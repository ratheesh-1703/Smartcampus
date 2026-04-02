<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../auth/token.php';

$user = require_auth($conn);
if (!$user) exit;
if (strtolower($user['role']) !== 'teacher' && strtolower($user['role']) !== 'class_coordinator' && strtolower($user['role']) !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$session_id = $data['session_id'] ?? null;
if (!$session_id) {
    echo json_encode(['success' => false, 'message' => 'session_id required']);
    exit;
}

// ensure teacher owns the session (or admin)
$stmt = $conn->prepare("SELECT teacher_id FROM attendance_sessions WHERE session_id = ? LIMIT 1");
$stmt->bind_param('i', $session_id);
$stmt->execute();
$res = $stmt->get_result();
if ($res->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Session not found']);
    exit;
}
$row = $res->fetch_assoc();
if ($row['teacher_id'] != $user['id'] && strtolower($user['role']) !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden']);
    exit;
}

$upd = $conn->prepare("UPDATE attendance_sessions SET end_time = NOW(), is_active = 0 WHERE session_id = ?");
$upd->bind_param('i', $session_id);
if ($upd->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to stop session']);
}
?>