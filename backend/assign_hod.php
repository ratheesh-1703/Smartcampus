<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

include "config.php";

$raw = file_get_contents("php://input");
$raw = is_string($raw) ? trim($raw) : '';
$raw = preg_replace('/^\xEF\xBB\xBF/', '', $raw);

$data = json_decode($raw, true);

if (!is_array($data)) {
  $fallback = [];
  parse_str($raw, $fallback);
  if (is_array($fallback) && !empty($fallback)) {
    $data = $fallback;
  }
}

if (!is_array($data)) {
  $data = $_POST;
}

if (!is_array($data) || empty($data)) {
  http_response_code(400);
  echo json_encode(["status"=>false,"message"=>"Invalid request body"]);
  exit;
}

$teacher_id = isset($data["teacher_id"]) ? (int)$data["teacher_id"] : 0;
$dept_id    = isset($data["dept_id"]) ? (int)$data["dept_id"] : 0;
$dept_code  = isset($data["dept"]) ? trim((string)$data["dept"]) : "";
$dept_code  = strtoupper($dept_code);

if(!$teacher_id || (!$dept_id && $dept_code === "")){
  echo json_encode(["status"=>false,"message"=>"Missing data"]);
  exit;
}

if (!$dept_id && $dept_code !== "") {
  $stmt = mysqli_prepare($conn, "SELECT id FROM departments WHERE code = ? OR name = ? LIMIT 1");
  mysqli_stmt_bind_param($stmt, "ss", $dept_code, $dept_code);
  mysqli_stmt_execute($stmt);
  $result = mysqli_stmt_get_result($stmt);
  $row = mysqli_fetch_assoc($result);
  mysqli_stmt_close($stmt);

  if (!$row) {
    $insertStmt = mysqli_prepare($conn, "INSERT INTO departments (name, code, status) VALUES (?, ?, 'active')");
    mysqli_stmt_bind_param($insertStmt, "ss", $dept_code, $dept_code);
    $insertOk = mysqli_stmt_execute($insertStmt);
    $newDeptId = mysqli_insert_id($conn);
    mysqli_stmt_close($insertStmt);

    if (!$insertOk || !$newDeptId) {
      echo json_encode(["status"=>false,"message"=>"Department not found and failed to create it"]);
      exit;
    }

    $dept_id = (int)$newDeptId;
  } else {
    $dept_id = (int)$row['id'];
  }
}

mysqli_begin_transaction($conn);

try {
  $oldHodId = null;
  $deptCodeForHodTable = "";
  $stmt = mysqli_prepare($conn, "SELECT hod_id, code, name FROM departments WHERE id = ? LIMIT 1");
  mysqli_stmt_bind_param($stmt, "i", $dept_id);
  mysqli_stmt_execute($stmt);
  $result = mysqli_stmt_get_result($stmt);
  $deptRow = mysqli_fetch_assoc($result);
  mysqli_stmt_close($stmt);

  if (!$deptRow) {
    throw new Exception("Department not found");
  }

  $oldHodId = !empty($deptRow['hod_id']) ? (int)$deptRow['hod_id'] : null;
  $deptCodeForHodTable = strtoupper(trim((string)($deptRow['code'] ?? '')));
  if ($deptCodeForHodTable === "") {
    $deptCodeForHodTable = strtoupper(trim((string)($deptRow['name'] ?? '')));
  }

  if ($oldHodId) {
    $stmt = mysqli_prepare($conn, "UPDATE teachers SET is_hod = 0 WHERE id = ?");
    mysqli_stmt_bind_param($stmt, "i", $oldHodId);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_close($stmt);
  }

  $stmt = mysqli_prepare($conn, "UPDATE departments SET hod_id = ? WHERE id = ?");
  mysqli_stmt_bind_param($stmt, "ii", $teacher_id, $dept_id);
  mysqli_stmt_execute($stmt);
  mysqli_stmt_close($stmt);

  $stmt = mysqli_prepare($conn, "UPDATE teachers SET is_hod = 1 WHERE id = ?");
  mysqli_stmt_bind_param($stmt, "i", $teacher_id);
  mysqli_stmt_execute($stmt);
  mysqli_stmt_close($stmt);

  if ($deptCodeForHodTable !== "") {
    $stmt = mysqli_prepare($conn, "UPDATE hods SET status = 'inactive' WHERE department = ?");
    mysqli_stmt_bind_param($stmt, "s", $deptCodeForHodTable);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_close($stmt);
  }

  $stmt = mysqli_prepare($conn, "UPDATE hods SET status = 'inactive' WHERE teacher_id = ?");
  mysqli_stmt_bind_param($stmt, "i", $teacher_id);
  mysqli_stmt_execute($stmt);
  mysqli_stmt_close($stmt);

  $stmt = mysqli_prepare($conn, "INSERT INTO hods (teacher_id, department, assigned_at, status) VALUES (?, ?, NOW(), 'active')");
  mysqli_stmt_bind_param($stmt, "is", $teacher_id, $deptCodeForHodTable);
  mysqli_stmt_execute($stmt);
  mysqli_stmt_close($stmt);

  mysqli_commit($conn);

  echo json_encode([
    "status"=>true,
    "message"=>"HOD Assigned Successfully"
  ]);
} catch (Throwable $e) {
  mysqli_rollback($conn);
  http_response_code(500);
  echo json_encode([
    "status"=>false,
    "message"=>"Failed to assign HOD",
    "error"=>$e->getMessage()
  ]);
}
