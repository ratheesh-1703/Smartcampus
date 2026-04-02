<?php
require "config.php";
header("Content-Type: application/json");

if(!isset($_GET["student_id"])){
    echo json_encode([
        "status"=>false,
        "message"=>"Student ID Missing"
    ]);
    exit;
}

$student_id = intval($_GET["student_id"]);

// Get fee summary
$q = mysqli_query($conn,"
SELECT * FROM student_fees
WHERE student_id='$student_id'
LIMIT 1
");

if(mysqli_num_rows($q)==0){
    echo json_encode([
        "status"=>false,
        "message"=>"No Fee Record Found"
    ]);
    exit;
}

$fee = mysqli_fetch_assoc($q);

// Get payment history
$p = mysqli_query($conn,"
SELECT amount, method, transaction_id, paid_on
FROM fee_payments
WHERE student_id='$student_id'
ORDER BY paid_on DESC
");

$history = [];
while($r = mysqli_fetch_assoc($p)){
    $history[] = $r;
}

echo json_encode([
 "status"=>true,
 "fee"=>$fee,
 "history"=>$history
]);
?>
