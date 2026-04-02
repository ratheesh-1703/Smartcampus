<?php
include "config.php";

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);
$username = trim($data["username"] ?? "");
$password = trim($data["password"] ?? "");

if($username === "" || $password === ""){
    echo json_encode(["status"=>false,"message"=>"Missing Username or Password"]);
    exit;
}

$stmt = mysqli_prepare($conn, "SELECT * FROM users WHERE username = ? LIMIT 1");
mysqli_stmt_bind_param($stmt, "s", $username);
mysqli_stmt_execute($stmt);
$q = mysqli_stmt_get_result($stmt);

if(mysqli_num_rows($q) === 1){
    $u = mysqli_fetch_assoc($q);

    if(password_verify($password, $u["password"])){
        echo json_encode([
            "status" => true,
            "message" => "Login Success",
            "role" => $u["role"],
            "user_id" => $u["id"],
            "name" => $u["name"] ?? ""
        ]);
        exit;
    }
}

echo json_encode([
    "status"=>false,
    "message"=>"Invalid Credentials"
]);
?>
