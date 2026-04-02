<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../auth/token.php';

$user = require_auth($conn);
if (!$user) exit;

// Return latest active session
$stmt = $conn->prepare("SELECT session_id, teacher_id, gateway_ip, start_time FROM attendance_sessions WHERE is_active = 1 ORDER BY start_time DESC LIMIT 1");
$stmt->execute();
$res = $stmt->get_result();
if ($res->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'No active session']);
    exit;
}
$row = $res->fetch_assoc();

// Optionally include teacher info
$t = $conn->prepare("SELECT id, name, register_no FROM users WHERE id = ? LIMIT 1");
$t->bind_param('i', $row['teacher_id']);
$t->execute();
$tr = $t->get_result()->fetch_assoc();

echo json_encode(['success' => true, 'session' => [
    'session_id' => (int)$row['session_id'],
    'teacher_id' => (int)$row['teacher_id'],
    'teacher_name' => $tr['name'] ?? null,
    'gateway_ip' => $row['gateway_ip'],
    'start_time' => $row['start_time']
]]);
?>