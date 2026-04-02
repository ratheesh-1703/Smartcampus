<?php
include "config.php";

header("Content-Type: application/json");

$q = mysqli_query($conn,
"SELECT * FROM attendance_sessions 
 WHERE is_active = 1
 ORDER BY id DESC LIMIT 1");

if(mysqli_num_rows($q)==0){
  echo json_encode(["status"=>false,"message"=>"No active session"]);
  exit;
}

echo json_encode([
  "status"=>true,
  "session"=>mysqli_fetch_assoc($q)
]);
?>
