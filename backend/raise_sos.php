<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if($_SERVER['REQUEST_METHOD'] === 'OPTIONS'){
  exit;
}

include "config.php";

$data = json_decode(file_get_contents("php://input"), true);

$student_id = $data["student_id"] ?? null;
$msg = $data["message"] ?? "Emergency Help Needed!";
$lat = $data["lat"] ?? null;
$lon = $data["lon"] ?? null;

if(!$student_id){
  echo json_encode(["status"=>false,"message"=>"Student Missing"]);
  exit;
}

// Insert SOS
mysqli_query($conn,"
INSERT INTO sos_alerts(student_id,message,latitude,longitude)
VALUES('$student_id','$msg','$lat','$lon')
");

echo json_encode([
  "status"=>true,
  "message"=>"SOS Triggered Successfully"
]);
?>
