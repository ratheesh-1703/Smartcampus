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

$department = isset($data['department']) ? trim((string)$data['department']) : '';
$year = isset($data['year']) ? trim((string)$data['year']) : '';
$section = isset($data['section']) ? strtoupper(trim((string)$data['section'])) : '';

if ($department === '' || $year === '' || $section === '') {
    echo json_encode(["status" => false, "message" => "department, year and section are required"]);
    exit;
}

$stmt = mysqli_prepare($conn, "SELECT id FROM classes WHERE department = ? AND year = ? AND section = ? LIMIT 1");
mysqli_stmt_bind_param($stmt, "sss", $department, $year, $section);
mysqli_stmt_execute($stmt);
$res = mysqli_stmt_get_result($stmt);
$exists = mysqli_fetch_assoc($res);
mysqli_stmt_close($stmt);

if ($exists) {
    echo json_encode(["status" => false, "message" => "Class already exists"]);
    exit;
}

$className = $department . ' - ' . $year . '-' . $section;
$stmt = mysqli_prepare($conn, "INSERT INTO classes (class_name, department, year, section, status) VALUES (?, ?, ?, ?, 'active')");
mysqli_stmt_bind_param($stmt, "ssss", $className, $department, $year, $section);
$ok = mysqli_stmt_execute($stmt);
$newId = mysqli_insert_id($conn);
mysqli_stmt_close($stmt);

if (!$ok) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Failed to create class", "error" => mysqli_error($conn)]);
    exit;
}

echo json_encode([
    "status" => true,
    "message" => "Class created successfully",
    "class" => [
        "id" => $newId,
        "department" => $department,
        "year" => $year,
        "section" => $section
    ]
]);
?>
