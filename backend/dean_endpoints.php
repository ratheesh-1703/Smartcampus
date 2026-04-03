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

function ensure_dean_tables(mysqli $conn): void {
    mysqli_query($conn, "
        CREATE TABLE IF NOT EXISTS dean_incidents (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            incident_type VARCHAR(180) NOT NULL,
            description TEXT DEFAULT NULL,
            severity VARCHAR(20) DEFAULT 'medium',
            status VARCHAR(40) DEFAULT 'Open',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    ");

    mysqli_query($conn, "
        CREATE TABLE IF NOT EXISTS dean_disciplinary_actions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            action_type VARCHAR(180) NOT NULL,
            reason TEXT DEFAULT NULL,
            status VARCHAR(40) DEFAULT 'Active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    ");

    mysqli_query($conn, "
        CREATE TABLE IF NOT EXISTS dean_policy_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(220) NOT NULL,
            description TEXT DEFAULT NULL,
            status VARCHAR(40) DEFAULT 'Submitted',
            requested_by INT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    ");

    mysqli_query($conn, "
        CREATE TABLE IF NOT EXISTS dean_notices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(220) NOT NULL,
            body TEXT DEFAULT NULL,
            priority VARCHAR(30) DEFAULT 'Normal',
            status VARCHAR(30) DEFAULT 'Active',
            posted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    ");

    mysqli_query($conn, "
        CREATE TABLE IF NOT EXISTS student_affairs_counseling (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            topic VARCHAR(220) DEFAULT NULL,
            notes TEXT DEFAULT NULL,
            session_date DATE DEFAULT NULL,
            status VARCHAR(30) DEFAULT 'Scheduled',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    ");
}

$action = isset($_GET['action']) ? trim((string)$_GET['action']) : '';
if ($action === '') {
    json_reply(['status' => false, 'message' => 'action is required'], 400);
}

ensure_dean_tables($conn);

switch ($action) {
    case 'get_incidents':
        $incidents = [];
        $query = mysqli_query($conn, "
            SELECT di.*, s.name, s.reg_no
            FROM dean_incidents di
            LEFT JOIN students s ON s.id = di.student_id
            ORDER BY di.updated_at DESC, di.id DESC
        ");
        if ($query) {
            while ($row = mysqli_fetch_assoc($query)) {
                $incidents[] = $row;
            }
        }
        json_reply(['status' => true, 'incidents' => $incidents]);

    case 'add_incident':
    case 'update_incident':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_reply(['status' => false, 'message' => 'POST required'], 405);
        }
        $input = get_input();
        $id = (int)($input['id'] ?? 0);
        $studentId = (int)($input['student_id'] ?? 0);
        $type = trim((string)($input['incident_type'] ?? ''));
        $desc = trim((string)($input['description'] ?? ''));
        $severity = trim((string)($input['severity'] ?? 'medium'));
        $status = trim((string)($input['status'] ?? 'Open'));

        if ($action === 'add_incident') {
            if ($studentId <= 0 || $type === '') {
                json_reply(['status' => false, 'message' => 'student_id and incident_type are required'], 400);
            }
            $stmt = mysqli_prepare($conn, 'INSERT INTO dean_incidents (student_id, incident_type, description, severity, status) VALUES (?, ?, ?, ?, ?)');
            if ($stmt) {
                mysqli_stmt_bind_param($stmt, 'issss', $studentId, $type, $desc, $severity, $status);
                mysqli_stmt_execute($stmt);
                mysqli_stmt_close($stmt);
            }
            json_reply(['status' => true, 'message' => 'Incident added']);
        }

        if ($id <= 0) {
            json_reply(['status' => false, 'message' => 'id is required'], 400);
        }
        $stmt = mysqli_prepare($conn, 'UPDATE dean_incidents SET student_id = ?, incident_type = ?, description = ?, severity = ?, status = ? WHERE id = ?');
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'issssi', $studentId, $type, $desc, $severity, $status, $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
        json_reply(['status' => true, 'message' => 'Incident updated']);

    case 'delete_incident':
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            json_reply(['status' => false, 'message' => 'id is required'], 400);
        }
        $stmt = mysqli_prepare($conn, 'DELETE FROM dean_incidents WHERE id = ?');
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'i', $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
        json_reply(['status' => true, 'message' => 'Incident deleted']);

    case 'get_disciplinary_actions':
        $actions = [];
        $query = mysqli_query($conn, "
            SELECT da.*, s.name, s.reg_no
            FROM dean_disciplinary_actions da
            LEFT JOIN students s ON s.id = da.student_id
            ORDER BY da.updated_at DESC, da.id DESC
        ");
        if ($query) {
            while ($row = mysqli_fetch_assoc($query)) {
                $actions[] = $row;
            }
        }
        json_reply(['status' => true, 'actions' => $actions]);

    case 'record_disciplinary_action':
    case 'update_disciplinary_action':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_reply(['status' => false, 'message' => 'POST required'], 405);
        }
        $input = get_input();
        $id = (int)($input['id'] ?? 0);
        $studentId = (int)($input['student_id'] ?? 0);
        $actionType = trim((string)($input['action_type'] ?? ''));
        $reason = trim((string)($input['reason'] ?? ''));
        $status = trim((string)($input['status'] ?? 'Active'));

        if ($action === 'record_disciplinary_action') {
            if ($studentId <= 0 || $actionType === '') {
                json_reply(['status' => false, 'message' => 'student_id and action_type are required'], 400);
            }
            $stmt = mysqli_prepare($conn, 'INSERT INTO dean_disciplinary_actions (student_id, action_type, reason, status) VALUES (?, ?, ?, ?)');
            if ($stmt) {
                mysqli_stmt_bind_param($stmt, 'isss', $studentId, $actionType, $reason, $status);
                mysqli_stmt_execute($stmt);
                mysqli_stmt_close($stmt);
            }
            json_reply(['status' => true, 'message' => 'Disciplinary action recorded']);
        }

        if ($id <= 0) {
            json_reply(['status' => false, 'message' => 'id is required'], 400);
        }
        $stmt = mysqli_prepare($conn, 'UPDATE dean_disciplinary_actions SET student_id = ?, action_type = ?, reason = ?, status = ? WHERE id = ?');
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'isssi', $studentId, $actionType, $reason, $status, $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
        json_reply(['status' => true, 'message' => 'Disciplinary action updated']);

    case 'delete_disciplinary_action':
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            json_reply(['status' => false, 'message' => 'id is required'], 400);
        }
        $stmt = mysqli_prepare($conn, 'DELETE FROM dean_disciplinary_actions WHERE id = ?');
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'i', $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
        json_reply(['status' => true, 'message' => 'Disciplinary action deleted']);

    case 'get_student_affairs_counseling':
        $rows = [];
        $query = mysqli_query($conn, "
            SELECT c.*, s.name AS student_name, s.reg_no
            FROM student_affairs_counseling c
            LEFT JOIN students s ON s.id = c.student_id
            ORDER BY c.session_date DESC, c.id DESC
            LIMIT 100
        ");
        if ($query) {
            while ($row = mysqli_fetch_assoc($query)) {
                $rows[] = $row;
            }
        }
        json_reply(['status' => true, 'counseling' => $rows]);

    case 'get_dean_reports':
        $totalStudents = 0;
        $recentIncidents = 0;
        $activeCases = 0;
        $pendingSos = 0;

        $q = mysqli_query($conn, 'SELECT COUNT(*) AS c FROM students');
        if ($q) {
            $r = mysqli_fetch_assoc($q);
            $totalStudents = (int)($r['c'] ?? 0);
        }

        $q = mysqli_query($conn, "SELECT COUNT(*) AS c FROM dean_incidents WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)");
        if ($q) {
            $r = mysqli_fetch_assoc($q);
            $recentIncidents = (int)($r['c'] ?? 0);
        }

        $q = mysqli_query($conn, "SELECT COUNT(*) AS c FROM dean_disciplinary_actions WHERE LOWER(COALESCE(status,'active')) IN ('active','open','under review')");
        if ($q) {
            $r = mysqli_fetch_assoc($q);
            $activeCases = (int)($r['c'] ?? 0);
        }

        if (table_exists($conn, 'sos_alerts')) {
            $q = mysqli_query($conn, "SELECT COUNT(*) AS c FROM sos_alerts WHERE LOWER(COALESCE(status,'pending')) IN ('pending','open')");
            if ($q) {
                $r = mysqli_fetch_assoc($q);
                $pendingSos = (int)($r['c'] ?? 0);
            }
        }

        json_reply([
            'status' => true,
            'report' => [
                'total_students' => $totalStudents,
                'recent_incidents' => $recentIncidents,
                'active_disciplinary_cases' => $activeCases,
                'pending_sos_alerts' => $pendingSos
            ]
        ]);

    case 'get_policy_requests':
        $statusFilter = trim((string)($_GET['status'] ?? ''));
        $where = '1=1';
        if ($statusFilter !== '') {
            $statusEsc = mysqli_real_escape_string($conn, $statusFilter);
            $where = "status = '$statusEsc'";
        }

        $rows = [];
        $query = mysqli_query($conn, "
            SELECT pr.*, u.name AS requested_by_name
            FROM dean_policy_requests pr
            LEFT JOIN users u ON u.id = pr.requested_by
            WHERE $where
            ORDER BY pr.updated_at DESC, pr.id DESC
        ");
        if ($query) {
            while ($row = mysqli_fetch_assoc($query)) {
                $rows[] = $row;
            }
        }
        json_reply(['status' => true, 'requests' => $rows]);

    case 'add_policy_request':
    case 'update_policy_request':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_reply(['status' => false, 'message' => 'POST required'], 405);
        }
        $input = get_input();
        $id = (int)($input['id'] ?? 0);
        $title = trim((string)($input['title'] ?? ''));
        $description = trim((string)($input['description'] ?? ''));
        $status = trim((string)($input['status'] ?? 'Submitted'));

        if ($title === '') {
            json_reply(['status' => false, 'message' => 'title is required'], 400);
        }

        if ($action === 'add_policy_request') {
            $stmt = mysqli_prepare($conn, 'INSERT INTO dean_policy_requests (title, description, status) VALUES (?, ?, ?)');
            if ($stmt) {
                mysqli_stmt_bind_param($stmt, 'sss', $title, $description, $status);
                mysqli_stmt_execute($stmt);
                mysqli_stmt_close($stmt);
            }
            json_reply(['status' => true, 'message' => 'Policy request added']);
        }

        if ($id <= 0) {
            json_reply(['status' => false, 'message' => 'id is required'], 400);
        }
        $stmt = mysqli_prepare($conn, 'UPDATE dean_policy_requests SET title = ?, description = ?, status = ? WHERE id = ?');
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'sssi', $title, $description, $status, $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
        json_reply(['status' => true, 'message' => 'Policy request updated']);

    case 'delete_policy_request':
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            json_reply(['status' => false, 'message' => 'id is required'], 400);
        }
        $stmt = mysqli_prepare($conn, 'DELETE FROM dean_policy_requests WHERE id = ?');
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'i', $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
        json_reply(['status' => true, 'message' => 'Policy request deleted']);

    case 'get_notices':
        $rows = [];
        $query = mysqli_query($conn, 'SELECT * FROM dean_notices ORDER BY posted_at DESC, id DESC');
        if ($query) {
            while ($row = mysqli_fetch_assoc($query)) {
                $rows[] = $row;
            }
        }
        json_reply(['status' => true, 'notices' => $rows]);

    case 'add_notice':
    case 'update_notice':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_reply(['status' => false, 'message' => 'POST required'], 405);
        }
        $input = get_input();
        $id = (int)($input['id'] ?? 0);
        $title = trim((string)($input['title'] ?? ''));
        $body = trim((string)($input['body'] ?? ''));
        $priority = trim((string)($input['priority'] ?? 'Normal'));
        $status = trim((string)($input['status'] ?? 'Active'));

        if ($title === '') {
            json_reply(['status' => false, 'message' => 'title is required'], 400);
        }

        if ($action === 'add_notice') {
            $stmt = mysqli_prepare($conn, 'INSERT INTO dean_notices (title, body, priority, status) VALUES (?, ?, ?, ?)');
            if ($stmt) {
                mysqli_stmt_bind_param($stmt, 'ssss', $title, $body, $priority, $status);
                mysqli_stmt_execute($stmt);
                mysqli_stmt_close($stmt);
            }
            json_reply(['status' => true, 'message' => 'Notice added']);
        }

        if ($id <= 0) {
            json_reply(['status' => false, 'message' => 'id is required'], 400);
        }
        $stmt = mysqli_prepare($conn, 'UPDATE dean_notices SET title = ?, body = ?, priority = ?, status = ? WHERE id = ?');
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'ssssi', $title, $body, $priority, $status, $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
        json_reply(['status' => true, 'message' => 'Notice updated']);

    case 'delete_notice':
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            json_reply(['status' => false, 'message' => 'id is required'], 400);
        }
        $stmt = mysqli_prepare($conn, 'DELETE FROM dean_notices WHERE id = ?');
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'i', $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
        json_reply(['status' => true, 'message' => 'Notice deleted']);

    default:
        json_reply(['status' => false, 'message' => 'Unknown action'], 404);
}
?>
