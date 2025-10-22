import express from "express";
import pool from "../db/connection.js";

const router = express.Router();

// ============================================================================
// DEPARTMENT-FIRST WITH IMMEDIATE MIDDLE CHECKING
// ============================================================================
// This algorithm allocates in department order with smart seat filling:
// 1. Group students by DEPARTMENT
// 2. For each department:
//    - Fill LEFT seat
//    - IMMEDIATELY check if MIDDLE can be filled (neighbor checking)
//    - Then fill RIGHT seat
// 3. This allows other departments to fill MIDDLE seats optimally
//    while current department fills L&R
//
// Benefits:
// - Neat department organization
// - Immediate MIDDLE allocation avoids empty middle seats
// - Neighbor-aware subject checking happens in real-time
// - Better capacity utilization
// - Each department gets assigned rooms/benches
// ============================================================================

router.post("/run-allocation", async (req, res) => {
  const { series_id, allocation_date, start_time } = req.body;

  if (!series_id || !allocation_date || !start_time) {
    return res.status(400).json({ 
      error: "series_id, allocation_date, and start_time are required." 
    });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // ========================================================================
    // STEP 1: Fetch Scheduled Exams for Time Slot
    // ========================================================================
    const [scheduledExams] = await conn.query(
      `SELECT exam_id, subject_id FROM ScheduledExams 
       WHERE series_id = ? AND exam_date = ? AND start_time = ?`,
      [series_id, allocation_date, start_time]
    );

    if (scheduledExams.length === 0) {
      await conn.rollback();
      return res.status(404).json({ 
        message: "No exams found for the selected series, date, and time." 
      });
    }

    const examIdsForSlot = scheduledExams.map(ex => ex.exam_id);
    const subjectIdsForSlot = scheduledExams.map(ex => ex.subject_id);

    console.log(`Found ${scheduledExams.length} exams for time slot`);

    // ========================================================================
    // STEP 2: Fetch Eligible Students with Subject Information
    // ========================================================================
    const [students] = await conn.query(
      `SELECT 
        stu.student_id, 
        stu.batch, 
        stu.semester, 
        d.dept_id,
        d.dept_code,
        d.dept_name,
        s.subject_id,
        s.subject_code,
        s.subject_name
       FROM Students stu
       JOIN Subjects s ON stu.semester = s.semester AND stu.dept_id = s.dept_id
       JOIN Departments d ON stu.dept_id = d.dept_id
       WHERE s.subject_id IN (?) 
       AND stu.status IN ('Active', 'Unassigned')
       ORDER BY d.dept_id, stu.batch, stu.student_id`,
      [subjectIdsForSlot]
    );

    if (students.length === 0) {
      await conn.rollback();
      return res.status(404).json({ 
        message: "No eligible students found for the selected exams." 
      });
    }

    console.log(`Found ${students.length} eligible students`);

    // ========================================================================
    // STEP 3: Group Students by DEPARTMENT and SUBJECT
    // ========================================================================
    const deptGroups = {};
    const studentToExamsMap = new Map();
    const otherDeptStudents = [];  // Track other dept students for MIDDLE filling

    for (const student of students) {
      const deptKey = student.dept_id;
      
      if (!deptGroups[deptKey]) {
        deptGroups[deptKey] = {
          dept_id: student.dept_id,
          dept_code: student.dept_code,
          dept_name: student.dept_name,
          students: [],
          studentsBySubject: {}
        };
      }
      
      deptGroups[deptKey].students.push(student);

      // Group by subject within department
      const subjectKey = student.subject_id;
      if (!deptGroups[deptKey].studentsBySubject[subjectKey]) {
        deptGroups[deptKey].studentsBySubject[subjectKey] = {
          subject_id: student.subject_id,
          subject_code: student.subject_code,
          subject_name: student.subject_name,
          students: []
        };
      }
      deptGroups[deptKey].studentsBySubject[subjectKey].students.push(student);
      
      // Map student to exam_id
      const matchingExam = scheduledExams.find(
        ex => ex.subject_id === student.subject_id
      );
      
      if (matchingExam) {
        if (!studentToExamsMap.has(student.student_id)) {
          studentToExamsMap.set(student.student_id, []);
        }
        studentToExamsMap.get(student.student_id).push(matchingExam.exam_id);
      }
    }

    // Convert to array and sort by department size (largest first)
    const sortedDepts = Object.values(deptGroups).sort(
      (a, b) => b.students.length - a.students.length
    );

    console.log("\nDepartments by size:");
    sortedDepts.forEach(dept => {
      console.log(`  - ${dept.dept_name} (${dept.dept_code}): ${dept.students.length} students`);
    });

    // ========================================================================
    // STEP 4: Fetch Classrooms
    // ========================================================================
    const [rooms] = await conn.query(
      `SELECT room_id, capacity FROM Classroom ORDER BY room_id`
    );

    if (rooms.length === 0) {
      await conn.rollback();
      return res.status(404).json({ 
        message: "No classrooms available." 
      });
    }

    // Initialize room bench structure
    const roomBenches = rooms.map(room => ({
      room_id: room.room_id,
      capacity: room.capacity,
      totalBenches: Math.ceil(room.capacity / 3),
      benches: Array.from({ length: Math.ceil(room.capacity / 3) }, () => ({
        left: null,
        middle: null,
        right: null
      }))
    }));

    console.log(`\nAvailable rooms: ${rooms.length}`);
    console.log(`Total capacity: ${rooms.reduce((sum, r) => sum + r.capacity, 0)} seats`);

    // ========================================================================
    // STEP 5: Clear Previous Allocations
    // ========================================================================
    await conn.query(
      `DELETE FROM Allocations WHERE exam_id IN (?)`,
      [examIdsForSlot]
    );

    console.log("Cleared previous allocations for this time slot\n");

    // ========================================================================
    // STEP 6: DEPARTMENT-FIRST WITH IMMEDIATE MIDDLE CHECKING
    // ========================================================================
    const studentSeatMap = new Map();
    let currentRoomIdx = 0;
    let currentBenchIdx = 0;

    console.log(`=== DEPARTMENT-FIRST ALLOCATION (WITH IMMEDIATE MIDDLE CHECKING) ===\n`);

    // Process each department in order
    for (const dept of sortedDepts) {
      console.log(`Processing: ${dept.dept_name} (${dept.students.length} students)`);
      
      let deptStudentIndex = 0;
      const deptStudents = [...dept.students];
      let allocatedCount = 0;

      while (deptStudentIndex < deptStudents.length) {
        // Find next available bench
        while (currentRoomIdx < roomBenches.length && currentBenchIdx >= roomBenches[currentRoomIdx].totalBenches) {
          currentRoomIdx++;
          currentBenchIdx = 0;
        }

        if (currentRoomIdx >= roomBenches.length) {
          console.log(`  Rooms exhausted, moving ${deptStudents.length - deptStudentIndex} students to unassigned`);
          break;
        }

        const room = roomBenches[currentRoomIdx];
        const bench = room.benches[currentBenchIdx];
        const rowNumber = Math.floor(currentBenchIdx / 7) + 1;
        const benchNumber = (currentBenchIdx % 7) + 1;

        // ====== STEP 1: Fill LEFT seat with current department student ======
        if (deptStudentIndex < deptStudents.length && !bench.left) {
          const student = deptStudents[deptStudentIndex];
          deptStudentIndex++;
          bench.left = student;
          studentSeatMap.set(student.student_id, {
            room_id: room.room_id,
            row_number: rowNumber,
            bench_number: benchNumber,
            seat_position: "left"
          });
          allocatedCount++;

          console.log(`  Room ${room.room_id}, Bench ${benchNumber}: LEFT = ${student.student_id} (${dept.dept_code})`);

          // ====== STEP 2: Immediately check if MIDDLE can be filled ======
          // Try to find a student from OTHER departments who can fill MIDDLE
          if (!bench.middle) {
            let middleAllocated = false;

            // Try each other department for a suitable MIDDLE student
            for (const otherDept of sortedDepts) {
              if (otherDept.dept_id === dept.dept_id) continue;  // Skip current department

              // Find a student from other dept with different subject
              for (let i = 0; i < otherDept.students.length; i++) {
                const candidate = otherDept.students[i];

                // Skip if already allocated
                if (studentSeatMap.has(candidate.student_id)) continue;

                // Check subject difference from LEFT
                if (candidate.subject_id !== bench.left.subject_id) {
                  // Check subject difference from RIGHT (if exists)
                  if (!bench.right || candidate.subject_id !== bench.right.subject_id) {
                    // ALLOCATE to MIDDLE
                    bench.middle = candidate;
                    studentSeatMap.set(candidate.student_id, {
                      room_id: room.room_id,
                      row_number: rowNumber,
                      bench_number: benchNumber,
                      seat_position: "middle"
                    });

                    // Remove from other dept's student list
                    otherDept.students.splice(i, 1);
                    middleAllocated = true;
                    allocatedCount++;

                    console.log(`    └─ MIDDLE = ${candidate.student_id} (${otherDept.dept_code}, immediate fill)`);
                    break;
                  }
                }
              }

              if (middleAllocated) break;
            }

            if (!middleAllocated) {
              console.log(`    └─ MIDDLE = [empty, no suitable other-dept student]`);
            }
          }
        }

        // ====== STEP 3: Fill RIGHT seat with current department student ======
        if (deptStudentIndex < deptStudents.length && !bench.right) {
          const student = deptStudents[deptStudentIndex];
          deptStudentIndex++;
          bench.right = student;
          studentSeatMap.set(student.student_id, {
            room_id: room.room_id,
            row_number: rowNumber,
            bench_number: benchNumber,
            seat_position: "right"
          });
          allocatedCount++;
          currentBenchIdx++;  // Move to next bench

          console.log(`  Room ${room.room_id}, Bench ${benchNumber}: RIGHT = ${student.student_id} (${dept.dept_code})`);
        } else if (!deptStudentIndex || !bench.right) {
          currentBenchIdx++;
        }
      }

      console.log(`  ${dept.dept_name} allocation complete: ${allocatedCount} students\n`);
    }

    console.log(`=== ALLOCATION COMPLETE ===`);
    console.log(`Total students allocated: ${studentSeatMap.size}`);

    // ========================================================================
    // STEP 7: Bulk Insert Allocations into Database
    // ========================================================================
    const assignedStudentIds = Array.from(studentSeatMap.keys());
    const allocationInserts = [];
    
    for (const student_id of assignedStudentIds) {
      const seat = studentSeatMap.get(student_id);
      const examIdsForStudent = studentToExamsMap.get(student_id) || [];
      
      for (const exam_id of examIdsForStudent) {
        allocationInserts.push([
          student_id,
          exam_id,
          seat.room_id,
          seat.row_number,
          seat.bench_number,
          seat.seat_position
        ]);
      }
    }

    if (allocationInserts.length > 0) {
      await conn.query(
        "INSERT INTO Allocations (student_id, exam_id, room_id, `row_number`, bench_number, seat_position) VALUES ?",
        [allocationInserts]
      );
      console.log(`\nInserted ${allocationInserts.length} allocation records`);
    }

    // ========================================================================
    // STEP 8: Update Student Statuses
    // ========================================================================
    if (assignedStudentIds.length > 0) {
      await conn.query(
        `UPDATE Students SET status = 'Assigned' WHERE student_id IN (?)`,
        [assignedStudentIds]
      );
      console.log(`Updated ${assignedStudentIds.length} students to 'Assigned' status`);
    }

    const allStudentIds = students.map(s => s.student_id);
    const unassignedStudentIds = allStudentIds.filter(
      id => !assignedStudentIds.includes(id)
    );
    
    if (unassignedStudentIds.length > 0) {
      await conn.query(
        `UPDATE Students SET status = 'Unassigned' WHERE student_id IN (?)`,
        [unassignedStudentIds]
      );
      console.log(`Updated ${unassignedStudentIds.length} students to 'Unassigned' status`);
    }

    await conn.commit();
    console.log("\nTransaction committed successfully");

    // ========================================================================
    // Return Response
    // ========================================================================
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

// ============================================================================
// GET /api/allocations/timeslot - Get all allocations for a specific session
// ============================================================================
router.get("/timeslot", async (req, res) => {
  const { seriesId, date, time } = req.query;
  
  if (!seriesId || !date || !time) {
    return res.status(400).json({ 
      error: "seriesId, date, and time are required query parameters." 
    });
  }

  try {
    const query = `
      SELECT a.*, s.name, s.batch, s.semester
      FROM Allocations a
      JOIN Students s ON a.student_id = s.student_id
      JOIN ScheduledExams se ON a.exam_id = se.exam_id
      WHERE se.series_id = ? AND se.exam_date = ? AND se.start_time = ?
      ORDER BY a.room_id, a.\`row_number\`, a.bench_number, a.seat_position
    `;
    const [rows] = await pool.query(query, [seriesId, date, time]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching allocations by time slot:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// DELETE /api/allocations/reset - Clear all allocations
// ============================================================================
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

// ============================================================================
// GET /api/allocations/status - Check if allocations exist for time slot
// ============================================================================
router.get("/status", async (req, res) => {
  const { seriesId, date, time } = req.query;
  
  if (!seriesId || !date || !time) {
    return res.status(400).json({ 
      error: "seriesId, date, and time are required." 
    });
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