<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

include "config.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => false, "message" => "Invalid request method"]);
    exit;
}

$raw = json_decode(file_get_contents("php://input"), true);
$id = $raw["id"] ?? $_POST["id"] ?? null;
$id = intval($id);

if ($id <= 0) {
    echo json_encode(["status" => false, "message" => "Invalid SOS id"]);
    exit;
}

try {
    $hasStatus = mysqli_num_rows(mysqli_query($conn, "SHOW COLUMNS FROM sos_alerts LIKE 'status'")) > 0;
    $hasResolvedAt = mysqli_num_rows(mysqli_query($conn, "SHOW COLUMNS FROM sos_alerts LIKE 'resolved_at'")) > 0;

    if (!$hasStatus && !$hasResolvedAt) {
        echo json_encode(["status" => false, "message" => "SOS schema does not support resolution"]);
        exit;
    }

    $setParts = [];
    if ($hasStatus) {
        $setParts[] = "status='resolved'";
    }
    if ($hasResolvedAt) {
        $setParts[] = "resolved_at=NOW()";
    }

    $setSql = implode(", ", $setParts);
    $sql = "UPDATE sos_alerts SET $setSql WHERE id = ?";

    if ($hasStatus) {
        $sql .= " AND LOWER(COALESCE(status, 'open')) NOT IN ('resolved', 'closed')";
    }

    $stmt = mysqli_prepare($conn, $sql);
    mysqli_stmt_bind_param($stmt, "i", $id);
    mysqli_stmt_execute($stmt);
    $affected = mysqli_stmt_affected_rows($stmt);

    if ($affected > 0) {
        echo json_encode(["status" => true, "message" => "SOS marked as completed"]);
    } else {
        echo json_encode(["status" => false, "message" => "SOS already completed or not found"]);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Failed to update SOS status"]);
}
?>