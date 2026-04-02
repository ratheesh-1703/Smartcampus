<?php
header('Content-Type: application/json');
http_response_code(501);
echo json_encode([
    'success' => false,
    'message' => 'Placeholder for restored missing file: approve_class_subject_plan.php',
]);
?>
