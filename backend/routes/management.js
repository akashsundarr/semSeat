import express from "express";
import pool from "../db/connection.js";

const router = express.Router();

// --- Department Management ---
router.post("/department", async (req, res) => {
  const { dept_name, dept_code } = req.body;
  try {
    const query =
      "INSERT INTO Departments (dept_name, dept_code) VALUES (?, ?)";
    await pool.query(query, [dept_name, dept_code]);
    res.status(201).json({ message: "Department created successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/department/:id", async (req, res) => {
    const { dept_name, dept_code } = req.body;
    const { id } = req.params;
    try {
        const [result] = await pool.query(
            "UPDATE Departments SET dept_name = ?, dept_code = ? WHERE dept_id = ?",
            [dept_name, dept_code, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Department not found." });
        }
        res.json({ message: "Department updated successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- NEW: DELETE a department ---
router.delete("/department/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query("DELETE FROM Departments WHERE dept_id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Department not found." });
        }
        res.status(200).json({ message: "Department deleted successfully!" });
    } catch (err) {
        // Handle specific database errors, like foreign key constraints
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ error: "Cannot delete. This department is linked to existing students or subjects." });
        }
        res.status(500).json({ error: err.message });
    }
});

// --- Subject Management ---
router.post("/subject", async (req, res) => {
  const { subject_code, subject_name, semester, dept_id } = req.body;
  try {
    const query =
      "INSERT INTO Subjects (subject_code, subject_name, semester, dept_id) VALUES (?, ?, ?, ?)";
    await pool.query(query, [subject_code, subject_name, semester, dept_id]);
    res.status(201).json({ message: "Subject created successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Exam Series Management ---
router.post("/exam-series", async (req, res) => {
  const { series_name, start_date, end_date } = req.body;
  try {
    const query =
      "INSERT INTO ExamSeries (series_name, start_date, end_date) VALUES (?, ?, ?)";
    await pool.query(query, [series_name, start_date, end_date]);
    res.status(201).json({ message: "Exam Series created successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Scheduled Exam Management ---
router.post("/scheduled-exam", async (req, res) => {
  // 1. subject_ids is now expected to be an array
  const { series_id, subject_ids, exam_date, start_time, end_time } = req.body;

  // 2. Validate the array
  if (!series_id || !Array.isArray(subject_ids) || subject_ids.length === 0 || !exam_date || !start_time || !end_time) {
    return res.status(400).json({ error: "Invalid input. `subject_ids` must be a non-empty array." });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const query =
      "INSERT INTO ScheduledExams (series_id, subject_id, exam_date, start_time, end_time) VALUES (?, ?, ?, ?, ?)";
    
    // 3. Loop through each subject_id and insert a row for it
    for (const subject_id of subject_ids) {
      await conn.query(query, [
        series_id,
        subject_id,
        exam_date,
        start_time,
        end_time,
      ]);
    }

    await conn.commit();
    res.status(201).json({ message: `Successfully scheduled ${subject_ids.length} exams!` });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

router.put("/classroom/:id", async (req, res) => {
    const { capacity } = req.body;
    const { id } = req.params;
    try {
        const [result] = await pool.query(
            "UPDATE Classroom SET capacity = ? WHERE room_id = ?",
            [capacity, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Classroom not found." });
        }
        res.json({ message: "Classroom updated successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE a classroom
router.delete("/classroom/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query("DELETE FROM Classroom WHERE room_id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Classroom not found." });
        }
        res.status(200).json({ message: "Classroom deleted successfully!" });
    } catch (err) {
        // Handle specific database errors, like foreign key constraints
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ error: "Cannot delete this classroom because it is currently in use in an allocation." });
        }
        res.status(500).json({ error: err.message });
    }
});

router.put("/student/:id", async (req, res) => {
    const { name, batch, semester, dept_id } = req.body;
    const { id } = req.params;
    try {
        const [result] = await pool.query(
            "UPDATE Students SET name = ?, batch = ?, semester = ?, dept_id = ? WHERE student_id = ?",
            [name, batch, semester, dept_id, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Student not found." });
        }
        res.json({ message: "Student updated successfully!" });
    } catch (err) {
        console.error("Error updating student:", err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE a student
// Corresponds to: DELETE /api/management/student/:id
router.delete("/student/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query("DELETE FROM Students WHERE student_id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Student not found." });
        }
        res.status(200).json({ message: "Student deleted successfully!" });
    } catch (err) {
        // This is a smart error handler for a common database issue.
        // If a student is already in an allocation, the database will prevent deletion.
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ error: "Cannot delete this student as they are part of an existing allocation." });
        }
        console.error("Error deleting student:", err);
        res.status(500).json({ error: err.message });
    }
});


router.post("/exam-series", async (req, res) => {
  const { series_name, start_date, end_date } = req.body;
  try {
    await pool.query("INSERT INTO ExamSeries (series_name, start_date, end_date) VALUES (?, ?, ?)", [series_name, start_date, end_date]);
    res.status(201).json({ message: "Exam Series created successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/exam-series/:id", async (req, res) => {
    const { series_name, start_date, end_date } = req.body;
    const { id } = req.params;
    try {
        const [result] = await pool.query(
            "UPDATE ExamSeries SET series_name = ?, start_date = ?, end_date = ? WHERE series_id = ?",
            [series_name, start_date, end_date, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: "Exam Series not found." });
        res.json({ message: "Exam Series updated successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete("/exam-series/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query("DELETE FROM ExamSeries WHERE series_id = ?", [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Exam Series not found." });
        res.json({ message: "Exam Series deleted successfully!" });
    } catch (err) {
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ error: "Cannot delete. This series is linked to scheduled exams." });
        }
        res.status(500).json({ error: err.message });
    }
});


// --- Scheduled Exam Management ---
router.post("/scheduled-exam", async (req, res) => {
    const { series_id, subject_ids, exam_date, start_time, end_time } = req.body;
    if (!subject_ids || subject_ids.length === 0) {
        return res.status(400).json({ error: "At least one subject must be selected." });
    }
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const query = "INSERT INTO ScheduledExams (series_id, subject_id, exam_date, start_time, end_time) VALUES (?, ?, ?, ?, ?)";
        for (const subject_id of subject_ids) {
            await conn.query(query, [series_id, subject_id, exam_date, start_time, end_time]);
        }
        await conn.commit();
        res.status(201).json({ message: `Successfully scheduled ${subject_ids.length} exams!` });
    } catch (err) {
        if (conn) await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

// Note: Editing a scheduled exam session is complex. 
// The best UX is to delete the entire session and re-create it.
router.delete("/scheduled-exam-session", async (req, res) => {
    const { series_id, exam_date, start_time } = req.query;
    if (!series_id || !exam_date || !start_time) {
        return res.status(400).json({ error: "series_id, exam_date, and start_time are required." });
    }
    try {
        const [result] = await pool.query(
            "DELETE FROM ScheduledExams WHERE series_id = ? AND exam_date = ? AND start_time = ?",
            [series_id, exam_date, start_time]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: "No exams found for this session." });
        res.json({ message: `Successfully deleted ${result.affectedRows} exam(s) from the session.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.post("/students/bulk", async (req, res) => {
    const students = req.body; // Expect an array of student objects

    if (!Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ error: "Request body must be a non-empty array of students." });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const query = "INSERT INTO Students (student_id, name, batch, semester, dept_id) VALUES ?";
        
        // Map the array of objects to an array of arrays for bulk insertion
        const values = students.map(s => [s.student_id, s.name, s.batch, s.semester, s.dept_id]);
        
        await conn.query(query, [values]);

        await conn.commit();
        res.status(201).json({ message: `Successfully imported ${students.length} students!` });
    } catch (err) {
        if (conn) await conn.rollback();
        // Handle potential duplicate entry errors
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "Import failed. One or more student IDs already exist in the database." });
        }
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});


export default router;
