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
    $where[] = "p.status = '$statusEsc'";
}

$whereSql = count($where) ? ('WHERE ' . implode(' AND ', $where)) : '';

$q = mysqli_query($conn, "
  SELECT
    p.id,
    c.year,
    c.section,
    s.subject_code,
    s.subject_name,
    s.credits
  FROM class_subject_plans p
  LEFT JOIN classes c ON c.id = p.class_id
  LEFT JOIN subjects s ON s.id = p.subject_id
  $whereSql
  ORDER BY p.id DESC
");

if (!$q) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Failed to fetch plans", "error" => mysqli_error($conn), "plans" => []]);
    exit;
}

$plans = [];
while ($row = mysqli_fetch_assoc($q)) {
    $plans[] = $row;
}

echo json_encode([
    "status" => true,
    "plans" => $plans
]);
?>
