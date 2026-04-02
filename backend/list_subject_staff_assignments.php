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

$dept = isset($_GET['dept']) ? trim((string)$_GET['dept']) : '';
$status = isset($_GET['status']) ? trim((string)$_GET['status']) : '';

$where = [];
if ($dept !== '') {
    $deptEsc = mysqli_real_escape_string($conn, $dept);
    $where[] = "c.department = '$deptEsc'";
}
if ($status !== '') {
    $statusEsc = mysqli_real_escape_string($conn, $status);
    $where[] = "a.status = '$statusEsc'";
}

$whereSql = count($where) ? ('WHERE ' . implode(' AND ', $where)) : '';

$q = mysqli_query($conn, "
  SELECT
    a.id,
    c.year,
    c.section,
    s.subject_code,
    s.subject_name,
    s.credits,
    t.name AS teacher_name
  FROM subject_staff_assignments a
  LEFT JOIN classes c ON c.id = a.class_id
  LEFT JOIN subjects s ON s.id = a.subject_id
  LEFT JOIN teachers t ON t.id = a.teacher_id
  $whereSql
  ORDER BY a.id DESC
");

if (!$q) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Failed to fetch assignments", "error" => mysqli_error($conn), "assignments" => []]);
    exit;
}

$assignments = [];
while ($row = mysqli_fetch_assoc($q)) {
    $assignments[] = $row;
}

echo json_encode([
    "status" => true,
    "assignments" => $assignments
]);
?>
