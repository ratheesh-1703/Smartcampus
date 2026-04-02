import express from 'express';
import { startSession, markAttendance, endSession, getAttendance } from '../controllers/attendanceController.js';
const router = express.Router();

router.post('/start', startSession);
router.post('/mark', markAttendance);
router.post('/end', endSession);
router.get('/get/:classId', getAttendance);

export default router;
