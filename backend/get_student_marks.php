<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if($_SERVER['REQUEST_METHOD'] === 'OPTIONS'){
  http_response_code(200);
  exit;
}

include "config.php";

try {
$student_id = isset($_GET["student_id"]) ? intval($_GET["student_id"]) : 0;

if($student_id <= 0){
  echo json_encode(["status"=>false,"message"=>"Missing student_id"]);
  exit;
}

$q = mysqli_query($conn,"
SELECT
  m.id,
  COALESCE(sub.subject_name, sub.subject_code, CONCAT('Subject #', m.subject_id)) AS subject,
  m.exam_type,
  m.marks_obtained,
  m.max_marks,
  ROUND((m.marks_obtained / NULLIF(m.max_marks, 0)) * 100, 2) AS percentage,
  m.exam_date,
  COALESCE(sub.semester, stu.semester, stu.year) AS semester
FROM marks m
LEFT JOIN subjects sub ON sub.id = m.subject_id
LEFT JOIN students stu ON stu.id = m.student_id
WHERE m.student_id='$student_id'
ORDER BY m.exam_date DESC, m.id DESC
");

if(!$q){
  echo json_encode([
    "status"=>false,
    "error"=>mysqli_error($conn)
  ]);
  exit;
}

$data = [];
while($r = mysqli_fetch_assoc($q)){
  $data[] = $r;
}

echo json_encode([
  "status"=>true,
  "marks"=>$data
]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode([
    "status" => false,
    "message" => "Failed to fetch student marks",
    "error" => $e->getMessage(),
    "marks" => []
  ]);
}
