<?php
include "config.php";

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

try {

// Validate Student ID
if(!isset($_GET["student_id"])){
    echo json_encode([
        "status"=>false,
        "message"=>"student_id required"
    ]);
    exit;
}

$student_id = intval($_GET["student_id"]);

$subject = isset($_GET["subject"]) ? trim((string)$_GET["subject"]) : "";
$from = isset($_GET["from"]) ? trim((string)$_GET["from"]) : "";
$to = isset($_GET["to"]) ? trim((string)$_GET["to"]) : "";

$subjectEsc = mysqli_real_escape_string($conn, $subject);
$fromEsc = mysqli_real_escape_string($conn, $from);
$toEsc = mysqli_real_escape_string($conn, $to);

// Base Conditions
$where = "WHERE 1=1";

// Subject filter
if($subject != ""){
    $where .= " AND (sub.subject_name LIKE '%$subjectEsc%' OR sub.subject_code LIKE '%$subjectEsc%')";
}

// Date filter
if($from != ""){
    $where .= " AND att.date >= '$fromEsc'";
}

if($to != ""){
    $where .= " AND att.date <= '$toEsc'";
}

// Total Classes Attended (sessions student present)
$presentQuery = mysqli_query($conn,"
SELECT ar.session_id
FROM attendance_records ar
JOIN attendance_sessions att ON ar.session_id = att.id
LEFT JOIN subjects sub ON sub.id = att.subject_id
$where
AND ar.student_id = $student_id
AND LOWER(COALESCE(ar.status, 'present')) IN ('present', 'p', 'od')
");

$present = mysqli_num_rows($presentQuery);

// Total Classes Conducted
$totalQuery = mysqli_query($conn,"
SELECT att.id
FROM attendance_sessions att
LEFT JOIN subjects sub ON sub.id = att.subject_id
$where
");

$total = mysqli_num_rows($totalQuery);

// Absent
$absent = $total - $present;

$percentage = 0;
if($total > 0){
    $percentage = round(($present / $total) * 100,2);
}

// Attendance History List
$historyQuery = mysqli_query($conn,"
SELECT
COALESCE(sub.subject_name, sub.subject_code, CONCAT('Subject #', att.subject_id)) AS subject,
att.date AS attendance_date,
TIME_FORMAT(COALESCE(att.start_time, att.created_at), '%H:%i:%s') AS attendance_time,
COALESCE(att.start_time, att.created_at) AS started_at,
CASE 
WHEN ar.student_id IS NULL THEN 'Absent'
WHEN LOWER(COALESCE(ar.status, 'present')) IN ('od') THEN 'OD'
ELSE 'Present'
END AS status
FROM attendance_sessions att
LEFT JOIN subjects sub ON sub.id = att.subject_id
LEFT JOIN attendance_records ar
ON ar.session_id = att.id 
AND ar.student_id = $student_id
$where
ORDER BY COALESCE(att.start_time, att.created_at) DESC
");

$history = [];
while($row = mysqli_fetch_assoc($historyQuery)){
    $history[] = $row;
}

// Response
echo json_encode([
    "status"=>true,
    "total"=>$total,
    "present"=>$present,
    "absent"=>$absent,
    "percentage"=>$percentage,
    "history"=>$history
]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => false,
        "message" => "Failed to fetch student history",
        "error" => $e->getMessage(),
        "history" => []
    ]);
}
?>
