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

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

$submissionId = isset($data['submission_id']) ? (int)$data['submission_id'] : 0;
$decision = isset($data['decision']) ? strtolower(trim((string)$data['decision'])) : '';
$comment = isset($data['comment']) ? trim((string)$data['comment']) : '';

if ($submissionId <= 0 || !in_array($decision, ['approved', 'rejected'], true)) {
    echo json_encode(["status" => false, "message" => "submission_id and valid decision are required"]);
    exit;
}

$stmt = mysqli_prepare($conn, "SELECT student_id FROM form_submissions WHERE id = ? LIMIT 1");
mysqli_stmt_bind_param($stmt, "i", $submissionId);
mysqli_stmt_execute($stmt);
$res = mysqli_stmt_get_result($stmt);
$submission = mysqli_fetch_assoc($res);
mysqli_stmt_close($stmt);

if (!$submission) {
    echo json_encode(["status" => false, "message" => "Submission not found"]);
    exit;
}

$newStatus = $decision;
mysqli_begin_transaction($conn);

try {
    $stmt = mysqli_prepare($conn, "UPDATE form_submissions SET review_status = ?, updated_at = NOW() WHERE id = ?");
    mysqli_stmt_bind_param($stmt, "si", $newStatus, $submissionId);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_close($stmt);

    $actionBy = isset($data['reviewer_id']) ? (int)$data['reviewer_id'] : null;
    if (!$actionBy) {
        $actionBy = null;
    }

    $actionName = $decision;
    $stmt = mysqli_prepare($conn, "INSERT INTO form_workflow_audit (form_submission_id, action_by, action_name, remarks, created_at) VALUES (?, ?, ?, ?, NOW())");
    mysqli_stmt_bind_param($stmt, "iiss", $submissionId, $actionBy, $actionName, $comment);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_close($stmt);

    $message = "Your form #" . $submissionId . " has been " . $decision . ".";
    $studentId = (int)($submission['student_id'] ?? 0);
    if ($studentId > 0) {
        $stmt = mysqli_prepare($conn, "INSERT INTO form_notifications (user_id, form_submission_id, message, is_read, created_at) VALUES (?, ?, ?, 0, NOW())");
        mysqli_stmt_bind_param($stmt, "iis", $studentId, $submissionId, $message);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
    }

    mysqli_commit($conn);

    echo json_encode([
        "status" => true,
        "message" => "Submission " . $decision . " successfully"
    ]);
} catch (Throwable $e) {
    mysqli_rollback($conn);
    http_response_code(500);
    echo json_encode([
        "status" => false,
        "message" => "Failed to review submission",
        "error" => $e->getMessage()
    ]);
}
?>
