import express from 'express';
import pool from '../db/connection.js';

const router = express.Router();

// --- Department Management ---
router.post('/department', async (req, res) => {
  const { dept_name, dept_code } = req.body;
  try {
    const query = 'INSERT INTO Departments (dept_name, dept_code) VALUES (?, ?)';
    await pool.query(query, [dept_name, dept_code]);
    res.status(201).json({ message: 'Department created successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Subject Management ---
router.post('/subject', async (req, res) => {
  const { subject_code, subject_name, semester, dept_id } = req.body;
  try {
    const query = 'INSERT INTO Subjects (subject_code, subject_name, semester, dept_id) VALUES (?, ?, ?, ?)';
    await pool.query(query, [subject_code, subject_name, semester, dept_id]);
    res.status(201).json({ message: 'Subject created successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Exam Series Management ---
router.post('/exam-series', async (req, res) => {
    const { series_name, start_date, end_date } = req.body;
    try {
        const query = 'INSERT INTO ExamSeries (series_name, start_date, end_date) VALUES (?, ?, ?)';
        await pool.query(query, [series_name, start_date, end_date]);
        res.status(201).json({ message: 'Exam Series created successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Scheduled Exam Management ---
router.post('/scheduled-exam', async (req, res) => {
    const { series_id, subject_id, exam_date, start_time, end_time } = req.body;
    try {
        const query = 'INSERT INTO ScheduledExams (series_id, subject_id, exam_date, start_time, end_time) VALUES (?, ?, ?, ?, ?)';
        console.log('Inserting:', series_name, start_date, end_date);
const [result] = await pool.query(query, [series_name, start_date, end_date]);
console.log('Insert result:', result);
        res.status(201).json({ message: 'Exam scheduled successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;