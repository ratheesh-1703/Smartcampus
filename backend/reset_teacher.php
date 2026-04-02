<?php
include "config.php";

$username = "teacher1";        // <-- change if different
$newPass = "teacher123";       // password you want

$hash = password_hash($newPass, PASSWORD_DEFAULT);

mysqli_query($conn,
"UPDATE users SET password='$hash' WHERE username='$username' AND role='teacher'");

echo "Teacher password reset successfully";
?>
