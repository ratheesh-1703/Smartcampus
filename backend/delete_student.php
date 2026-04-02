<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin:*");
include "config.php";

$id = $_GET["id"];

// delete user too
$q = mysqli_query($conn,"SELECT user_id FROM students WHERE id='$id'");
$u = mysqli_fetch_assoc($q)["user_id"];

mysqli_query($conn,"DELETE FROM users WHERE id='$u'");
mysqli_query($conn,"DELETE FROM students WHERE id='$id'");

echo json_encode(["status"=>true,"message"=>"Student Deleted"]);
?>
