<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

include "config.php";

$data = json_decode(file_get_contents("php://input"), true);

$name       = $data["name"];
$staff_id   = $data["staff_id"];
$dept       = $data["dept"];
$phone      = $data["phone"];
$email      = $data["email"];
$dob        = $data["dob"];
$gender     = $data["gender"] ?? "Not Set";

// CHECK DUPLICATE STAFF ID
$check = mysqli_query($conn,
"SELECT id FROM teachers WHERE staff_id='$staff_id'");

if(mysqli_num_rows($check)){
    echo json_encode([
        "status"=>false,
        "message"=>"Staff ID Already Exists"
    ]);
    exit;
}


/*********** AUTO USERNAME ***********/
$q = mysqli_query($conn,
"SELECT username FROM users WHERE role='teacher' ORDER BY id DESC LIMIT 1");

if(mysqli_num_rows($q)){
    $last = mysqli_fetch_assoc($q)["username"];   // TCHR005
    $num = intval(substr($last,4)) + 1;
} else {
    $num = 1;
}

$username = "TCHR" . str_pad($num, 3, "0", STR_PAD_LEFT);


/*********** PASSWORD = DOB ***********/
$plainPass = str_replace("-","",$dob);
$passwordHash = password_hash($plainPass,PASSWORD_DEFAULT);


/*********** CREATE USER ***********/
mysqli_query($conn,"
INSERT INTO users(name, username, password, role, first_login)
VALUES('$name', '$username', '$passwordHash', 'teacher', 1)
");

$user_id = mysqli_insert_id($conn);


/*********** INSERT TEACHER ***********/
mysqli_query($conn,"
INSERT INTO teachers(
 user_id,name,staff_id,dept,phone,email,gender,dob
)
VALUES(
 '$user_id','$name','$staff_id','$dept','$phone','$email','$gender','$dob'
)
");

echo json_encode([
    "status"=>true,
    "message"=>"Teacher Added Successfully",
    "login" => [
        "username"=>$username,
        "password"=>$plainPass
    ]
]);
?>
