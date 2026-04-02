<?php
include "config.php";

$id = $_GET["id"];

mysqli_query($conn,"DELETE FROM teachers WHERE id='$id'");
mysqli_query($conn,"DELETE FROM users WHERE role='teacher' AND id='$id'");

echo json_encode([
 "status"=>true,
 "message"=>"Teacher Deleted Successfully"
]);
?>
