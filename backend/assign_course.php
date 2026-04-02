<?php
header("Content-Type: application/json");
include "config.php";

$data = json_decode(file_get_contents("php://input"), true);

$teacher_id = $data["teacher_id"];
$dept = $data["dept"];
$year = $data["year"];
$section = $data["section"];
$subject = $data["subject"];

mysqli_query($conn,"
INSERT INTO teacher_courses(teacher_id,dept,year,section,subject)
VALUES('$teacher_id','$dept','$year','$section','$subject')
");

echo json_encode(["status"=>true,"message"=>"Course Assigned"]);
?>
