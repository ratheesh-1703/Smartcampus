<?php
require_once("../auth/admin-session.php");
require_once("../config/db.php");

$data = json_decode(file_get_contents("php://input"), true);

$regNo = $data['reg_no'];
$name = $data['name'];
$role = $data['role'];
$dept = $data['department'];
$year = $data['year'];

/*
 Default Password Rule:
 Student  → dept+year  (CSE3)
 Teacher  → teacher@123
 Student Affairs → affairs@123
*/

if ($role === "student") {
    $rawPassword = $dept . $year;
} elseif ($role === "teacher") {
    $rawPassword = "teacher@123";
} else {
    $rawPassword = "affairs@123";
}

$password = hash("sha256", $rawPassword);

$sql = "INSERT INTO users (reg_no, name, role, department, year, password)
        VALUES (?, ?, ?, ?, ?, ?)";

$stmt = mysqli_prepare($conn, $sql);
mysqli_stmt_bind_param($stmt, "ssssss",
    $regNo, $name, $role, $dept, $year, $password
);

if (mysqli_stmt_execute($stmt)) {
    echo json_encode([
        "status" => "success",
        "default_password" => $rawPassword
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "User already exists"
    ]);
}
