<?php
require "config.php";
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

if(!$data){
    echo json_encode(["status"=>false,"message"=>"No Input"]);
    exit;
}

$student_id = $data["student_id"];
$semester = $data["semester"];
$gpa = $data["gpa"];
$result = strtoupper($data["result"]);

$check = mysqli_query($conn,"
SELECT id FROM grades
WHERE student_id='$student_id' AND semester='$semester'
");

if(mysqli_num_rows($check) > 0){
    mysqli_query($conn,"
        UPDATE grades 
        SET gpa='$gpa', result='$result'
        WHERE student_id='$student_id' AND semester='$semester'
    ");

    echo json_encode([
        "status"=>true,
        "message"=>"Grade Updated Successfully"
    ]);
}
else{
    mysqli_query($conn,"
        INSERT INTO grades(student_id, semester, gpa, result)
        VALUES('$student_id','$semester','$gpa','$result')
    ");

    echo json_encode([
        "status"=>true,
        "message"=>"Grade Added Successfully"
    ]);
}
?>
