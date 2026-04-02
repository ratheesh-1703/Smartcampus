<?php
require "config.php";
header("Content-Type: application/json");

try {

if(!isset($_GET["student_id"])){
    echo json_encode([
        "status"=>false,
        "message"=>"Student ID Missing"
    ]);
    exit;
}

$student_id = intval($_GET["student_id"]);

// Fetch semester wise GPA
$q = mysqli_query($conn,"
SELECT
    g.id,
    g.semester,
    g.year,
    COALESCE(sub.subject_name, sub.subject_code, CONCAT('Subject #', g.subject_id)) AS subject,
    g.grade,
    g.gpa,
    g.created_at
FROM grades g
LEFT JOIN subjects sub ON sub.id = g.subject_id
WHERE g.student_id='$student_id'
ORDER BY CAST(g.year AS UNSIGNED), CAST(g.semester AS UNSIGNED), g.id
");

$grades = [];
$totalGPA = 0;
$count = 0;

while($r = mysqli_fetch_assoc($q)){
    $grades[] = $r;
    $totalGPA += $r["gpa"];
    $count++;
}

$cgpa = $count > 0 ? round($totalGPA/$count,2) : 0;

echo json_encode([
 "status"=>true,
 "cgpa"=>$cgpa,
 "semesters"=>$count,
 "grades"=>$grades
]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => false,
        "message" => "Failed to fetch student grades",
        "error" => $e->getMessage(),
        "grades" => []
    ]);
}
?>
