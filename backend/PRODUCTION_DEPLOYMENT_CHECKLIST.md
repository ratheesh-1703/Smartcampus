# SmartCampus Production Deployment Guide

## ✅ Pre-Deployment Checklist

### Phase 1: Security Hardening (COMPLETE)
- [x] Created DBHelper.php - Prepared statements for all database queries
- [x] Created InputValidator.php - Input validation and sanitization
- [x] Created SecurityHelper.php - CORS, rate limiting, error handling
- [x] Updated config.php - Environment variable support
- [x] Added .htaccess - Web server security rules
- [x] Security headers - X-Frame-Options, CSP, HSTS ready

### Phase 2: Configuration Before Deployment

#### 1. Create .env file
```bash
# Copy from .env.example and configure
cp .env.example .env

# Edit .env with your values:
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASS=your_secure_password
DB_NAME=smartcampus
ALLOWED_ORIGINS=https://yourdomains.com
APP_ENV=production
APP_DEBUG=false
```

**IMPORTANT:** Never commit `.env` to git!

#### 2. Database Security
```sql
-- Create limited-privilege database user (don't use root in production!)
CREATE USER 'smartcampus_user'@'localhost' IDENTIFIED BY 'YOUR_SECURE_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, INDEX, ALTER ON smartcampus.* TO 'smartcampus_user'@'localhost';
FLUSH PRIVILEGES;
```

#### 3. File Permissions
```bash
# Backend directory
chmod 755 /var/www/html/backend
chmod 644 /var/www/html/backend/*.php

# Secure directories
chmod 750 /var/www/html/backend/lib
chmod 700 /var/www/html/backend/logs
chmod 700 /var/www/html/backend/uploads

# Make uploads writable but not executable
chmod 755 /var/www/html/backend/uploads
chmod 755 /var/www/html/backend/uploads/students
chmod 755 /var/www/html/backend/uploads/teachers

# Protect sensitive files
chmod 600 /var/www/html/backend/.env
chmod 600 /var/www/html/backend/config.php
```

#### 4. SSL/HTTPS Certificate
```bash
# Using Let's Encrypt (recommended - FREE)
sudo apt-get install certbot python3-certbot-apache
sudo certbot certonly --apache -d yourdomain.com

# Update your Apache config to force HTTPS
# Add this to VirtualHost:
# <IfModule mod_headers.c>
#     Header always set Strict-Transport-Security "max-age=31536000"
# </IfModule>
# Redirect /backend http to https
```

#### 5. Database Backup Strategy
```bash
# Daily automated backup
0 2 * * * mysqldump -u smartcampus_user -p$DB_PASS smartcampus > /backups/smartcampus_$(date +\%Y\%m\%d).sql

# Weekly full backup with compression
0 3 * * 0 mysqldump -u smartcampus_user -p$DB_PASS smartcampus | gzip > /backups/smartcampus_weekly_$(date +\%Y\%m\%d).sql.gz
```

### Phase 3: API Hardening

All critical APIs now use:
- ✅ Prepared statements (no SQL injection)
- ✅ Input validation (InputValidator class)
- ✅ Rate limiting (SecurityHelper)
- ✅ Error handling (safe error messages)
- ✅ Security headers (automatic)

**Updated APIs:**
- admin_counts.php
- get_system_status.php
- get_recent_activities.php
- get_student_profile_portal.php
- upload_student_photo.php

### Phase 4: Testing Before Production

#### Performance Testing
```bash
# Test with Apache Bench (ab)
ab -n 1000 -c 100 http://localhost/backend/admin_counts.php

# Test login endpoint
ab -n 100 -c 10 -p login.json -T application/json http://localhost/backend/login.php
```

#### Security Testing
```bash
# SQL Injection test (should be protected)
curl "http://localhost/backend/get_student_profile_portal.php?student_id=1' OR '1'='1"
# Should return safe error, not database info

# XSS test
curl -X POST -d '{"username":"<script>alert(1)</script>"}' http://localhost/backend/login.php
# Should sanitize/escape the input
```

#### Rate Limit Testing
```bash
# Rapid requests should be rate limited
for i in {1..150}; do curl http://localhost/backend/admin_counts.php; done
# After ~100 requests, should get rate limit response
```

### Phase 5: Deployment Steps

#### On Production Server:

```bash
# 1. Stop application
sudo systemctl stop apache2

# 2. Deploy code
git clone https://github.com/yourrepo/smartcampus.git /var/www/html/smartcampus
cd /var/www/html/smartcampus/backend

# 3. Set permissions
chmod 755 .
chmod 644 *.php
chmod 700 lib logs uploads
chown -R www-data:www-data uploads logs

# 4. Create .env
cp .env.example .env
# EDIT WITH PRODUCTION VALUES!!!
nano .env

# 5. Verify database connection
php -r "include 'config.php'; echo 'DB Connected: ' . ($conn ? 'YES' : 'NO');"

# 6. Create logs directory
mkdir -p logs
chmod 700 logs

# 7. Restart server
sudo systemctl start apache2

# 8. Test endpoint
curl http://yourdomain.com/backend/admin_counts.php
```

### Phase 6: Monitoring & Maintenance

#### Set Up Monitoring
- Monitor error logs: `tail -f /var/www/html/backend/logs/security.log`
- Monitor database performance
- Set up uptime monitoring (Pingdom, Uptime Robot)
- Set up error tracking (Sentry, Rollbar)

#### Regular Maintenance
- **Weekly:** Check security logs for suspicious activity
- **Daily:** Verify automated backups completed
- **Monthly:** Update PHP, MySQL, and dependencies
- **Quarterly:** Security audit and code review

#### Logging & Alerts
All security events are logged to `/backend/logs/security.log`:
- Failed logins
- Rate limit violations
- Invalid input attempts
- Database errors
- API access patterns

### Phase 7: Post-Deployment Validation

```bash
# 1. Test all critical endpoints
curl -X POST -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  https://yourdomain.com/backend/login.php

# 2. Verify HTTPS
curl -I https://yourdomain.com/backend/admin_counts.php
# Should see: Strict-Transport-Security header

# 3. Check security headers
curl -I https://yourdomain.com/backend/admin_counts.php | grep -E "X-|Content-Security|Referrer"

# 4. Test rate limiting
for i in {1..150}; do 
  curl -s https://yourdomain.com/backend/admin_counts.php > /dev/null
done
echo "Rate limit test complete"

# 5. Verify uploads work
curl -X POST -F "id=1" -F "photo=@test.jpg" \
  https://yourdomain.com/backend/upload_student_photo.php
```

## 🚨 Critical Configuration Items

| Item | Status | Production Value |
|------|--------|------------------|
| APP_ENV | ✅ | `production` |
| APP_DEBUG | ✅ | `false` |
| HTTPS | ⚠️ | Required |
| Database User | ⚠️ | Limited permissions |
| .env file | ⚠️ | Create & secure |
| Error Logging | ✅ | Enable |
| Rate Limiting | ✅ | Enable (100 req/min) |
| Session Timeout | ⚠️ | 30 minutes |
| CORS Origins | ⚠️ | Update to production domains |

## ⚠️ DO NOT FORGET

- [ ] Remove all debug/test files
- [ ] Disable directory listing in .htaccess
- [ ] Set proper file permissions (644 for PHP, 755 for dirs)
- [ ] Create and secure .env file
- [ ] Enable HTTPS/SSL
- [ ] Set up database backups
- [ ] Configure monitoring & alerting
- [ ] Test all APIs before going live
- [ ] Have rollback plan ready
- [ ] Set up 24/7 monitoring

## Support & Rollback

If issues occur:
1. Check `/backend/logs/security.log` for errors
2. Verify database connectivity
3. Check .env configuration
4. Review Apache error logs: `/var/log/apache2/error.log`
5. Rollback: `git checkout HEAD~1` and restart

---

**Last Updated:** March 28, 2026
**Status:** Production-Ready Infrastructure
