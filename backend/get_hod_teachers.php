<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

include "config.php";

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);
if (!is_array($data)) {
  $data = $_POST;
}

$hodInput = 0;
if (isset($data['teacher_id'])) {
  $hodInput = (int)$data['teacher_id'];
} elseif (isset($_GET['teacher_id'])) {
  $hodInput = (int)$_GET['teacher_id'];
}

if ($hodInput <= 0) {
  echo json_encode(["status" => false, "message" => "teacher_id is required", "teachers" => []]);
  exit;
}

$stmt = mysqli_prepare($conn, "SELECT id, dept FROM teachers WHERE id = ? OR user_id = ? LIMIT 1");
if (!$stmt) {
  http_response_code(500);
  echo json_encode(["status" => false, "message" => "Failed to prepare HOD lookup", "error" => mysqli_error($conn), "teachers" => []]);
  exit;
}

mysqli_stmt_bind_param($stmt, "ii", $hodInput, $hodInput);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$hodRow = mysqli_fetch_assoc($result);
mysqli_stmt_close($stmt);

if (!$hodRow || empty($hodRow['dept'])) {
  echo json_encode(["status" => false, "message" => "HOD department not found", "teachers" => []]);
  exit;
}

$dept = (string)$hodRow['dept'];

$stmt = mysqli_prepare($conn, "
  SELECT
    t.id,
    t.name,
    t.teacher_code AS staff_id,
    t.dept,
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM class_coordinators cc
        WHERE cc.teacher_id = t.id
          AND cc.department = t.dept
          AND cc.status = 'active'
      ) THEN 1 ELSE 0
    END AS is_coordinator,
    (
      SELECT CONCAT('Year ', cc2.year, ' - ', cc2.section)
      FROM class_coordinators cc2
      WHERE cc2.teacher_id = t.id
        AND cc2.department = t.dept
        AND cc2.status = 'active'
      ORDER BY cc2.id DESC
      LIMIT 1
    ) AS assigned_class
  FROM teachers t
  WHERE t.dept = ?
  ORDER BY t.name ASC
");

if (!$stmt) {
  http_response_code(500);
  echo json_encode(["status" => false, "message" => "Failed to load teachers", "error" => mysqli_error($conn), "teachers" => []]);
  exit;
}

mysqli_stmt_bind_param($stmt, "s", $dept);
mysqli_stmt_execute($stmt);
$res = mysqli_stmt_get_result($stmt);

$teachers = [];
while ($r = mysqli_fetch_assoc($res)) {
  $teachers[] = $r;
}
mysqli_stmt_close($stmt);

echo json_encode([
  "status" => true,
  "dept" => $dept,
  "teachers" => $teachers
]);
