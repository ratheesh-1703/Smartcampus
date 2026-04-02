import { pool } from '../models/db.js';

// Start attendance session
export const startSession = async (req, res) => {
  const { classId, subject } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO attendance_sessions (class_id, subject, status, start_time) VALUES (?,?,?,NOW())',
      [classId, subject, 'active']
    );
    res.json({ sessionId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark attendance
export const markAttendance = async (req, res) => {
  const { sessionId, studentId, status } = req.body;
  try {
    await pool.query(
      'INSERT INTO attendance_records (session_id, student_id, status) VALUES (?,?,?)',
      [sessionId, studentId, status]
    );
    res.json({ message: 'Attendance marked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// End attendance session
export const endSession = async (req, res) => {
  const { sessionId } = req.body;
  try {
    await pool.query('UPDATE attendance_sessions SET status="closed", end_time=NOW() WHERE id=?', [sessionId]);
    res.json({ message: 'Session closed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get attendance for class
export const getAttendance = async (req, res) => {
  const classId = req.params.classId;
  try {
    const [rows] = await pool.query(
      'SELECT a.*, s.name AS student_name FROM attendance_records a JOIN students s ON a.student_id=s.id JOIN attendance_sessions sess ON a.session_id=sess.id WHERE sess.class_id=?',
      [classId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
