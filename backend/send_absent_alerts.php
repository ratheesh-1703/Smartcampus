<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

include "config.php";

$session_id = $_GET["session_id"] ?? 0;

if(!$session_id){
    echo json_encode(["status"=>false,"message"=>"Session ID Missing"]);
    exit;
}

// SESSION DETAILS
$session = mysqli_fetch_assoc(mysqli_query($conn,"
SELECT subject,teacher_id,started_at 
FROM attendance_sessions 
WHERE id='$session_id'
"));

$subjectName = $session["subject"];
$date = $session["started_at"];

// GET ABSENT STUDENTS
$absent = mysqli_query($conn,"
SELECT s.name,s.reg_no,s.parent_email 
FROM students s
WHERE s.id NOT IN(
   SELECT student_id FROM attendance_records WHERE session_id='$session_id'
)
");

if(!mysqli_num_rows($absent)){
    echo json_encode(["status"=>true,"message"=>"No Absentees"]);
    exit;
}

// SEND EMAIL
while($s = mysqli_fetch_assoc($absent)){

    $to = $s["parent_email"];
    if(!$to) continue;

    $title = "Student Absent Alert - Smart Campus";
    $msg =
"Dear Parent,

Your ward {$s['name']} ({$s['reg_no']}) was ABSENT for:
Subject: $subjectName
Date: $date

If this is unexpected, please contact the department.

Regards,
Smart Campus System";

    $headers = "From: smartcampus@gmail.com";

    mail($to,$title,$msg,$headers);
}

echo json_encode([
    "status"=>true,
    "message"=>"Absent parent alerts sent successfully"
]);
?>
