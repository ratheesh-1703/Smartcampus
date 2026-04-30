<?php
header("Content-Type: application/json");

include "config.php";

// Get test email from query parameter
$test_email = $_GET['email'] ?? 'test@example.com';
$subject = "SmartCampus Mail System Test";
$message = "
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { background-color: #f5f5f5; padding: 20px; border-radius: 5px; }
    .header { color: #333; font-size: 18px; font-weight: bold; }
    .content { color: #666; margin: 15px 0; line-height: 1.6; }
    .footer { color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
  </style>
</head>
<body>
<div class='container'>
  <div class='header'>Welcome to SmartCampus Email System</div>
  <div class='content'>
    <p>This is a test email from the SmartCampus system.</p>
    <p><strong>Test Status:</strong> SUCCESS ✓</p>
    <p>Your mail system is configured and working correctly.</p>
    <p>Sent at: " . date("Y-m-d H:i:s") . "</p>
  </div>
  <div class='footer'>
    <p>This is an automated test message. Please do not reply.</p>
    <p>SmartCampus System © 2024</p>
  </div>
</div>
</body>
</html>
";

// Send test email
$result = $mail->send($test_email, $subject, $message, [], true);

// Add mail configuration info
$config = $mail->getConfig();

echo json_encode([
    "status" => $result['success'],
    "message" => $result['message'],
    "recipient" => $test_email,
    "sent_at" => date("Y-m-d H:i:s"),
    "mail_config" => $config
], JSON_PRETTY_PRINT);
?>

