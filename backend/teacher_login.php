<?php
include "config.php";

$data = json_decode(file_get_contents("php://input"), true);

$staff_id = $data["username"];
$password = $data["password"];

$q = mysqli_query($conn,"
SELECT * FROM teachers WHERE staff_id='$staff_id'
");

if(mysqli_num_rows($q)==1){

    $t = mysqli_fetch_assoc($q);

    if(password_verify($password, $t["password"])){

        echo json_encode([
            "status"=>true,
            "teacher"=>$t
        ]);
        exit;
    }
}

echo json_encode([
 "status"=>false,
 "message"=>"Invalid credentials"
]);
?>
