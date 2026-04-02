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

$q = mysqli_prepare($conn, "
    SELECT
      s.id,
      s.teacher_id,
      COALESCE(sub.subject_name, tc.subject_name, CONCAT('Subject ', s.subject_id)) AS subject,
      COALESCE(c.department, tc.dept, '') AS dept,
      COALESCE(c.year, tc.year, '') AS year,
      COALESCE(c.section, '') AS section,
      COALESCE(s.start_time, s.created_at) AS started_at,
      s.class_id,
      s.subject_id,
      s.status
    FROM attendance_sessions s
    LEFT JOIN subjects sub ON sub.id = s.subject_id
    LEFT JOIN classes c ON c.id = s.class_id
    LEFT JOIN teacher_courses tc
      ON tc.teacher_id = s.teacher_id
     AND (tc.subject_id = s.subject_id OR tc.subject_id IS NULL)
    WHERE s.teacher_id = ?
      AND (s.status = 'active' OR s.end_time IS NULL)
    ORDER BY s.id DESC
    LIMIT 1
");

if (!$q) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Failed to prepare query", "error" => mysqli_error($conn)]);
    exit;
}

mysqli_stmt_bind_param($q, "i", $teacher_id);
mysqli_stmt_execute($q);
$res = mysqli_stmt_get_result($q);
$session = mysqli_fetch_assoc($res);
mysqli_stmt_close($q);

if (!$session) {
    echo json_encode(["status" => false, "message" => "No Active Attendance Session"]);
    exit;
}

$session['hotspot_enabled'] = false;
$session['hotspot_ssid'] = null;
$session['gateway_ip'] = null;

echo json_encode([
    "status" => true,
    "session" => $session
]);
?>
