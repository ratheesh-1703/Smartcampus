<?php
require_once __DIR__ . '/../config/db.php';

$sql = "ALTER TABLE attendance_sessions
  ADD COLUMN IF NOT EXISTS gateway_ip VARCHAR(45) NULL,
  ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 1";

if ($conn->query($sql) === TRUE) {
    echo json_encode(['success' => true, 'message' => 'attendance_sessions updated']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $conn->error]);
}
?>