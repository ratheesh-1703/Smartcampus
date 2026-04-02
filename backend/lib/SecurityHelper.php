<?php
/**
 * SECURITY HELPER
 * CORS, CSRF, Rate Limiting, Error Handling
 */

class SecurityHelper {
    
    /**
     * Set secure CORS headers
     */
    public static function setCorsHeaders($allowedOrigins = ['http://localhost:3000', 'http://localhost']) {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        if(in_array($origin, $allowedOrigins)) {
            header("Access-Control-Allow-Origin: $origin");
            header("Access-Control-Allow-Credentials: true");
        }
        
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization");
        header("Access-Control-Max-Age: 3600");
    }
    
    /**
     * Set security headers for production
     */
    public static function setSecurityHeaders() {
        header("X-Content-Type-Options: nosniff");
        header("X-Frame-Options: DENY");
        header("X-XSS-Protection: 1; mode=block");
        header("Referrer-Policy: strict-origin-when-cross-origin");
        header("Strict-Transport-Security: max-age=31536000; includeSubDomains");
        header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");
    }
    
    /**
     * Get CSRF token or validate it
     */
    public static function csrfToken() {
        if(!isset($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }
    
    public static function validateCsrfToken($token) {
        return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
    }
    
    /**
     * Rate limiting per IP
     * Returns true if within limits, false if exceeded
     */
    public static function checkRateLimit($key, $maxAttempts = 100, $windowSeconds = 60) {
        $ip = $_SERVER['REMOTE_ADDR'];
        $identifier = $key . ':' . $ip;
        $cacheFile = sys_get_temp_dir() . '/rate_limit_' . md5($identifier) . '.json';
        
        $attempts = [];
        if(file_exists($cacheFile)) {
            $data = json_decode(file_get_contents($cacheFile), true);
            $attempts = $data['attempts'] ?? [];
            
            // Clean old attempts
            $cutoff = time() - $windowSeconds;
            $attempts = array_filter($attempts, function($t) use ($cutoff) {
                return $t > $cutoff;
            });
        }
        
        // Check if exceeded
        if(count($attempts) >= $maxAttempts) {
            return false;
        }
        
        // Add current attempt
        $attempts[] = time();
        file_put_contents($cacheFile, json_encode(['attempts' => $attempts]));
        
        return true;
    }
    
    /**
     * Log security events
     */
    public static function logSecurityEvent($event, $details = []) {
        $logFile = dirname(__DIR__) . '/logs/security.log';
        
        // Create logs directory if not exists
        if(!is_dir(dirname($logFile))) {
            mkdir(dirname($logFile), 0755, true);
        }
        
        $logEntry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'ip' => $_SERVER['REMOTE_ADDR'],
            'event' => $event,
            'details' => $details
        ];
        
        file_put_contents($logFile, json_encode($logEntry) . PHP_EOL, FILE_APPEND);
    }
    
    /**
     * Safe error response for production
     */
    public static function errorResponse($message, $code = 400) {
        http_response_code($code);
        header("Content-Type: application/json");
        
        SecurityHelper::logSecurityEvent('API_ERROR', [
            'message' => $message,
            'code' => $code,
            'endpoint' => $_SERVER['REQUEST_URI']
        ]);
        
        echo json_encode([
            'status' => false,
            'message' => 'An error occurred. Please try again later.',
            'error_id' => uniqid()
        ]);
        exit;
    }
    
    /**
     * Success response
     */
    public static function successResponse($data = [], $message = "Success") {
        http_response_code(200);
        header("Content-Type: application/json");
        
        echo json_encode([
            'status' => true,
            'message' => $message,
            'data' => $data
        ]);
        exit;
    }
    
    /**
     * Hash password securely
     */
    public static function hashPassword($password) {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    }
    
    /**
     * Verify password
     */
    public static function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }
    
    /**
     * Generate secure token
     */
    public static function generateToken($length = 32) {
        return bin2hex(random_bytes($length));
    }
}

?>
