<?php
include "config.php";

$student_id = $_GET["student_id"] ?? 0;

$response = [
  "status" => false,
  "total" => 0,
  "present" => 0,
  "absent" => 0,
  "percentage" => 0
];

if(!$student_id){
  echo json_encode($response);
  exit;
}

$totalQuery = mysqli_query($conn,
"SELECT COUNT(*) AS total 
 FROM attendance_sessions");

$total = mysqli_fetch_assoc($totalQuery)["total"];

$presentQuery = mysqli_query($conn,
"SELECT COUNT(*) AS present 
 FROM attendance_records 
 WHERE student_id='$student_id' AND status='Present'");

$present = mysqli_fetch_assoc($presentQuery)["present"];

$absent = $total - $present;
$percentage = $total > 0 ? round(($present/$total)*100,2) : 0;

echo json_encode([
  "status" => true,
  "total" => $total,
  "present" => $present,
  "absent" => $absent,
  "percentage" => $percentage
]);
?>
