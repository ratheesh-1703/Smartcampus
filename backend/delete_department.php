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
if ($id <= 0) {
    echo json_encode(["status" => false, "message" => "Invalid department id"]);
    exit;
}

$deptStmt = mysqli_prepare($conn, "SELECT id, name, code FROM departments WHERE id = ? LIMIT 1");
mysqli_stmt_bind_param($deptStmt, "i", $id);
mysqli_stmt_execute($deptStmt);
$deptRes = mysqli_stmt_get_result($deptStmt);
$dept = mysqli_fetch_assoc($deptRes);
mysqli_stmt_close($deptStmt);

if (!$dept) {
    echo json_encode(["status" => false, "message" => "Department not found"]);
    exit;
}

$deptName = (string)$dept['name'];
$deptCode = (string)$dept['code'];

$teacherStmt = mysqli_prepare($conn, "SELECT COUNT(*) AS total FROM teachers WHERE dept = ? OR dept = ?");
mysqli_stmt_bind_param($teacherStmt, "ss", $deptName, $deptCode);
mysqli_stmt_execute($teacherStmt);
$teacherCountRes = mysqli_stmt_get_result($teacherStmt);
$teacherCountRow = mysqli_fetch_assoc($teacherCountRes);
mysqli_stmt_close($teacherStmt);
$teacherCount = (int)($teacherCountRow['total'] ?? 0);

if ($teacherCount > 0) {
    echo json_encode(["status" => false, "message" => "Cannot delete: $teacherCount teacher(s) are assigned to this department"]);
    exit;
}

$studentStmt = mysqli_prepare($conn, "SELECT COUNT(*) AS total FROM students WHERE dept = ? OR dept = ?");
mysqli_stmt_bind_param($studentStmt, "ss", $deptName, $deptCode);
mysqli_stmt_execute($studentStmt);
$studentCountRes = mysqli_stmt_get_result($studentStmt);
$studentCountRow = mysqli_fetch_assoc($studentCountRes);
mysqli_stmt_close($studentStmt);
$studentCount = (int)($studentCountRow['total'] ?? 0);

if ($studentCount > 0) {
    echo json_encode(["status" => false, "message" => "Cannot delete: $studentCount student(s) are assigned to this department"]);
    exit;
}

$deleteStmt = mysqli_prepare($conn, "DELETE FROM departments WHERE id = ?");
mysqli_stmt_bind_param($deleteStmt, "i", $id);
$ok = mysqli_stmt_execute($deleteStmt);
mysqli_stmt_close($deleteStmt);

if (!$ok) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Failed to delete department", "error" => mysqli_error($conn)]);
    exit;
}

echo json_encode([
    "status" => true,
    "message" => "Department deleted successfully"
]);
?>
