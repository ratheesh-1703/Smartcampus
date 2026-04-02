<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

include "config.php";

try {
    $studentId = isset($_GET["student_id"]) ? intval($_GET["student_id"]) : 0;
    $coordinatorId = isset($_GET["coordinator_id"]) ? intval($_GET["coordinator_id"]) : 0;

    if ($studentId > 0) {
        $q = mysqli_query($conn, "
            SELECT
                r.id,
                r.student_id,
                r.reason,
                r.status,
                r.requested_at,
                r.decision_notes AS decision_note,
                s.reg_no,
                s.name AS student_name,
                s.dept,
                s.year,
                s.section
            FROM student_logout_requests r
            LEFT JOIN students s ON s.id = r.student_id
            WHERE r.student_id = $studentId
            ORDER BY r.requested_at DESC, r.id DESC
            LIMIT 1
        ");

        $request = ($q && mysqli_num_rows($q) > 0) ? mysqli_fetch_assoc($q) : null;

        echo json_encode([
            "status" => true,
            "request" => $request
        ]);
        exit;
    }

    if ($coordinatorId > 0) {
        $q = mysqli_query($conn, "
            SELECT DISTINCT
                r.id,
                r.student_id,
                r.reason,
                r.status,
                r.requested_at,
                r.decision_notes AS decision_note,
                s.reg_no,
                s.name AS student_name,
                s.dept,
                s.year,
                s.section
            FROM student_logout_requests r
            JOIN students s ON s.id = r.student_id
            JOIN class_coordinators cc
              ON cc.teacher_id = $coordinatorId
             AND cc.status = 'active'
             AND cc.department = s.dept
             AND cc.year = s.year
             AND cc.section = s.section
            WHERE r.status = 'pending'
            ORDER BY r.requested_at DESC, r.id DESC
        ");

        $requests = [];
        if ($q) {
            while ($row = mysqli_fetch_assoc($q)) {
                $requests[] = $row;
            }
        }

        echo json_encode([
            "status" => true,
            "requests" => $requests
        ]);
        exit;
    }

    echo json_encode([
        "status" => true,
        "request" => null,
        "requests" => []
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => false,
        "message" => "Failed to fetch logout requests",
        "error" => $e->getMessage(),
        "request" => null,
        "requests" => []
    ]);
}
?>
