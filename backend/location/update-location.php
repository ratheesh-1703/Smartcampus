<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../auth/token.php';

$user = require_auth($conn);
if (!$user) exit;

$data = json_decode(file_get_contents('php://input'), true);
$lat = isset($data['latitude']) ? (float)$data['latitude'] : null;
$lng = isset($data['longitude']) ? (float)$data['longitude'] : null;

if ($lat === null || $lng === null) {
    echo json_encode(['success' => false, 'message' => 'latitude and longitude required']);
    exit;
}

// Upsert into student_locations (unique user_id)
$stmt = $conn->prepare("INSERT INTO student_locations (user_id, latitude, longitude) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude), updated_at = CURRENT_TIMESTAMP");
$stmt->bind_param('idd', $user['id'], $lat, $lng);
if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => $conn->error]);
}
?>