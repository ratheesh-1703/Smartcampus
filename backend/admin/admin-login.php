<?php
session_start();
require_once("../config/db.php");

$data = json_decode(file_get_contents("php://input"), true);

$adminId = $data['adminId'];
$password = hash('sha256', $data['password']);

$sql = "SELECT * FROM admins WHERE admin_id = ? AND password = ?";
$stmt = mysqli_prepare($conn, $sql);
mysqli_stmt_bind_param($stmt, "ss", $adminId, $password);
mysqli_stmt_execute($stmt);

$result = mysqli_stmt_get_result($stmt);

if (mysqli_num_rows($result) === 1) {
    $_SESSION['admin_logged_in'] = true;
    $_SESSION['admin_id'] = $adminId;

    echo json_encode([
        "status" => "success",
        "message" => "Admin login successful"
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Invalid admin credentials"
    ]);
}
