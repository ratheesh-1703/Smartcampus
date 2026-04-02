<?php
$host = "localhost";
$user = "root";
$pass = "";
$db   = "smart_campus";

$conn = mysqli_connect($host, $user, $pass, $db);

if (!$conn) {
    die("Database connection failed");
}
?>
