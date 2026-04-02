<?php
require_once("../auth/admin-session.php");
require_once("../config/db.php");

$result = mysqli_query($conn, "SELECT id, reg_no, name, role, department, year FROM users");

$users = [];

while ($row = mysqli_fetch_assoc($result)) {
    $users[] = $row;
}

echo json_encode($users);
