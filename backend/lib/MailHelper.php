<?php

class MailHelper {
    private $host;
    private $port;
    private $username;
    private $password;
    private $from_email;
    private $from_name;
    private $smtp_secure;
    private $log_enabled;
    private $log_file;

    public function __construct() {
        $this->host = getenv('MAIL_HOST') ?: 'localhost';
        $this->port = getenv('MAIL_PORT') ?: 587;
        $this->username = getenv('MAIL_USERNAME') ?: '';
        $this->password = getenv('MAIL_PASSWORD') ?: '';
        $this->from_email = getenv('MAIL_FROM') ?: 'noreply@smartcampus.com';
        $this->from_name = getenv('MAIL_FROM_NAME') ?: 'Smart Campus';
        $this->smtp_secure = getenv('MAIL_SECURE') ?: 'tls'; // tls or ssl
        $this->log_enabled = getenv('MAIL_LOG_ENABLED') !== 'false';
        $this->log_file = __DIR__ . '/../logs/mail.log';
        
        // Create logs directory if it doesn't exist
        $log_dir = dirname($this->log_file);
        if (!is_dir($log_dir)) {
            mkdir($log_dir, 0755, true);
        }
    }

    /**
     * Send email using SMTP or fallback to PHP mail()
     */
    public function send($to, $subject, $message, $headers = [], $use_html = true) {
        try {
            // Prepare headers
            $default_headers = [
                'MIME-Version' => '1.0',
                'Content-type' => $use_html ? 'text/html;charset=UTF-8' : 'text/plain;charset=UTF-8',
                'From' => "{$this->from_name} <{$this->from_email}>",
                'Reply-To' => $this->from_email,
                'X-Mailer' => 'SmartCampus/1.0'
            ];

            $headers = array_merge($default_headers, $headers);
            $header_string = '';
            foreach ($headers as $key => $value) {
                $header_string .= "{$key}: {$value}\r\n";
            }

            // Try SMTP first if configured
            if (!empty($this->username) && !empty($this->host)) {
                $result = $this->sendViaSMTP($to, $subject, $message, $header_string);
            } else {
                // Fallback to PHP native mail()
                $result = $this->sendViaPhpMail($to, $subject, $message, $header_string);
            }

            // Log the mail attempt
            if ($result) {
                $this->log('SUCCESS', $to, $subject, $message);
                return [
                    'success' => true,
                    'message' => 'Email sent successfully',
                    'recipient' => $to
                ];
            } else {
                $this->log('FAILED', $to, $subject, $message, 'Unknown error');
                return [
                    'success' => false,
                    'message' => 'Failed to send email',
                    'recipient' => $to
                ];
            }

        } catch (Exception $e) {
            $this->log('ERROR', $to, $subject, $message, $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error: ' . $e->getMessage(),
                'recipient' => $to
            ];
        }
    }

    /**
     * Send via SMTP (using PHP's built-in stream functions)
     */
    private function sendViaSMTP($to, $subject, $message, $headers) {
        try {
            $smtp_secure_prefix = ($this->smtp_secure === 'ssl') ? 'ssl://' : '';
            
            // Connect to SMTP server
            $socket = fsockopen(
                $smtp_secure_prefix . $this->host,
                $this->port,
                $errno,
                $errstr,
                10
            );

            if (!$socket) {
                throw new Exception("Failed to connect to SMTP server: $errstr ($errno)");
            }

            $this->readResponse($socket);

            // Send EHLO
            fwrite($socket, "EHLO " . gethostname() . "\r\n");
            $this->readResponse($socket);

            // Start TLS if required
            if ($this->smtp_secure === 'tls') {
                fwrite($socket, "STARTTLS\r\n");
                $this->readResponse($socket);
                stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                fwrite($socket, "EHLO " . gethostname() . "\r\n");
                $this->readResponse($socket);
            }

            // Authenticate
            if (!empty($this->username)) {
                fwrite($socket, "AUTH LOGIN\r\n");
                $this->readResponse($socket);

                fwrite($socket, base64_encode($this->username) . "\r\n");
                $this->readResponse($socket);

                fwrite($socket, base64_encode($this->password) . "\r\n");
                $this->readResponse($socket);
            }

            // Set sender
            fwrite($socket, "MAIL FROM: <{$this->from_email}>\r\n");
            $this->readResponse($socket);

            // Set recipient
            fwrite($socket, "RCPT TO: <{$to}>\r\n");
            $this->readResponse($socket);

            // Send data
            fwrite($socket, "DATA\r\n");
            $this->readResponse($socket);

            // Format email
            $email_data = "To: {$to}\r\n";
            $email_data .= "Subject: {$subject}\r\n";
            $email_data .= "{$headers}\r\n";
            $email_data .= "{$message}\r\n.\r\n";

            fwrite($socket, $email_data);
            $response = $this->readResponse($socket);

            // Quit
            fwrite($socket, "QUIT\r\n");
            fclose($socket);

            return strpos($response, '250') === 0;

        } catch (Exception $e) {
            throw new Exception("SMTP Error: " . $e->getMessage());
        }
    }

    /**
     * Send via PHP native mail()
     */
    private function sendViaPhpMail($to, $subject, $message, $headers) {
        return mail($to, $subject, $message, $headers);
    }

    /**
     * Read SMTP response
     */
    private function readResponse($socket) {
        $response = '';
        while ($line = fgets($socket, 256)) {
            $response .= $line;
            if (substr($line, 3, 1) === ' ') {
                break;
            }
        }
        return $response;
    }

    /**
     * Log mail activity
     */
    private function log($status, $recipient, $subject, $message, $error_msg = '') {
        if (!$this->log_enabled) return;

        try {
            $timestamp = date('Y-m-d H:i:s');
            $log_entry = "[$timestamp] STATUS: $status | RECIPIENT: $recipient | SUBJECT: $subject";
            
            if ($error_msg) {
                $log_entry .= " | ERROR: $error_msg";
            }
            
            // Truncate message preview to 100 chars
            $msg_preview = substr(str_replace(["\r\n", "\n", "\r"], " ", $message), 0, 100);
            $log_entry .= " | MESSAGE: {$msg_preview}...\n";

            file_put_contents($this->log_file, $log_entry, FILE_APPEND | LOCK_EX);

        } catch (Exception $e) {
            error_log("Mail logging error: " . $e->getMessage());
        }
    }

    /**
     * Get mail logs
     */
    public function getLogs($lines = 50) {
        if (!file_exists($this->log_file)) {
            return [];
        }

        $file = file($this->log_file);
        return array_slice($file, -$lines);
    }

    /**
     * Clear mail logs
     */
    public function clearLogs() {
        if (file_exists($this->log_file)) {
            file_put_contents($this->log_file, '');
            return true;
        }
        return false;
    }

    /**
     * Send batch emails
     */
    public function sendBatch($recipients, $subject, $message, $headers = [], $use_html = true) {
        $results = [];
        
        foreach ($recipients as $recipient) {
            $results[] = $this->send($recipient, $subject, $message, $headers, $use_html);
        }

        return $results;
    }

    /**
     * Get mail configuration (for debugging)
     */
    public function getConfig() {
        return [
            'host' => $this->host,
            'port' => $this->port,
            'username' => !empty($this->username) ? substr($this->username, 0, 3) . '***' : 'NOT SET',
            'use_authentication' => !empty($this->username),
            'from_email' => $this->from_email,
            'from_name' => $this->from_name,
            'secure_type' => $this->smtp_secure,
            'logging_enabled' => $this->log_enabled
        ];
    }
}
?>
