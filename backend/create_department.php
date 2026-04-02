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

$deptName = isset($data['dept_name']) ? trim((string)$data['dept_name']) : '';
if ($deptName === '') {
    echo json_encode(["status" => false, "message" => "Department name is required"]);
    exit;
}

$check = mysqli_prepare($conn, "SELECT id FROM departments WHERE LOWER(name) = LOWER(?) LIMIT 1");
mysqli_stmt_bind_param($check, "s", $deptName);
mysqli_stmt_execute($check);
$existing = mysqli_stmt_get_result($check);
$existsRow = mysqli_fetch_assoc($existing);
mysqli_stmt_close($check);

if ($existsRow) {
    echo json_encode(["status" => false, "message" => "Department already exists"]);
    exit;
}

$baseCode = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $deptName));
if ($baseCode === '') {
    $baseCode = 'DEPT';
}
$baseCode = substr($baseCode, 0, 20);
$code = $baseCode;
$counter = 1;

while (true) {
    $codeCheck = mysqli_prepare($conn, "SELECT id FROM departments WHERE code = ? LIMIT 1");
    mysqli_stmt_bind_param($codeCheck, "s", $code);
    mysqli_stmt_execute($codeCheck);
    $codeRes = mysqli_stmt_get_result($codeCheck);
    $codeExists = mysqli_fetch_assoc($codeRes);
    mysqli_stmt_close($codeCheck);

    if (!$codeExists) {
        break;
    }

    $counter++;
    $suffix = (string)$counter;
    $code = substr($baseCode, 0, max(1, 20 - strlen($suffix))) . $suffix;
}

$insert = mysqli_prepare($conn, "INSERT INTO departments (name, code, status) VALUES (?, ?, 'active')");
mysqli_stmt_bind_param($insert, "ss", $deptName, $code);
$ok = mysqli_stmt_execute($insert);
$newId = mysqli_insert_id($conn);
mysqli_stmt_close($insert);

if (!$ok) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Failed to create department", "error" => mysqli_error($conn)]);
    exit;
}

echo json_encode([
    "status" => true,
    "message" => "Department created successfully",
    "department" => [
        "id" => $newId,
        "dept_name" => $deptName,
        "code" => $code
    ]
]);
?>
