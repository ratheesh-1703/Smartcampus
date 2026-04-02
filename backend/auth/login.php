<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/token.php';

$data = json_decode(file_get_contents('php://input'), true);
$identifier = $data['email'] ?? ($data['username'] ?? '');
$password = $data['password'] ?? '';

if (!$identifier || !$password) {
    echo json_encode(['success' => false, 'message' => 'username/email and password required']);
    exit;
}

// Try to find user by email, username or register_no
$stmt = $conn->prepare("SELECT id, username, name, email, password, role FROM users WHERE email = ? OR username = ? OR register_no = ? LIMIT 1");
$stmt->bind_param('sss', $identifier, $identifier, $identifier);
$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    exit;
}
$user = $result->fetch_assoc();

$stored = $user['password'];
$ok = false;
if (password_verify($password, $stored)) $ok = true;
if (!$ok && hash('sha256', $password) === $stored) $ok = true;

if (!$ok) {
    echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    exit;
}

$token = create_token($conn, $user['id']);
if (!$token) {
    echo json_encode(['success' => false, 'message' => 'Failed to create token']);
    exit;
}

echo json_encode(['success' => true, 'token' => $token, 'user' => ['id' => $user['id'], 'name' => $user['name'], 'role' => $user['role']]]);
?>