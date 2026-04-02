<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include "config.php";

header("Content-Type: application/json");

if(!isset($_GET["student_id"])){
    echo json_encode([
        "status"=>false,
        "message"=>"Student ID Missing"
    ]);
    exit;
}

$student_id = intval($_GET["student_id"]);

$q = mysqli_query($conn,"
SELECT 
 id,
 reg_no,
 name,
 dept,
 year,
 semester,
 student_email,
 student_phone,
 gender,
 dob,
 blood_group,
 address,
 city,
 state,
 pincode,
 photo
FROM students
WHERE id = '$student_id'
LIMIT 1
");

if(mysqli_num_rows($q)==1){

    $student = mysqli_fetch_assoc($q);

    echo json_encode([
        "status"=>true,
        "student"=>$student
    ]);
}
else{
    echo json_encode([
        "status"=>false,
        "message"=>"Student Not Found"
    ]);
}
?>
