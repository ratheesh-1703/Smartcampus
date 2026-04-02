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

// Check session exists
$s = mysqli_query($conn,
"SELECT * FROM attendance_sessions WHERE id=$session_id LIMIT 1");

if(mysqli_num_rows($s) == 0){
    echo json_encode([
        "status"=>false,
        "message"=>"Session Not Found"
    ]);
    exit;
}

// Total Students (all students in college — modify if section based later)
$totalQuery = mysqli_query($conn,"SELECT COUNT(*) AS total FROM students");
$totalRow = mysqli_fetch_assoc($totalQuery);
$total = $totalRow["total"];

// Present Students
$presentQuery = mysqli_query($conn,"
SELECT COUNT(*) AS present 
FROM attendance 
WHERE session_id = $session_id
");
$pRow = mysqli_fetch_assoc($presentQuery);
$present = $pRow["present"];

// Absent = Total - Present
$absent = $total - $present;

$percentage = 0;
if($total > 0){
    $percentage = round(($present / $total) * 100, 2);
}

echo json_encode([
    "status"=>true,
    "total"=>$total,
    "present"=>$present,
    "absent"=>$absent,
    "percentage"=>$percentage
]);
?>
