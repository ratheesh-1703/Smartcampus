<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include "config.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => false, "message" => "Method not allowed"]);
    exit;
}

$ok = mysqli_query($conn, "UPDATE form_notifications SET is_read = 1 WHERE is_read = 0");

if (!$ok) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Failed to update notifications", "error" => mysqli_error($conn)]);
    exit;
}

echo json_encode(["status" => true, "message" => "Notifications marked as read"]);
?>
