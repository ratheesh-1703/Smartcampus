<?php
include "config.php";

require 'vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

$spreadsheet = new Spreadsheet();
$sheet = $spreadsheet->getActiveSheet();

$sheet->setCellValue('A1', 'Reg No');
$sheet->setCellValue('B1', 'Name');
$sheet->setCellValue('C1', 'Dept');
$sheet->setCellValue('D1', 'Year');
$sheet->setCellValue('E1', 'Admission Year');
$sheet->setCellValue('F1', 'Phone');
$sheet->setCellValue('G1', 'Email');

$sql = mysqli_query($conn,"
SELECT reg_no, name, dept, year, admission_year, student_phone, student_email
FROM students ORDER BY dept, reg_no
");

$row = 2;

while($s = mysqli_fetch_assoc($sql)){
    $sheet->setCellValue('A'.$row, $s['reg_no']);
    $sheet->setCellValue('B'.$row, $s['name']);
    $sheet->setCellValue('C'.$row, $s['dept']);
    $sheet->setCellValue('D'.$row, $s['year']);
    $sheet->setCellValue('E'.$row, $s['admission_year']);
    $sheet->setCellValue('F'.$row, $s['student_phone']);
    $sheet->setCellValue('G'.$row, $s['student_email']);
    $row++;
}

$writer = new Xlsx($spreadsheet);
$fileName = "students_export.xlsx";

header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
header("Content-Disposition: attachment; filename=\"$fileName\"");
$writer->save("php://output");
exit;
?>
