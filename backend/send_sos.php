<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

include "config.php";

try {

if ($_SERVER["REQUEST_METHOD"] != "POST") {
    echo json_encode(["status" => false, "message" => "Invalid Request"]);
    exit;
}

// CHECK STUDENT ID
if(!isset($_POST["student_id"]) || !isset($_POST["message"])) {
    echo json_encode(["status"=>false,"message"=>"Missing values"]);
    exit;
}

$student_id = $_POST["student_id"];
$message = $_POST["message"];

// ================== HANDLE PHOTO UPLOAD ==================
if(isset($_FILES["photo"]) && $_FILES["photo"]["error"] == 0){

    $folder = "uploads/sos/";
    
    if(!is_dir($folder)){
        mkdir($folder,777,true);
    }

    $filename = time() . "_" . $_FILES["photo"]["name"];
    $path = $folder . $filename;

    move_uploaded_file($_FILES["photo"]["tmp_name"], $path);
}

$student_id = intval($student_id);
$messageEsc = mysqli_real_escape_string($conn, (string)$message);

// ================== SAVE INTO DATABASE ==================
$q = mysqli_query($conn,"
INSERT INTO sos_alerts(student_id,message,created_at)
VALUES('$student_id','$messageEsc',NOW())
");

if($q){
    echo json_encode([
        "status"=>true,
        "message"=>"SOS Sent Successfully"
    ]);
} else {
    echo json_encode([
        "status"=>false,
        "message"=>"Database Error",
        "error"=>mysqli_error($conn)
    ]);
}
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => false,
        "message" => "Failed to send SOS",
        "error" => $e->getMessage()
    ]);
}
?>
