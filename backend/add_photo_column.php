<?php
include "config.php";

$query = "ALTER TABLE students ADD COLUMN photo VARCHAR(255) DEFAULT NULL";

if(mysqli_query($conn, $query)){
    echo json_encode(["status"=>true, "message"=>"Photo column added successfully"]);
} else {
    echo json_encode(["status"=>false, "message"=>"Failed to add photo column: " . mysqli_error($conn)]);
}
?>