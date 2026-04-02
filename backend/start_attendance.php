<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include "config.php";

/* READ INPUT */
$data = json_decode(file_get_contents("php://input"), true);

if(!$data || !isset($data["teacher_id"]) || !isset($data["subject"])){
    echo json_encode([
        "status" => false,
        "message" => "Missing teacher_id or subject"
    ]);
    exit;
}

$teacher_id = intval($data["teacher_id"]);
$subject    = mysqli_real_escape_string($conn, $data["subject"]);

/* GET NETWORK IP (HOTSPOT / WIFI) */
$gateway_ip = $_SERVER['REMOTE_ADDR'];

/* CHECK EXISTING ACTIVE SESSION */
$check = mysqli_query($conn, "
    SELECT id FROM attendance_sessions
    WHERE teacher_id='$teacher_id' AND is_active=1
");

if(mysqli_num_rows($check)){
    echo json_encode([
        "status" => false,
        "message" => "Attendance already running"
    ]);
    exit;
}

/* CREATE SESSION */
mysqli_query($conn, "
    INSERT INTO attendance_sessions
    (teacher_id, subject, gateway_ip, is_active, started_at)
    VALUES
    ('$teacher_id', '$subject', '$gateway_ip', 1, NOW())
");

echo json_encode([
    "status" => true,
    "message" => "Attendance Started Successfully",
    "gateway_ip" => $gateway_ip
]);
