<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

include "config.php";

try {
    $payload = json_decode(file_get_contents("php://input"), true) ?: [];

    $requestId = intval($payload["request_id"] ?? 0);
    $decision = strtolower(trim((string)($payload["decision"] ?? "")));
    $decisionNote = mysqli_real_escape_string($conn, trim((string)($payload["decision_note"] ?? "")));
    $decidedBy = intval($payload["decided_by"] ?? 0);

    if ($requestId <= 0 || !in_array($decision, ["approved", "rejected"], true)) {
        echo json_encode([
            "status" => false,
            "message" => "request_id and valid decision are required"
        ]);
        exit;
    }

    $reqCheck = mysqli_query($conn, "SELECT id, status FROM student_logout_requests WHERE id=$requestId LIMIT 1");
    if (!$reqCheck || mysqli_num_rows($reqCheck) === 0) {
        echo json_encode([
            "status" => false,
            "message" => "Request not found"
        ]);
        exit;
    }

    mysqli_query($conn, "
        UPDATE student_logout_requests
        SET status='$decision',
            decision_notes='$decisionNote',
            decided_by=" . ($decidedBy > 0 ? $decidedBy : "NULL") . ",
            decided_at=NOW()
        WHERE id=$requestId
        LIMIT 1
    ");

    echo json_encode([
        "status" => true,
        "message" => "Logout request updated",
        "request_id" => $requestId,
        "decision" => $decision
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => false,
        "message" => "Failed to update logout request",
        "error" => $e->getMessage()
    ]);
}
?>
