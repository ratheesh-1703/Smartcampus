<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
include "config.php";

$q = mysqli_query($conn,"
  SELECT id,name,staff_id,dept
  FROM teachers
  ORDER BY dept,name
");

$teachers = [];
while($row = mysqli_fetch_assoc($q)){
  $teachers[] = $row;
}

echo json_encode([
  "status"=>true,
  "teachers"=>$teachers
]);
