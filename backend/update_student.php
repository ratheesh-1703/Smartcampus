<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin:*");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

include "config.php";

$data = json_decode(file_get_contents("php://input"));

$id = $data->id;
$name = $data->name;
$dept = $data->dept;
$year = $data->year;
$semester = $data->semester;
$phone = $data->student_phone;
$email = $data->student_email;
$address = $data->address;
$city = $data->city;
$state = $data->state;
$pincode = $data->pincode;

$query = mysqli_query($conn,"
UPDATE students SET 
 name='$name',
 dept='$dept',
 year='$year',
 semester='$semester',
 student_phone='$phone',
 student_email='$email',
 address='$address',
 city='$city',
 state='$state',
 pincode='$pincode'
WHERE id='$id'
");

if($query){
    echo json_encode(["status"=>true,"message"=>"Student Updated Successfully"]);
}else{
    echo json_encode(["status"=>false,"message"=>"Update Failed"]);
}
?>
