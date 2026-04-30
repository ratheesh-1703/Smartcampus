# Entry/Exit & Check-In/Check-Out Notifications

## Overview

The SmartCampus system now sends automated email notifications to parents and teachers whenever:

1. **Students enter/exit campus** - via GPS tracking
2. **Teachers check-in/check-out** - via biometric system

Every entry, exit, check-in, and check-out event is logged with complete timestamps and email notifications are sent automatically.

---

## Student Entry/Exit Notifications

### How It Works

**File**: [check_entry_exit.php](check_entry_exit.php)

1. **Student Location Tracking**:
   - Student app sends GPS coordinates
   - System checks if student is within campus boundary
   - Campus boundary coordinates: 
     - Latitude: 9.5698 to 9.5795
     - Longitude: 77.6695 to 77.6875

2. **Entry Detection**:
   - Student enters boundary → System generates **ENTRY email**
   - Sent to parent with:
     - Entry time
     - Student details (name, register no, dept, year)
     - Location confirmation

3. **Exit Detection**:
   - Student leaves boundary → System generates **EXIT email**
   - Sent to parent with:
     - Entry time (when they entered)
     - Exit time (when they left)
     - Duration on campus
     - Student details

### Entry Email Example

**Subject**: Campus Entry Alert - John Smith (REG001)

**Content**:
```
Your ward has Entered Campus
✓ ENTRY CONFIRMED

Student Name: John Smith
Register No: REG001
Department: Computer Science
Year: 3
Entry Time: 09:30 AM
Entry Date: April 04, 2024
Location: Campus Main Gate
```

### Exit Email Example

**Subject**: Campus Exit Alert - John Smith (REG001)

**Content**:
```
Your ward has Left Campus
✓ EXIT RECORDED

Student Name: John Smith
Register No: REG001
Department: Computer Science
Year: 3
Entry Time: 09:30 AM
Exit Time: 03:45 PM
Date: April 04, 2024
Location: Campus Main Gate
```

### API Response (with logging)

```json
{
    "status": true,
    "inside": false,
    "email_notification_sent": true,
    "email_result": {
        "success": true,
        "message": "Email sent successfully",
        "recipient": "parent@example.com"
    }
}
```

---

## Teacher Check-In/Check-Out Notifications

### How It Works

**File**: [log_teacher_biometric.php](log_teacher_biometric.php)

1. **Check-In Recording**:
   - Teacher scans biometric/ID
   - System records check-in time
   - Email sent to teacher's registered email

2. **Check-Out Recording**:
   - Teacher scans biometric/ID again
   - System records check-out time
   - Email sent with total duration on campus

### Check-In Email Example

**Subject**: Check-In Recorded: Dr. Ahmed Khan - April 04, 2024

**Content**:
```
Check-In Recorded
✓ CHECK-IN CONFIRMED

Teacher Name: Dr. Ahmed Khan
Staff ID: STF001
Department: Computer Science
Check-In Time: 09:00 AM
Date: April 04, 2024
```

### Check-Out Email Example

**Subject**: Check-Out Recorded: Dr. Ahmed Khan - April 04, 2024

**Content**:
```
Check-Out Recorded
✓ CHECK-OUT CONFIRMED

Teacher Name: Dr. Ahmed Khan
Staff ID: STF001
Department: Computer Science
Check-In Time: 09:00 AM
Check-Out Time: 04:30 PM
Date: April 04, 2024
```

### API Response (with logging)

```json
{
    "status": true,
    "message": "Check-out recorded successfully",
    "check_out_time": "16:30:45",
    "email_notification_sent": true,
    "email_result": {
        "success": true,
        "message": "Email sent successfully",
        "recipient": "teacher@example.com"
    }
}
```

---

## Email Logging

**Every entry/exit and check-in/check-out is logged** to: `backend/logs/mail.log`

Sample log entries:
```
[2024-04-04 09:30:15] STATUS: SUCCESS | RECIPIENT: parent@example.com | SUBJECT: Campus Entry Alert - John Smith (REG001) | MESSAGE: Your ward has Entered Campus...
[2024-04-04 15:45:30] STATUS: SUCCESS | RECIPIENT: parent@example.com | SUBJECT: Campus Exit Alert - John Smith (REG001) | MESSAGE: Your ward has Left Campus...
[2024-04-04 09:00:00] STATUS: SUCCESS | RECIPIENT: teacher@example.com | SUBJECT: Check-In Recorded: Dr. Ahmed Khan - April 04, 2024 | MESSAGE: Check-In Recorded...
[2024-04-04 16:30:00] STATUS: SUCCESS | RECIPIENT: teacher@example.com | SUBJECT: Check-Out Recorded: Dr. Ahmed Khan - April 04, 2024 | MESSAGE: Check-Out Recorded...
```

---

## Configuration Required

### For Emails to Work

1. **Add to .env**:
```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=tls
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=noreply@smartcampus.com
MAIL_FROM_NAME=Smart Campus System
MAIL_LOG_ENABLED=true
```

2. **Verify Database Tables**:
   - `students` table has `parent_email` field
   - `teachers` table exists
   - `users` table has email for teachers
   - `student_entry_log` table exists
   - `teacher_biometric_log` table exists

3. **GPS Boundary Configuration**:
   - Adjust campus boundary coordinates in `check_entry_exit.php`
   - Current: Latitude 9.5698-9.5795, Longitude 77.6695-77.6875

---

## API Endpoints

### Student Entry/Exit
**URL**: `POST /check_entry_exit.php`

**Request**:
```json
{
    "student_id": 1,
    "latitude": 9.5750,
    "longitude": 77.6785
}
```

**Response**:
```json
{
    "status": true,
    "inside": true,
    "email_notification_sent": true,
    "email_result": {
        "success": true,
        "message": "Email sent successfully",
        "recipient": "parent@example.com"
    }
}
```

### Teacher Check-In/Check-Out
**URL**: `POST /log_teacher_biometric.php`

**Request**:
```json
{
    "teacher_id": 1,
    "status": "CHECK_IN",
    "note": "Main Gate Scanner"
}
```

**Response**:
```json
{
    "status": true,
    "message": "Check-in recorded successfully",
    "check_in_time": "09:30:45",
    "email_notification_sent": true,
    "email_result": {
        "success": true,
        "message": "Email sent successfully",
        "recipient": "teacher@example.com"
    }
}
```

---

## View Notifications Sent

### View All Logs
```bash
curl http://localhost/backend/mail_logs.php?action=view&lines=100
```

### View Dashboard
```bash
curl http://localhost/backend/mail_dashboard.php?action=dashboard
```

### CLI Tools
```bash
# View logs
php mail-cli.php logs view 50

# Follow logs in real-time
php mail-cli.php logs tail
```

---

## Troubleshooting

### Emails not being sent

1. **Check configuration**:
   - Is `.env` file created with mail settings?
   - Are credentials correct?
   - Is `MAIL_LOG_ENABLED=true` set?

2. **Check logs**:
   ```bash
   curl http://localhost/backend/mail_logs.php?action=view
   ```

3. **Verify database fields**:
   - Does student record have `parent_email`?
   - Does teacher have registered email?

4. **Test mail system**:
   ```bash
   curl "http://localhost/backend/testmail.php?email=your-email@gmail.com"
   ```

---

## Summary

| Event | Who Gets Email | Contains |
|-------|----------------|----------|
| Student Entry | Parent/Guardian | Entry time, student details |
| Student Exit | Parent/Guardian | Entry & exit times, student details, duration |
| Teacher Check-In | Teacher | Check-in time, department, date |
| Teacher Check-Out | Teacher | Check-in & check-out times, duration, date |

**All events are automatically logged** in `backend/logs/mail.log` for audit purposes.
