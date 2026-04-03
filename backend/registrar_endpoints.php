<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

include "config.php";

function json_reply(array $payload, int $statusCode = 200): void {
    http_response_code($statusCode);
    echo json_encode($payload);
    exit;
}

function get_input(): array {
    $input = json_decode(file_get_contents("php://input"), true);
    if (!is_array($input)) {
        $input = $_POST;
    }
    return is_array($input) ? $input : [];
}

function table_exists(mysqli $conn, string $table): bool {
    $tableEsc = mysqli_real_escape_string($conn, $table);
    $result = mysqli_query($conn, "SHOW TABLES LIKE '$tableEsc'");
    return $result && mysqli_num_rows($result) > 0;
}

function ensure_registrar_tables(mysqli $conn): void {
    mysqli_query($conn, "
        CREATE TABLE IF NOT EXISTS admission_applications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            applicant_name VARCHAR(160) NOT NULL,
            reg_no VARCHAR(80) DEFAULT NULL,
            department VARCHAR(120) DEFAULT NULL,
            year_of_study VARCHAR(30) DEFAULT NULL,
            status VARCHAR(40) DEFAULT 'Pending',
            submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    ");

    // Keep compatibility with older restored schemas by adding any missing columns.
    mysqli_query($conn, "ALTER TABLE admission_applications ADD COLUMN IF NOT EXISTS applicant_name VARCHAR(160) NOT NULL DEFAULT ''");
    mysqli_query($conn, "ALTER TABLE admission_applications ADD COLUMN IF NOT EXISTS reg_no VARCHAR(80) NULL");
    mysqli_query($conn, "ALTER TABLE admission_applications ADD COLUMN IF NOT EXISTS department VARCHAR(120) NULL");
    mysqli_query($conn, "ALTER TABLE admission_applications ADD COLUMN IF NOT EXISTS year_of_study VARCHAR(30) NULL");
    mysqli_query($conn, "ALTER TABLE admission_applications ADD COLUMN IF NOT EXISTS status VARCHAR(40) DEFAULT 'Pending'");
    mysqli_query($conn, "ALTER TABLE admission_applications ADD COLUMN IF NOT EXISTS submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP");
    mysqli_query($conn, "ALTER TABLE admission_applications ADD COLUMN IF NOT EXISTS updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

    mysqli_query($conn, "
        CREATE TABLE IF NOT EXISTS certificate_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            certificate_type VARCHAR(120) NOT NULL,
            purpose VARCHAR(255) DEFAULT NULL,
            status VARCHAR(40) DEFAULT 'Pending',
            requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    ");

    mysqli_query($conn, "
        CREATE TABLE IF NOT EXISTS id_card_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            reason VARCHAR(255) DEFAULT NULL,
            status VARCHAR(40) DEFAULT 'Pending',
            requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    ");
}

$action = isset($_GET['action']) ? trim((string)$_GET['action']) : '';
if ($action === '') {
    json_reply(['status' => false, 'message' => 'action is required'], 400);
}

ensure_registrar_tables($conn);

switch ($action) {
    case 'get_student_records':
        $department = trim((string)($_GET['department'] ?? ''));
        $year = trim((string)($_GET['year'] ?? ''));

        $conditions = [];
        if ($department !== '') {
            $depEsc = mysqli_real_escape_string($conn, $department);
            $conditions[] = "dept = '$depEsc'";
        }
        if ($year !== '') {
            $yearEsc = mysqli_real_escape_string($conn, $year);
            $conditions[] = "year = '$yearEsc'";
        }

        $where = count($conditions) ? ('WHERE ' . implode(' AND ', $conditions)) : '';
        $rows = [];
        $query = mysqli_query($conn, "
            SELECT id, reg_no, name, dept AS department, year, email, phone, created_at
            FROM students
            $where
            ORDER BY created_at DESC, id DESC
            LIMIT 500
        ");
        if ($query) {
            while ($row = mysqli_fetch_assoc($query)) {
                $rows[] = $row;
            }
        }
        json_reply(['status' => true, 'records' => $rows]);

    case 'update_student_record':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_reply(['status' => false, 'message' => 'POST required'], 405);
        }
        $input = get_input();
        $studentId = (int)($input['student_id'] ?? 0);
        $name = trim((string)($input['name'] ?? ''));
        $department = trim((string)($input['department'] ?? ''));
        $year = trim((string)($input['year'] ?? ''));
        $email = trim((string)($input['email'] ?? ''));
        $phone = trim((string)($input['phone'] ?? ''));

        if ($studentId <= 0) {
            json_reply(['status' => false, 'message' => 'student_id is required'], 400);
        }

        $stmt = mysqli_prepare($conn, 'UPDATE students SET name = COALESCE(NULLIF(?,""),name), dept = COALESCE(NULLIF(?,""),dept), year = COALESCE(NULLIF(?,""),year), email = COALESCE(NULLIF(?,""),email), phone = COALESCE(NULLIF(?,""),phone) WHERE id = ?');
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'sssssi', $name, $department, $year, $email, $phone, $studentId);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
        json_reply(['status' => true, 'message' => 'Student record updated']);

    case 'get_admissions':
    case 'get_admission_applications':
        $admissionYear = trim((string)($_GET['year'] ?? ''));

        $rows = [];
        if (table_exists($conn, 'admission_applications')) {
            $where = '';
            if ($admissionYear !== '') {
                $yearEsc = mysqli_real_escape_string($conn, $admissionYear);
                $where = "WHERE YEAR(submitted_at) = '$yearEsc'";
            }
            $query = mysqli_query($conn, "
                SELECT id, applicant_name, reg_no, department, year_of_study, status, submitted_at, updated_at
                FROM admission_applications
                $where
                ORDER BY submitted_at DESC, id DESC
            ");
            if ($query) {
                while ($row = mysqli_fetch_assoc($query)) {
                    $rows[] = $row;
                }
            }
        }

        if (!count($rows)) {
            $where = '';
            if ($admissionYear !== '') {
                $yearEsc = mysqli_real_escape_string($conn, $admissionYear);
                $where = "WHERE YEAR(created_at) = '$yearEsc'";
            }
            $query = mysqli_query($conn, "
                SELECT id, name AS applicant_name, reg_no, dept AS department, year AS year_of_study,
                       'Enrolled' AS status, created_at AS submitted_at, created_at AS updated_at
                FROM students
                $where
                ORDER BY created_at DESC, id DESC
                LIMIT 500
            ");
            if ($query) {
                while ($row = mysqli_fetch_assoc($query)) {
                    $rows[] = $row;
                }
            }
        }

        json_reply(['status' => true, 'admissions' => $rows]);

    case 'add_admission_application':
    case 'update_admission_application':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_reply(['status' => false, 'message' => 'POST required'], 405);
        }
        $input = get_input();
        $id = (int)($input['id'] ?? 0);
        $name = trim((string)($input['applicant_name'] ?? ''));
        $regNo = trim((string)($input['reg_no'] ?? ''));
        $department = trim((string)($input['department'] ?? ''));
        $yearOfStudy = trim((string)($input['year_of_study'] ?? ''));
        $status = trim((string)($input['status'] ?? 'Pending'));

        if ($name === '') {
            json_reply(['status' => false, 'message' => 'applicant_name is required'], 400);
        }

        if ($action === 'add_admission_application') {
            $stmt = mysqli_prepare($conn, 'INSERT INTO admission_applications (applicant_name, reg_no, department, year_of_study, status) VALUES (?, ?, ?, ?, ?)');
            if ($stmt) {
                mysqli_stmt_bind_param($stmt, 'sssss', $name, $regNo, $department, $yearOfStudy, $status);
                mysqli_stmt_execute($stmt);
                mysqli_stmt_close($stmt);
            }
            json_reply(['status' => true, 'message' => 'Admission application added']);
        }

        if ($id <= 0) {
            json_reply(['status' => false, 'message' => 'id is required'], 400);
        }
        $stmt = mysqli_prepare($conn, 'UPDATE admission_applications SET applicant_name = ?, reg_no = ?, department = ?, year_of_study = ?, status = ? WHERE id = ?');
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'sssssi', $name, $regNo, $department, $yearOfStudy, $status, $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
        json_reply(['status' => true, 'message' => 'Admission application updated']);

    case 'delete_admission_application':
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            json_reply(['status' => false, 'message' => 'id is required'], 400);
        }
        $stmt = mysqli_prepare($conn, 'DELETE FROM admission_applications WHERE id = ?');
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'i', $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
        json_reply(['status' => true, 'message' => 'Admission application deleted']);

    case 'get_academic_transcript':
        $studentId = (int)($_GET['student_id'] ?? 0);
        if ($studentId <= 0) {
            json_reply(['status' => false, 'message' => 'student_id is required'], 400);
        }

        $student = null;
        $stmt = mysqli_prepare($conn, 'SELECT id, reg_no, name, dept AS department, year FROM students WHERE id = ? LIMIT 1');
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'i', $studentId);
            mysqli_stmt_execute($stmt);
            $result = mysqli_stmt_get_result($stmt);
            if ($result) {
                $student = mysqli_fetch_assoc($result);
            }
            mysqli_stmt_close($stmt);
        }

        if (!$student) {
            json_reply(['status' => false, 'message' => 'Student not found'], 404);
        }

        $semesters = [];
        if (table_exists($conn, 'exam_marks')) {
            $query = mysqli_query($conn, "
                SELECT COALESCE(es.semester, 'N/A') AS semester,
                       ROUND(AVG(em.marks), 2) AS average_marks,
                       COUNT(*) AS subjects
                FROM exam_marks em
                LEFT JOIN exam_schedules es ON es.id = em.schedule_id
                WHERE em.student_id = {$studentId}
                GROUP BY COALESCE(es.semester, 'N/A')
                ORDER BY semester
            ");
            if ($query) {
                while ($row = mysqli_fetch_assoc($query)) {
                    $gpa = round(((float)$row['average_marks']) / 10.0, 2);
                    $semesters[] = [
                        'semester' => $row['semester'],
                        'subjects' => (int)$row['subjects'],
                        'average_marks' => (float)$row['average_marks'],
                        'gpa' => $gpa,
                        'result' => $gpa >= 5.0 ? 'Pass' : 'At Risk'
                    ];
                }
            }
        }

        $overallGpa = 0.0;
        if (count($semesters) > 0) {
            $sum = 0.0;
            foreach ($semesters as $s) {
                $sum += (float)$s['gpa'];
            }
            $overallGpa = round($sum / count($semesters), 2);
        }

        json_reply([
            'status' => true,
            'transcript' => [
                'student' => $student,
                'semesters' => $semesters,
                'overall_gpa' => $overallGpa,
                'generated_at' => date('Y-m-d H:i:s')
            ]
        ]);

    case 'get_certificate_requests':
        $rows = [];
        $query = mysqli_query($conn, "
            SELECT cr.*, s.name AS student_name, s.reg_no
            FROM certificate_requests cr
            LEFT JOIN students s ON s.id = cr.student_id
            ORDER BY cr.requested_at DESC, cr.id DESC
        ");
        if ($query) {
            while ($row = mysqli_fetch_assoc($query)) {
                $rows[] = $row;
            }
        }
        json_reply(['status' => true, 'certificate_requests' => $rows]);

    case 'add_certificate_request':
    case 'update_certificate_request':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_reply(['status' => false, 'message' => 'POST required'], 405);
        }
        $input = get_input();
        $id = (int)($input['id'] ?? 0);
        $studentId = (int)($input['student_id'] ?? 0);
        $type = trim((string)($input['certificate_type'] ?? ''));
        $purpose = trim((string)($input['purpose'] ?? ''));
        $status = trim((string)($input['status'] ?? 'Pending'));

        if ($studentId <= 0 || $type === '') {
            json_reply(['status' => false, 'message' => 'student_id and certificate_type are required'], 400);
        }

        if ($action === 'add_certificate_request') {
            $stmt = mysqli_prepare($conn, 'INSERT INTO certificate_requests (student_id, certificate_type, purpose, status) VALUES (?, ?, ?, ?)');
            if ($stmt) {
                mysqli_stmt_bind_param($stmt, 'isss', $studentId, $type, $purpose, $status);
                mysqli_stmt_execute($stmt);
                mysqli_stmt_close($stmt);
            }
            json_reply(['status' => true, 'message' => 'Certificate request added']);
        }

        if ($id <= 0) {
            json_reply(['status' => false, 'message' => 'id is required'], 400);
        }
        $stmt = mysqli_prepare($conn, 'UPDATE certificate_requests SET student_id = ?, certificate_type = ?, purpose = ?, status = ? WHERE id = ?');
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'isssi', $studentId, $type, $purpose, $status, $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
        json_reply(['status' => true, 'message' => 'Certificate request updated']);

    case 'delete_certificate_request':
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            json_reply(['status' => false, 'message' => 'id is required'], 400);
        }
        $stmt = mysqli_prepare($conn, 'DELETE FROM certificate_requests WHERE id = ?');
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'i', $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
        json_reply(['status' => true, 'message' => 'Certificate request deleted']);

    case 'get_id_card_requests':
        $rows = [];
        $query = mysqli_query($conn, "
            SELECT ir.*, s.name AS student_name, s.reg_no
            FROM id_card_requests ir
            LEFT JOIN students s ON s.id = ir.student_id
            ORDER BY ir.requested_at DESC, ir.id DESC
        ");
        if ($query) {
            while ($row = mysqli_fetch_assoc($query)) {
                $rows[] = $row;
            }
        }
        json_reply(['status' => true, 'id_card_requests' => $rows]);

    case 'add_id_card_request':
    case 'update_id_card_request':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_reply(['status' => false, 'message' => 'POST required'], 405);
        }
        $input = get_input();
        $id = (int)($input['id'] ?? 0);
        $studentId = (int)($input['student_id'] ?? 0);
        $reason = trim((string)($input['reason'] ?? ''));
        $status = trim((string)($input['status'] ?? 'Pending'));

        if ($studentId <= 0) {
            json_reply(['status' => false, 'message' => 'student_id is required'], 400);
        }

        if ($action === 'add_id_card_request') {
            $stmt = mysqli_prepare($conn, 'INSERT INTO id_card_requests (student_id, reason, status) VALUES (?, ?, ?)');
            if ($stmt) {
                mysqli_stmt_bind_param($stmt, 'iss', $studentId, $reason, $status);
                mysqli_stmt_execute($stmt);
                mysqli_stmt_close($stmt);
            }
            json_reply(['status' => true, 'message' => 'ID card request added']);
        }

        if ($id <= 0) {
            json_reply(['status' => false, 'message' => 'id is required'], 400);
        }
        $stmt = mysqli_prepare($conn, 'UPDATE id_card_requests SET student_id = ?, reason = ?, status = ? WHERE id = ?');
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'issi', $studentId, $reason, $status, $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
        json_reply(['status' => true, 'message' => 'ID card request updated']);

    case 'delete_id_card_request':
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            json_reply(['status' => false, 'message' => 'id is required'], 400);
        }
        $stmt = mysqli_prepare($conn, 'DELETE FROM id_card_requests WHERE id = ?');
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'i', $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
        json_reply(['status' => true, 'message' => 'ID card request deleted']);

    case 'get_registrar_metrics':
        $totalStudents = 0;
        $pendingAdmissions = 0;
        $pendingCertificates = 0;
        $pendingIdCards = 0;

        $q = mysqli_query($conn, 'SELECT COUNT(*) AS c FROM students');
        if ($q) {
            $r = mysqli_fetch_assoc($q);
            $totalStudents = (int)($r['c'] ?? 0);
        }

        $q = mysqli_query($conn, "SELECT COUNT(*) AS c FROM admission_applications WHERE LOWER(COALESCE(status,'pending')) IN ('pending','under review')");
        if ($q) {
            $r = mysqli_fetch_assoc($q);
            $pendingAdmissions = (int)($r['c'] ?? 0);
        }

        $q = mysqli_query($conn, "SELECT COUNT(*) AS c FROM certificate_requests WHERE LOWER(COALESCE(status,'pending')) IN ('pending','under review')");
        if ($q) {
            $r = mysqli_fetch_assoc($q);
            $pendingCertificates = (int)($r['c'] ?? 0);
        }

        $q = mysqli_query($conn, "SELECT COUNT(*) AS c FROM id_card_requests WHERE LOWER(COALESCE(status,'pending')) IN ('pending','under review')");
        if ($q) {
            $r = mysqli_fetch_assoc($q);
            $pendingIdCards = (int)($r['c'] ?? 0);
        }

        json_reply([
            'status' => true,
            'metrics' => [
                'total_students' => $totalStudents,
                'pending_admissions' => $pendingAdmissions,
                'pending_certificate_requests' => $pendingCertificates,
                'pending_id_card_requests' => $pendingIdCards
            ]
        ]);

    default:
        json_reply(['status' => false, 'message' => 'Unknown action'], 404);
}
?>
