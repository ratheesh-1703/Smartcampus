<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require "db.php";

$response = [
  "status" => false,
  "total_inserted" => 0,
  "skipped" => 0,
  "errors" => []
];

if (!isset($_FILES["file"])) {
  echo json_encode(["status"=>false,"message"=>"No file uploaded"]);
  exit;
}

$file = $_FILES["file"]["tmp_name"];

if (!file_exists($file)) {
  echo json_encode(["status"=>false,"message"=>"File not found"]);
  exit;
}

$handle = fopen($file, "r");
if (!$handle) {
  echo json_encode(["status"=>false,"message"=>"Unable to read CSV"]);
  exit;
}

// Detect schema differences once
$teacherCodeColumn = "teacher_code";
$checkStaffIdCol = $conn->query("SHOW COLUMNS FROM teachers LIKE 'staff_id'");
if ($checkStaffIdCol && $checkStaffIdCol->num_rows > 0) {
  $teacherCodeColumn = "staff_id";
}

$usersHasFirstLogin = false;
$checkFirstLoginCol = $conn->query("SHOW COLUMNS FROM users LIKE 'first_login'");
if ($checkFirstLoginCol && $checkFirstLoginCol->num_rows > 0) {
  $usersHasFirstLogin = true;
}

// Read first row and decide whether it's a header
$firstRow = fgetcsv($handle);
$rows = [];
if ($firstRow !== false) {
  $isHeader = isset($firstRow[0]) && preg_match('/name|teacher|staff/i', (string)$firstRow[0]);
  if (!$isHeader) {
    $rows[] = $firstRow;
  }
}

while (($row = fgetcsv($handle)) !== false) {
  $rows[] = $row;
}

foreach ($rows as $row) {

  // Skip empty lines
  if (!$row || (count($row) === 1 && trim((string)$row[0]) === "")) {
    continue;
  }

  // Handle malformed delimiter case (single column with semicolon-separated values)
  if (count($row) === 1 && str_contains((string)$row[0], ';')) {
    $row = str_getcsv((string)$row[0], ';');
  }

  // Pad row to avoid undefined index warnings
  $row = array_pad($row, 7, "");

  try {
    list($name,$staff_id,$dept,$phone,$email,$dob,$gender) = $row;

    $name = trim((string)$name);
    $staff_id = trim((string)$staff_id);
    $dept = strtoupper(trim((string)$dept));
    $phone = trim((string)$phone);
    $email = trim((string)$email);
    $dob = trim((string)$dob);
    $gender = trim((string)$gender);

    if ($name === "" || $staff_id === "") {
      $response["skipped"]++;
      continue;
    }

    // 🔐 DOB password
    $dobTs = strtotime($dob);
    $password_raw = $dobTs ? date("Ymd", $dobTs) : "teacher123";
    $password = password_hash($password_raw, PASSWORD_DEFAULT);

    // ❌ Check duplicate teacher code (staff_id/teacher_code)
    $check = $conn->prepare("SELECT id FROM teachers WHERE {$teacherCodeColumn}=?");
    $check->bind_param("s", $staff_id);
    $check->execute();
    $check->store_result();

    if ($check->num_rows > 0) {
      $response["skipped"]++;
      continue;
    }

    $checkUser = $conn->prepare("SELECT id FROM users WHERE username=? LIMIT 1");
    $checkUser->bind_param("s", $staff_id);
    $checkUser->execute();
    $checkUser->store_result();
    if ($checkUser->num_rows > 0) {
      $response["skipped"]++;
      continue;
    }

    // ✅ Insert teacher
    $stmt = $conn->prepare("
      INSERT INTO teachers (name, {$teacherCodeColumn}, dept, phone, email, dob)
      VALUES (?,?,?,?,?,?)
    ");
    $stmt->bind_param(
      "ssssss",
      $name,$staff_id,$dept,$phone,$email,$dob
    );
    $stmt->execute();
    $teacher_id = $stmt->insert_id;

    // ✅ Insert user login
    if ($usersHasFirstLogin) {
      $u = $conn->prepare(" 
        INSERT INTO users (username,password,role,linked_id,first_login,name,email,phone,status)
        VALUES (?,?,?,?,1,?,?,?,?)
      ");
    } else {
      $u = $conn->prepare(" 
        INSERT INTO users (username,password,role,linked_id,name,email,phone,status)
        VALUES (?,?,?,?,?,?,?,?)
      ");
    }
    $role = "teacher";
    $status = "active";
    if ($usersHasFirstLogin) {
      $u->bind_param("sssissss", $staff_id, $password, $role, $teacher_id, $name, $email, $phone, $status);
    } else {
      $u->bind_param("sssissss", $staff_id, $password, $role, $teacher_id, $name, $email, $phone, $status);
    }
    $u->execute();

    // Link teacher -> user
    $newUserId = $u->insert_id;
    $updateTeacher = $conn->prepare("UPDATE teachers SET user_id=? WHERE id=?");
    $updateTeacher->bind_param("ii", $newUserId, $teacher_id);
    $updateTeacher->execute();

    $response["total_inserted"]++;

  } catch (Throwable $e) {
    $response["errors"][] = $e->getMessage();
    continue;
  }
}

fclose($handle);

$response["status"] = true;
echo json_encode($response);
