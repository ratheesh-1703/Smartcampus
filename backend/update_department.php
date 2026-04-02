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

$id = isset($data['id']) ? (int)$data['id'] : 0;
$deptName = isset($data['dept_name']) ? trim((string)$data['dept_name']) : '';

if ($id <= 0 || $deptName === '') {
    echo json_encode(["status" => false, "message" => "Department id and name are required"]);
    exit;
}

$check = mysqli_prepare($conn, "SELECT id FROM departments WHERE id = ? LIMIT 1");
mysqli_stmt_bind_param($check, "i", $id);
mysqli_stmt_execute($check);
$res = mysqli_stmt_get_result($check);
$row = mysqli_fetch_assoc($res);
mysqli_stmt_close($check);

if (!$row) {
    echo json_encode(["status" => false, "message" => "Department not found"]);
    exit;
}

$dup = mysqli_prepare($conn, "SELECT id FROM departments WHERE LOWER(name) = LOWER(?) AND id <> ? LIMIT 1");
mysqli_stmt_bind_param($dup, "si", $deptName, $id);
mysqli_stmt_execute($dup);
$dupRes = mysqli_stmt_get_result($dup);
$dupRow = mysqli_fetch_assoc($dupRes);
mysqli_stmt_close($dup);

if ($dupRow) {
    echo json_encode(["status" => false, "message" => "Another department with this name already exists"]);
    exit;
}

$update = mysqli_prepare($conn, "UPDATE departments SET name = ? WHERE id = ?");
mysqli_stmt_bind_param($update, "si", $deptName, $id);
$ok = mysqli_stmt_execute($update);
mysqli_stmt_close($update);

if (!$ok) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Failed to update department", "error" => mysqli_error($conn)]);
    exit;
}

echo json_encode([
    "status" => true,
    "message" => "Department updated successfully"
]);
?>
