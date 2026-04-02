<?php
header('Content-Type: application/json; charset=UTF-8');

include "config.php";

$res = mysqli_query($conn, "SELECT * FROM teachers ORDER BY id DESC");

if (!$res) {
  http_response_code(500);
  echo json_encode([
    "status" => false,
    "message" => "Failed to fetch teachers",
    "error" => mysqli_error($conn)
  ]);
  exit;
}

$teachers = [];
while ($t = mysqli_fetch_assoc($res)) {
  $teachers[] = $t;
}

echo json_encode([
  "status" => true,
  "teachers" => $teachers
]);
?>
