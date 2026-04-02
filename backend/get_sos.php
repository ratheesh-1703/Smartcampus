<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include "config.php";

$hasStatus = mysqli_num_rows(mysqli_query($conn, "SHOW COLUMNS FROM sos_alerts LIKE 'status'")) > 0;

$where = "";
if ($hasStatus) {
  $where = "WHERE LOWER(COALESCE(a.status,'open')) NOT IN ('resolved','closed')";
}

$q = mysqli_query($conn,"
SELECT a.*, s.name, s.reg_no 
FROM sos_alerts a
JOIN students s ON a.student_id = s.id
$where
ORDER BY a.id DESC
");

$list = [];
while($row = mysqli_fetch_assoc($q)){
  $list[] = $row;
}

echo json_encode([
  "status"=>true,
  "alerts"=>$list
]);
?>
