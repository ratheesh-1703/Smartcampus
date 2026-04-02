<?php
include "config.php";

$id = $_POST["id"];

if(!isset($_FILES["photo"])){
  echo json_encode(["status"=>false,"message"=>"No file"]);
  exit;
}

$folder = "uploads/teachers/";
$ext = pathinfo($_FILES["photo"]["name"], PATHINFO_EXTENSION);

$fileName = "teacher_".$id."_".time().".".$ext;
$path = $folder.$fileName;

if(move_uploaded_file($_FILES["photo"]["tmp_name"], $path)){
  
  mysqli_query($conn,
    "UPDATE teachers SET photo='$fileName' WHERE id='$id'"
  );

  echo json_encode(["status"=>true,"message"=>"Photo Updated"]);
}
else{
  echo json_encode(["status"=>false,"message"=>"Upload Failed"]);
}
?>
