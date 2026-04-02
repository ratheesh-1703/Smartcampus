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

$teacherId = isset($data['teacher_id']) ? (int)$data['teacher_id'] : 0;
$action = isset($data['action']) ? strtolower(trim((string)$data['action'])) : 'assign';

if ($teacherId <= 0) {
    echo json_encode(["status" => false, "message" => "teacher_id is required"]);
    exit;
}

$stmt = mysqli_prepare($conn, "SELECT id, dept FROM teachers WHERE id = ? LIMIT 1");
mysqli_stmt_bind_param($stmt, "i", $teacherId);
mysqli_stmt_execute($stmt);
$res = mysqli_stmt_get_result($stmt);
$teacher = mysqli_fetch_assoc($res);
mysqli_stmt_close($stmt);

if (!$teacher || empty($teacher['dept'])) {
    echo json_encode(["status" => false, "message" => "Teacher or department not found"]);
    exit;
}

$dept = (string)$teacher['dept'];

mysqli_begin_transaction($conn);
try {
    if ($action === 'remove') {
        $stmt = mysqli_prepare($conn, "UPDATE subject_controllers SET status = 'inactive' WHERE teacher_id = ? AND dept = ? AND status = 'active'");
        mysqli_stmt_bind_param($stmt, "is", $teacherId, $dept);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);

        mysqli_commit($conn);
        echo json_encode(["status" => true, "message" => "Subject controller removed"]);
        exit;
    }

    $stmt = mysqli_prepare($conn, "UPDATE subject_controllers SET status = 'inactive' WHERE dept = ? AND status = 'active'");
    mysqli_stmt_bind_param($stmt, "s", $dept);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_close($stmt);

    $assignedBy = isset($data['assigned_by']) ? (int)$data['assigned_by'] : null;
    if (!$assignedBy) {
        $assignedBy = null;
    }

    $stmt = mysqli_prepare($conn, "INSERT INTO subject_controllers (teacher_id, dept, assigned_by, status, assigned_at) VALUES (?, ?, ?, 'active', NOW())");
    mysqli_stmt_bind_param($stmt, "isi", $teacherId, $dept, $assignedBy);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_close($stmt);

    mysqli_commit($conn);
    echo json_encode(["status" => true, "message" => "Subject controller assigned"]);
} catch (Throwable $e) {
    mysqli_rollback($conn);
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Failed to update subject controller", "error" => $e->getMessage()]);
}
?>
