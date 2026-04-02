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

$teacher_id = isset($_GET['teacher_id']) ? (int)$_GET['teacher_id'] : 0;
if ($teacher_id <= 0) {
    echo json_encode(["status" => false, "message" => "teacher_id is required", "timetable" => []]);
    exit;
}

$q = mysqli_prepare($conn, "
    SELECT
      ct.day_of_week,
      ct.start_time,
      ct.end_time,
      COALESCE(sub.subject_code, '') AS subject_code,
      COALESCE(sub.subject_name, tc.subject_name, CONCAT('Subject ', ct.subject_id)) AS subject_name,
      COALESCE(c.department, tc.dept, '') AS dept,
      COALESCE(c.year, tc.year, '') AS year,
      COALESCE(c.section, '') AS section
    FROM class_timetable ct
    LEFT JOIN subjects sub ON sub.id = ct.subject_id
    LEFT JOIN classes c ON c.id = ct.class_id
    LEFT JOIN teacher_courses tc
      ON tc.teacher_id = ct.teacher_id
     AND (tc.subject_id = ct.subject_id OR tc.subject_id IS NULL)
    WHERE ct.teacher_id = ?
      AND (ct.status IN ('approved', 'active') OR ct.status IS NULL OR ct.status = '')
    ORDER BY FIELD(ct.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'), ct.start_time
");

if (!$q) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Failed to prepare query", "error" => mysqli_error($conn), "timetable" => []]);
    exit;
}

mysqli_stmt_bind_param($q, "i", $teacher_id);
mysqli_stmt_execute($q);
$res = mysqli_stmt_get_result($q);

$periodCounter = [];
$rows = [];

while ($row = mysqli_fetch_assoc($res)) {
    $day = $row['day_of_week'] ?: 'Monday';

    if (!isset($periodCounter[$day])) {
        $periodCounter[$day] = 0;
    }

    $periodCounter[$day]++;
    $period = min($periodCounter[$day], 6);

    $rows[] = [
        "day" => $day,
        "period" => $period,
        "subject_code" => $row['subject_code'] ?: '-',
        "subject_name" => $row['subject_name'] ?: '-',
        "dept" => $row['dept'] ?: '-',
        "year" => $row['year'] ?: '-',
        "section" => $row['section'] ?: '-'
    ];
}

mysqli_stmt_close($q);

echo json_encode([
    "status" => true,
    "timetable" => $rows
]);
?>
