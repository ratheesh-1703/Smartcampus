<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include "config.php";

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

$teacherInput = 0;
if (isset($data['teacher_id'])) {
    $teacherInput = (int)$data['teacher_id'];
} elseif (isset($_GET['teacher_id'])) {
    $teacherInput = (int)$_GET['teacher_id'];
}

$dept = "";

if ($teacherInput > 0) {
    $stmt = mysqli_prepare($conn, "SELECT dept FROM teachers WHERE id = ? OR user_id = ? LIMIT 1");
    mysqli_stmt_bind_param($stmt, "ii", $teacherInput, $teacherInput);
    mysqli_stmt_execute($stmt);
    $res = mysqli_stmt_get_result($stmt);
    $row = mysqli_fetch_assoc($res);
    mysqli_stmt_close($stmt);
    $dept = (string)($row['dept'] ?? "");
}

if ($dept === "") {
    $res = mysqli_query($conn, "
      SELECT h.department
      FROM hods h
      WHERE h.status = 'active'
      ORDER BY h.id DESC
      LIMIT 1
    ");
    $row = $res ? mysqli_fetch_assoc($res) : null;
    $dept = (string)($row['department'] ?? "");
}

if ($dept === "") {
    echo json_encode([
        "status" => true,
        "dept" => "",
        "teachers" => []
    ]);
    exit;
}

$stmt = mysqli_prepare($conn, "
  SELECT
    t.id,
    t.name,
    t.teacher_code AS staff_id,
    t.dept,
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM subject_controllers sc
        WHERE sc.teacher_id = t.id
          AND sc.dept = t.dept
          AND sc.status = 'active'
      ) THEN 1 ELSE 0
    END AS is_subject_controller
  FROM teachers t
  WHERE t.dept = ?
  ORDER BY t.name ASC
");

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Failed to prepare query", "error" => mysqli_error($conn)]);
    exit;
}

mysqli_stmt_bind_param($stmt, "s", $dept);
mysqli_stmt_execute($stmt);
$res = mysqli_stmt_get_result($stmt);

$teachers = [];
while ($row = mysqli_fetch_assoc($res)) {
    $teachers[] = $row;
}
mysqli_stmt_close($stmt);

echo json_encode([
    "status" => true,
    "dept" => $dept,
    "teachers" => $teachers
]);
?>
