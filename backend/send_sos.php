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

if ($student_id <= 0) {
    echo json_encode(["status" => false, "message" => "Invalid student_id"]);
    exit;
}

// Resolve incoming identifier to actual students.id.
$resolved_student_id = 0;

// Case 1: already a valid students.id
$checkStudent = mysqli_query($conn, "SELECT id FROM students WHERE id = '$student_id' LIMIT 1");
if ($checkStudent && mysqli_num_rows($checkStudent) > 0) {
    $resolved_student_id = (int)mysqli_fetch_assoc($checkStudent)["id"];
}

// Case 2: incoming value is users.id and students.user_id exists
if ($resolved_student_id === 0) {
    $hasUserIdColumn = mysqli_num_rows(mysqli_query($conn, "SHOW COLUMNS FROM students LIKE 'user_id'")) > 0;
    if ($hasUserIdColumn) {
        $byUserId = mysqli_query($conn, "SELECT id FROM students WHERE user_id = '$student_id' LIMIT 1");
        if ($byUserId && mysqli_num_rows($byUserId) > 0) {
            $resolved_student_id = (int)mysqli_fetch_assoc($byUserId)["id"];
        }
    }
}

// Case 3: incoming value is users.id with linked_id
if ($resolved_student_id === 0) {
    $hasLinkedId = mysqli_num_rows(mysqli_query($conn, "SHOW COLUMNS FROM users LIKE 'linked_id'")) > 0;
    if ($hasLinkedId) {
        $u = mysqli_query($conn, "SELECT linked_id FROM users WHERE id = '$student_id' LIMIT 1");
        if ($u && mysqli_num_rows($u) > 0) {
            $linkedId = (int)mysqli_fetch_assoc($u)["linked_id"];
            if ($linkedId > 0) {
                $byLinked = mysqli_query($conn, "SELECT id FROM students WHERE id = '$linkedId' LIMIT 1");
                if ($byLinked && mysqli_num_rows($byLinked) > 0) {
                    $resolved_student_id = (int)mysqli_fetch_assoc($byLinked)["id"];
                }
            }
        }
    }
}

if ($resolved_student_id === 0) {
    echo json_encode([
        "status" => false,
        "message" => "Student record not found for provided student_id"
    ]);
    exit;
}

// ================== SAVE INTO DATABASE ==================
$q = mysqli_query($conn,"
INSERT INTO sos_alerts(student_id,message,created_at)
VALUES('$resolved_student_id','$messageEsc',NOW())
");

if($q){
    echo json_encode([
        "status"=>true,
        "message"=>"SOS Sent Successfully",
        "resolved_student_id" => $resolved_student_id
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
