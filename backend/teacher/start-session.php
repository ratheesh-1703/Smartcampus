<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../auth/token.php';

$user = require_auth($conn); // teacher or admin allowed by check below
if (!$user) exit;
if (strtolower($user['role']) !== 'teacher' && strtolower($user['role']) !== 'class_coordinator' && strtolower($user['role']) !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$hotspot_ssid = $data['hotspot_ssid'] ?? null;
$gateway_ip = $_SERVER['REMOTE_ADDR'];
$teacher_id = $user['id'];

$stmt = $conn->prepare("INSERT INTO attendance_sessions (teacher_id, hotspot_ssid, gateway_ip, start_time, is_active) VALUES (?, ?, ?, NOW(), 1)");
$stmt->bind_param("iss", $teacher_id, $hotspot_ssid, $gateway_ip);
if ($stmt->execute()) {
    $session_id = $conn->insert_id;
    echo json_encode(['success' => true, 'session_id' => $session_id, 'gateway_ip' => $gateway_ip]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to start session', 'error' => $conn->error]);
}
?>