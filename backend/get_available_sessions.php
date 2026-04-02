<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include "config.php";

try {
    $student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : 0;
    if ($student_id <= 0) {
        echo json_encode(["status" => false, "message" => "Missing student_id", "sessions" => []]);
        exit;
    }

    $studentQ = mysqli_query($conn, "SELECT dept, year, section FROM students WHERE id='$student_id' LIMIT 1");
    if (!$studentQ || mysqli_num_rows($studentQ) === 0) {
        echo json_encode(["status" => false, "message" => "Student not found", "sessions" => []]);
        exit;
    }

    $student = mysqli_fetch_assoc($studentQ);
    $deptEsc = mysqli_real_escape_string($conn, (string)$student['dept']);
    $yearEsc = mysqli_real_escape_string($conn, (string)$student['year']);
    $sectionEsc = mysqli_real_escape_string($conn, (string)$student['section']);

    $q = mysqli_query($conn, "
      SELECT
        s.id,
        s.date,
        s.start_time,
        s.end_time,
        s.status,
        COALESCE(sub.subject_name, sub.subject_code, CONCAT('Subject #', s.subject_id)) AS subject,
        t.name AS teacher_name
      FROM attendance_sessions s
      LEFT JOIN classes c ON c.id = s.class_id
      LEFT JOIN subjects sub ON sub.id = s.subject_id
      LEFT JOIN teachers t ON t.id = s.teacher_id
      WHERE c.department = '$deptEsc'
        AND c.year = '$yearEsc'
        AND c.section = '$sectionEsc'
      ORDER BY s.date DESC, s.start_time DESC, s.id DESC
    ");

    if (!$q) {
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Failed to fetch sessions", "error" => mysqli_error($conn), "sessions" => []]);
        exit;
    }

    $sessions = [];
    while ($row = mysqli_fetch_assoc($q)) {
        $sessions[] = $row;
    }

    echo json_encode(["status" => true, "sessions" => $sessions]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Failed to fetch sessions", "error" => $e->getMessage(), "sessions" => []]);
}
?>
