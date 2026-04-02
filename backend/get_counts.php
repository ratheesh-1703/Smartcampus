<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
include "config.php";

// total students
$s = mysqli_query($conn, "SELECT COUNT(*) AS total FROM students");
$students = mysqli_fetch_assoc($s)['total'];

// total teachers (for future)
$t = mysqli_query($conn, "SELECT COUNT(*) AS total FROM teachers");
$teachers = mysqli_fetch_assoc($t)['total'] ?? 0;

// active SOS alerts (future ready)
$hasStatus = mysqli_num_rows(mysqli_query($conn, "SHOW COLUMNS FROM sos_alerts LIKE 'status'")) > 0;
if ($hasStatus) {
    $a = mysqli_query($conn, "SELECT COUNT(*) AS total FROM sos_alerts WHERE LOWER(COALESCE(status,'open')) NOT IN ('resolved','closed')");
} else {
    $a = mysqli_query($conn, "SELECT COUNT(*) AS total FROM sos_alerts");
}
$sos = mysqli_fetch_assoc($a)['total'] ?? 0;

echo json_encode([
    "status" => true,
    "students" => $students,
    "teachers" => $teachers,
    "sos" => $sos
]);
?>
