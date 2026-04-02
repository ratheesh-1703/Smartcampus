<?php
include "config.php";

$username = 'admin';
$password = 'admin123';

$q = mysqli_query($conn, "SELECT * FROM users WHERE username='$username'");
$u = mysqli_fetch_assoc($q);

echo "<b>Stored Hash:</b><br>";
echo $u['password'] . "<br><br>";

if(password_verify($password, $u['password'])){
    echo "<h2 style='color:green'>PASSWORD MATCHED ✔</h2>";
} else {
    echo "<h2 style='color:red'>PASSWORD FAILED ❌</h2>";
}
?>
