<?php
include "config.php";

$data = json_decode(file_get_contents("php://input"), true);

$student_id = intval($data['student_id']);
$teacher_id = intval($data['teacher_id']);
$date = date("Y-m-d");

$conn->query("
  INSERT INTO attendance (student_id, date, status, marked_by)
  VALUES ($student_id, '$date', 'Present', $teacher_id)
");

echo json_encode(["status"=>true]);
