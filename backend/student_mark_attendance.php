<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include "config.php";

if($_SERVER['REQUEST_METHOD'] === 'OPTIONS'){
  exit;
}

require "config.php";
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

if(!$data){
    echo json_encode(["status"=>false,"message"=>"No Data Received"]);
    exit;
}

$student_id = $data["student_id"];
$gateway_ip = $_SERVER['REMOTE_ADDR']; // Mobile / Lab wifi IP

// 1. Check if active session exists
$s = mysqli_query($conn,"
SELECT * FROM attendance_sessions
WHERE is_active = 1
LIMIT 1
");

if(mysqli_num_rows($s)==0){
    echo json_encode([
        "status"=>false,
        "message"=>"No Active Attendance Session"
    ]);
    exit;
}

$session = mysqli_fetch_assoc($s);
$session_id = $session["id"];

// 2. Validate Gateway IP
if($session["gateway_ip"] !== $gateway_ip){
    echo json_encode([
        "status"=>false,
        "message"=>"You are not connected to classroom network"
    ]);
    exit;
}

// 3. Prevent duplicate marking
$chk = mysqli_query($conn,"
SELECT id FROM attendance_records
WHERE session_id='$session_id' AND student_id='$student_id'
");

if(mysqli_num_rows($chk)>0){
    echo json_encode([
        "status"=>false,
        "message"=>"Attendance Already Marked"
    ]);
    exit;
}

// 4. Insert Attendance
mysqli_query($conn,"
INSERT INTO attendance_records(session_id, student_id)
VALUES('$session_id','$student_id')
");

echo json_encode([
 "status"=>true,
 "message"=>"Attendance Marked Successfully 🎉",
 "session_subject"=>$session["subject"]
]);
?>
