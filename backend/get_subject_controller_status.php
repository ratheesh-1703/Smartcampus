<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

require_once "config.php";

$teacherId = isset($_GET["teacher_id"]) ? (int)$_GET["teacher_id"] : 0;

if ($teacherId <= 0) {
    echo json_encode([
        "status" => false,
        "message" => "teacher_id is required"
    ]);
    exit;
}

$isController = false;

$tableExists = mysqli_query($conn, "SHOW TABLES LIKE 'subject_controllers'");
if ($tableExists && mysqli_num_rows($tableExists) > 0) {
    $teacherIdColumn = null;
    $candidateColumns = ["teacher_id", "staff_id", "controller_id"];

    foreach ($candidateColumns as $columnName) {
        $columnCheck = mysqli_query($conn, "SHOW COLUMNS FROM subject_controllers LIKE '$columnName'");
        if ($columnCheck && mysqli_num_rows($columnCheck) > 0) {
            $teacherIdColumn = $columnName;
            break;
        }
    }

    if ($teacherIdColumn) {
        $query = "SELECT id FROM subject_controllers WHERE $teacherIdColumn = ? LIMIT 1";
        $stmt = mysqli_prepare($conn, $query);
        mysqli_stmt_bind_param($stmt, "i", $teacherId);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        $isController = ($result && mysqli_num_rows($result) > 0);
    }
}

echo json_encode([
    "status" => true,
    "teacher_id" => $teacherId,
    "is_subject_controller" => $isController
]);
?>
