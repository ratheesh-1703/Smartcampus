<?php
// Suppress warnings/notices in output
ini_set('display_errors', 0);
error_reporting(E_ERROR | E_PARSE);
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  http_response_code(200);
  exit;
}

include "config.php";

try {
  $data = json_decode(file_get_contents("php://input"), true) ?: [];

  $student_id = $data["student_id"] ?? null;
  $lat = $data["latitude"] ?? null;
  $lng = $data["longitude"] ?? null;

  if (!$student_id || !is_numeric($lat) || !is_numeric($lng)) {
    echo json_encode(["status" => false, "message" => "Missing data"]);
    exit;
  }

  $student_id = intval($student_id);
  $lat = (float)$lat;
  $lng = (float)$lng;

  $MIN_LAT = 9.57146148959631;
  $MAX_LAT = 9.577132043292297;
  $MIN_LNG = 77.67198452088708;
  $MAX_LNG = 77.68419393574877;

  $getStatus = function ($latitude, $longitude) use ($MIN_LAT, $MAX_LAT, $MIN_LNG, $MAX_LNG) {
    return (
      $latitude >= $MIN_LAT &&
      $latitude <= $MAX_LAT &&
      $longitude >= $MIN_LNG &&
      $longitude <= $MAX_LNG
    ) ? "IN" : "OUT";
  };

  $current_status = $getStatus($lat, $lng);

  $q = mysqli_query($conn, "
    SELECT latitude, longitude
    FROM live_locations
    WHERE student_id = '$student_id'
    ORDER BY recorded_at DESC, id DESC
    LIMIT 1
  ");

  $old_status = "OUT";
  if ($q && mysqli_num_rows($q) > 0) {
    $prev = mysqli_fetch_assoc($q);
    $old_status = $getStatus((float)$prev["latitude"], (float)$prev["longitude"]);
  }

  // Keep one latest location row per student (update if exists, insert if first time)
  $latestRowRes = mysqli_query($conn, "
    SELECT id
    FROM live_locations
    WHERE student_id = '$student_id'
    ORDER BY recorded_at DESC, id DESC
    LIMIT 1
  ");

  if ($latestRowRes && mysqli_num_rows($latestRowRes) > 0) {
    $latestRow = mysqli_fetch_assoc($latestRowRes);
    $latestId = (int)$latestRow['id'];

    mysqli_query($conn, "
      UPDATE live_locations
      SET latitude = '$lat', longitude = '$lng', recorded_at = NOW()
      WHERE id = '$latestId'
    ");
  } else {
    mysqli_query($conn, "
      INSERT INTO live_locations(student_id, latitude, longitude, recorded_at)
      VALUES('$student_id', '$lat', '$lng', NOW())
    ");
  }

  if ($old_status !== $current_status) {
    $studentRes = mysqli_query($conn, "
      SELECT s.name, s.reg_no, s.parent_email
      FROM students s
      WHERE s.id = '$student_id'
      LIMIT 1
    ");

    if ($studentRes && mysqli_num_rows($studentRes) > 0) {
      $s = mysqli_fetch_assoc($studentRes);
      if (!empty($s["parent_email"])) {
        $action = ($current_status === "IN") ? "ENTERED the campus" : "LEFT the campus";

        $subject = "Campus Movement Alert - {$s['name']}";
        $message = "
        Dear Parent,<br><br>
        Your ward <b>{$s['name']}</b> ({$s['reg_no']}) has <b>$action</b>.<br><br>
        <b>Date & Time:</b> " . date("d-m-Y h:i A") . "<br><br>
        Regards,<br>
        Smart Campus System
        ";

        $headers  = "MIME-Version: 1.0\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8\r\n";
        $headers .= "From: Smart Campus <no-reply@smartcampus.com>";

        // Suppress mail() warnings and log if needed
        @mail($s["parent_email"], $subject, $message, $headers);
      }
    }
  }

  echo json_encode([
    "status" => true,
    "campus_status" => $current_status
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode([
    "status" => false,
    "message" => "Failed to update location",
    "error" => $e->getMessage()
  ]);
}
?>