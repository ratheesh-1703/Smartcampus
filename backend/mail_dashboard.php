<?php
header("Content-Type: application/json");

include "config.php";

// Get mail statistics and logs

$action = $_GET['action'] ?? 'dashboard';

switch($action) {
    case 'dashboard':
    case 'stats':
        $logs = $mail->getLogs(10000); // Get all logs
        
        $stats = [
            'total' => 0,
            'success' => 0,
            'failed' => 0,
            'error' => 0,
            'success_rate' => 0
        ];

        $recipients = [];
        $subjects = [];
        $recent = [];

        foreach ($logs as $log) {
            $stats['total']++;

            if (strpos($log, 'SUCCESS') !== false) {
                $stats['success']++;
                $severity = 'success';
            } elseif (strpos($log, 'FAILED') !== false) {
                $stats['failed']++;
                $severity = 'failed';
            } elseif (strpos($log, 'ERROR') !== false) {
                $stats['error']++;
                $severity = 'error';
            } else {
                continue;
            }

            // Parse log entry
            if (preg_match('/\[(.+?)\].*RECIPIENT: ([^\s|]+).*SUBJECT: ([^|]+)/', $log, $matches)) {
                $timestamp = $matches[1];
                $recipient = trim($matches[2]);
                $subject = trim($matches[3]);

                // Count recipients
                $recipients[$recipient] = ($recipients[$recipient] ?? 0) + 1;
                
                // Count subjects
                $subjects[$subject] = ($subjects[$subject] ?? 0) + 1;

                // Store recent entries
                if (count($recent) < 20) {
                    $recent[] = [
                        'timestamp' => $timestamp,
                        'recipient' => $recipient,
                        'subject' => $subject,
                        'status' => $severity,
                        'log' => trim($log)
                    ];
                }
            }
        }

        // Calculate success rate
        if ($stats['total'] > 0) {
            $stats['success_rate'] = round(($stats['success'] / $stats['total']) * 100, 2);
        }

        // Sort recipients by frequency
        arsort($recipients);
        $top_recipients = array_slice($recipients, 0, 10);

        // Sort subjects by frequency
        arsort($subjects);
        $top_subjects = array_slice($subjects, 0, 10);

        echo json_encode([
            "status" => true,
            "action" => "dashboard",
            "timestamp" => date("Y-m-d H:i:s"),
            "stats" => $stats,
            "top_recipients" => array_map(function($recipient, $count) {
                return ['recipient' => $recipient, 'count' => $count];
            }, array_keys($top_recipients), array_values($top_recipients)),
            "top_subjects" => array_map(function($subject, $count) {
                return ['subject' => $subject, 'count' => $count];
            }, array_keys($top_subjects), array_values($top_subjects)),
            "recent_activity" => $recent,
            "mail_config" => $mail->getConfig()
        ], JSON_PRETTY_PRINT);
        break;

    case 'breakdown':
        // Get breakdown by hour/day
        $logs = $mail->getLogs(10000);
        
        $breakdown = [];
        foreach ($logs as $log) {
            if (preg_match('/\[(.+?)\].*STATUS: (\w+)/', $log, $matches)) {
                $timestamp = $matches[1];
                $status = $matches[2];
                
                $date = substr($timestamp, 0, 10);
                $hour = substr($timestamp, 11, 2);
                
                if (!isset($breakdown[$date])) {
                    $breakdown[$date] = ['success' => 0, 'failed' => 0, 'error' => 0];
                }
                
                $key = strtolower($status);
                if (isset($breakdown[$date][$key])) {
                    $breakdown[$date][$key]++;
                }
            }
        }

        echo json_encode([
            "status" => true,
            "action" => "breakdown",
            "breakdown_by_date" => $breakdown
        ], JSON_PRETTY_PRINT);
        break;

    default:
        echo json_encode([
            "status" => false,
            "message" => "Unknown action",
            "available_actions" => ["dashboard", "stats", "breakdown"]
        ], JSON_PRETTY_PRINT);
}
?>
