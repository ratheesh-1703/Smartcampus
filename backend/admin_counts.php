<?php
include "config.php";

try {
    // Rate limiting check
    if(!SecurityHelper::checkRateLimit('admin_counts', 100, 60)) {
        http_response_code(429);
        echo json_encode([
            "status" => false,
            "message" => "Too many requests. Please try again later."
        ]);
        exit;
    }

    // Database health check
    $dbCheck = $db->selectOne("SELECT DATABASE() as db");
    
    // Count students
    $students = $db->count("SELECT COUNT(*) as total FROM students");
    
    // Count teachers
    $teachers = $db->count("SELECT COUNT(*) as total FROM teachers");
    
    // Count active sessions using prepared statement
    $activeSessions = 0;
    $sessionCheck = $db->select("SHOW TABLES LIKE 'attendance_sessions'");
    if(!empty($sessionCheck)) {
        $activeSessions = $db->count("SELECT COUNT(*) as total FROM attendance_sessions WHERE status = 'active'");
    }
    
    // Count SOS alerts
    $sos = 0;
    $sosCheck = $db->select("SHOW TABLES LIKE 'sos_alerts'");
    if(!empty($sosCheck)) {
        $hasStatus = !empty($db->select("SHOW COLUMNS FROM sos_alerts LIKE 'status'"));
        if ($hasStatus) {
            $sos = $db->count("SELECT COUNT(*) as total FROM sos_alerts WHERE LOWER(COALESCE(status,'open')) NOT IN ('resolved','closed')");
        } else {
            $sos = $db->count("SELECT COUNT(*) as total FROM sos_alerts");
        }
    }
    
    // Return sanitized response
    echo json_encode([
        "status" => true,
        "students" => intval($students),
        "teachers" => intval($teachers),
        "activeSessions" => intval($activeSessions),
        "sos" => intval($sos),
        "timestamp" => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    // Log error securely
    SecurityHelper::logSecurityEvent('ADMIN_COUNTS_ERROR', ['error' => $e->getMessage()]);
    
    // Return generic error for security
    http_response_code(500);
    echo json_encode([
        "status" => false,
        "message" => "Service temporarily unavailable"
    ]);
}
?>
