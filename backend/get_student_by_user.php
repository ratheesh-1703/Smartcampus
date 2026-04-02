<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if($_SERVER['REQUEST_METHOD'] === 'OPTIONS'){
  exit;
}

include "config.php";

$user_id = $_GET["user_id"];

$q = mysqli_query($conn, "SELECT id FROM students WHERE user_id='$user_id' LIMIT 1");

if(mysqli_num_rows($q)){
    echo json_encode([
        "status"=>true,
        "student"=>mysqli_fetch_assoc($q)
    ]);
} else {
    echo json_encode([
        "status"=>false
    ]);
}
?>
