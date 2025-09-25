import express from 'express';
import pool from '../db/connection.js';

const router = express.Router();

// Get list of all unique semesters from Students
router.get('/semesters', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT DISTINCT semester FROM Students ORDER BY semester');
    res.json(rows.map(row => row.semester));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get list of all rooms
router.get('/rooms', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT room_id FROM Classroom ORDER BY room_id');
    res.json(rows.map(row => row.room_id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get list of all Exam Series
router.get('/exam-series', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT series_id, series_name FROM ExamSeries ORDER BY start_date DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get timetable for a specific series
router.get('/timetable/:series_id', async (req, res) => {
    try {
        const { series_id } = req.params;
        const query = `
            SELECT se.exam_id, se.exam_date, se.start_time, s.subject_name, s.subject_code, d.dept_code
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

export default router;