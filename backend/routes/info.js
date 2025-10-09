import express from "express";
import pool from "../db/connection.js";

const router = express.Router();

// Get list of all unique semesters from Students
router.get("/semesters", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT DISTINCT semester FROM Students ORDER BY semester"
    );
    res.json(rows.map((row) => row.semester));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get list of all rooms
router.get('/rooms', async (req, res) => {
  try {
    // Select both room_id and capacity
    const [rows] = await pool.query('SELECT room_id, capacity FROM Classroom ORDER BY room_id');
    res.json(rows); // Send the full array of objects
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get list of all Exam Series
router.get("/exam-series", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT series_id, series_name FROM ExamSeries ORDER BY start_date DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/departments', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT dept_id, dept_name, dept_code FROM Departments ORDER BY dept_name');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET all subjects
router.get('/subjects', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT subject_id, subject_name, subject_code FROM Subjects ORDER BY subject_name');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET all students
router.get('/students', async (req, res) => {
    try {
        const query = `
            SELECT s.student_id, s.name, s.batch, s.semester, d.dept_name 
            FROM Students s 
            JOIN Departments d ON s.dept_id = d.dept_id 
            ORDER BY s.student_id
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// GET all Exam Series (updated to format dates)
router.get("/exam-series", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT series_id, series_name, DATE_FORMAT(start_date, '%Y-%m-%d') as start_date, DATE_FORMAT(end_date, '%Y-%m-%d') as end_date FROM ExamSeries ORDER BY start_date DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- NEW: GET all Scheduled Exam Sessions ---
router.get("/scheduled-exams", async (req, res) => {
    try {
        // This query groups all subjects for a single time slot into one row
        const query = `
            SELECT 
                se.series_id,
                es.series_name,
                DATE_FORMAT(se.exam_date, '%Y-%m-%d') as exam_date,
                se.start_time,
                CONCAT(se.series_id, '_', se.exam_date, '_', se.start_time) as session_key,
                GROUP_CONCAT(s.subject_name ORDER BY s.subject_name SEPARATOR ', ') as subjects
            FROM ScheduledExams se
            JOIN ExamSeries es ON se.series_id = es.series_id
            JOIN Subjects s ON se.subject_id = s.subject_id
            GROUP BY se.series_id, es.series_name, se.exam_date, se.start_time
            ORDER BY se.exam_date, se.start_time;
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching scheduled exams:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get timetable for a specific series
router.get("/timetable/:series_id", async (req, res) => {
  try {
    const { series_id } = req.params;
    // In /routes/info.js
    const query = `
    SELECT 
        se.exam_id, 
        DATE_FORMAT(se.exam_date, '%Y-%m-%d') AS exam_date, -- This is the change
        se.start_time, 
        s.subject_name, 
        s.subject_code, 
        d.dept_code
    FROM ScheduledExams se
    JOIN Subjects s ON se.subject_id = s.subject_id
    JOIN Departments d ON s.dept_id = d.dept_id
    WHERE se.series_id = ?
    ORDER BY se.exam_date, se.start_time
`;
    const [rows] = await pool.query(query, [series_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add this new route to your info.js file

router.get('/departments', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT dept_id, dept_name, dept_code FROM Departments ORDER BY dept_name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/subjects', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT subject_id, subject_name, subject_code FROM Subjects ORDER BY subject_name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/students", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.student_id, s.name, s.batch, s.semester, s.dept_id, d.dept_name 
      FROM Students s
      JOIN Departments d ON s.dept_id = d.dept_id
      ORDER BY s.student_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
export default router;
