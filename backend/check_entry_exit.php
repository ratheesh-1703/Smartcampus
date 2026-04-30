<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include "config.php";

$data = json_decode(file_get_contents("php://input"), true);

$student_id = $data["student_id"];
$lat = $data["latitude"];
$lng = $data["longitude"];

/* CAMPUS BOUNDARY */
$inside =
  ($lat >= 9.5698 && $lat <= 9.5795) &&
  ($lng >= 77.6695 && $lng <= 77.6875);

/* GET CURRENT STATUS */
$q = mysqli_query($conn,"
  SELECT * FROM student_entry_log
  WHERE student_id='$student_id'
");

if(mysqli_num_rows($q)==0){
  mysqli_query($conn,"
    INSERT INTO student_entry_log(student_id,last_status)
    VALUES('$student_id','OUT')
  ");
  $current = "OUT";
}else{
  $row = mysqli_fetch_assoc($q);
  $current = $row["last_status"];
}

$email_sent = false;
$email_result = null;

/* ENTRY */
if($inside && $current=="OUT"){
  mysqli_query($conn,"
    UPDATE student_entry_log
    SET entry_time=NOW(), last_status='IN'
    WHERE student_id='$student_id'
  ");
  
  // ========== SEND ENTRY EMAIL TO PARENT ==========
  $student = mysqli_fetch_assoc(mysqli_query($conn,"
    SELECT s.name, s.reg_no, s.parent_email, s.dept, s.year 
    FROM students s 
    WHERE s.id='$student_id' 
    LIMIT 1
  "));
  
  if($student && !empty($student['parent_email'])) {
    $entry_time = date("h:i A");
    $entry_date = date("F d, Y");
    
    $subject = "Campus Entry Alert - {$student['name']} ({$student['reg_no']})";
    $message = "
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        .container { background-color: #f5f5f5; padding: 20px; border-radius: 5px; }
        .header { background-color: #28a745; color: white; padding: 15px; border-radius: 5px; }
        .content { background-color: white; padding: 20px; margin-top: 15px; border-radius: 5px; }
        .status { color: #28a745; font-weight: bold; font-size: 18px; }
        .detail { margin: 10px 0; line-height: 1.6; }
        .label { color: #666; font-weight: bold; }
        .value { color: #333; }
        .footer { color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
      </style>
    </head>
    <body>
    <div class='container'>
      <div class='header'>
        <h2>Your ward has Entered Campus</h2>
      </div>
      <div class='content'>
        <p class='status'>✓ ENTRY CONFIRMED</p>
        
        <div class='detail'>
          <span class='label'>Student Name:</span>
          <span class='value'>{$student['name']}</span>
        </div>
        
        <div class='detail'>
          <span class='label'>Register No:</span>
          <span class='value'>{$student['reg_no']}</span>
        </div>
        
        <div class='detail'>
          <span class='label'>Department:</span>
          <span class='value'>{$student['dept']}</span>
        </div>
        
        <div class='detail'>
          <span class='label'>Year:</span>
          <span class='value'>{$student['year']}</span>
        </div>
        
        <div class='detail'>
          <span class='label'>Entry Time:</span>
          <span class='value' style='color: #28a745; font-size: 16px;'><strong>$entry_time</strong></span>
        </div>
        
        <div class='detail'>
          <span class='label'>Entry Date:</span>
          <span class='value'>$entry_date</span>
        </div>
        
        <div class='detail'>
          <span class='label'>Location:</span>
          <span class='value'>Campus Main Gate</span>
        </div>
      </div>
      <div class='footer'>
        <p>This is an automated notification from SmartCampus System.</p>
        <p>If you did not authorize this entry, please contact the campus administration immediately.</p>
        <p>SmartCampus © 2024</p>
      </div>
    </div>
    </body>
    </html>
    ";
    
    $email_result = $mail->send($student['parent_email'], $subject, $message, [], true);
    $email_sent = $email_result['success'];
  }
}

/* EXIT */
if(!$inside && $current=="IN"){
  mysqli_query($conn,"
    UPDATE student_entry_log
    SET exit_time=NOW(), last_status='OUT'
    WHERE student_id='$student_id'
  ");
  
  // ========== SEND EXIT EMAIL TO PARENT ==========
  $student = mysql
  "status"=>true,
  "inside"=>$inside,
  "email_notification_sent" => $email_sent,
  "email_result" => $email_result
,"
    SELECT s.name, s.reg_no, s.parent_email, s.dept, s.year,
           DATE_FORMAT(se.entry_time, '%h:%i %p') as entry_time_formatted
    FROM students s 
    LEFT JOIN student_entry_log se ON se.student_id = s.id
    WHERE s.id='$student_id' 
    LIMIT 1
  "));
  
  if($student && !empty($student['parent_email'])) {
    $exit_time = date("h:i A");
    $exit_date = date("F d, Y");
    
    $subject = "Campus Exit Alert - {$student['name']} ({$student['reg_no']})";
    $message = "
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        .container { background-color: #f5f5f5; padding: 20px; border-radius: 5px; }
        .header { background-color: #dc3545; color: white; padding: 15px; border-radius: 5px; }
        .content { background-color: white; padding: 20px; margin-top: 15px; border-radius: 5px; }
        .status { color: #dc3545; font-weight: bold; font-size: 18px; }
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
        <h2>Your ward has Left Campus</h2>
      </div>
      <div class='content'>
        <p class='status'>✓ EXIT RECORDED</p>
        
        <div class='detail'>
          <span class='label'>Student Name:</span>
          <span class='value'>{$student['name']}</span>
        </div>
        
        <div class='detail'>
          <span class='label'>Register No:</span>
          <span class='value'>{$student['reg_no']}</span>
        </div>
        
        <div class='detail'>
          <span class='label'>Department:</span>
          <span class='value'>{$student['dept']}</span>
        </div>
        
        <div class='detail'>
          <span class='label'>Year:</span>
          <span class='value'>{$student['year']}</span>
        </div>
        
        <div class='time-summary'>
          <div class='detail'>
            <span class='label'>Entry Time:</span>
            <span class='value'>{$student['entry_time_formatted']}</span>
          </div>
          <div class='detail'>
            <span class='label'>Exit Time:</span>
            <span class='value' style='color: #dc3545; font-size: 16px;'><strong>$exit_time</strong></span>
          </div>
          <div class='detail'>
            <span class='label'>Date:</span>
            <span class='value'>$exit_date</span>
          </div>
        </div>
        
        <div class='detail'>
          <span class='label'>Location:</span>
          <span class='value'>Campus Main Gate</span>
        </div>
      </div>
      <div class='footer'>
        <p>This is an automated notification from SmartCampus System.</p>
        <p>If this exit was unauthorized, please contact the campus administration immediately.</p>
        <p>SmartCampus © 2024</p>
      </div>
    </div>
    </body>
    </html>
    ";
    
    $email_result = $mail->send($student['parent_email'], $subject, $message, [], true);
    $email_sent = $email_result['success'];
  }
}

echo json_encode(["status"=>true,"inside"=>$inside]);
