<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
include "config.php";

$search = $_GET['search'] ?? "";
$dept = $_GET['dept'] ?? "";
$year = $_GET['year'] ?? "";

$page = $_GET['page'] ?? 1;
$limit = 10;
$offset = ($page - 1) * $limit;

$where = "WHERE 1";

if($search != ""){
    $where .= " AND (reg_no LIKE '%$search%' OR name LIKE '%$search%')";
}

if($dept != ""){
    $where .= " AND dept = '$dept'";
}

if($year != ""){
    $where .= " AND year = '$year'";
}

// total count
$countQuery = mysqli_query($conn, "SELECT COUNT(*) AS total FROM students $where");
$total = mysqli_fetch_assoc($countQuery)['total'];

// data query
$q = mysqli_query($conn,"
SELECT id, reg_no, name, dept, year, admission_year
FROM students
$where
ORDER BY dept, reg_no
LIMIT $limit OFFSET $offset
");

$data = [];
while($row = mysqli_fetch_assoc($q)){
    $data[] = $row;
}

echo json_encode([
    "status"=>true,
    "students"=>$data,
    "total"=>$total,
    "page"=>$page,
    "limit"=>$limit
]);
?>
