<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
include "config.php";

$hod_user_id = $_GET["user_id"];

$q = mysqli_query($conn,"
SELECT t.dept, t.id as teacher_id
FROM teachers t
JOIN hods h ON h.teacher_id = t.id
WHERE t.user_id = '$hod_user_id'
");

if(!mysqli_num_rows($q)){
  echo json_encode(["status"=>false]);
  exit;
}

$hod = mysqli_fetch_assoc($q);
$dept = $hod["dept"];

$teachers = mysqli_query($conn,"
SELECT * FROM teachers WHERE dept='$dept'
");

$list=[];
while($t=mysqli_fetch_assoc($teachers)){
  $list[]=$t;
}

echo json_encode([
  "status"=>true,
  "teachers"=>$list
]);
