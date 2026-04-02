<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit;
}

$payload = json_decode(file_get_contents("php://input"), true) ?: [];
$reason = trim($payload["reason"] ?? "Need early leave");

echo json_encode([
    "status" => true,
    "message" => "Logout permission request submitted",
    "reason" => $reason
]);
?>
