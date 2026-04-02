<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include "config.php";

$id = $_POST["id"] ?? null;

if(!$id){
    echo json_encode(["status"=>false,"message"=>"No Student ID"]);
    exit;
}

if(!isset($_FILES["photo"])){
    echo json_encode(["status"=>false,"message"=>"No File"]);
    exit;
}

$folder = "uploads/students/";
if(!is_dir($folder)){
    echo json_encode(["status"=>false,"message"=>"Upload directory not found"]);
    exit;
}

if(!is_writable($folder)){
    echo json_encode(["status"=>false,"message"=>"Upload directory not writable"]);
    exit;
}

$ext = strtolower(pathinfo($_FILES["photo"]["name"], PATHINFO_EXTENSION));
$allowedExts = ['jpg', 'jpeg', 'png', 'gif'];

if(!in_array($ext, $allowedExts)){
    echo json_encode(["status"=>false,"message"=>"Invalid file type. Only JPG, PNG, GIF allowed"]);
    exit;
}

$fileName = "student_".$id."_".time().".".$ext;
$path = $folder.$fileName;

if(move_uploaded_file($_FILES["photo"]["tmp_name"], $path)){
    
    $updateQuery = mysqli_query($conn,"UPDATE students SET photo='$fileName' WHERE id='$id'");
    
    if($updateQuery){
        echo json_encode([
            "status"=>true,
            "message"=>"Photo Uploaded Successfully",
            "photo"=>$fileName
        ]);
    } else {
        unlink($path); // Delete the uploaded file if DB update fails
        echo json_encode(["status"=>false,"message"=>"Database update failed"]);
    }
}
else{
    echo json_encode(["status"=>false,"message"=>"File upload failed"]);
}
?>
