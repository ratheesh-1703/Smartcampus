<?php
include "config.php";

$newPass = password_hash("admin123", PASSWORD_BCRYPT);

mysqli_query($conn, "
    UPDATE users 
    SET password='$newPass', role='admin'
    WHERE username='admin'
");

echo "Admin password reset to admin123";
