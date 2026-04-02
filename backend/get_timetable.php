<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

include "config.php";

try {
  $student_id = isset($_GET["student_id"]) ? intval($_GET["student_id"]) : 0;

  if ($student_id <= 0) {
    echo json_encode(["status" => false, "message" => "Missing student_id", "timetable" => []]);
    exit;
  }

  $studentQ = mysqli_query($conn, "SELECT dept, year, section FROM students WHERE id='$student_id' LIMIT 1");
  if (!$studentQ || mysqli_num_rows($studentQ) === 0) {
    echo json_encode(["status" => false, "message" => "Student not found", "timetable" => []]);
    exit;
  }

  $student = mysqli_fetch_assoc($studentQ);
  $deptEsc = mysqli_real_escape_string($conn, (string)$student['dept']);
  $yearEsc = mysqli_real_escape_string($conn, (string)$student['year']);
  $sectionEsc = mysqli_real_escape_string($conn, (string)$student['section']);

  $q = mysqli_query($conn, "
    SELECT
      tt.id,
      tt.day_of_week AS day,
      tt.start_time,
      tt.end_time,
      tt.room_no,
      COALESCE(sub.subject_name, sub.subject_code, CONCAT('Subject #', tt.subject_id)) AS subject,
      t.name AS teacher_name
    FROM class_timetable tt
    LEFT JOIN classes c ON c.id = tt.class_id
    LEFT JOIN subjects sub ON sub.id = tt.subject_id
    LEFT JOIN teachers t ON t.id = tt.teacher_id
    WHERE c.department = '$deptEsc'
      AND c.year = '$yearEsc'
      AND c.section = '$sectionEsc'
    ORDER BY FIELD(tt.day_of_week,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'), tt.start_time, tt.id
  ");

  if (!$q) {
    http_response_code(500);
    echo json_encode([
      "status" => false,
      "message" => "Failed to fetch timetable",
      "error" => mysqli_error($conn),
      "timetable" => []
    ]);
    exit;
  }

  $data = [];
  while ($r = mysqli_fetch_assoc($q)) {
    $data[] = $r;
  }

  echo json_encode([
    "status" => true,
    "timetable" => $data
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode([
    "status" => false,
    "message" => "Failed to fetch timetable",
    "error" => $e->getMessage(),
    "timetable" => []
  ]);
}
?>