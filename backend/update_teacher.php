<?php
include "config.php";

$data = json_decode(file_get_contents("php://input"), true);

$id = $data["id"];
$name = $data["name"];
$dept = $data["dept"];
$phone = $data["phone"];
$email = $data["email"];

mysqli_query($conn,"
UPDATE teachers 
SET name='$name', dept='$dept', phone='$phone', email='$email'
WHERE id='$id'
");

echo json_encode([
 "status"=>true,
 "message"=>"Teacher Updated Successfully"
]);
?>
