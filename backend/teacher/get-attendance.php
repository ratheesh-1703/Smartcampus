<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../auth/token.php';

$user = require_auth($conn);
if (!$user) exit;

$session_id = isset($_GET['session_id']) ? intval($_GET['session_id']) : null;
if (!$session_id) {
    echo json_encode(['success' => false, 'message' => 'session_id required']);
    exit;
}

// ensure teacher owns the session or admin
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

$q = $conn->prepare("SELECT ar.id, ar.timestamp, u.id as student_id, u.name, u.register_no FROM attendance_records ar JOIN users u ON ar.student_id = u.id WHERE ar.session_id = ? ORDER BY ar.id DESC");
$q->bind_param('i', $session_id);
$q->execute();
$r = $q->get_result();
$list = [];
while ($row = $r->fetch_assoc()) {
    $list[] = [
        'id' => (int)$row['id'],
        'student_id' => (int)$row['student_id'],
        'name' => $row['name'],
        'register_no' => $row['register_no'],
        'timestamp' => $row['timestamp']
    ];
}

echo json_encode(['success' => true, 'records' => $list]);
?>