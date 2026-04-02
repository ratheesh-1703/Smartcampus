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

$department = isset($_GET['department']) ? trim((string)$_GET['department']) : '';
if ($department === '') {
        echo json_encode(["status" => false, "message" => "department is required", "classes" => []]);
        exit;
}

$stmt = mysqli_prepare($conn, "
    SELECT
        c.id,
        c.department,
        c.year,
        c.section,
        t.name AS coordinator_name,
        t.teacher_code AS coordinator_staff_id,
        cc.teacher_id AS coordinator_teacher_id
    FROM classes c
    LEFT JOIN class_coordinators cc
        ON cc.class_id = c.id
     AND cc.status = 'active'
    LEFT JOIN teachers t
        ON t.id = cc.teacher_id
    WHERE c.department = ?
    ORDER BY CAST(c.year AS UNSIGNED), c.section
");

if (!$stmt) {
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Failed to prepare query", "error" => mysqli_error($conn), "classes" => []]);
        exit;
}

mysqli_stmt_bind_param($stmt, "s", $department);
mysqli_stmt_execute($stmt);
$res = mysqli_stmt_get_result($stmt);

$classes = [];
while ($row = mysqli_fetch_assoc($res)) {
        $classes[] = $row;
}
mysqli_stmt_close($stmt);

echo json_encode([
        "status" => true,
        "classes" => $classes
]);
?>
