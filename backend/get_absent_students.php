<?php
include "config.php";

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

if(!isset($_GET["session_id"])){
    echo json_encode([
        "status"=>false,
        "message"=>"session_id required"
    ]);
    exit;
}

$session_id = intval($_GET["session_id"]);

// Get session details
$sessionQ = mysqli_query($conn,"
    SELECT teacher_id, subject 
    FROM attendance_sessions 
    WHERE id=$session_id
");

if(mysqli_num_rows($sessionQ)==0){
    echo json_encode([
        "status"=>false,
        "message"=>"Session Not Found"
    ]);
    exit;
}

$session = mysqli_fetch_assoc($sessionQ);

// Find teacher details → get dept & year mapping
$teacherQ = mysqli_query($conn,"
    SELECT dept 
    FROM teachers 
    WHERE user_id=".$session['teacher_id']
);

$teacher = mysqli_fetch_assoc($teacherQ);
$dept = $teacher["dept"];

// Get students of that department
$studentsQ = mysqli_query($conn,"
SELECT id, reg_no, name, dept
FROM students 
WHERE dept='$dept'
");

// Get present students
$presentQ = mysqli_query($conn,"
SELECT student_id 
FROM attendance 
WHERE session_id=$session_id
");

$presentIds = [];
while($p = mysqli_fetch_assoc($presentQ)){
    $presentIds[] = $p["student_id"];
}

$absent = [];

while($s = mysqli_fetch_assoc($studentsQ)){
    if(!in_array($s["id"], $presentIds)){
        $absent[] = $s;
    }
}

echo json_encode([
    "status"=>true,
    "count"=>count($absent),
    "absent"=>$absent
]);
?>
