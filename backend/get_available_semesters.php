<?php
require "config.php";
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
SELECT DISTINCT semester 
FROM marks
WHERE student_id='$student_id'
ORDER BY semester ASC
");

$sem = [];
while($r = mysqli_fetch_assoc($q)){
    $sem[] = $r["semester"];
}

echo json_encode([
 "status"=>true,
 "semesters"=>$sem
]);
?>
