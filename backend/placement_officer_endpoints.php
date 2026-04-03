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

function reply_json(array $payload, int $status = 200): void {
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

function req_data(): array {
    $raw = json_decode(file_get_contents("php://input"), true);
    if (!is_array($raw)) {
        $raw = $_POST;
    }
    return is_array($raw) ? $raw : [];
}

function ensure_placement_tables(mysqli $conn): void {
    mysqli_query($conn, "
        CREATE TABLE IF NOT EXISTS placement_job_postings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_name VARCHAR(180) NOT NULL,
            role_title VARCHAR(180) NOT NULL,
            description TEXT DEFAULT NULL,
            location VARCHAR(140) DEFAULT NULL,
            package_lpa DECIMAL(10,2) DEFAULT 0,
            eligibility_criteria VARCHAR(255) DEFAULT NULL,
            deadline DATE DEFAULT NULL,
            status VARCHAR(40) DEFAULT 'Open',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    ");

    mysqli_query($conn, "
        CREATE TABLE IF NOT EXISTS placement_students (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            company_name VARCHAR(180) NOT NULL,
            role_title VARCHAR(180) NOT NULL,
            package_lpa DECIMAL(10,2) DEFAULT 0,
            placement_date DATE DEFAULT NULL,
            status VARCHAR(40) DEFAULT 'Placed',
            notes TEXT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    ");

    mysqli_query($conn, "
        CREATE TABLE IF NOT EXISTS placement_companies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_name VARCHAR(180) NOT NULL,
            industry VARCHAR(120) DEFAULT NULL,
            contact_person VARCHAR(120) DEFAULT NULL,
            contact_email VARCHAR(180) DEFAULT NULL,
            contact_phone VARCHAR(50) DEFAULT NULL,
            status VARCHAR(40) DEFAULT 'Active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    ");

    mysqli_query($conn, "
        CREATE TABLE IF NOT EXISTS placement_internships (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_name VARCHAR(180) NOT NULL,
            role_title VARCHAR(180) NOT NULL,
            stipend DECIMAL(10,2) DEFAULT 0,
            duration_months INT DEFAULT 0,
            eligibility_criteria VARCHAR(255) DEFAULT NULL,
            deadline DATE DEFAULT NULL,
            status VARCHAR(40) DEFAULT 'Open',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    ");

    mysqli_query($conn, "
        CREATE TABLE IF NOT EXISTS placement_internship_applications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            internship_id INT NOT NULL,
            student_id INT NOT NULL,
            application_status VARCHAR(40) DEFAULT 'Applied',
            remarks TEXT DEFAULT NULL,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    ");
}

$action = isset($_GET['action']) ? trim((string)$_GET['action']) : '';
if ($action === '') {
    reply_json(['status' => false, 'message' => 'action is required'], 400);
}

ensure_placement_tables($conn);

switch ($action) {
    case 'get_job_postings':
        $rows = [];
        $q = mysqli_query($conn, 'SELECT * FROM placement_job_postings ORDER BY created_at DESC, id DESC');
        if ($q) {
            while ($row = mysqli_fetch_assoc($q)) {
                $rows[] = $row;
            }
        }
        reply_json(['status' => true, 'jobs' => $rows]);

    case 'add_job_posting':
    case 'update_job_posting':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            reply_json(['status' => false, 'message' => 'POST required'], 405);
        }
        $d = req_data();
        $id = (int)($d['id'] ?? 0);
        $company = trim((string)($d['company_name'] ?? ''));
        $role = trim((string)($d['role_title'] ?? ''));
        $description = trim((string)($d['description'] ?? ''));
        $location = trim((string)($d['location'] ?? ''));
        $package = (float)($d['package_lpa'] ?? 0);
        $elig = trim((string)($d['eligibility_criteria'] ?? ''));
        $deadline = trim((string)($d['deadline'] ?? ''));
        $status = trim((string)($d['status'] ?? 'Open'));

        if ($company === '' || $role === '') {
            reply_json(['status' => false, 'message' => 'company_name and role_title are required'], 400);
        }

        if ($action === 'add_job_posting') {
            $stmt = mysqli_prepare($conn, 'INSERT INTO placement_job_postings (company_name, role_title, description, location, package_lpa, eligibility_criteria, deadline, status) VALUES (?, ?, ?, ?, ?, ?, NULLIF(?, ""), ?)');
            if ($stmt) {
                mysqli_stmt_bind_param($stmt, 'ssssdsss', $company, $role, $description, $location, $package, $elig, $deadline, $status);
                mysqli_stmt_execute($stmt);
                mysqli_stmt_close($stmt);
            }
            reply_json(['status' => true, 'message' => 'Job posting added']);
        }

        if ($id <= 0) {
            reply_json(['status' => false, 'message' => 'id is required'], 400);
        }
        $stmt = mysqli_prepare($conn, 'UPDATE placement_job_postings SET company_name = ?, role_title = ?, description = ?, location = ?, package_lpa = ?, eligibility_criteria = ?, deadline = NULLIF(?, ""), status = ? WHERE id = ?');
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'ssssdsssi', $company, $role, $description, $location, $package, $elig, $deadline, $status, $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
        reply_json(['status' => true, 'message' => 'Job posting updated']);

    case 'delete_job_posting':
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            reply_json(['status' => false, 'message' => 'id is required'], 400);
        }
        $stmt = mysqli_prepare($conn, 'DELETE FROM placement_job_postings WHERE id = ?');
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'i', $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
        reply_json(['status' => true, 'message' => 'Job posting deleted']);

    case 'get_student_placements':
        $rows = [];
        $q = mysqli_query($conn, "
            SELECT p.*, s.name AS student_name, s.reg_no
            FROM placement_students p
            LEFT JOIN students s ON s.id = p.student_id
            ORDER BY p.placement_date DESC, p.id DESC
        ");
        if ($q) {
            while ($row = mysqli_fetch_assoc($q)) {
                $rows[] = $row;
            }
        }
        reply_json(['status' => true, 'placements' => $rows]);

    case 'record_placement':
    case 'update_placement':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            reply_json(['status' => false, 'message' => 'POST required'], 405);
        }
        $d = req_data();
        $id = (int)($d['id'] ?? 0);
        $studentId = (int)($d['student_id'] ?? 0);
        $company = trim((string)($d['company_name'] ?? ''));
        $role = trim((string)($d['role_title'] ?? ''));
        $package = (float)($d['package_lpa'] ?? 0);
        $placementDate = trim((string)($d['placement_date'] ?? ''));
        $status = trim((string)($d['status'] ?? 'Placed'));
        $notes = trim((string)($d['notes'] ?? ''));

        if ($studentId <= 0 || $company === '' || $role === '') {
            reply_json(['status' => false, 'message' => 'student_id, company_name and role_title are required'], 400);
        }

        if ($action === 'record_placement') {
            $stmt = mysqli_prepare($conn, 'INSERT INTO placement_students (student_id, company_name, role_title, package_lpa, placement_date, status, notes) VALUES (?, ?, ?, ?, NULLIF(?, ""), ?, ?)');
            if ($stmt) {
                mysqli_stmt_bind_param($stmt, 'issdsss', $studentId, $company, $role, $package, $placementDate, $status, $notes);
                mysqli_stmt_execute($stmt);
                mysqli_stmt_close($stmt);
            }
            reply_json(['status' => true, 'message' => 'Placement recorded']);
        }

        if ($id <= 0) {
            reply_json(['status' => false, 'message' => 'id is required'], 400);
        }
        $stmt = mysqli_prepare($conn, 'UPDATE placement_students SET student_id = ?, company_name = ?, role_title = ?, package_lpa = ?, placement_date = NULLIF(?, ""), status = ?, notes = ? WHERE id = ?');
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'issdsssi', $studentId, $company, $role, $package, $placementDate, $status, $notes, $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
        reply_json(['status' => true, 'message' => 'Placement updated']);

    case 'delete_placement':
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            reply_json(['status' => false, 'message' => 'id is required'], 400);
        }
        $stmt = mysqli_prepare($conn, 'DELETE FROM placement_students WHERE id = ?');
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'i', $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
        reply_json(['status' => true, 'message' => 'Placement deleted']);

    case 'get_companies':
        $rows = [];
        $q = mysqli_query($conn, 'SELECT * FROM placement_companies ORDER BY company_name ASC');
        if ($q) {
            while ($row = mysqli_fetch_assoc($q)) {
                $rows[] = $row;
            }
        }
        reply_json(['status' => true, 'companies' => $rows]);

    case 'add_company':
    case 'update_company':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            reply_json(['status' => false, 'message' => 'POST required'], 405);
        }
        $d = req_data();
        $id = (int)($d['id'] ?? 0);
        $name = trim((string)($d['company_name'] ?? ''));
        $industry = trim((string)($d['industry'] ?? ''));
        $contactPerson = trim((string)($d['contact_person'] ?? ''));
        $contactEmail = trim((string)($d['contact_email'] ?? ''));
        $contactPhone = trim((string)($d['contact_phone'] ?? ''));
        $status = trim((string)($d['status'] ?? 'Active'));

        if ($name === '') {
            reply_json(['status' => false, 'message' => 'company_name is required'], 400);
        }

        if ($action === 'add_company') {
            $stmt = mysqli_prepare($conn, 'INSERT INTO placement_companies (company_name, industry, contact_person, contact_email, contact_phone, status) VALUES (?, ?, ?, ?, ?, ?)');
            if ($stmt) {
                mysqli_stmt_bind_param($stmt, 'ssssss', $name, $industry, $contactPerson, $contactEmail, $contactPhone, $status);
                mysqli_stmt_execute($stmt);
                mysqli_stmt_close($stmt);
            }
            reply_json(['status' => true, 'message' => 'Company added']);
        }

        if ($id <= 0) {
            reply_json(['status' => false, 'message' => 'id is required'], 400);
        }
        $stmt = mysqli_prepare($conn, 'UPDATE placement_companies SET company_name = ?, industry = ?, contact_person = ?, contact_email = ?, contact_phone = ?, status = ? WHERE id = ?');
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'ssssssi', $name, $industry, $contactPerson, $contactEmail, $contactPhone, $status, $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
        reply_json(['status' => true, 'message' => 'Company updated']);

    case 'delete_company':
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            reply_json(['status' => false, 'message' => 'id is required'], 400);
        }
        $stmt = mysqli_prepare($conn, 'DELETE FROM placement_companies WHERE id = ?');
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'i', $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
        reply_json(['status' => true, 'message' => 'Company deleted']);

    case 'get_internships':
        $rows = [];
        $q = mysqli_query($conn, 'SELECT * FROM placement_internships ORDER BY created_at DESC, id DESC');
        if ($q) {
            while ($row = mysqli_fetch_assoc($q)) {
                $rows[] = $row;
            }
        }
        reply_json(['status' => true, 'internships' => $rows]);

    case 'add_internship':
    case 'update_internship':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            reply_json(['status' => false, 'message' => 'POST required'], 405);
        }
        $d = req_data();
        $id = (int)($d['id'] ?? 0);
        $company = trim((string)($d['company_name'] ?? ''));
        $role = trim((string)($d['role_title'] ?? ''));
        $stipend = (float)($d['stipend'] ?? 0);
        $duration = (int)($d['duration_months'] ?? 0);
        $elig = trim((string)($d['eligibility_criteria'] ?? ''));
        $deadline = trim((string)($d['deadline'] ?? ''));
        $status = trim((string)($d['status'] ?? 'Open'));

        if ($company === '' || $role === '') {
            reply_json(['status' => false, 'message' => 'company_name and role_title are required'], 400);
        }

        if ($action === 'add_internship') {
            $stmt = mysqli_prepare($conn, 'INSERT INTO placement_internships (company_name, role_title, stipend, duration_months, eligibility_criteria, deadline, status) VALUES (?, ?, ?, ?, ?, NULLIF(?, ""), ?)');
            if ($stmt) {
                mysqli_stmt_bind_param($stmt, 'ssdisss', $company, $role, $stipend, $duration, $elig, $deadline, $status);
                mysqli_stmt_execute($stmt);
                mysqli_stmt_close($stmt);
            }
            reply_json(['status' => true, 'message' => 'Internship added']);
        }

        if ($id <= 0) {
            reply_json(['status' => false, 'message' => 'id is required'], 400);
        }
        $stmt = mysqli_prepare($conn, 'UPDATE placement_internships SET company_name = ?, role_title = ?, stipend = ?, duration_months = ?, eligibility_criteria = ?, deadline = NULLIF(?, ""), status = ? WHERE id = ?');
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'ssdisssi', $company, $role, $stipend, $duration, $elig, $deadline, $status, $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
        reply_json(['status' => true, 'message' => 'Internship updated']);

    case 'delete_internship':
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            reply_json(['status' => false, 'message' => 'id is required'], 400);
        }
        $stmt = mysqli_prepare($conn, 'DELETE FROM placement_internships WHERE id = ?');
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'i', $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
        reply_json(['status' => true, 'message' => 'Internship deleted']);

    case 'get_internship_applications':
        $rows = [];
        $q = mysqli_query($conn, "
            SELECT ia.*, i.company_name, i.role_title, s.name AS student_name, s.reg_no
            FROM placement_internship_applications ia
            LEFT JOIN placement_internships i ON i.id = ia.internship_id
            LEFT JOIN students s ON s.id = ia.student_id
            ORDER BY ia.applied_at DESC, ia.id DESC
        ");
        if ($q) {
            while ($row = mysqli_fetch_assoc($q)) {
                $rows[] = $row;
            }
        }
        reply_json(['status' => true, 'applications' => $rows]);

    case 'add_internship_application':
    case 'update_internship_application':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            reply_json(['status' => false, 'message' => 'POST required'], 405);
        }
        $d = req_data();
        $id = (int)($d['id'] ?? 0);
        $internshipId = (int)($d['internship_id'] ?? 0);
        $studentId = (int)($d['student_id'] ?? 0);
        $applicationStatus = trim((string)($d['application_status'] ?? 'Applied'));
        $remarks = trim((string)($d['remarks'] ?? ''));

        if ($internshipId <= 0 || $studentId <= 0) {
            reply_json(['status' => false, 'message' => 'internship_id and student_id are required'], 400);
        }

        if ($action === 'add_internship_application') {
            $stmt = mysqli_prepare($conn, 'INSERT INTO placement_internship_applications (internship_id, student_id, application_status, remarks) VALUES (?, ?, ?, ?)');
            if ($stmt) {
                mysqli_stmt_bind_param($stmt, 'iiss', $internshipId, $studentId, $applicationStatus, $remarks);
                mysqli_stmt_execute($stmt);
                mysqli_stmt_close($stmt);
            }
            reply_json(['status' => true, 'message' => 'Internship application added']);
        }

        if ($id <= 0) {
            reply_json(['status' => false, 'message' => 'id is required'], 400);
        }
        $stmt = mysqli_prepare($conn, 'UPDATE placement_internship_applications SET internship_id = ?, student_id = ?, application_status = ?, remarks = ? WHERE id = ?');
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'iissi', $internshipId, $studentId, $applicationStatus, $remarks, $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
        reply_json(['status' => true, 'message' => 'Internship application updated']);

    case 'delete_internship_application':
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            reply_json(['status' => false, 'message' => 'id is required'], 400);
        }
        $stmt = mysqli_prepare($conn, 'DELETE FROM placement_internship_applications WHERE id = ?');
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'i', $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
        reply_json(['status' => true, 'message' => 'Internship application deleted']);

    case 'get_placement_stats':
        $stats = [
            'total_jobs' => 0,
            'open_jobs' => 0,
            'total_placements' => 0,
            'avg_package_lpa' => 0,
            'total_companies' => 0,
            'total_internships' => 0,
            'pending_applications' => 0
        ];

        $q = mysqli_query($conn, 'SELECT COUNT(*) AS c FROM placement_job_postings');
        if ($q) { $stats['total_jobs'] = (int)(mysqli_fetch_assoc($q)['c'] ?? 0); }

        $q = mysqli_query($conn, "SELECT COUNT(*) AS c FROM placement_job_postings WHERE LOWER(COALESCE(status,'open')) = 'open'");
        if ($q) { $stats['open_jobs'] = (int)(mysqli_fetch_assoc($q)['c'] ?? 0); }

        $q = mysqli_query($conn, 'SELECT COUNT(*) AS c, ROUND(AVG(package_lpa),2) AS a FROM placement_students');
        if ($q) {
            $r = mysqli_fetch_assoc($q);
            $stats['total_placements'] = (int)($r['c'] ?? 0);
            $stats['avg_package_lpa'] = (float)($r['a'] ?? 0);
        }

        $q = mysqli_query($conn, 'SELECT COUNT(*) AS c FROM placement_companies');
        if ($q) { $stats['total_companies'] = (int)(mysqli_fetch_assoc($q)['c'] ?? 0); }

        $q = mysqli_query($conn, 'SELECT COUNT(*) AS c FROM placement_internships');
        if ($q) { $stats['total_internships'] = (int)(mysqli_fetch_assoc($q)['c'] ?? 0); }

        $q = mysqli_query($conn, "SELECT COUNT(*) AS c FROM placement_internship_applications WHERE LOWER(COALESCE(application_status,'applied')) IN ('applied','pending')");
        if ($q) { $stats['pending_applications'] = (int)(mysqli_fetch_assoc($q)['c'] ?? 0); }

        reply_json(['status' => true, 'stats' => $stats]);

    default:
        reply_json(['status' => false, 'message' => 'Unknown action'], 404);
}
?>
