<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../auth/token.php';

$user = require_auth($conn);
if (!$user) exit;

// Only admin/teacher/student_affairs allowed to list all locations
$role = strtolower($user['role']);
if (!in_array($role, ['admin', 'teacher', 'student_affairs'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden']);
    exit;
}

$q = $conn->prepare("SELECT l.user_id, l.latitude, l.longitude, l.updated_at, u.name, u.register_no FROM student_locations l JOIN users u ON l.user_id = u.id ORDER BY l.updated_at DESC");
$q->execute();
$res = $q->get_result();
$list = [];
while ($row = $res->fetch_assoc()) {
    $list[] = $row;
}

echo json_encode(['success' => true, 'locations' => $list]);
?>