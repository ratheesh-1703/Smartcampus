<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include "config.php";

$q = mysqli_query($conn, "
  SELECT
    d.id,
    d.name AS dept_name,
    d.code,
    d.hod_id,
    t.name AS hod_name,
    d.status,
    d.created_at,
    d.updated_at
  FROM departments d
  LEFT JOIN teachers t ON t.id = d.hod_id
  ORDER BY d.name ASC
");

if (!$q) {
  http_response_code(500);
  echo json_encode([
    "status" => false,
    "message" => "Failed to load departments",
    "error" => mysqli_error($conn)
  ]);
  exit;
}

$depts = [];
while($row = mysqli_fetch_assoc($q)){
  $depts[] = $row;
}

echo json_encode([
  "status"=>true,
  "departments"=>$depts
]);
