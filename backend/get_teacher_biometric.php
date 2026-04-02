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
    echo json_encode(["status" => false, "message" => "teacher_id is required", "logs" => []]);
    exit;
}

$q = mysqli_prepare($conn, "
    SELECT id, attendance_date, check_in, check_out, device_info, created_at
    FROM teacher_biometric_log
    WHERE teacher_id = ?
    ORDER BY attendance_date DESC, id DESC
    LIMIT 100
");

if (!$q) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Failed to prepare query", "error" => mysqli_error($conn), "logs" => []]);
    exit;
}

mysqli_stmt_bind_param($q, "i", $teacher_id);
mysqli_stmt_execute($q);
$res = mysqli_stmt_get_result($q);

$logs = [];
while ($row = mysqli_fetch_assoc($res)) {
    if (!empty($row['check_out'])) {
        $logs[] = [
            "id" => $row['id'] . "-out",
            "status" => "CHECK_OUT",
            "method" => "BIOMETRIC",
            "note" => $row['device_info'] ?? '',
            "logged_at" => $row['check_out']
        ];
    }

    if (!empty($row['check_in'])) {
        $logs[] = [
            "id" => $row['id'] . "-in",
            "status" => "CHECK_IN",
            "method" => "BIOMETRIC",
            "note" => $row['device_info'] ?? '',
            "logged_at" => $row['check_in']
        ];
    }
}

mysqli_stmt_close($q);

usort($logs, static function ($a, $b) {
    $ta = strtotime($a['logged_at'] ?? '1970-01-01 00:00:00');
    $tb = strtotime($b['logged_at'] ?? '1970-01-01 00:00:00');
    return $tb <=> $ta;
});

echo json_encode([
    "status" => true,
    "logs" => $logs
]);
?>
