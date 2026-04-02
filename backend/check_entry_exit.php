<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include "config.php";

$data = json_decode(file_get_contents("php://input"), true);

$student_id = $data["student_id"];
$lat = $data["latitude"];
$lng = $data["longitude"];

/* CAMPUS BOUNDARY */
$inside =
  ($lat >= 9.5698 && $lat <= 9.5795) &&
  ($lng >= 77.6695 && $lng <= 77.6875);

/* GET CURRENT STATUS */
$q = mysqli_query($conn,"
  SELECT * FROM student_entry_log
  WHERE student_id='$student_id'
");

if(mysqli_num_rows($q)==0){
  mysqli_query($conn,"
    INSERT INTO student_entry_log(student_id,last_status)
    VALUES('$student_id','OUT')
  ");
  $current = "OUT";
}else{
  $row = mysqli_fetch_assoc($q);
  $current = $row["last_status"];
}

/* ENTRY */
if($inside && $current=="OUT"){
  mysqli_query($conn,"
    UPDATE student_entry_log
    SET entry_time=NOW(), last_status='IN'
    WHERE student_id='$student_id'
  ");
}

/* EXIT */
if(!$inside && $current=="IN"){
  mysqli_query($conn,"
    UPDATE student_entry_log
    SET exit_time=NOW(), last_status='OUT'
    WHERE student_id='$student_id'
  ");
}

echo json_encode(["status"=>true,"inside"=>$inside]);
