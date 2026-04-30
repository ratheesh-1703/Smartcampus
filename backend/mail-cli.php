#!/usr/bin/env php
<?php
/**
 * Mail System CLI Tool
 * Usage: php mail-cli.php [command] [options]
 */

require __DIR__ . '/config.php';

class MailCLI {
    private $mail;

    public function __construct($mail) {
        $this->mail = $mail;
    }

    public function run($args) {
        $command = $args[1] ?? 'help';

        switch ($command) {
            case 'send':
                $this->sendCommand($args);
                break;
            case 'test':
                $this->testCommand($args);
                break;
            case 'logs':
                $this->logsCommand($args);
                break;
            case 'config':
                $this->configCommand();
                break;
            case 'help':
            default:
                $this->showHelp();
                break;
        }
    }

    private function sendCommand($args) {
        if (count($args) < 4) {
            $this->error("Usage: php mail-cli.php send <email> <subject> [message]");
            return;
        }

        $email = $args[2];
        $subject = $args[3];
        $message = $args[4] ?? 'Test message from CLI';

        $this->info("Sending email to: $email");
        $this->info("Subject: $subject");

        $result = $this->mail->send($email, $subject, $message);

        if ($result['success']) {
            $this->success("✓ Email sent successfully!");
        } else {
            $this->error("✗ Failed to send email: " . $result['message']);
        }
    }

    private function testCommand($args) {
        $email = $args[2] ?? 'test@example.com';

        $this->info("=== SmartCampus Mail System Test ===");
        $this->info("Testing email configuration...\n");

        $config = $this->mail->getConfig();
        $this->printConfig($config);

        $this->info("\nSending test email to: $email");

        $subject = "SmartCampus Mail System Test - " . date("Y-m-d H:i:s");
        $message = "<h2>SmartCampus Mail System Test</h2>";
        $message .= "<p>If you received this email, your mail system is working correctly!</p>";
        $message .= "<p><strong>Test sent at:</strong> " . date("Y-m-d H:i:s") . "</p>";

        $result = $this->mail->send($email, $subject, $message, [], true);

        if ($result['success']) {
            $this->success("\n✓ Test email sent successfully!");
            $this->info("Check your inbox for the test email.");
        } else {
            $this->error("\n✗ Test email failed: " . $result['message']);
        }
    }

    private function logsCommand($args) {
        $subcommand = $args[2] ?? 'list';
        $lines = $args[3] ?? 20;

        switch ($subcommand) {
            case 'list':
            case 'view':
                $this->viewLogs($lines);
                break;
            case 'clear':
                $this->clearLogs();
                break;
            case 'tail':
                $this->tailLogs($lines);
                break;
            default:
                $this->error("Unknown logs subcommand: $subcommand");
                $this->info("Available: list, view, clear, tail");
        }
    }

    private function viewLogs($lines) {
        $logs = $this->mail->getLogs($lines);
        
        if (empty($logs)) {
            $this->info("No mail logs found.");
            return;
        }

        $this->info("=== Mail Logs (Last $lines entries) ===\n");

        foreach ($logs as $log) {
            if (strpos($log, 'SUCCESS') !== false) {
                $this->success(rtrim($log));
            } elseif (strpos($log, 'FAILED') !== false) {
                $this->warning(rtrim($log));
            } elseif (strpos($log, 'ERROR') !== false) {
                $this->error(rtrim($log));
            } else {
                echo rtrim($log) . "\n";
            }
        }

        $this->info("\n" . count($logs) . " log entries shown.");
    }

    private function tailLogs($lines) {
        $log_file = __DIR__ . '/logs/mail.log';
        
        if (!file_exists($log_file)) {
            $this->error("Log file not found: $log_file");
            return;
        }

        $this->info("=== Tailing Mail Logs (Last $lines lines) ===");
        $this->info("Press Ctrl+C to stop\n");

        system("tail -f -n $lines $log_file");
    }

    private function clearLogs() {
        $this->warning("Are you sure you want to clear all mail logs? (yes/no)");
        $response = trim(fgets(STDIN));

        if ($response === 'yes' || $response === 'y') {
            if ($this->mail->clearLogs()) {
                $this->success("✓ Mail logs cleared successfully!");
            } else {
                $this->error("✗ Failed to clear mail logs.");
            }
        } else {
            $this->info("Operation cancelled.");
        }
    }

    private function configCommand() {
        $config = $this->mail->getConfig();
        
        $this->info("=== Mail System Configuration ===\n");
        $this->printConfig($config);
    }

    private function printConfig($config) {
        foreach ($config as $key => $value) {
            if (is_bool($value)) {
                $value = $value ? 'Yes' : 'No';
            }
            printf("%-20s : %s\n", ucfirst(str_replace('_', ' ', $key)), $value);
        }
    }

    private function showHelp() {
        echo <<<EOT
╔════════════════════════════════════════════════════════════╗
║         SmartCampus Mail System CLI Tool v1.0              ║
╚════════════════════════════════════════════════════════════╝

COMMANDS:
  send      Send a test email
            Usage: php mail-cli.php send <email> <subject> [message]
            Example: php mail-cli.php send user@example.com "Test" "Hello"

  test      Run mail system test
            Usage: php mail-cli.php test [email]
            Example: php mail-cli.php test user@example.com

  logs      Manage mail logs
            Usage: php mail-cli.php logs [subcommand] [lines]
            Subcommands:
              - list (default)     : Show recent logs
              - view              : View logs
              - clear             : Clear all logs
              - tail              : Follow logs (like tail -f)
            Example: php mail-cli.php logs view 50

  config    Show mail configuration
            Usage: php mail-cli.php config

  help      Show this help message
            Usage: php mail-cli.php help

EXAMPLES:
  # Send a test email
  php mail-cli.php test admin@example.com

  # View last 20 mail logs
  php mail-cli.php logs view 20

  # Follow mail logs in real-time
  php mail-cli.php logs tail

  # Show current configuration
  php mail-cli.php config

EOT;
    }

    private function info($message) {
        echo "\033[34m" . $message . "\033[0m\n";
    }

    private function success($message) {
        echo "\033[32m" . $message . "\033[0m\n";
    }

    private function warning($message) {
        echo "\033[33m" . $message . "\033[0m\n";
    }

    private function error($message) {
        echo "\033[31m" . $message . "\033[0m\n";
    }
}

// Run the CLI
$cli = new MailCLI($mail);
$cli->run($argv);
?>
