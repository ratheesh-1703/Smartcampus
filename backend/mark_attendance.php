<?php
include "config.php";
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

$student_id = $data["student_id"];
$session_id = $data["session_id"];

$student_ip = $_SERVER['REMOTE_ADDR'];

// Get session details
$sess = mysqli_query($conn,
"SELECT gateway_ip FROM attendance_sessions WHERE id='$session_id' AND is_active=1");

if(mysqli_num_rows($sess)==0){
  echo json_encode(["status"=>false,"message"=>"Session expired"]);
  exit;
}

$session = mysqli_fetch_assoc($sess);
$teacher_gateway = $session["gateway_ip"];

// Extract only first 3 octets of IP
$teacher_net = implode('.', array_slice(explode('.', $teacher_gateway),0,3));
$student_net = implode('.', array_slice(explode('.', $student_ip),0,3));

if($teacher_net !== $student_net){
  echo json_encode([
    "status"=>false,
    "message"=>"You are not connected to class hotspot ❌"
  ]);
  exit;
}

// Prevent duplicate
$check = mysqli_query($conn,
"SELECT id FROM attendance_records WHERE student_id='$student_id' AND session_id='$session_id'");

if(mysqli_num_rows($check)>0){
  echo json_encode(["status"=>false,"message"=>"Already Marked"]);
  exit;
}

$q = mysqli_query($conn,
"INSERT INTO attendance_records(student_id,session_id,student_ip)
 VALUES('$student_id','$session_id','$student_ip')");

if($q){
  echo json_encode(["status"=>true,"message"=>"Attendance Marked ✅"]);
}else{
  echo json_encode(["status"=>false,"message"=>"Failed"]);
}
?>
