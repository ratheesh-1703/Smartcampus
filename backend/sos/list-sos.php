<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../auth/token.php';

$user = require_auth($conn);
if (!$user) exit;

// If teacher/admin/student affairs role, return all open alerts; otherwise return only user's alerts
$role = strtolower($user['role']);
$all = ($role === 'admin' || $role === 'student_affairs' || $role === 'affairs' || $role === 'teacher');

// detect schema: sos_alerts may reference users (user_id) or students (student_id)
$has_user_id = $conn->query("SHOW COLUMNS FROM sos_alerts LIKE 'user_id'")->num_rows > 0;
$has_student_id = $conn->query("SHOW COLUMNS FROM sos_alerts LIKE 'student_id'")->num_rows > 0;
$photo_col = $conn->query("SHOW COLUMNS FROM sos_alerts LIKE 'photo_path'")->num_rows > 0 ? 'photo_path' : 'image_path';
$status_col = $conn->query("SHOW COLUMNS FROM sos_alerts LIKE 'status'")->num_rows > 0 ? 'status' : null;
$status_filter = $status_col ? " AND LOWER(COALESCE(s.$status_col,'open')) NOT IN ('resolved','closed')" : "";

if ($has_user_id) {
    if ($all) {
        $sql = "SELECT s.id, s.user_id as user_id, s.message, s.latitude, s.longitude, s.$photo_col as photo_path" . ($status_col ? ", s.$status_col as status" : ", 'open' as status") . ", s.created_at, u.name, u.register_no FROM sos_alerts s JOIN users u ON s.user_id = u.id WHERE 1=1" . $status_filter . " ORDER BY s.created_at DESC";
        $q = $conn->prepare($sql);
        $q->execute();
    } else {
        $sql = "SELECT s.id, s.user_id as user_id, s.message, s.latitude, s.longitude, s.$photo_col as photo_path" . ($status_col ? ", s.$status_col as status" : ", 'open' as status") . ", s.created_at, u.name, u.register_no FROM sos_alerts s JOIN users u ON s.user_id = u.id WHERE s.user_id = ?" . $status_filter . " ORDER BY s.created_at DESC";
        $q = $conn->prepare($sql);
        $q->bind_param('i', $user['id']);
        $q->execute();
    }
} elseif ($has_student_id) {
    // join via students -> users
    if ($all) {
        $sql = "SELECT s.id, s.student_id as student_id, s.message, s.latitude, s.longitude, s.$photo_col as photo_path" . ($status_col ? ", s.$status_col as status" : ", 'open' as status") . ", s.created_at, u.name, u.register_no FROM sos_alerts s JOIN students st ON s.student_id = st.id JOIN users u ON st.user_id = u.id WHERE 1=1" . $status_filter . " ORDER BY s.created_at DESC";
        $q = $conn->prepare($sql);
        $q->execute();
    } else {
        // find student id
        $sq = $conn->prepare("SELECT id FROM students WHERE user_id = ? LIMIT 1");
        $sq->bind_param('i', $user['id']);
        $sq->execute();
        $sr = $sq->get_result();
        if ($sr->num_rows === 0) {
            echo json_encode(['success' => true, 'alerts' => []]);
            exit;
        }
        $student_id = $sr->fetch_assoc()['id'];
        $sql = "SELECT s.id, s.student_id as student_id, s.message, s.latitude, s.longitude, s.$photo_col as photo_path" . ($status_col ? ", s.$status_col as status" : ", 'open' as status") . ", s.created_at, u.name, u.register_no FROM sos_alerts s JOIN students st ON s.student_id = st.id JOIN users u ON st.user_id = u.id WHERE s.student_id = ?" . $status_filter . " ORDER BY s.created_at DESC";
        $q = $conn->prepare($sql);
        $q->bind_param('i', $student_id);
        $q->execute();
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Unsupported sos_alerts schema']);
    exit;
}

$res = $q->get_result();
$list = [];
while ($row = $res->fetch_assoc()) {
    $list[] = $row;
}

echo json_encode(['success' => true, 'alerts' => $list]);
?>