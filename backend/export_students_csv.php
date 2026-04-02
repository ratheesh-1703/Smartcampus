<?php
include "config.php";

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename=students.csv');

$output = fopen('php://output', 'w');

fputcsv($output, [
    'Reg No','Name','Dept','Year','Admission Year','Phone','Email'
]);

$q = mysqli_query($conn,"
SELECT reg_no,name,dept,year,admission_year,student_phone,student_email
FROM students ORDER BY dept, reg_no
");

while($row = mysqli_fetch_assoc($q)){
    fputcsv($output, $row);
}

fclose($output);
exit;
?>
