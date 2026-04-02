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

try {
    $dept = isset($_GET['department']) ? mysqli_real_escape_string($conn, (string)$_GET['department']) : '';
    
    if (empty($dept)) {
        echo json_encode(["status" => false, "message" => "Missing department parameter", "teachers" => []]);
        exit;
    }

    $q = mysqli_query($conn, "
      SELECT *
      FROM teachers
      WHERE dept = '$dept'
      ORDER BY name ASC
    ");

    if (!$q) {
        http_response_code(500);
        echo json_encode([
            "status" => false,
            "message" => "Failed to fetch teachers",
            "error" => mysqli_error($conn),
            "teachers" => []
        ]);
        exit;
    }

    $teachers = [];
    while ($row = mysqli_fetch_assoc($q)) {
        $teachers[] = $row;
    }

    echo json_encode([
        "status" => true,
        "teachers" => $teachers,
        "count" => count($teachers)
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => false,
        "message" => "Failed to fetch teachers",
        "error" => $e->getMessage(),
        "teachers" => []
    ]);
}
?>
