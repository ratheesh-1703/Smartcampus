<?php
require "config.php";

header("Content-Type: application/json");

// Check if ID given
if(!isset($_GET["id"])){
    echo json_encode([
        "status"=>false,
        "message"=>"Student ID Missing"
    ]);
    exit;
}

$id = intval($_GET["id"]);

$q = mysqli_query($conn,"
SELECT 
 s.* 
FROM students s
WHERE s.id = '$id'
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
