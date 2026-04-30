# SmartCampus Mail System

## Overview
The mail system now includes professional SMTP support with comprehensive logging of all email sends. Every email sent through the system is logged with:
- **Timestamp**: When the email was sent
- **Status**: SUCCESS, FAILED, or ERROR
- **Recipient**: Email address
- **Subject**: Email subject
- **Message Preview**: First 100 characters of the message
- **Error Details**: If sending failed

## Setup Instructions

### 1. Configuration (for Gmail)

Create or update `.env` file in the backend directory:

```
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=tls
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=noreply@smartcampus.com
MAIL_FROM_NAME=Smart Campus System
MAIL_LOG_ENABLED=true
```

### 2. Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication**:
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Copy the 16-character password
   - Use this in `MAIL_PASSWORD`

### 3. Other Email Providers

**Outlook.com/Hotmail**:
```
MAIL_HOST=smtp-mail.outlook.com
MAIL_PORT=587
MAIL_SECURE=tls
MAIL_USERNAME=your-email@outlook.com
MAIL_PASSWORD=your-password
```

**SendGrid**:
```
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_SECURE=tls
MAIL_USERNAME=apikey
MAIL_PASSWORD=SG.xxxxxxxxxxxxx
```

## Usage

### Sending Emails in Your Code

```php
// In any PHP file that includes config.php
$result = $mail->send(
    'recipient@example.com',
    'Email Subject',
    '<html>Your HTML message</html>',
    [],  // Optional additional headers
    true // Use HTML format
);

// Check result
if ($result['success']) {
    echo "Email sent to " . $result['recipient'];
} else {
    echo "Error: " . $result['message'];
}
```

### Sending Batch Emails

```php
$recipients = [
    'user1@example.com',
    'user2@example.com',
    'user3@example.com'
];

$results = $mail->sendBatch(
    $recipients,
    'Subject',
    '<html>Message</html>',
    [],
    true
);

foreach ($results as $result) {
    echo $result['success'] ? "✓" : "✗";
    echo " {$result['recipient']}\n";
}
```

## API Endpoints

### Test Mail
**URL**: `POST /testmail.php?email=test@example.com`

Test if mail system is working:
```bash
curl "http://localhost/backend/testmail.php?email=test@example.com"
```

**Response**:
```json
{
    "status": true,
    "message": "Email sent successfully",
    "recipient": "test@example.com",
    "sent_at": "2024-04-04 10:30:45",
    "mail_config": {
        "host": "smtp.gmail.com",
        "port": 587,
        "username": "you***",
        "use_authentication": true,
        "from_email": "noreply@smartcampus.com",
        "from_name": "Smart Campus System",
        "secure_type": "tls",
        "logging_enabled": true
    }
}
```

### View Mail Logs
**URL**: `GET /mail_logs.php?action=view&lines=50`

View recent mail sending logs:
```bash
curl "http://localhost/backend/mail_logs.php?action=view&lines=50"
```

**Response**:
```json
{
    "status": true,
    "action": "view",
    "total_logs": 3,
    "logs": [
        "[2024-04-04 10:30:45] STATUS: SUCCESS | RECIPIENT: parent@example.com | SUBJECT: Attendance Alert - John Smith (REG001) | MESSAGE: Dear Parent....",
        "[2024-04-04 10:25:30] STATUS: SUCCESS | RECIPIENT: parent2@example.com | SUBJECT: Attendance Alert - Jane Doe (REG002) | MESSAGE: Dear Parent....",
        "[2024-04-04 10:15:00] STATUS: FAILED | RECIPIENT: invalid@example.com | SUBJECT: Attendance Alert | ERROR: Invalid email address"
    ],
    "mail_config": { ... }
}
```

### View Mail Configuration
**URL**: `GET /mail_logs.php?action=config`

```bash
curl "http://localhost/backend/mail_logs.php?action=config"
```

### Clear Mail Logs
**URL**: `GET /mail_logs.php?action=clear`

```bash
curl "http://localhost/backend/mail_logs.php?action=clear"
```

## Current Integration

### end_attendance.php
When attendance ends, the system now:
1. Finds all absent students
2. Sends HTML email to each parent
3. Logs each send attempt
4. Returns results with email statistics

**Response includes**:
```json
{
    "status": true,
    "message": "Attendance Ended & Parent Alerts Sent",
    "emails_sent": 5,
    "email_results": [
        {"success": true, "message": "Email sent successfully", "recipient": "parent1@example.com"},
        {"success": true, "message": "Email sent successfully", "recipient": "parent2@example.com"}
    ]
}
```

## Log File Location

Mail logs are stored in: `backend/logs/mail.log`

View logs directly:
```bash
tail -f backend/logs/mail.log
```

Sample log entries:
```
[2024-04-04 10:30:45] STATUS: SUCCESS | RECIPIENT: parent@example.com | SUBJECT: Attendance Alert - John Smith (REG001) | MESSAGE: Dear Parent, This is to inform you that your...
[2024-04-04 10:25:30] STATUS: SUCCESS | RECIPIENT: parent2@example.com | SUBJECT: Attendance Alert - Jane Doe (REG002) | MESSAGE: Dear Parent, This is to inform you that your...
[2024-04-04 10:15:00] STATUS: FAILED | RECIPIENT: invalid@email | SUBJECT: Test Email | ERROR: SMTP Error: Failed to connect to SMTP server
```

## Troubleshooting

### No logs being created
- Check that `logs/` directory exists and is writable
- Set `MAIL_LOG_ENABLED=true` in .env
- Check PHP error logs

### Emails not sending
1. **Test basic connectivity**:
   ```php
   curl "http://localhost/backend/testmail.php?email=your-email@gmail.com"
   ```

2. **Check logs**:
   ```
   http://localhost/backend/mail_logs.php?action=view
   ```

3. **Verify configuration**:
   - Correct SMTP host and port
   - Valid username/password
   - TLS/SSL setting matches provider

4. **For Gmail**:
   - Using App Password, not regular password
   - 2-Factor Authentication enabled
   - App Password is correct (16 characters)

5. **Firewall/Network**:
   - Ensure port 587 (TLS) or 465 (SSL) is not blocked
   - Check firewall rules

## Security Notes

- Never commit `.env` file with real credentials to version control
- Use environment variables for sensitive data
- Passwords are masked in logs and API responses
- Implement rate limiting for mass email operations
- Validate email addresses before sending

## Future Enhancements

- [ ] Email templates support
- [ ] Attachment support
- [ ] Scheduled email sending
- [ ] Email delivery tracking
- [ ] Webhook notifications on send failure
- [ ] HTML email builder
- [ ] Bulk email management UI
