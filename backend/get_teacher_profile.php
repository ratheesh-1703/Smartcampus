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

$id = isset($_GET["id"]) ? (int)$_GET["id"] : 0;
if ($id <= 0) {
  echo json_encode(["status" => false, "message" => "Invalid teacher id"]);
  exit;
}

$stmt = mysqli_prepare($conn, "SELECT * FROM teachers WHERE id = ? OR user_id = ? LIMIT 1");
if (!$stmt) {
  http_response_code(500);
  echo json_encode(["status" => false, "message" => "Failed to prepare query", "error" => mysqli_error($conn)]);
  exit;
}

mysqli_stmt_bind_param($stmt, "ii", $id, $id);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$teacher = mysqli_fetch_assoc($result);
mysqli_stmt_close($stmt);

if ($teacher) {
  echo json_encode([
    "status" => true,
    "teacher" => $teacher
  ]);
  exit;
}

echo json_encode([
  "status" => false,
  "message" => "Teacher not found"
]);
?>
