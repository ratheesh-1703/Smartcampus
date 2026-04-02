<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include "config.php";

$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
if ($limit <= 0) {
    $limit = 10;
}
$limit = min($limit, 100);

$notifications = [];
$q = mysqli_query($conn, "SELECT id, user_id, form_submission_id, message, is_read, created_at FROM form_notifications ORDER BY id DESC LIMIT $limit");
if ($q) {
    while ($row = mysqli_fetch_assoc($q)) {
        $notifications[] = $row;
    }
}

$unread = 0;
$uq = mysqli_query($conn, "SELECT COUNT(*) AS total FROM form_notifications WHERE is_read = 0");
if ($uq) {
    $ur = mysqli_fetch_assoc($uq);
    $unread = (int)($ur['total'] ?? 0);
}

echo json_encode([
    "status" => true,
    "notifications" => $notifications,
    "unread_count" => $unread
]);
?>
