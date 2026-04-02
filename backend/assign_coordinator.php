<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
include "config.php";

$data = json_decode(file_get_contents("php://input"), true);

$teacher_id = $data["teacher_id"];
$year = $data["year"];
$section = $data["section"];
$hod_user_id = $data["hod_user_id"];

// Get HOD dept
$q = mysqli_query($conn,"
SELECT t.id, t.dept 
FROM teachers t
JOIN hods h ON h.teacher_id = t.id
WHERE t.user_id='$hod_user_id'
");

$hod = mysqli_fetch_assoc($q);

// Verify same dept
$tq = mysqli_query($conn,"
SELECT * FROM teachers WHERE id='$teacher_id' AND dept='{$hod['dept']}'
");

if(!mysqli_num_rows($tq)){
  echo json_encode(["status"=>false,"message"=>"Unauthorized"]);
  exit;
}

mysqli_query($conn,"
INSERT INTO class_coordinators
(teacher_id,dept,year,section,assigned_by)
VALUES('$teacher_id','{$hod['dept']}','$year','$section','{$hod['id']}')
");

echo json_encode(["status"=>true,"message"=>"Coordinator Assigned"]);
