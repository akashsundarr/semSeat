import express from 'express';
import pool from '../db/connection.js';

const router = express.Router();

// Route to insert a new student
router.post('/student', async (req, res) => {
  const { student_id, name, batch, semester } = req.body;
  if (!student_id || !name || !batch || !semester) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    const query = 'INSERT INTO Students (student_id, name, batch, semester) VALUES (?, ?, ?, ?)';
    await pool.query(query, [student_id, name, batch, semester]);
    res.status(201).json({ message: 'Student inserted successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route to insert a new classroom
router.post('/classroom', async (req, res) => {
  const { room_id, capacity } = req.body;
  if (!room_id || !capacity) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    const query = 'INSERT INTO Classroom (room_id, capacity) VALUES (?, ?)';
    await pool.query(query, [room_id, capacity]);
    res.status(201).json({ message: 'Classroom inserted successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// New: Route to insert a new exam
router.post('/exam', async (req, res) => {
  const { event_name, date, start_time, end_time, semesters_involved } = req.body;
  if (!event_name || !date || !start_time || !end_time || !semesters_involved) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    const query = 'INSERT INTO Exams (event_name, date, start_time, end_time, semesters_involved) VALUES (?, ?, ?, ?, ?)';
    await pool.query(query, [event_name, date, start_time, end_time, semesters_involved]);
    res.status(201).json({ message: 'Exam event created successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;