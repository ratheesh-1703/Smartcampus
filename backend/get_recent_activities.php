<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

include "config.php";

$activities = [];

try {
    // Get Recent Student Registrations (last 24 hours)
    $result_students = mysqli_query($conn, "
        SELECT id, name, created_at FROM students 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ORDER BY created_at DESC
        LIMIT 10
    ");
    
    if($result_students) {
        while($row = mysqli_fetch_assoc($result_students)) {
            $activities[] = [
                "id" => $row["id"],
                "type" => "student_registered",
                "title" => "New Student Registered",
                "description" => $row["name"],
                "icon" => "👤",
                "timestamp" => $row["created_at"],
                "color" => "primary"
            ];
        }
    }

    // Get Recent Attendance Sessions Started (last 24 hours)
    $result_attendance = mysqli_query($conn, "
        SELECT id, status, date, start_time FROM attendance_sessions 
        WHERE date >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        ORDER BY date DESC, start_time DESC
        LIMIT 10
    ");
    
    if($result_attendance) {
        while($row = mysqli_fetch_assoc($result_attendance)) {
            $activities[] = [
                "id" => $row["id"],
                "type" => "attendance_started",
                "title" => "Attendance Session Started",
                "description" => "Status: " . ucfirst($row["status"]),
                "icon" => "📚",
                "timestamp" => $row["date"] . " " . $row["start_time"],
                "color" => "success"
            ];
        }
    }

    // Get Recent Teachers Added (last 24 hours)
    $result_teachers = mysqli_query($conn, "
        SELECT id, name, created_at FROM teachers 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ORDER BY created_at DESC
        LIMIT 5
    ");
    
    if($result_teachers) {
        while($row = mysqli_fetch_assoc($result_teachers)) {
            $activities[] = [
                "id" => $row["id"],
                "type" => "teacher_added",
                "title" => "New Teacher Added",
                "description" => $row["name"],
                "icon" => "👨‍🏫",
                "timestamp" => $row["created_at"],
                "color" => "info"
            ];
        }
    }

    // Sort all activities by timestamp (most recent first)
    usort($activities, function($a, $b) {
        return strtotime($b["timestamp"]) - strtotime($a["timestamp"]);
    });

    // Keep only the 10 most recent
    $activities = array_slice($activities, 0, 10);

    echo json_encode([
        "status" => true,
        "activities" => $activities,
        "count" => count($activities)
    ]);

} catch (Exception $e) {
    echo json_encode([
        "status" => false,
        "message" => $e->getMessage(),
        "activities" => []
    ]);
}
?>