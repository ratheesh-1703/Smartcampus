<?php
require "config.php";
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

if(!$data){
    echo json_encode(["status"=>false, "message"=>"No input"]);
    exit;
}

$student_id = $data["student_id"];
$amount = $data["amount"];
$method = $data["method"];
$transaction = $data["transaction_id"];

// Insert into payment history
mysqli_query($conn,"
INSERT INTO fee_payments(student_id, amount, method, transaction_id)
VALUES('$student_id','$amount','$method','$transaction')
");

// Update main balance
mysqli_query($conn,"
UPDATE student_fees
SET paid_amount = paid_amount + '$amount',
    balance = total_amount - paid_amount,
    status = CASE 
        WHEN (total_amount - paid_amount) <= 0 THEN 'PAID'
        ELSE 'PENDING'
    END
WHERE student_id='$student_id'
");

echo json_encode([
 "status"=>true,
 "message"=>"Payment Recorded Successfully"
]);
?>
