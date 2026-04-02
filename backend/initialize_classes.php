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
    $data = [];
}

$department = isset($data['department']) ? trim((string)$data['department']) : '';

if ($department === '') {
    $q = mysqli_query($conn, "SELECT department FROM classes WHERE department IS NOT NULL AND department <> '' LIMIT 1");
    $row = $q ? mysqli_fetch_assoc($q) : null;
    if ($row && !empty($row['department'])) {
        $department = (string)$row['department'];
    }
}

if ($department === '') {
    $q = mysqli_query($conn, "SELECT code FROM departments WHERE code IS NOT NULL AND code <> '' LIMIT 1");
    $row = $q ? mysqli_fetch_assoc($q) : null;
    if ($row && !empty($row['code'])) {
        $department = (string)$row['code'];
    }
}

if ($department === '') {
    echo json_encode(["status" => false, "message" => "Department is required"]);
    exit;
}

$years = ["1", "2", "3", "4"];
$sections = ["A", "B", "C"];

$created = 0;
$existing = 0;

foreach ($years as $year) {
    foreach ($sections as $section) {
        $stmt = mysqli_prepare($conn, "SELECT id FROM classes WHERE department = ? AND year = ? AND section = ? LIMIT 1");
        mysqli_stmt_bind_param($stmt, "sss", $department, $year, $section);
        mysqli_stmt_execute($stmt);
        $res = mysqli_stmt_get_result($stmt);
        $row = mysqli_fetch_assoc($res);
        mysqli_stmt_close($stmt);

        if ($row) {
            $existing++;
            continue;
        }

        $className = $department . ' - ' . $year . '-' . $section;
        $stmt = mysqli_prepare($conn, "INSERT INTO classes (class_name, department, year, section, status) VALUES (?, ?, ?, ?, 'active')");
        mysqli_stmt_bind_param($stmt, "ssss", $className, $department, $year, $section);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
        $created++;
    }
}

echo json_encode([
    "status" => true,
    "message" => "Classes initialized",
    "department" => $department,
    "created" => $created,
    "existing" => $existing
]);
?>
