<?php
include "config.php";

$data = json_decode(file_get_contents("php://input"), true);
$teacher_id = intval($data['teacher_id']);

$q = $conn->query("
  SELECT assigned_class 
  FROM teachers 
  WHERE id=$teacher_id AND is_coordinator=1
");

if($q->num_rows == 0){
  echo json_encode(["status"=>false]);
  exit;
}

$class = $q->fetch_assoc()['assigned_class'];

$res = $conn->query("
  SELECT id, name, reg_no 
  FROM students 
  WHERE class='$class'
");

$students=[];
while($r=$res->fetch_assoc()){
  $students[]=$r;
}

echo json_encode([
  "status"=>true,
  "students"=>$students
]);
