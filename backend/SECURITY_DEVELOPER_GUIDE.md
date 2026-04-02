# SmartCampus Security Helpers - Developer Guide

## Quick Reference

### 1. Database Operations (DBHelper)

```php
include "config.php";

// SELECT multiple rows
$users = $db->select("SELECT id, name FROM users WHERE dept = ?", ["IT"], "s");

// SELECT single row
$user = $db->selectOne("SELECT * FROM users WHERE id = ?", [123], "i");

// COUNT query
$count = $db->count("SELECT COUNT(*) as total FROM users WHERE status = ?", ["active"], "s");

// INSERT (with auto-increment ID)
$result = $db->insertId(
    "INSERT INTO students (name, reg_no, dept) VALUES (?, ?, ?)",
    ["John", "CS2301", "CSE"],
    "sss"
);
echo "New ID: " . $result['id'];

// UPDATE / DELETE
$result = $db->execute(
    "UPDATE students SET name = ? WHERE id = ?",
    ["Jane", 123],
    "si"
);
echo "Rows affected: " . $result['affected'];

// Type hints: "s"=string, "i"=integer, "d"=double, "b"=BLOB
```

### 2. Input Validation (InputValidator)

```php
include "config.php";

try {
    // String validation
    $name = InputValidator::string($_POST['name'], 1, 100);
    
    // Integer validation
    $age = InputValidator::integer($_POST['age'], 1, 120);
    
    // Email validation
    $email = InputValidator::email($_POST['email']);
    
    // Phone validation
    $phone = InputValidator::phone($_POST['phone']);
    
    // Date validation
    $dob = InputValidator::date($_POST['dob']); // Returns YYYY-MM-DD
    
    // Enum/choice validation
    $role = InputValidator::enum($_POST['role'], ['student', 'teacher', 'admin']);
    
    // File upload validation
    InputValidator::imageFile($_FILES['photo'], 5000); // 5MB limit
    
    // Required field check
    $username = InputValidator::required($_POST['username'], 'Username');
    
} catch (Exception $e) {
    // Validation failed
    http_response_code(400);
    echo json_encode(["status" => false, "message" => $e->getMessage()]);
    exit;
}
```

### 3. Security Functions (SecurityHelper)

```php
include "config.php";

// Rate limiting
if(!SecurityHelper::checkRateLimit('api_endpoint', 100, 60)) {
    http_response_code(429);
    echo json_encode(["status" => false, "message" => "Too many requests"]);
    exit;
}

// Password hashing
$hashedPassword = SecurityHelper::hashPassword($plainPassword);

// Password verification
if(SecurityHelper::verifyPassword($submittedPassword, $hashedPassword)) {
    // Password matches
}

// Generate secure token
$token = SecurityHelper::generateToken(32);

// Log security events
SecurityHelper::logSecurityEvent('FAILED_LOGIN', [
    'username' => $username,
    'reason' => 'Invalid password'
]);

// Error response (generic, no info leak)
SecurityHelper::errorResponse("Unable to process request", 500);

// Success response
SecurityHelper::successResponse([
    'user_id' => 123,
    'name' => 'John'
], "Login successful");
```

---

## Complete Secure API Example

```php
<?php
include "config.php";

try {
    // 1. Check rate limit
    if(!SecurityHelper::checkRateLimit('user_endpoint', 100, 60)) {
        http_response_code(429);
        echo json_encode(["status" => false, "message" => "Rate limited"]);
        exit;
    }
    
    // 2. Get and validate input
    $data = json_decode(file_get_contents("php://input"), true);
    
    if(!$data) {
        throw new Exception("Invalid JSON");
    }
    
    // Validate inputs
    $userId = InputValidator::integer($data['user_id'] ?? null, 1);
    $email = InputValidator::email($data['email'] ?? null);
    
    // 3. Database query with prepared statement
    $user = $db->selectOne(
        "SELECT id, name, email FROM users WHERE id = ? AND status = ?",
        [$userId, 'active'],
        "is"
    );
    
    if(!$user) {
        throw new Exception("User not found");
    }
    
    // 4. Update with prepared statement
    $result = $db->execute(
        "UPDATE users SET email = ? WHERE id = ?",
        [$email, $userId],
        "si"
    );
    
    // 5. Return safe response
    echo json_encode([
        "status" => true,
        "message" => "User updated successfully",
        "user_id" => intval($user['id']),
        "name" => htmlspecialchars($user['name'])
    ]);
    
} catch (Exception $e) {
    // 6. Secure error handling
    SecurityHelper::logSecurityEvent('USER_UPDATE_ERROR', [
        'error' => $e->getMessage()
    ]);
    
    http_response_code(500);
    echo json_encode([
        "status" => false,
        "message" => "An error occurred"
    ]);
}
?>
```

---

## Common Patterns

### Login/Authentication
```php
// 1. Validate input
$username = InputValidator::string($_POST['username'], 1, 50);
$password = InputValidator::required($_POST['password'], 'Password');

// 2. Find user (prepared statement)
$user = $db->selectOne(
    "SELECT id, password_hash FROM users WHERE username = ? LIMIT 1",
    [$username],
    "s"
);

// 3. Verify password
if($user && SecurityHelper::verifyPassword($password, $user['password_hash'])) {
    // Login success
    $_SESSION['user_id'] = $user['id'];
} else {
    // Log failed attempt
    SecurityHelper::logSecurityEvent('FAILED_LOGIN', ['username' => $username]);
    throw new Exception("Invalid credentials");
}
```

### File Upload (Photo)
```php
// 1. Validate file
InputValidator::imageFile($_FILES['photo'], 5000); // 5MB

// 2. Validate user ID
$studentId = InputValidator::integer($_POST['id'], 1);

// 3. Generate safe filename
$ext = strtolower(pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION));
$filename = "student_" . $studentId . "_" . time() . "." . $ext;
$uploadPath = "uploads/students/" . $filename;

// 4. Move file
if(!move_uploaded_file($_FILES['photo']['tmp_name'], $uploadPath)) {
    throw new Exception("Upload failed");
}

// 5. Update database (prepared statement)
$db->execute(
    "UPDATE students SET photo = ? WHERE id = ?",
    [$filename, $studentId],
    "si"
);
```

### List with Filters
```php
// Build safe query with prepared statements
$query = "SELECT id, name, email FROM users WHERE 1=1";
$params = [];
$types = "";

// Add filters conditionally
if(isset($dept) && !empty($dept)) {
    $query .= " AND dept = ?";
    $params[] = $dept;
    $types .= "s";
}

if(isset($year) && !empty($year)) {
    $query .= " AND year = ?";
    $params[] = $year;
    $types .= "i";
}

// Execute safe query
$users = $db->select($query, $params, $types);
```

---

## Type String Reference

Use the correct type string for `bind_param()`:

| Type | Description |
|------|-------------|
| `i` | Integer |
| `s` | String |
| `d` | Double/Float |
| `b` | BLOB (binary) |

```php
// Example: Update string, integer, double
$db->execute(
    "UPDATE products SET name = ?, stock = ?, price = ? WHERE id = ?",
    [$name, $stock, $price, $id],
    "ssdi" // name(s), stock(d - wait no, int), price(d), id(i)
);

// Correct:
$db->execute(
    "UPDATE products SET name = ?, stock = ?, price = ? WHERE id = ?",
    [$name, $stock, $price, $id],
    "sidi" // name(s), stock(i), price(d), id(i)
);
```

---

## Error Messages Best Practices

### ❌ Bad - Information Leak
```php
echo json_encode([
    "error" => "Duplicate entry 'BSCIT23001' for key 'students.uq_students_reg_no'",
    "sql" => "INSERT INTO students..."
]);
// Attacker sees database structure!
```

### ✅ Good - Generic Message
```php
http_response_code(400);
echo json_encode([
    "status" => false,
    "message" => "Unable to create student record"
]);

// Internally log details
SecurityHelper::logSecurityEvent('DUPLICATE_REG_NO', [
    'reg_no' => $regNo,
    'error' => $e->getMessage()
]);
```

---

## Testing Your API

```bash
# Test rate limiting (should allow 100, block 101+)
for i in {1..105}; do 
    curl -s http://localhost/backend/your_api.php | grep status
done

# Test SQL injection protection
curl "http://localhost/backend/api.php?id=1' OR '1'='1"
# Should return safe error, not database info

# Test input validation
curl -X POST -d '{"email":"not-an-email"}' http://localhost/backend/api.php
# Should reject with validation message

# Test with valid input
curl -X POST -d '{"id":123,"name":"John"}' http://localhost/backend/api.php
# Should succeed
```

---

## Migration Checklist

Convert existing APIs one by one:

- [ ] Replace `mysqli_query()` with `$db->select()`, `$db->count()`, `$db->execute()`
- [ ] Replace direct input with `InputValidator` methods
- [ ] Add rate limiting check
- [ ] Add try-catch error handling
- [ ] Use `SecurityHelper::errorResponse()` for errors
- [ ] Log security events for important actions
- [ ] Test with SQL injection payloads
- [ ] Test with rate limiting
- [ ] Test with invalid inputs

---

## Resources

- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
- **PHP Security:** https://www.php.net/manual/en/security.php
- **SQL Injection:** https://owasp.org/www-community/attacks/SQL_Injection
- **Input Validation:** https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html

---

**Questions?** Review the helper class files directly:
- `/lib/DBHelper.php` - All database operations
- `/lib/InputValidator.php` - Input validation rules
- `/lib/SecurityHelper.php` - Security functions
