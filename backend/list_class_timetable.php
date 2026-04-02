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

$dept = isset($_GET['dept']) ? trim((string)$_GET['dept']) : '';
$status = isset($_GET['status']) ? trim((string)$_GET['status']) : '';

$where = [];
if ($dept !== '') {
    $deptEsc = mysqli_real_escape_string($conn, $dept);
    $where[] = "c.department = '$deptEsc'";
}
if ($status !== '') {
    $statusEsc = mysqli_real_escape_string($conn, $status);
    $where[] = "tt.status = '$statusEsc'";
}

$whereSql = count($where) ? ('WHERE ' . implode(' AND ', $where)) : '';

$q = mysqli_query($conn, "
  SELECT
    tt.id,
    c.id AS class_id,
    c.year,
    c.section,
    tt.day_of_week,
    tt.start_time,
    s.subject_code,
    s.subject_name,
    s.credits,
    t.name AS teacher_name
  FROM class_timetable tt
  LEFT JOIN classes c ON c.id = tt.class_id
  LEFT JOIN subjects s ON s.id = tt.subject_id
  LEFT JOIN teachers t ON t.id = tt.teacher_id
  $whereSql
  ORDER BY c.id, FIELD(tt.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'), tt.start_time, tt.id
");

if (!$q) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Failed to fetch timetable", "error" => mysqli_error($conn), "timetable" => []]);
    exit;
}

$periodMap = [];
$rows = [];

while ($row = mysqli_fetch_assoc($q)) {
    $classId = (string)($row['class_id'] ?? '0');
    $day = (string)($row['day_of_week'] ?? '');
    $key = $classId . '|' . $day;

    if (!isset($periodMap[$key])) {
        $periodMap[$key] = 0;
    }
    $periodMap[$key]++;

    $rows[] = [
        "id" => $row['id'],
        "year" => $row['year'],
        "section" => $row['section'],
        "day" => $day,
        "period" => $periodMap[$key],
        "subject_code" => $row['subject_code'] ?? '-',
        "subject_name" => $row['subject_name'] ?? '-',
        "credits" => $row['credits'],
        "teacher_name" => $row['teacher_name'] ?? '-'
    ];
}

echo json_encode([
    "status" => true,
    "timetable" => $rows
]);
?>
