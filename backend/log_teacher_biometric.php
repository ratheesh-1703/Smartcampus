<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include "config.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => false, "message" => "Method not allowed"]);
    exit;
}

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

$teacher_id = isset($data['teacher_id']) ? (int)$data['teacher_id'] : 0;
$status = isset($data['status']) ? strtoupper(trim((string)$data['status'])) : '';
$note = isset($data['note']) ? trim((string)$data['note']) : '';

if ($teacher_id <= 0 || !in_array($status, ['CHECK_IN', 'CHECK_OUT'], true)) {
    echo json_encode(["status" => false, "message" => "Invalid teacher_id or status"]);
    exit;
}

$today = date('Y-m-d');

$stmt = mysqli_prepare($conn, "
    SELECT id, check_in, check_out
    FROM teacher_biometric_log
    WHERE teacher_id = ? AND attendance_date = ?
    ORDER BY id DESC
    LIMIT 1
");
mysqli_stmt_bind_param($stmt, "is", $teacher_id, $today);
mysqli_stmt_execute($stmt);
$res = mysqli_stmt_get_result($stmt);
$existing = mysqli_fetch_assoc($res);
mysqli_stmt_close($stmt);

$email_sent = false;
$email_result = null;

if ($status === 'CHECK_IN') {
    if ($existing && !empty($existing['check_in']) && empty($existing['check_out'])) {
        echo json_encode([
            "status" => true, 
            "message" => "Already checked in for today",
            "email_notification_sent" => false
        ]);
        exit;
    }

    $ins = mysqli_prepare($conn, "
        INSERT INTO teacher_biometric_log (teacher_id, attendance_date, check_in, device_info)
        VALUES (?, ?, NOW(), ?)
    ");
    mysqli_stmt_bind_param($ins, "iss", $teacher_id, $today, $note);
    $ok = mysqli_stmt_execute($ins);
    mysqli_stmt_close($ins);

    if (!$ok) {
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Failed to check in", "error" => mysqli_error($conn)]);
        exit;
    }

    // ========== SEND CHECK-IN EMAIL NOTIFICATION ==========
    $teacher = mysqli_fetch_assoc(mysqli_query($conn,"
        SELECT t.name, t.staff_id, u.email as teacher_email, t.dept
        FROM teachers t
        LEFT JOIN users u ON u.linked_id = t.id AND u.role='teacher'
        WHERE t.id='$teacher_id' 
        LIMIT 1
    "));
    
    if($teacher && !empty($teacher['teacher_email'])) {
        $check_in_time = date("h:i A");
        $check_in_date = date("F d, Y");
        
        $subject = "Check-In Recorded: {$teacher['name']} - $check_in_date";
        $message = "
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { background-color: #f5f5f5; padding: 20px; border-radius: 5px; }
            .header { background-color: #007bff; color: white; padding: 15px; border-radius: 5px; }
            .content { background-color: white; padding: 20px; margin-top: 15px; border-radius: 5px; }
            .status { color: #007bff; font-weight: bold; font-size: 18px; }
            .detail { margin: 10px 0; line-height: 1.6; }
            .label { color: #666; font-weight: bold; }
            .value { color: #333; }
            .footer { color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
          </style>
        </head>
        <body>
        <div class='container'>
// ========== SEND CHECK-OUT EMAIL NOTIFICATION ==========
$teacher = mysqli_fetch_assoc(mysqli_query($conn,"
    SELECT t.name, t.staff_id, u.email as teacher_email, t.dept,
           DATE_FORMAT(tb.check_in, '%h:%i %p') as check_in_formatted
    FROM teachers t
    LEFT JOIN users u ON u.linked_id = t.id AND u.role='teacher'
    LEFT JOIN teacher_biometric_log tb ON tb.id = {$rowId}
    WHERE t.id='$teacher_id' 
    LIMIT 1
"));

if($teacher && !empty($teacher['teacher_email'])) {
    $check_out_time = date("h:i A");
    $check_out_date = date("F d, Y");
    
    $subject = "Check-Out Recorded: {$teacher['name']} - $check_out_date";
    $message = "
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        .container { background-color: #f5f5f5; padding: 20px; border-radius: 5px; }
        .header { background-color: #6f42c1; color: white; padding: 15px; border-radius: 5px; }
        .content { background-color: white; padding: 20px; margin-top: 15px; border-radius: 5px; }
        .status { color: #6f42c1; font-weight: bold; font-size: 18px; }
        .detail { margin: 10px 0; line-height: 1.6; }
        .label { color: #666; font-weight: bold; }
        .value { color: #333; }
        .time-summary { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; }
        .footer { color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
      </style>
    </head>
    <body>
    <div class='container'>
      <div class='header'>
        <h2>Check-Out Recorded</h2>
      </div>
      <div class='content'>
        <p class='status'>✓ CHECK-OUT CONFIRMED</p>
        
        <div class='detail'>
          <span class='label'>Teacher Name:</span>
          <span class='value'>{$teacher['name']}</span>
        </div>
        
        <div class='detail'>
          <span class='label'>Staff ID:</span>
          <span class='value'>{$teacher['staff_id']}</span>
        </div>
        
        <div class='detail'>
          <span class='label'>Department:</span>
          <span class='value'>{$teacher['dept']}</span>
        </div>
        
        <div class='time-summary'>
          <div class='detail'>
            <span class='label'>Check-In Time:</span>
            <span class='value'>{$teacher['check_in_formatted']}</span>
          </div>
          <div class='detail'>
            <span class='label'>Check-Out Time:</span>
            <span class='value' style='color: #6f42c1; font-size: 16px;'><strong>$check_out_time</strong></span>
          </div>
          <div class='detail'>
            <span class='label'>Date:</span>
            <span class='value'>$check_out_date</span>
          </div>
        </div>
      </div>
      <div class='footer'>
        <p>This is an automated notification from SmartCampus System.</p>
        <p>SmartCampus © 2024</p>
      </div>
    </div>
    </body>
    </html>
    ";
    
    $email_result = $mail->send($teacher['teacher_email'], $subject, $message, [], true);
    $email_sent = $email_result['success'];
}

echo json_encode([
    "status" => true, 
    "message" => "Check-out recorded successfully",
    "check_out_time" => date("H:i:s"),
    "email_notification_sent" => $email_sent,
    "email_result" => $email_result
]);          <h2>Check-In Recorded</h2>
          </div>
          <div class='content'>
            <p class='status'>✓ CHECK-IN CONFIRMED</p>
            
            <div class='detail'>
              <span class='label'>Teacher Name:</span>
              <span class='value'>{$teacher['name']}</span>
            </div>
            
            <div class='detail'>
              <span class='label'>Staff ID:</span>
              <span class='value'>{$teacher['staff_id']}</span>
            </div>
            
            <div class='detail'>
              <span class='label'>Department:</span>
              <span class='value'>{$teacher['dept']}</span>
            </div>
            
            <div class='detail'>
              <span class='label'>Check-In Time:</span>
              <span class='value' style='color: #007bff; font-size: 16px;'><strong>$check_in_time</strong></span>
            </div>
            
            <div class='detail'>
              <span class='label'>Date:</span>
              <span class='value'>$check_in_date</span>
            </div>
          </div>
          <div class='footer'>
            <p>This is an automated notification from SmartCampus System.</p>
            <p>SmartCampus © 2024</p>
          </div>
        </div>
        </body>
        </html>
        ";
        
        $email_result = $mail->send($teacher['teacher_email'], $subject, $message, [], true);
        $email_sent = $email_result['success'];
    }

    echo json_encode([
        "status" => true, 
        "message" => "Check-in recorded successfully",
        "check_in_time" => date("H:i:s"),
        "email_notification_sent" => $email_sent,
        "email_result" => $email_result
    ]);
    exit;
}

if (!$existing) {
    $ins = mysqli_prepare($conn, "
        INSERT INTO teacher_biometric_log (teacher_id, attendance_date, check_out, device_info)
        VALUES (?, ?, NOW(), ?)
    ");
    mysqli_stmt_bind_param($ins, "iss", $teacher_id, $today, $note);
    $ok = mysqli_stmt_execute($ins);
    mysqli_stmt_close($ins);

    if (!$ok) {
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Failed to check out", "error" => mysqli_error($conn)]);
        exit;
    }

    echo json_encode(["status" => true, "message" => "Check-out recorded successfully"]);
    exit;
}

$upd = mysqli_prepare($conn, "UPDATE teacher_biometric_log SET check_out = NOW(), device_info = ? WHERE id = ?");
$rowId = (int)$existing['id'];
mysqli_stmt_bind_param($upd, "si", $note, $rowId);
$ok = mysqli_stmt_execute($upd);
mysqli_stmt_close($upd);

if (!$ok) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Failed to check out", "error" => mysqli_error($conn)]);
    exit;
}

echo json_encode(["status" => true, "message" => "Check-out recorded successfully"]);
?>
