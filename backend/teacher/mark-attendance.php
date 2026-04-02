<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../auth/token.php';

$user = require_auth($conn);
if (!$user) exit;

if (strtolower($user['role']) !== 'student' && strtolower($user['role']) !== 'parent' && strtolower($user['role']) !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$session_id = $data['session_id'] ?? null;
$student_reg = $data['register_no'] ?? ($data['reg_no'] ?? null);
if (!$session_id || !$student_reg) {
    echo json_encode(['success' => false, 'message' => 'session_id and register_no required']);
    exit;
}

// validate session active
$stmt = $conn->prepare("SELECT session_id, gateway_ip, is_active FROM attendance_sessions WHERE session_id = ? LIMIT 1");
$stmt->bind_param('i', $session_id);
$stmt->execute();
$res = $stmt->get_result();
if ($res->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Session not found']);
    exit;
}
$session = $res->fetch_assoc();
if (!$session['is_active']) {
    echo json_encode(['success' => false, 'message' => 'Session not active']);
    exit;
}

// optional: could check gateway_ip vs request IP. Currently allow students to mark from anywhere.

// find student id by register_no
$find = $conn->prepare("SELECT id, register_no FROM users WHERE register_no = ? LIMIT 1");
$find->bind_param('s', $student_reg);
$find->execute();
$r2 = $find->get_result();
if ($r2->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Student not found']);
    exit;
}
$student = $r2->fetch_assoc();
$student_id = $student['id'];

// avoid duplicate attendance for same session
$dup = $conn->prepare("SELECT id FROM attendance_records WHERE session_id = ? AND student_id = ? LIMIT 1");
$dup->bind_param('ii', $session_id, $student_id);
$dup->execute();
$r3 = $dup->get_result();
if ($r3->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'Already marked']);
    exit;
}

$ins = $conn->prepare("INSERT INTO attendance_records (session_id, student_id, timestamp) VALUES (?, ?, NOW())");
$ins->bind_param('ii', $session_id, $student_id);
if ($ins->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to mark attendance']);
}
?>