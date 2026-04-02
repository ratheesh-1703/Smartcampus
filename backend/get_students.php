<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

include "config.php";

try {
    $department = isset($_GET['department']) ? trim((string)$_GET['department']) : '';
    if ($department === '' && isset($_GET['dept'])) {
        $department = trim((string)$_GET['dept']);
    }
    $year = isset($_GET['year']) ? trim((string)$_GET['year']) : '';
    $section = isset($_GET['section']) ? trim((string)$_GET['section']) : '';

    $where = ["1=1"];
    if ($department !== '') {
        $departmentEsc = mysqli_real_escape_string($conn, $department);
        $where[] = "dept = '$departmentEsc'";
    }
    if ($year !== '') {
        $yearEsc = mysqli_real_escape_string($conn, $year);
        $where[] = "year = '$yearEsc'";
    }
    if ($section !== '') {
        $sectionEsc = mysqli_real_escape_string($conn, $section);
        $where[] = "section = '$sectionEsc'";
    }

    $whereSql = "WHERE " . implode(" AND ", $where);

    $q = mysqli_query($conn,"
    SELECT id, reg_no, name, dept, year, section, admission_year
    FROM students
    $whereSql
    ORDER BY dept, reg_no
    ");

    if (!$q) {
        http_response_code(500);
        echo json_encode([
            "status" => false,
            "message" => "Failed to fetch students",
            "students" => []
        ]);
        exit;
    }

    $data = [];
    while($row = mysqli_fetch_assoc($q)){
        $data[] = $row;
    }

    echo json_encode(["status"=>true, "students"=>$data]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => false,
        "message" => "Failed to fetch students",
        "error" => $e->getMessage(),
        "students" => []
    ]);
}
?>
