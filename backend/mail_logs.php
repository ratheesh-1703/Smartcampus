<?php
header("Content-Type: application/json");

include "config.php";

// Get action from query
$action = $_GET['action'] ?? 'view';
$lines = $_GET['lines'] ?? 50;

switch($action) {
    case 'view':
        $logs = $mail->getLogs($lines);
        echo json_encode([
            "status" => true,
            "action" => "view",
            "total_logs" => count($logs),
            "logs" => $logs,
            "mail_config" => $mail->getConfig()
        ], JSON_PRETTY_PRINT);
        break;

    case 'clear':
        // Add authorization check here if needed
        $cleared = $mail->clearLogs();
        echo json_encode([
            "status" => $cleared,
            "action" => "clear",
            "message" => $cleared ? "Logs cleared successfully" : "Failed to clear logs"
        ], JSON_PRETTY_PRINT);
        break;

    case 'config':
        echo json_encode([
            "status" => true,
            "action" => "config",
            "mail_config" => $mail->getConfig()
        ], JSON_PRETTY_PRINT);
        break;

    default:
        echo json_encode([
            "status" => false,
            "message" => "Unknown action",
            "available_actions" => ["view", "clear", "config"]
        ], JSON_PRETTY_PRINT);
}
?>
