<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

error_reporting(E_ALL);
ini_set("display_errors", 1);

include "config.php";

if(!isset($_FILES["file"])){
    echo json_encode([
        "status"=>false,
        "message"=>"No File"
    ]);
    exit;
}



$filename = $_FILES["file"]["tmp_name"];
$file = fopen($filename, "r");

$students = [];

// Read first row and detect header
$firstRow = fgetcsv($file, 10000, ",");
if ($firstRow !== false) {
    $firstCell = isset($firstRow[0]) ? trim((string)$firstRow[0]) : "";
    $isHeader = preg_match('/name|student|reg|department/i', $firstCell);
    if (!$isHeader) {
        $firstRow = array_pad($firstRow, 24, "");
        $students[] = [
            "name" => $firstRow[0],
            "gender" => $firstRow[1],
            "dob" => $firstRow[2],
            "blood" => $firstRow[3],
            "nationality" => $firstRow[4],
            "religion" => $firstRow[5],
            "category" => $firstRow[6],

            "dept" => strtoupper($firstRow[7]),
            "year" => $firstRow[8],
            "semester" => $firstRow[9],
            "section" => $firstRow[10],
            "admission_type" => $firstRow[11],
            "admission_year" => $firstRow[12],
            "status" => $firstRow[13],

            "student_phone" => $firstRow[14],
            "address" => $firstRow[15],
            "city" => $firstRow[16],
            "state" => $firstRow[17],
            "pincode" => $firstRow[18],

            "father_name" => $firstRow[19],
            "mother_name" => $firstRow[20],
            "parent_phone" => $firstRow[21],
            "parent_email" => $firstRow[22],
            "guardian" => $firstRow[23],
        ];
    }
}

// READ CSV → STORE TEMPORARILY
while(($row = fgetcsv($file, 10000, ",")) !== FALSE){

    // Skip empty lines
    if (!$row || (count($row) === 1 && trim((string)$row[0]) === "")) {
        continue;
    }

    // Handle semicolon-separated CSV rows
    if (count($row) === 1 && str_contains((string)$row[0], ';')) {
        $row = str_getcsv((string)$row[0], ';');
    }

    $row = array_pad($row, 24, "");

    $students[] = [
        "name" => $row[0],
        "gender" => $row[1],
        "dob" => $row[2],
        "blood" => $row[3],
        "nationality" => $row[4],
        "religion" => $row[5],
        "category" => $row[6],

        "dept" => strtoupper($row[7]),
        "year" => $row[8],
        "semester" => $row[9],
        "section" => $row[10],
        "admission_type" => $row[11],
        "admission_year" => $row[12],
        "status" => $row[13],

        "student_phone" => $row[14],
        "address" => $row[15],
        "city" => $row[16],
        "state" => $row[17],
        "pincode" => $row[18],

        "father_name" => $row[19],
        "mother_name" => $row[20],
        "parent_phone" => $row[21],
        "parent_email" => $row[22],
        "guardian" => $row[23],
    ];
}

fclose($file);

// SORT: Dept → Year → Name
usort($students, function($a,$b){

    if($a["dept"] == $b["dept"]){

        $ay = intval(preg_replace('/\D/', '', (string)$a["admission_year"]));
        $by = intval(preg_replace('/\D/', '', (string)$b["admission_year"]));

        if($ay === $by)
            return strcmp($a["name"], $b["name"]);

        return $ay <=> $by;
    }

    return strcmp($a["dept"], $b["dept"]);
});

$counter = [];
$inserted = 0;
$skipped = 0;

$esc = function($value) use ($conn) {
    return mysqli_real_escape_string($conn, (string)$value);
};

foreach($students as $s){

    $dept = strtoupper(trim((string)$s["dept"]));
    $dept = preg_replace('/[^A-Z0-9]/', '', $dept);
    $admissionYearDigits = preg_replace('/\D/', '', (string)$s["admission_year"]);
    $yr = strlen($admissionYearDigits) >= 2 ? substr($admissionYearDigits, -2) : date('y'); // 2025 -> 25

    if ($dept === '') {
        $skipped++;
        continue;
    }

    $key = $dept.$yr;

    // CONTINUE REG NO IF ALREADY EXISTING IN DB
    if(!isset($counter[$key])){

    $prefixForLike = addcslashes($dept.$yr, '%_');
    $prefixEscaped = mysqli_real_escape_string($conn, $prefixForLike);

    // Check last reg_no in students
    $q1 = mysqli_query($conn,"
        SELECT reg_no FROM students 
        WHERE reg_no LIKE '{$prefixEscaped}%' ESCAPE '\\\\'
        ORDER BY reg_no DESC LIMIT 1
    ");

    // Check last username in users also
    $q2 = mysqli_query($conn,"
        SELECT username FROM users
        WHERE username LIKE '{$prefixEscaped}%' ESCAPE '\\\\'
        ORDER BY username DESC LIMIT 1
    ");

    $max = 0;

    if(mysqli_num_rows($q1)){
        $last = mysqli_fetch_assoc($q1)['reg_no'];
        $max = max($max, intval(substr($last,-3)));
    }

    if(mysqli_num_rows($q2)){
        $lastUser = mysqli_fetch_assoc($q2)['username'];
        $max = max($max, intval(substr($lastUser,-3)));
    }

    $counter[$key] = $max + 1;
}

    while (true) {
        $num = str_pad($counter[$key], 3, "0", STR_PAD_LEFT);
        $regno = $dept.$yr.$num;
        $counter[$key]++;

        $regnoEsc = mysqli_real_escape_string($conn, $regno);
        $existsUser = mysqli_query($conn, "SELECT 1 FROM users WHERE username='$regnoEsc' LIMIT 1");
        $existsStudent = mysqli_query($conn, "SELECT 1 FROM students WHERE reg_no='$regnoEsc' LIMIT 1");

        $userTaken = $existsUser && mysqli_num_rows($existsUser) > 0;
        $studentTaken = $existsStudent && mysqli_num_rows($existsStudent) > 0;

        if (!$userTaken && !$studentTaken) {
            break;
        }
    }

    // AUTO EMAIL
    $student_email = $regno . "@mail.com";

    // PASSWORD = DOB (YYYYMMDD)
    $plainPass = str_replace("-", "", $s["dob"]);
    $passwordHash = password_hash($plainPass, PASSWORD_DEFAULT);

    $regnoEsc = $esc($regno);
    $passwordHashEsc = $esc($passwordHash);
    $studentEmailEsc = $esc($student_email);

    $nameEsc = $esc($s['name']);
    $genderEsc = $esc($s['gender']);
    $dobEsc = $esc($s['dob']);
    $bloodEsc = $esc($s['blood']);
    $nationalityEsc = $esc($s['nationality']);
    $religionEsc = $esc($s['religion']);
    $categoryEsc = $esc($s['category']);
    $deptEsc = $esc($dept);
    $yearEsc = $esc($s['year']);
    $semesterEsc = $esc($s['semester']);
    $sectionEsc = $esc($s['section']);
    $admissionTypeEsc = $esc($s['admission_type']);
    $admissionYearEsc = $esc($s['admission_year']);
    $statusEsc = $esc($s['status']);
    $studentPhoneEsc = $esc($s['student_phone']);
    $addressEsc = $esc($s['address']);
    $cityEsc = $esc($s['city']);
    $stateEsc = $esc($s['state']);
    $pincodeEsc = $esc($s['pincode']);
    $fatherNameEsc = $esc($s['father_name']);
    $motherNameEsc = $esc($s['mother_name']);
    $parentPhoneEsc = $esc($s['parent_phone']);
    $parentEmailEsc = $esc($s['parent_email']);
    $guardianEsc = $esc($s['guardian']);

    mysqli_begin_transaction($conn);
    try {
        mysqli_query($conn,"
          INSERT INTO users(username, password, role)
          VALUES('$regnoEsc', '$passwordHashEsc', 'student')
        ");

        $user_id = mysqli_insert_id($conn);

        mysqli_query($conn,"
        INSERT INTO students(
            user_id, reg_no, name, gender, dob, blood_group,
            nationality, religion, category,
            dept, year, semester, section,
            admission_type, admission_year, status,
            student_phone, student_email, address, city, state, pincode,
            father_name, mother_name, parent_phone, parent_email, guardian_name
        )
        VALUES(
            '$user_id','$regnoEsc','$nameEsc','$genderEsc','$dobEsc','$bloodEsc',
            '$nationalityEsc','$religionEsc','$categoryEsc',
            '$deptEsc','$yearEsc','$semesterEsc','$sectionEsc',
            '$admissionTypeEsc','$admissionYearEsc','$statusEsc',
            '$studentPhoneEsc','$studentEmailEsc','$addressEsc','$cityEsc','$stateEsc','$pincodeEsc',
            '$fatherNameEsc','$motherNameEsc','$parentPhoneEsc','$parentEmailEsc','$guardianEsc'
        )
        ");

        mysqli_commit($conn);
        $inserted++;
    } catch (Throwable $e) {
        mysqli_rollback($conn);
        $skipped++;
        continue;
    }
}

echo json_encode([
    "status"=>true,
    "message"=>"Students Imported Successfully",
    "total_inserted"=>$inserted,
    "skipped"=>$skipped
]);
?>
