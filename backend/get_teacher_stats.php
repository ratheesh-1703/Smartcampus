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
    echo json_encode(["status" => false, "message" => "teacher_id is required"]);
    exit;
}

$today = date('Y-m-d');
$weekday = date('l');

$myStudents = 0;
$classesScheduled = 0;
$attendancePending = 0;
$upcomingClasses = [];

$qStudents = mysqli_prepare($conn, "
    SELECT COUNT(DISTINCT s.id) AS total
    FROM students s
    INNER JOIN teacher_courses tc
      ON tc.teacher_id = ?
     AND (tc.dept = s.dept OR tc.dept IS NULL OR tc.dept = '')
     AND (tc.year = s.year OR tc.year IS NULL OR tc.year = '')
");
if ($qStudents) {
    mysqli_stmt_bind_param($qStudents, "i", $teacher_id);
    mysqli_stmt_execute($qStudents);
    $resStudents = mysqli_stmt_get_result($qStudents);
    $rowStudents = mysqli_fetch_assoc($resStudents);
    $myStudents = (int)($rowStudents['total'] ?? 0);
    mysqli_stmt_close($qStudents);
}

$qClasses = mysqli_prepare($conn, "
    SELECT COUNT(*) AS total
    FROM class_timetable ct
    WHERE ct.teacher_id = ?
      AND (ct.status IN ('approved', 'active') OR ct.status IS NULL OR ct.status = '')
");
if ($qClasses) {
    mysqli_stmt_bind_param($qClasses, "i", $teacher_id);
    mysqli_stmt_execute($qClasses);
    $resClasses = mysqli_stmt_get_result($qClasses);
    $rowClasses = mysqli_fetch_assoc($resClasses);
    $classesScheduled = (int)($rowClasses['total'] ?? 0);
    mysqli_stmt_close($qClasses);
}

$qSessionCount = mysqli_prepare($conn, "
    SELECT COUNT(*) AS total
    FROM attendance_sessions
    WHERE teacher_id = ?
      AND (
            date = ?
         OR DATE(start_time) = ?
         OR DATE(created_at) = ?
      )
");
if ($qSessionCount) {
    mysqli_stmt_bind_param($qSessionCount, "isss", $teacher_id, $today, $today, $today);
    mysqli_stmt_execute($qSessionCount);
    $resSessionCount = mysqli_stmt_get_result($qSessionCount);
    $rowSessionCount = mysqli_fetch_assoc($resSessionCount);
    $sessionsToday = (int)($rowSessionCount['total'] ?? 0);
    mysqli_stmt_close($qSessionCount);
    $attendancePending = max($classesScheduled - $sessionsToday, 0);
}

$qToday = mysqli_prepare($conn, "
    SELECT
      COALESCE(sub.subject_name, tc.subject_name, CONCAT('Subject ', ct.subject_id)) AS subject,
      COALESCE(c.department, tc.dept, '') AS dept,
      COALESCE(c.year, tc.year, '') AS year,
      COALESCE(c.section, '') AS section,
      ct.start_time
    FROM class_timetable ct
    LEFT JOIN subjects sub ON sub.id = ct.subject_id
    LEFT JOIN classes c ON c.id = ct.class_id
    LEFT JOIN teacher_courses tc
      ON tc.teacher_id = ct.teacher_id
     AND (tc.subject_id = ct.subject_id OR tc.subject_id IS NULL)
    WHERE ct.teacher_id = ?
      AND ct.day_of_week = ?
      AND (ct.status IN ('approved', 'active') OR ct.status IS NULL OR ct.status = '')
    ORDER BY ct.start_time ASC
    LIMIT 10
");
if ($qToday) {
    mysqli_stmt_bind_param($qToday, "is", $teacher_id, $weekday);
    mysqli_stmt_execute($qToday);
    $resToday = mysqli_stmt_get_result($qToday);
    while ($row = mysqli_fetch_assoc($resToday)) {
        $upcomingClasses[] = [
            "subject" => $row['subject'] ?? '-',
            "dept" => $row['dept'] ?? '-',
            "year" => $row['year'] ?? '-',
            "section" => $row['section'] ?? '-'
        ];
    }
    mysqli_stmt_close($qToday);
}

echo json_encode([
    "status" => true,
    "stats" => [
        "my_students" => $myStudents,
        "classes_scheduled" => $classesScheduled,
        "attendance_pending" => $attendancePending,
        "upcoming_classes" => $upcomingClasses
    ]
]);
?>
