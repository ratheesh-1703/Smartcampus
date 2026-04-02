<?php
include "config.php";

$data = json_decode(file_get_contents("php://input"), true);
$teacher_id = intval($data['teacher_id']);
$date = $data['date'] ?? date("Y-m-d");

/* Step 1: Get assigned class */
$q = $conn->query("
  SELECT assigned_class 
  FROM teachers 
  WHERE id=$teacher_id AND is_coordinator=1
");

if($q->num_rows == 0){
  echo json_encode(["status"=>false,"message"=>"Not coordinator"]);
  exit;
}

$class = $q->fetch_assoc()['assigned_class'];

/* Step 2: Fetch attendance */
$res = $conn->query("
  SELECT 
    s.name,
    s.reg_no,
    a.status,
    a.date
  FROM attendance a
  JOIN students s ON s.id = a.student_id
  WHERE s.class='$class' AND a.date='$date'
");

$records=[];
$present=0;
$absent=0;

while($r=$res->fetch_assoc()){
  $records[] = $r;
  if($r['status']=="Present") $present++;
  else $absent++;
}

echo json_encode([
  "status"=>true,
  "records"=>$records,
  "summary"=>[
    "present"=>$present,
    "absent"=>$absent
  ]
]);
