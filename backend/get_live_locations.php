<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include "config.php";


$dept = isset($_GET['dept']) ? trim((string)$_GET['dept']) : '';

// Extra: Check user role from session or token if available
session_start();
$role = isset($_SESSION['role']) ? $_SESSION['role'] : '';

// If role is hod/coordinator/subject_controller and dept is missing, reject
if (in_array($role, ['hod', 'coordinator', 'subject_controller']) && $dept === '') {
  echo json_encode([
    "status" => false,
    "message" => "Department not specified for this role."
  ]);
  exit;
}


$query = "
  SELECT 
    s.name,
    s.reg_no,
    s.dept,
    l.latitude,
    l.longitude,
    l.recorded_at
  FROM live_locations l
  JOIN students s ON s.id = l.student_id
";

if ($dept !== '') {
    $deptEsc = mysqli_real_escape_string($conn, $dept);
    $query .= " WHERE s.dept = '$deptEsc'";
}

$query .= " ORDER BY l.recorded_at DESC";

$q = mysqli_query($conn, $query);

$students = [];

while($row = mysqli_fetch_assoc($q)){
  $students[] = $row;
}

echo json_encode([
  "status" => true,
  "students" => $students
]);
