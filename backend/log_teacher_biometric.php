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

$teacher_id = isset($data['teacher_id']) ? (int)$data['teacher_id'] : 0;
$status = isset($data['status']) ? strtoupper(trim((string)$data['status'])) : '';
$note = isset($data['note']) ? trim((string)$data['note']) : '';

if ($teacher_id <= 0 || !in_array($status, ['CHECK_IN', 'CHECK_OUT'], true)) {
    echo json_encode(["status" => false, "message" => "Invalid teacher_id or status"]);
    exit;
}

$today = date('Y-m-d');

$stmt = mysqli_prepare($conn, "
    SELECT id, check_in, check_out
    FROM teacher_biometric_log
    WHERE teacher_id = ? AND attendance_date = ?
    ORDER BY id DESC
    LIMIT 1
");
mysqli_stmt_bind_param($stmt, "is", $teacher_id, $today);
mysqli_stmt_execute($stmt);
$res = mysqli_stmt_get_result($stmt);
$existing = mysqli_fetch_assoc($res);
mysqli_stmt_close($stmt);

if ($status === 'CHECK_IN') {
    if ($existing && !empty($existing['check_in']) && empty($existing['check_out'])) {
        echo json_encode(["status" => true, "message" => "Already checked in for today"]);
        exit;
    }

    $ins = mysqli_prepare($conn, "
        INSERT INTO teacher_biometric_log (teacher_id, attendance_date, check_in, device_info)
        VALUES (?, ?, NOW(), ?)
    ");
    mysqli_stmt_bind_param($ins, "iss", $teacher_id, $today, $note);
    $ok = mysqli_stmt_execute($ins);
    mysqli_stmt_close($ins);

    if (!$ok) {
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Failed to check in", "error" => mysqli_error($conn)]);
        exit;
    }

    echo json_encode(["status" => true, "message" => "Check-in recorded successfully"]);
    exit;
}

if (!$existing) {
    $ins = mysqli_prepare($conn, "
        INSERT INTO teacher_biometric_log (teacher_id, attendance_date, check_out, device_info)
        VALUES (?, ?, NOW(), ?)
    ");
    mysqli_stmt_bind_param($ins, "iss", $teacher_id, $today, $note);
    $ok = mysqli_stmt_execute($ins);
    mysqli_stmt_close($ins);

    if (!$ok) {
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Failed to check out", "error" => mysqli_error($conn)]);
        exit;
    }

    echo json_encode(["status" => true, "message" => "Check-out recorded successfully"]);
    exit;
}

$upd = mysqli_prepare($conn, "UPDATE teacher_biometric_log SET check_out = NOW(), device_info = ? WHERE id = ?");
$rowId = (int)$existing['id'];
mysqli_stmt_bind_param($upd, "si", $note, $rowId);
$ok = mysqli_stmt_execute($upd);
mysqli_stmt_close($upd);

if (!$ok) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Failed to check out", "error" => mysqli_error($conn)]);
    exit;
}

echo json_encode(["status" => true, "message" => "Check-out recorded successfully"]);
?>
