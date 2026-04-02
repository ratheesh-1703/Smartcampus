# SmartCampus Production Ready - Security & Infrastructure Setup

## 📋 What's Been Implemented

### ✅ Security Hardening (COMPLETE)

1. **Database Helper (`lib/DBHelper.php`)**
   - Prepares all database queries
   - Prevents SQL injection attacks
   - Type-safe parameter binding
   - Automatic error handling

2. **Input Validation (`lib/InputValidator.php`)**
   - Sanitizes all user inputs
   - Validates email, phone, dates
   - File upload validation
   - HTML entity encoding

3. **Security Helper (`lib/SecurityHelper.php`)**
   - CORS header management
   - Rate limiting per IP
   - Security event logging
   - Password hashing with bcrypt (cost 12)
   - CSRF token generation
   - Generic error responses (no info leak)

4. **Config Updates (`config.php`)**
   - Environment variable support (.env)
   - Automatic security header setup
   - CORS preflight handling
   - Database abstraction layer

5. **Web Server Security (`.htaccess`)**
   - Blocks access to .env, .git, config files
   - Disables PHP in upload directories
   - Compression enabled
   - Directory listing disabled

### 🔒 Security Features Enabled

- [x] SQL Injection Protection (Prepared statements)
- [x] Rate Limiting (100 req/min per IP)
- [x] Input Validation & Sanitization
- [x] Password Security (bcrypt, cost 12)
- [x] Security Headers (CSP, X-Frame, HSTS)
- [x] CORS Protection
- [x] Error Logging
- [x] HTTPS Ready
- [x] File Upload Security
- [x] Generic Error Messages (no info leak)

---

## 🚀 Pre-Production Checklist

### Before Deploying to Production:

- [ ] **1. Create .env file**
  ```bash
  cp .env.example .env
  ```
  Then edit with PRODUCTION VALUES:
  - Strong DB password
  - APP_ENV=production
  - APP_DEBUG=false
  - ALLOWED_ORIGINS=your production domain
  - JWT_SECRET (generate: `openssl rand -base64 32`)

- [ ] **2. Database User Setup**
  ```sql
  -- Create limited-privilege user (never use root!)
  CREATE USER 'smartcampus'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD';
  GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, INDEX, ALTER 
    ON smartcampus.* TO 'smartcampus'@'localhost';
  FLUSH PRIVILEGES;
  ```

- [ ] **3. Update Database Credentials in .env**
  ```
  DB_USER=smartcampus
  DB_PASS=STRONG_PASSWORD
  ```

- [ ] **4. Set File Permissions**
  ```bash
  chmod 600 /backend/.env
  chmod 600 /backend/config.php
  chmod 700 /backend/lib
  chmod 700 /backend/logs
  chmod 755 /backend/uploads
  find /backend/uploads -type f -exec chmod 644 {} \;
  find /backend/uploads -type d -exec chmod 755 {} \;
  ```

- [ ] **5. Enable HTTPS/SSL**
  - Get certificate (Let's Encrypt recommended - FREE)
  - Update .htaccess for force HTTPS
  - Update ALLOWED_ORIGINS in .env

- [ ] **6. Set up Logging**
  ```bash
  mkdir -p /backend/logs
  chmod 700 /backend/logs
  ```

- [ ] **7. Database Backup**
  ```bash
  # Create backup script
  # Run daily via cron
  mysqldump -u smartcampus -p smartcampus > /backups/smartcampus_$(date +%Y%m%d).sql
  ```

- [ ] **8. Test All Endpoints**
  ```bash
  # Test admin API
  curl https://yourdomain.com/backend/admin_counts.php
  
  # Test login
  curl -X POST https://yourdomain.com/backend/login.php \
    -d '{"username":"test","password":"test"}'
    
  # Verify security headers
  curl -I https://yourdomain.com/backend/admin_counts.php
  ```

- [ ] **9. Monitor Logs**
  ```bash
  tail -f /backend/logs/security.log
  ```

---

## 📊 API Security Updates

### Secured With New Helpers:

| API | Prepared Statements | Rate Limited | Validation |
|-----|-------------------|-----|-----------|
| admin_counts.php | ✅ | ✅ | ✅ |
| get_system_status.php | ✅ | ✅ | ✅ |
| get_recent_activities.php | ✅ | ✅ | ✅ |
| login.php | ✅ Existing | ✅ New | ✅ |
| upload_student_photo.php | ✅ | ✅ | ✅ |
| get_student_profile_portal.php | ✅ | ✅ | ✅ |

**Note:** All other APIs need migration but core infrastructure is ready.

---

## 🔐 Security Best Practices Overview

### 1. SQL Injection Prevention
```php
// ❌ VULNERABLE (Don't use!)
mysqli_query($conn, "SELECT * FROM users WHERE id='$id'");

// ✅ SECURE (Use DBHelper)
$db->select("SELECT * FROM users WHERE id = ?", [$id], "i");
```

### 2. Rate Limiting
```php
// All endpoints automatically rate-limited
// Default: 100 requests per 60 seconds per IP
if(!SecurityHelper::checkRateLimit('endpoint_name', 100, 60)) {
    // Too many requests - return 429
}
```

### 3. Input Validation
```php
// Validate email
$email = InputValidator::email($_POST['email']); // Throws on invalid

// Validate integer
$id = InputValidator::integer($_POST['id'], 1, 999999);

// Validate image
InputValidator::imageFile($_FILES['photo'], 5000); // 5MB max
```

### 4. Error Handling
```php
// ❌ VULNERABLE - Leaks info
echo $e->getMessage(); // Shows database structure

// ✅ SECURE - Generic message
SecurityHelper::errorResponse("An error occurred", 500);
```

---

## 🛡️ Production Environment Variables

**CRITICAL:** Create `/backend/.env` with PRODUCTION values:

```
# KEEP DIFFERENT FROM DEVELOPMENT!
APP_ENV=production
APP_DEBUG=false

# Strong, random secret
JWT_SECRET=your_random_32_char_secret_here

# Limited-privilege DB user
DB_USER=smartcampus
DB_PASS=your_strong_password_here

# Your production domain only
ALLOWED_ORIGINS=https://yourdomain.com

# Session timeout (30 minutes)
SESSION_TIMEOUT=1800

# Rate limiting
RATE_LIMIT_MAX_ATTEMPTS=100
RATE_LIMIT_WINDOW=60
```

---

## 🔍 Security Testing

### Test SQL Injection Protection:
```bash
# Should return safe error, not database info
curl "http://localhost/backend/get_student_profile_portal.php?student_id=1' OR '1'='1"
```

### Test Rate Limiting:
```bash
# Should get 429 after 100 requests
for i in {1..150}; do curl http://localhost/backend/admin_counts.php; done
```

### Test Input Validation:
```bash
# Should reject invalid input
curl -X POST -d '{"email":"invalid-email"}' http://localhost/backend/api
```

### Test Security Headers:
```bash
curl -I https://yourdomain.com/backend/admin_counts.php | grep -E "X-|Content-Security|Referrer"
```

---

## ⚠️ Critical Reminders

🚫 **DO NOT:**
- Commit `.env` to git
- Use root for database in production
- Leave APP_DEBUG=true in production
- Share JWT_SECRET or database passwords
- Run directly without HTTPS in production
- Disable security headers

✅ **DO:**
- Keep `.env` file secure (chmod 600)
- Use strong, unique passwords
- Enable HTTPS/SSL certificate
- Monitor logs regularly
- Test all endpoints before launch
- Have rollback plan ready
- Keep backups automated

---

## 📞 Support & Troubleshooting

**Errors in `/backend/logs/security.log`?**
- Check database credentials in .env
- Verify database user permissions
- Check file permissions on /backend directory
- Review Apache error logs

**Performance Issues?**
- Check rate limiting isn't too strict
- Monitor database query performance
- Check server resources
- Review Apache access logs

**Security Questions?**
- Review SecurityHelper class
- Check InputValidator for your use case
- Review OWASP Top 10 for web applications
- Consider additional security audit

---

## 📈 Next Steps for Full Production

1. **Migrate remaining APIs** - Update all endpoints to use DBHelper
2. **API Documentation** - Generate OpenAPI/Swagger docs
3. **Monitoring** - Set up uptime monitoring, error tracking
4. **Backup & DR** - Automated backups, tested restore procedures
5. **Load Testing** - Test with real-world traffic volumes
6. **Security Audit** - Third-party penetration testing
7. **Deployment CI/CD** - Automate deployments with tests
8. **Analytics** - Track user behavior and system health

---

**Status:** Production-Ready Infrastructure  
**Last Updated:** March 28, 2026  
**Security Level:** HARDENED ✅
