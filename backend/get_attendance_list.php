<?php
include "config.php";
header("Content-Type: application/json");

$session_id = $_GET["session_id"];

$q = mysqli_query($conn,"
SELECT s.reg_no, s.name, s.dept, ar.marked_at 
FROM attendance_records ar
JOIN students s ON ar.student_id = s.id
WHERE ar.session_id = '$session_id'
ORDER BY ar.marked_at DESC
");

$students = [];
while($r = mysqli_fetch_assoc($q)){
    $students[] = $r;
}

echo json_encode([
 "status"=>true,
 "students"=>$students
]);
?>
