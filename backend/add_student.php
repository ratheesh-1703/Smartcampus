<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

include "config.php";

$data = json_decode(file_get_contents("php://input"));

$name = $data->name;
$reg = $data->reg_no;
$dept = $data->dept;
$year = $data->year;
$parent = $data->parent_phone;
$password = password_hash("123456", PASSWORD_DEFAULT); // default password

// create user account
$userQuery = mysqli_query($conn,"
INSERT INTO users(name, username, password, role)
VALUES ('$name','$reg','$password','student')
");

$user_id = mysqli_insert_id($conn);

// insert student
$studentQuery = mysqli_query($conn,"
INSERT INTO students(user_id, reg_no, name, dept, year, parent_phone)
VALUES('$user_id','$reg','$name','$dept','$year','$parent')
");

echo json_encode(["status"=>true,"message"=>"Student Added Successfully"]);
?>
