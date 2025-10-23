import express from "express";
import pool from "../db/connection.js";

const router = express.Router();

// Get overall statistics
router.get("/stats", async (req, res) => {
  try {
    const [students] = await pool.query(
      "SELECT COUNT(*) AS totalStudents FROM Students"
    );

    const [classrooms] = await pool.query(
      "SELECT COUNT(*) AS totalClassrooms FROM Classroom"
    );

    const [exams] = await pool.query(
      "SELECT COUNT(*) AS totalExams FROM ScheduledExams"
    );

    // If you track allocation status in Allocations table
    const [completed] = await pool.query(
      "SELECT COUNT(*) AS allocationsCompleted FROM Allocations WHERE status = 'completed'"
    );

    const [pending] = await pool.query(
      "SELECT COUNT(*) AS allocationsPending FROM Allocations WHERE status = 'pending'"
    );

    res.json({
      totalStudents: students[0].totalStudents,
      totalClassrooms: classrooms[0].totalClassrooms,
      totalExams: exams[0].totalExams,
      allocationsCompleted: completed[0]?.allocationsCompleted || 0,
      allocationsPending: pending[0]?.allocationsPending || 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
