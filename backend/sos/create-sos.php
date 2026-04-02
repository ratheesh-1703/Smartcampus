<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../auth/token.php';

$user = require_auth($conn);
if (!$user) exit;

// Accept POST multipart/form-data or JSON
$message = $_POST['message'] ?? null;
$lat = isset($_POST['latitude']) ? (float)$_POST['latitude'] : ($_POST['lat'] ?? null);
$lng = isset($_POST['longitude']) ? (float)$_POST['longitude'] : ($_POST['lng'] ?? null);

if (!$message) {
    echo json_encode(['success' => false, 'message' => 'message is required']);
    exit;
}

$photo_path = null;
if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
    $uploads = __DIR__ . '/../../uploads/sos_photos';
    if (!is_dir($uploads)) mkdir($uploads, 0755, true);
    $name = bin2hex(random_bytes(8)) . '-' . basename($_FILES['photo']['name']);
    $dest = $uploads . '/' . $name;
    if (move_uploaded_file($_FILES['photo']['tmp_name'], $dest)) {
        // keep relative path
        $photo_path = 'uploads/sos_photos/' . $name;
    }
}

// Determine schema variations and insert accordingly
$has_user_id = $conn->query("SHOW COLUMNS FROM sos_alerts LIKE 'user_id'")->num_rows > 0;
$has_student_id = $conn->query("SHOW COLUMNS FROM sos_alerts LIKE 'student_id'")->num_rows > 0;
$photo_col = $conn->query("SHOW COLUMNS FROM sos_alerts LIKE 'photo_path'")->num_rows > 0 ? 'photo_path' : 'image_path';

if ($has_user_id) {
    $stmt = $conn->prepare("INSERT INTO sos_alerts (user_id, message, latitude, longitude, $photo_col) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param('issss', $user['id'], $message, $lat, $lng, $photo_path);
} elseif ($has_student_id) {
    // find student's id from users table
    $sq = $conn->prepare("SELECT id FROM students WHERE user_id = ? LIMIT 1");
    $sq->bind_param('i', $user['id']);
    $sq->execute();
    $sr = $sq->get_result();
    $student_id = null;
    if ($sr && $sr->num_rows > 0) {
        $student_id = $sr->fetch_assoc()['id'];
    }
    if (!$student_id) {
        // attempt to create a minimal students record if register_no is available on users
        $userInfo = $conn->prepare("SELECT register_no FROM users WHERE id = ? LIMIT 1");
        $userInfo->bind_param('i', $user['id']);
        $userInfo->execute();
        $ui = $userInfo->get_result()->fetch_assoc();
        $reg = $ui['register_no'] ?? null;
        $ins = $conn->prepare("INSERT INTO students (user_id, register_no) VALUES (?, ?)");
        $ins->bind_param('is', $user['id'], $reg);
        if ($ins->execute()) {
            $student_id = $conn->insert_id;
        }
    }
    if (!$student_id) {
        echo json_encode(['success' => false, 'message' => 'Student record not found']);
        exit;
    }
    $stmt = $conn->prepare("INSERT INTO sos_alerts (student_id, message, latitude, longitude, $photo_col) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param('issss', $student_id, $message, $lat, $lng, $photo_path);
} else {
    echo json_encode(['success' => false, 'message' => 'Unsupported sos_alerts schema']);
    exit;
}

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'id' => $conn->insert_id]);
} else {
    echo json_encode(['success' => false, 'message' => $conn->error]);
}
?>