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
    $dept = isset($_GET['dept']) ? mysqli_real_escape_string($conn, (string)$_GET['dept']) : '';
    
    if (empty($dept)) {
        echo json_encode(["status" => false, "message" => "Missing dept parameter", "subjects" => []]);
        exit;
    }

    $q = mysqli_query($conn, "
      SELECT 
        id,
        subject_code,
        subject_name,
        dept,
        semester,
        credits,
        status
      FROM subjects
      WHERE dept = '$dept'
      ORDER BY subject_code ASC
    ");

    if (!$q) {
        http_response_code(500);
        echo json_encode([
            "status" => false,
            "message" => "Failed to fetch subjects",
            "error" => mysqli_error($conn),
            "subjects" => []
        ]);
        exit;
    }

    $subjects = [];
    while ($row = mysqli_fetch_assoc($q)) {
        $subjects[] = $row;
    }

    echo json_encode([
        "status" => true,
        "subjects" => $subjects,
        "count" => count($subjects)
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => false,
        "message" => "Failed to fetch subjects",
        "error" => $e->getMessage(),
        "subjects" => []
    ]);
}
?>
