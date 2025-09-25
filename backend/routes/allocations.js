import express from "express";
import pool from "../db/connection.js";

const router = express.Router();

// The main allocation function
router.post("/run-allocation", async (req, res) => {
    const { series_id, allocation_date } = req.body;
    if (!series_id || !allocation_date) {
        return res.status(400).json({ error: "series_id and allocation_date are required." });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Get exams for the day
        const [scheduledExams] = await conn.query(
            `SELECT exam_id, subject_id FROM ScheduledExams WHERE series_id = ? AND exam_date = ?`,
            [series_id, allocation_date]
        );
        if (scheduledExams.length === 0) {
            return res.status(404).json({ message: "No exams found for the selected series and date." });
        }
        const examIdsForDay = scheduledExams.map(ex => ex.exam_id);
        const subjectIdsForDay = scheduledExams.map(ex => ex.subject_id);

        // 2. Get students for those exams
        const studentQuery = `
            SELECT stu.student_id, stu.batch, stu.semester, d.dept_code
            FROM Students stu
            JOIN Subjects s ON stu.semester = s.semester AND stu.dept_id = s.dept_id
            JOIN Departments d ON stu.dept_id = d.dept_id
            WHERE s.subject_id IN (?) AND stu.status IN ('Active', 'Unassigned')
        `;
        const [students] = await conn.query(studentQuery, [subjectIdsForDay]);
        
        let studentPool = students.map(s => ({ ...s, batch_key: `${s.dept_code}-S${s.semester}-${s.batch}` }));
        studentPool.sort((a, b) => a.semester - b.semester || a.batch_key.localeCompare(b.batch_key));
        
        // =================================================================
        // ## NEW LOGIC 1: Check if the entire student pool is homogeneous
        // =================================================================
        let isHomogeneousPool = false;
        if (studentPool.length > 1) {
            const firstStudentGroup = `${studentPool[0].dept_code}-S${studentPool[0].semester}`;
            isHomogeneousPool = studentPool.every(s => `${s.dept_code}-S${s.semester}` === firstStudentGroup);
        }
        // =================================================================

        // 3. Get classrooms
        const [rooms] = await conn.query("SELECT room_id, capacity FROM Classroom ORDER BY room_id");
        
        // Clear previous allocations for the day
        await conn.query(`DELETE FROM Allocations WHERE exam_id IN (?)`, [examIdsForDay]);

        // 4. Run the allocation algorithm
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
                    // =====================================================================
                    // ## NEW LOGIC 2: Skip middle seat if the pool is homogeneous
                    // =====================================================================
                    if (isHomogeneousPool && seat === 1) {
                        continue; // Leave middle seat empty
                    }
                    // =====================================================================
                    
                    if (studentPool.length === 0) break;

                    let studentIndex = -1;

                    // Try to find a student from a different group for the bench
                    if (!isHomogeneousPool) {
                        studentIndex = studentPool.findIndex(s => !bench.some(b_s => `${b_s.dept_code}-S${b_s.semester}` === `${s.dept_code}-S${s.semester}`));
                    }
                    
                    // If no such student is found (or if pool is homogeneous), just take the first one
                    if (studentIndex === -1) {
                        studentIndex = 0;
                    }

                    const studentToAllocate = studentPool[studentIndex];

                    bench.push(studentToAllocate);
                    studentPool.splice(studentIndex, 1);

                    studentSeatMap.set(studentToAllocate.student_id, {
                        room_id: room.room_id,
                        row_number,
                        bench_number,
                        seat_position: seatPositions[seat]
                    });
                }
                bench_number++;
                if (bench_number > 7) {
                    bench_number = 1;
                    row_number++;
                }
            }
        }

        // 5. Insert allocations into the database
        const assignedStudentIds = Array.from(studentSeatMap.keys());
        for (const student_id of assignedStudentIds) {
            const seat = studentSeatMap.get(student_id);
            const [studentExams] = await conn.query(
                `SELECT se.exam_id FROM ScheduledExams se
                 JOIN Subjects s ON se.subject_id = s.subject_id
                 JOIN Students stu ON s.semester = stu.semester AND s.dept_id = stu.dept_id
                 WHERE stu.student_id = ? AND se.exam_id IN (?)`,
                [student_id, examIdsForDay]
            );

            for (const exam of studentExams) {
                await conn.query(
                    "INSERT INTO Allocations (student_id, exam_id, room_id, `row_number`, bench_number, seat_position) VALUES (?, ?, ?, ?, ?, ?)",
                    [student_id, exam.exam_id, seat.room_id, seat.row_number, seat.bench_number, seat.seat_position]
                );
            }
        }

        // 6. Update student statuses
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
            message: `Allocation completed for ${allocation_date}.`,
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


// GET /api/allocations?exam_id=101 - get allocations for a specific exam
router.get("/", async (req, res) => {
    const { exam_id } = req.query;
    if (!exam_id) return res.status(400).json({ error: "exam_id is required" });
    try {
      const [rows] = await pool.query(
        `SELECT a.*, s.name, s.batch, s.semester 
         FROM Allocations a
         JOIN Students s ON a.student_id = s.student_id
         WHERE a.exam_id = ?
         ORDER BY a.room_id, a.row_number, a.bench_number, a.seat_position`,
        [exam_id]
      );
      res.json(rows);
    } catch (err) {
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


export default router;