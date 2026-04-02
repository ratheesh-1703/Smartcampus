<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include "config.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => false, "message" => "Method not allowed"]);
    exit;
}

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

$teacherId = isset($data['teacher_id']) ? (int)$data['teacher_id'] : 0;
$department = isset($data['department']) ? trim((string)$data['department']) : '';
$year = isset($data['year']) ? trim((string)$data['year']) : '';
$section = isset($data['section']) ? trim((string)$data['section']) : '';

if ($teacherId <= 0 || $department === '' || $year === '' || $section === '') {
    echo json_encode(["status" => false, "message" => "teacher_id, department, year and section are required"]);
    exit;
}

mysqli_begin_transaction($conn);

try {
    $stmt = mysqli_prepare($conn, "SELECT id FROM classes WHERE department = ? AND year = ? AND section = ? LIMIT 1");
    mysqli_stmt_bind_param($stmt, "sss", $department, $year, $section);
    mysqli_stmt_execute($stmt);
    $res = mysqli_stmt_get_result($stmt);
    $classRow = mysqli_fetch_assoc($res);
    mysqli_stmt_close($stmt);

    if (!$classRow) {
        $className = $department . ' - ' . $year . '-' . $section;
        $stmt = mysqli_prepare($conn, "INSERT INTO classes (class_name, department, year, section, status) VALUES (?, ?, ?, ?, 'active')");
        mysqli_stmt_bind_param($stmt, "ssss", $className, $department, $year, $section);
        mysqli_stmt_execute($stmt);
        $classId = (int)mysqli_insert_id($conn);
        mysqli_stmt_close($stmt);
    } else {
        $classId = (int)$classRow['id'];
    }

    $stmt = mysqli_prepare($conn, "UPDATE class_coordinators SET status = 'inactive' WHERE class_id = ? AND status = 'active'");
    mysqli_stmt_bind_param($stmt, "i", $classId);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_close($stmt);

    $stmt = mysqli_prepare($conn, "INSERT INTO class_coordinators (class_id, teacher_id, department, year, section, status, assigned_at) VALUES (?, ?, ?, ?, ?, 'active', NOW())");
    mysqli_stmt_bind_param($stmt, "iisss", $classId, $teacherId, $department, $year, $section);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_close($stmt);

    mysqli_commit($conn);

    echo json_encode(["status" => true, "message" => "Coordinator assigned successfully"]);
} catch (Throwable $e) {
    mysqli_rollback($conn);
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Failed to assign coordinator", "error" => $e->getMessage()]);
}
?>
