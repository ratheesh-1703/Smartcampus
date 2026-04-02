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

$department = isset($data['department']) ? trim((string)$data['department']) : '';
$year = isset($data['year']) ? trim((string)$data['year']) : '';
$section = isset($data['section']) ? trim((string)$data['section']) : '';

if ($department === '' || $year === '' || $section === '') {
    echo json_encode(["status" => false, "message" => "department, year and section are required"]);
    exit;
}

$stmt = mysqli_prepare($conn, "
  UPDATE class_coordinators
  SET status = 'inactive'
  WHERE department = ?
    AND year = ?
    AND section = ?
    AND status = 'active'
");
mysqli_stmt_bind_param($stmt, "sss", $department, $year, $section);
mysqli_stmt_execute($stmt);
$affected = mysqli_stmt_affected_rows($stmt);
mysqli_stmt_close($stmt);

echo json_encode([
  "status" => true,
  "message" => $affected > 0 ? "Coordinator removed successfully" : "No active coordinator found"
]);
?>
