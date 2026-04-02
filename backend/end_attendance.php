<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

include "config.php";

$teacher_id = $_GET["teacher_id"];

// GET ACTIVE SESSION
$q = mysqli_query($conn,"
SELECT * FROM attendance_sessions
WHERE teacher_id='$teacher_id' AND is_active=1
LIMIT 1
");

if(!mysqli_num_rows($q)){
  echo json_encode([
    "status"=>false,
    "message"=>"No Active Session"
  ]);
  exit;
}

$session = mysqli_fetch_assoc($q);
$session_id = $session["id"];

// CLOSE SESSION
mysqli_query($conn,"
UPDATE attendance_sessions 
SET is_active=0, ended_at=NOW()
WHERE id='$session_id'
");

// ================= ABSENTEES =================
$absent = mysqli_query($conn,"
SELECT s.name, s.reg_no, s.parent_email
FROM students s
WHERE s.dept='{$session['dept']}'
AND s.year='{$session['year']}'
AND s.section='{$session['section']}'
AND s.id NOT IN (
  SELECT student_id FROM attendance_records 
  WHERE session_id='$session_id'
)
");

// ================= SEND EMAIL ALERT =================
while($a = mysqli_fetch_assoc($absent)){

  if(!$a["parent_email"]) continue;

  $to = $a["parent_email"];
  $subject = "Attendance Alert - {$a['name']} ({$a['reg_no']})";

  $msg = "
  Dear Parent,<br><br>
  This is to inform you that your ward:<br><br>

  <b>Name:</b> {$a['name']}<br>
  <b>Register No:</b> {$a['reg_no']}<br>
  <b>Subject:</b> {$session['subject']}<br>
  <b>Date:</b> ".date("d-m-Y")."<br><br>

  was marked <span style='color:red'><b>ABSENT</b></span> today.<br><br>

  Regards,<br>
  Smart Campus System
  ";

  $headers  = "MIME-Version: 1.0\r\n";
  $headers .= "Content-type:text/html;charset=UTF-8\r\n";
  $headers .= "From: Smart Campus <no-reply@smartcampus.com>";

  mail($to, $subject, $msg, $headers);
}

echo json_encode([
  "status"=>true,
  "message"=>"Attendance Ended & Parent Alerts Sent"
]);
?>
