<?php
// Load environment variables from .env file (if it exists)
if(file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_SKIP_EMPTY_LINES | FILE_IGNORE_NEW_LINES);
    foreach($lines as $line) {
        if(strpos(trim($line), '#') === 0) continue;
        if(strpos($line, '=') === false) continue;
        [$key, $val] = explode('=', $line, 2);
        putenv(trim($key) . '=' . trim($val));
    }
}

// Database configuration from environment or defaults
$db_host = getenv('DB_HOST') ?: 'localhost';
$db_user = getenv('DB_USER') ?: 'root';
$db_pass = getenv('DB_PASS') ?: '';
$db_name = getenv('DB_NAME') ?: 'smartcampus';

// Create connection
$conn = mysqli_connect($db_host, $db_user, $db_pass, $db_name);

if(!$conn){
    error_log("Database connection failed: " . mysqli_connect_error());
    header("Content-Type: application/json");
    http_response_code(500);
    die(json_encode(["status"=>false, "message"=>"Service unavailable"]));
}

// Set charset
mysqli_set_charset($conn, "utf8mb4");

// Load security and database libraries
require_once __DIR__ . '/lib/SecurityHelper.php';
require_once __DIR__ . '/lib/DBHelper.php';
require_once __DIR__ . '/lib/InputValidator.php';

// Initialize database helper
$db = new DBHelper($conn);

// Set security headers for production
header("Content-Type: application/json");
SecurityHelper::setSecurityHeaders();

// CORS configuration
$allowed = explode(',', getenv('ALLOWED_ORIGINS') ?: 'http://localhost:3000,http://localhost:5173,http://localhost');
SecurityHelper::setCorsHeaders(array_map('trim', $allowed));

// Handle CORS preflight
if($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

?>


