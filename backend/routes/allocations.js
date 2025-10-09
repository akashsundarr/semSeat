import express from "express";
import pool from "../db/connection.js";

const router = express.Router();

// The main allocation function - NOW FULLY OPTIMIZED
router.post("/run-allocation", async (req, res) => {
    const { series_id, allocation_date, start_time } = req.body;
    if (!series_id || !allocation_date || !start_time) {
        return res.status(400).json({ error: "series_id, allocation_date, and start_time are required." });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Get all exams for the specific time slot
        const [scheduledExams] = await conn.query(
            `SELECT exam_id, subject_id FROM ScheduledExams WHERE series_id = ? AND exam_date = ? AND start_time = ?`,
            [series_id, allocation_date, start_time]
        );

        if (scheduledExams.length === 0) {
            return res.status(404).json({ message: "No exams found for the selected series, date, and time." });
        }
        
        const examIdsForSlot = scheduledExams.map(ex => ex.exam_id);
        const subjectIdsForSlot = scheduledExams.map(ex => ex.subject_id);

        // 2. Get all eligible students for those subjects
        const [students] = await conn.query(
            `SELECT stu.student_id, stu.batch, stu.semester, d.dept_code
             FROM Students stu
             JOIN Subjects s ON stu.semester = s.semester AND stu.dept_id = s.dept_id
             JOIN Departments d ON stu.dept_id = d.dept_id
             WHERE s.subject_id IN (?) AND stu.status IN ('Active', 'Unassigned')`,
            [subjectIdsForSlot]
        );
        
        let studentPool = students.map(s => ({ ...s, batch_key: `${s.dept_code}-S${s.semester}-${s.batch}` }));
        studentPool.sort((a, b) => a.semester - b.semester || a.batch_key.localeCompare(b.batch_key));
        
        const firstStudentGroup = studentPool.length > 0 ? `${studentPool[0].dept_code}-S${studentPool[0].semester}` : null;
        const isHomogeneousPool = studentPool.every(s => `${s.dept_code}-S${s.semester}` === firstStudentGroup);

        // 3. Get all classrooms
        const [rooms] = await conn.query("SELECT room_id, capacity FROM Classroom ORDER BY room_id");
        
        // 4. Clear any previous allocations for this specific exam session
        await conn.query(`DELETE FROM Allocations WHERE exam_id IN (?)`, [examIdsForSlot]);

        // 5. --- PRE-COMPUTATION (THE OPTIMIZATION) ---
        // Create a map of which exams each student is taking
        const studentToExamsMap = new Map();
        if (students.length > 0) {
            const studentIds = students.map(s => s.student_id);
            const studentSubjectQuery = `
                SELECT stu.student_id, s.subject_id
                FROM Students stu
                JOIN Subjects s ON stu.semester = s.semester AND stu.dept_id = s.dept_id
                WHERE stu.student_id IN (?) AND s.subject_id IN (?)
            `;
            const [studentSubjects] = await conn.query(studentSubjectQuery, [studentIds, subjectIdsForSlot]);
            const subjectToExamMap = new Map(scheduledExams.map(ex => [ex.subject_id, ex.exam_id]));

            for (const ss of studentSubjects) {
                if (!studentToExamsMap.has(ss.student_id)) {
                    studentToExamsMap.set(ss.student_id, []);
                }
                const exam_id = subjectToExamMap.get(ss.subject_id);
                if (exam_id) {
                    studentToExamsMap.get(ss.student_id).push(exam_id);
                }
            }
        }
        
        // 6. Run the seating algorithm
        const studentSeatMap = new Map();
        const seatPositions = ["left", "middle", "right"];

        for (const room of rooms) {
            if (studentPool.length === 0) break;
            const benches = Math.ceil(room.capacity / 3);
            let row_number = 1, bench_number = 1;

            for (let b = 0; b < benches; b++) {
                if (studentPool.length === 0) break;
                const bench = [];

                for (let seat = 0; seat < 3; seat++) {
                    if (isHomogeneousPool && seat === 1) continue; 
                    if (studentPool.length === 0) break;

                    let studentIndex = !isHomogeneousPool
                        ? studentPool.findIndex(s => !bench.some(b_s => `${b_s.dept_code}-S${b_s.semester}` === `${s.dept_code}-S${s.semester}`))
                        : -1;
                    
                    if (studentIndex === -1) studentIndex = 0;

                    const studentToAllocate = studentPool.splice(studentIndex, 1)[0];
                    bench.push(studentToAllocate);

                    studentSeatMap.set(studentToAllocate.student_id, {
                        room_id: room.room_id, row_number, bench_number, seat_position: seatPositions[seat]
                    });
                }
                bench_number++;
                if (bench_number > 7) { bench_number = 1; row_number++; }
            }
        }

        // 7. --- BULK INSERT (THE OPTIMIZATION) ---
        // Prepare a single array of all data to be inserted
        const assignedStudentIds = Array.from(studentSeatMap.keys());
        const allocationInserts = [];
        for (const student_id of assignedStudentIds) {
            const seat = studentSeatMap.get(student_id);
            const examIdsForStudent = studentToExamsMap.get(student_id) || [];
            for (const exam_id of examIdsForStudent) {
                allocationInserts.push([
                    student_id, exam_id, seat.room_id, seat.row_number,
                    seat.bench_number, seat.seat_position
                ]);
            }
        }

        if (allocationInserts.length > 0) {
            await conn.query(
                "INSERT INTO Allocations (student_id, exam_id, room_id, `row_number`, bench_number, seat_position) VALUES ?",
                [allocationInserts]
            );
        }

        // 8. Update student statuses
        if (assignedStudentIds.length > 0) {
            await conn.query("UPDATE Students SET status = 'Assigned' WHERE student_id IN (?)", [assignedStudentIds]);
        }
        const unassignedStudentIds = studentPool.map(s => s.student_id);
        if (unassignedStudentIds.length > 0) {
            await conn.query("UPDATE Students SET status = 'Unassigned' WHERE student_id IN (?)", [unassignedStudentIds]);
        }
        
        await conn.commit();
        res.json({
            ok: true,
            message: `Allocation completed for ${allocation_date} at ${start_time}.`,
            students_assigned: assignedStudentIds.length,
            unassigned_count: unassignedStudentIds.length,
        });

    } catch (err) {
        if (conn) await conn.rollback();
        console.error("Allocation Error:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});


// GET /api/allocations/timeslot - get all allocations for a specific session
router.get("/timeslot", async (req, res) => {
    const { seriesId, date, time } = req.query;
    if (!seriesId || !date || !time) {
        return res.status(400).json({ error: "seriesId, date, and time are required query parameters." });
    }
    try {
        const query = `
            SELECT a.*, s.name, s.batch, s.semester 
            FROM Allocations a
            JOIN Students s ON a.student_id = s.student_id
            JOIN ScheduledExams se ON a.exam_id = se.exam_id
            WHERE se.series_id = ? AND se.exam_date = ? AND se.start_time = ?
            ORDER BY a.room_id, a.row_number, a.bench_number, a.seat_position
        `;
        const [rows] = await pool.query(query, [seriesId, date, time]);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching allocations by time slot:", err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/allocations/reset
router.delete("/reset", async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query("TRUNCATE TABLE Allocations");
        await conn.query("UPDATE Students SET status = 'Active' WHERE status <> 'Active'");
        await conn.commit();
        res.json({ 
            ok: true, 
            message: "All allocations have been cleared and student statuses have been reset." 
        });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error("Reset Error:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

router.get("/status", async (req, res) => {
    const { seriesId, date, time } = req.query;
    if (!seriesId || !date || !time) {
        return res.status(400).json({ error: "seriesId, date, and time are required." });
    }

    try {
        const query = `
            SELECT 1 
            FROM Allocations a
            JOIN ScheduledExams se ON a.exam_id = se.exam_id
            WHERE se.series_id = ? AND se.exam_date = ? AND se.start_time = ?
            LIMIT 1
        `;
        const [rows] = await pool.query(query, [seriesId, date, time]);
        
        res.json({ allocated: rows.length > 0 });

    } catch (err) {
        console.error("Error checking allocation status:", err);
        res.status(500).json({ error: err.message });
    }
});


export default router;