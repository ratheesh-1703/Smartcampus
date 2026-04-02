<?php
require_once __DIR__ . "/../config/db.php";

function create_token($conn, $user_id, $ttl_hours = 168) {
    $token = bin2hex(random_bytes(24));
    $expires_at = date('Y-m-d H:i:s', strtotime("+{$ttl_hours} hours"));

    $stmt = $conn->prepare("INSERT INTO tokens (user_id, token, expires_at) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $user_id, $token, $expires_at);
    $ok = $stmt->execute();
    if ($ok) return $token;
    return null;
}

function validate_token($conn, $token) {
    if (!$token) return null;
    $stmt = $conn->prepare("SELECT t.token_id, t.user_id, t.expires_at, u.id, u.username, u.name, u.role FROM tokens t JOIN users u ON t.user_id = u.id WHERE t.token = ? LIMIT 1");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();
    if (!$result || $result->num_rows === 0) return null;
    $row = $result->fetch_assoc();
    if ($row['expires_at'] && strtotime($row['expires_at']) < time()) return null;
    // return user info
    return [
        'user_id' => (int)$row['user_id'],
        'id' => (int)$row['id'],
        'username' => $row['username'],
        'name' => $row['name'],
        'role' => $row['role']
    ];
}

function get_bearer_token() {
    $headers = [];
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
    } else {
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
    }

    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? null;
    if (!$auth) return null;
    if (stripos($auth, 'Bearer ') === 0) {
        return trim(substr($auth, 7));
    }
    return null;
}

function require_auth($conn, $require_admin = false) {
    $token = get_bearer_token();
    $user = validate_token($conn, $token);
    if (!$user) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    if ($require_admin && strtolower($user['role']) !== 'admin') {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
    return $user;
}
?>