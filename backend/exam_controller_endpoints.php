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

function ensure_exam_tables(mysqli $conn): void {
    mysqli_query($conn, "
        CREATE TABLE IF NOT EXISTS exam_schedules (
            id INT AUTO_INCREMENT PRIMARY KEY,
            exam_name VARCHAR(180) NOT NULL,
            subject VARCHAR(180) NOT NULL,
            dept VARCHAR(120) NOT NULL,
            year INT DEFAULT NULL,
            semester INT DEFAULT NULL,
            exam_date DATE NOT NULL,
            exam_time TIME DEFAULT NULL,
            duration INT DEFAULT NULL,
            status VARCHAR(30) DEFAULT 'Scheduled',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_exam_schedule_filters (dept, semester, year, exam_date)
        ) ENGINE=InnoDB
    ");

    mysqli_query($conn, "
        CREATE TABLE IF NOT EXISTS exam_marks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            exam_id INT NOT NULL,
            student_id INT NOT NULL,
            marks DECIMAL(6,2) DEFAULT 0,
            grade VARCHAR(10) DEFAULT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_exam_marks (exam_id, student_id),
            INDEX idx_exam_marks_exam (exam_id),
            INDEX idx_exam_marks_student (student_id)
        ) ENGINE=InnoDB
    ");

    mysqli_query($conn, "
        CREATE TABLE IF NOT EXISTS result_publishing (
            exam_id INT PRIMARY KEY,
            status VARCHAR(30) DEFAULT 'Draft',
            published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            published_by VARCHAR(120) DEFAULT NULL
        ) ENGINE=InnoDB
    ");

    mysqli_query($conn, "
        CREATE TABLE IF NOT EXISTS moderation_reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            exam_id INT NOT NULL,
            summary TEXT DEFAULT NULL,
            status VARCHAR(30) DEFAULT 'Draft',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_moderation_exam (exam_id)
        ) ENGINE=InnoDB
    ");

    mysqli_query($conn, "
        CREATE TABLE IF NOT EXISTS revaluation_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            exam_id INT NOT NULL,
            student_id INT NOT NULL,
            reason TEXT DEFAULT NULL,
            status VARCHAR(30) DEFAULT 'Pending',
            updated_marks DECIMAL(6,2) DEFAULT NULL,
            updated_grade VARCHAR(10) DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_revaluation_exam (exam_id),
            INDEX idx_revaluation_status (status)
        ) ENGINE=InnoDB
    ");
}

$action = isset($_GET["action"]) ? trim((string)$_GET["action"]) : "";
if ($action === "") {
    json_reply([
        "status" => false,
        "message" => "action is required"
    ], 400);
}

ensure_exam_tables($conn);

switch ($action) {
    case "get_exam_schedules":
        $dept = trim((string)($_GET["dept"] ?? ""));
        $semester = trim((string)($_GET["semester"] ?? ""));

        $where = ["1=1"];
        if ($dept !== "") {
            $deptEsc = mysqli_real_escape_string($conn, $dept);
            $where[] = "dept = '$deptEsc'";
        }
        if ($semester !== "") {
            $semEsc = mysqli_real_escape_string($conn, $semester);
            $where[] = "CAST(semester AS CHAR) = '$semEsc'";
        }

        $rows = [];
        $sql = "
            SELECT id, exam_name, subject, dept, year, semester, exam_date, exam_time, duration, status
            FROM exam_schedules
            WHERE " . implode(" AND ", $where) . "
            ORDER BY exam_date DESC, exam_time DESC, id DESC
        ";
        $query = mysqli_query($conn, $sql);
        if ($query) {
            while ($row = mysqli_fetch_assoc($query)) {
                $rows[] = $row;
            }
        }

        json_reply(["status" => true, "schedules" => $rows]);

    case "add_exam_schedule":
        if ($_SERVER["REQUEST_METHOD"] !== "POST") {
            json_reply(["status" => false, "message" => "POST required"], 405);
        }

        $input = get_input();
        $examName = trim((string)($input["exam_name"] ?? ""));
        $subject = trim((string)($input["subject"] ?? ""));
        $dept = trim((string)($input["dept"] ?? ""));
        $year = (int)($input["year"] ?? 0);
        $semester = (int)($input["semester"] ?? 0);
        $examDate = trim((string)($input["exam_date"] ?? ""));
        $examTime = trim((string)($input["exam_time"] ?? ""));
        $duration = (int)($input["duration"] ?? 0);

        if ($examName === "" || $subject === "" || $dept === "" || $examDate === "") {
            json_reply(["status" => false, "message" => "exam_name, subject, dept and exam_date are required"], 400);
        }

        $stmt = mysqli_prepare($conn, "
            INSERT INTO exam_schedules (exam_name, subject, dept, year, semester, exam_date, exam_time, duration)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, "sssiiisi", $examName, $subject, $dept, $year, $semester, $examDate, $examTime, $duration);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }

        json_reply(["status" => true, "message" => "Exam schedule added"]);

    case "update_exam_schedule":
        if ($_SERVER["REQUEST_METHOD"] !== "POST") {
            json_reply(["status" => false, "message" => "POST required"], 405);
        }

        $input = get_input();
        $id = (int)($input["id"] ?? 0);
        $examName = trim((string)($input["exam_name"] ?? ""));
        $subject = trim((string)($input["subject"] ?? ""));
        $dept = trim((string)($input["dept"] ?? ""));
        $year = (int)($input["year"] ?? 0);
        $semester = (int)($input["semester"] ?? 0);
        $examDate = trim((string)($input["exam_date"] ?? ""));
        $examTime = trim((string)($input["exam_time"] ?? ""));
        $duration = (int)($input["duration"] ?? 0);

        if ($id <= 0) {
            json_reply(["status" => false, "message" => "id is required"], 400);
        }

        $stmt = mysqli_prepare($conn, "
            UPDATE exam_schedules
            SET exam_name = ?, subject = ?, dept = ?, year = ?, semester = ?, exam_date = ?, exam_time = ?, duration = ?
            WHERE id = ?
        ");
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, "sssiiisii", $examName, $subject, $dept, $year, $semester, $examDate, $examTime, $duration, $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }

        json_reply(["status" => true, "message" => "Exam schedule updated"]);

    case "delete_exam_schedule":
        $id = (int)($_GET["id"] ?? 0);
        if ($id <= 0) {
            json_reply(["status" => false, "message" => "id is required"], 400);
        }

        $stmt = mysqli_prepare($conn, "DELETE FROM exam_schedules WHERE id = ?");
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, "i", $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }

        json_reply(["status" => true, "message" => "Exam schedule deleted"]);

    case "get_marks":
        $examId = (int)($_GET["exam_id"] ?? 0);
        if ($examId <= 0) {
            json_reply(["status" => false, "message" => "exam_id is required"], 400);
        }

        $marks = [];
        $stmt = mysqli_prepare($conn, "
            SELECT
                m.exam_id,
                m.student_id,
                m.marks,
                m.grade,
                s.reg_no,
                s.name
            FROM exam_marks m
            LEFT JOIN students s ON s.id = m.student_id
            WHERE m.exam_id = ?
            ORDER BY s.reg_no ASC, m.student_id ASC
        ");
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, "i", $examId);
            mysqli_stmt_execute($stmt);
            $res = mysqli_stmt_get_result($stmt);
            while ($res && ($row = mysqli_fetch_assoc($res))) {
                $marks[] = $row;
            }
            mysqli_stmt_close($stmt);
        }

        json_reply(["status" => true, "marks" => $marks]);

    case "upload_marks":
        if ($_SERVER["REQUEST_METHOD"] !== "POST") {
            json_reply(["status" => false, "message" => "POST required"], 405);
        }

        $input = get_input();
        $examId = (int)($input["exam_id"] ?? 0);
        $studentId = (int)($input["student_id"] ?? 0);
        $marks = (float)($input["marks"] ?? 0);
        $grade = trim((string)($input["grade"] ?? ""));

        if ($examId <= 0 || $studentId <= 0) {
            json_reply(["status" => false, "message" => "exam_id and student_id are required"], 400);
        }

        $stmt = mysqli_prepare($conn, "
            INSERT INTO exam_marks (exam_id, student_id, marks, grade)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE marks = VALUES(marks), grade = VALUES(grade), updated_at = NOW()
        ");
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, "iids", $examId, $studentId, $marks, $grade);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }

        json_reply(["status" => true, "message" => "Marks saved"]);

    case "delete_mark":
        $examId = (int)($_GET["exam_id"] ?? 0);
        $studentId = (int)($_GET["student_id"] ?? 0);
        if ($examId <= 0 || $studentId <= 0) {
            json_reply(["status" => false, "message" => "exam_id and student_id are required"], 400);
        }

        $stmt = mysqli_prepare($conn, "DELETE FROM exam_marks WHERE exam_id = ? AND student_id = ?");
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, "ii", $examId, $studentId);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }

        json_reply(["status" => true, "message" => "Mark deleted"]);

    case "get_results":
        $semester = trim((string)($_GET["semester"] ?? ""));
        $year = trim((string)($_GET["year"] ?? ""));

        $where = ["1=1"];
        if ($semester !== "") {
            $semEsc = mysqli_real_escape_string($conn, $semester);
            $where[] = "CAST(e.semester AS CHAR) = '$semEsc'";
        }
        if ($year !== "") {
            $yearEsc = mysqli_real_escape_string($conn, $year);
            $where[] = "CAST(e.year AS CHAR) = '$yearEsc'";
        }

        $results = [];
        $sql = "
            SELECT
                s.reg_no,
                s.name,
                e.exam_name,
                e.subject,
                m.marks,
                m.grade,
                e.semester,
                e.year
            FROM exam_marks m
            LEFT JOIN students s ON s.id = m.student_id
            LEFT JOIN exam_schedules e ON e.id = m.exam_id
            WHERE " . implode(" AND ", $where) . "
            ORDER BY e.exam_date DESC, s.reg_no ASC
        ";
        $query = mysqli_query($conn, $sql);
        if ($query) {
            while ($row = mysqli_fetch_assoc($query)) {
                $results[] = $row;
            }
        }

        json_reply(["status" => true, "results" => $results]);

    case "get_result_publishing":
        $rows = [];
        $query = mysqli_query($conn, "
            SELECT rp.exam_id, rp.status, rp.published_at, rp.published_by, e.exam_name
            FROM result_publishing rp
            LEFT JOIN exam_schedules e ON e.id = rp.exam_id
            ORDER BY rp.published_at DESC, rp.exam_id DESC
        ");
        if ($query) {
            while ($row = mysqli_fetch_assoc($query)) {
                $rows[] = $row;
            }
        }

        json_reply(["status" => true, "publishing" => $rows]);

    case "publish_results":
        if ($_SERVER["REQUEST_METHOD"] !== "POST") {
            json_reply(["status" => false, "message" => "POST required"], 405);
        }

        $input = get_input();
        $examId = (int)($input["exam_id"] ?? 0);
        $status = trim((string)($input["status"] ?? "Draft"));
        if ($examId <= 0) {
            json_reply(["status" => false, "message" => "exam_id is required"], 400);
        }
        if (!in_array($status, ["Published", "Draft"], true)) {
            $status = "Draft";
        }

        $publishedBy = "exam_controller";
        $stmt = mysqli_prepare($conn, "
            INSERT INTO result_publishing (exam_id, status, published_at, published_by)
            VALUES (?, ?, NOW(), ?)
            ON DUPLICATE KEY UPDATE status = VALUES(status), published_at = NOW(), published_by = VALUES(published_by)
        ");
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, "iss", $examId, $status, $publishedBy);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }

        json_reply(["status" => true, "message" => "Publishing status updated"]);

    case "get_moderation_reports":
        $reports = [];
        $query = mysqli_query($conn, "
            SELECT mr.id, mr.exam_id, mr.summary, mr.status, mr.created_at, mr.updated_at, e.exam_name
            FROM moderation_reports mr
            LEFT JOIN exam_schedules e ON e.id = mr.exam_id
            ORDER BY mr.updated_at DESC, mr.id DESC
        ");
        if ($query) {
            while ($row = mysqli_fetch_assoc($query)) {
                $reports[] = $row;
            }
        }
        json_reply(["status" => true, "reports" => $reports]);

    case "add_moderation_report":
        if ($_SERVER["REQUEST_METHOD"] !== "POST") {
            json_reply(["status" => false, "message" => "POST required"], 405);
        }

        $input = get_input();
        $examId = (int)($input["exam_id"] ?? 0);
        $summary = trim((string)($input["summary"] ?? ""));
        $status = trim((string)($input["status"] ?? "Draft"));
        if ($examId <= 0) {
            json_reply(["status" => false, "message" => "exam_id is required"], 400);
        }

        $stmt = mysqli_prepare($conn, "INSERT INTO moderation_reports (exam_id, summary, status) VALUES (?, ?, ?)");
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, "iss", $examId, $summary, $status);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
        json_reply(["status" => true, "message" => "Moderation report added"]);

    case "update_moderation_report":
        if ($_SERVER["REQUEST_METHOD"] !== "POST") {
            json_reply(["status" => false, "message" => "POST required"], 405);
        }

        $input = get_input();
        $id = (int)($input["id"] ?? 0);
        $examId = (int)($input["exam_id"] ?? 0);
        $summary = trim((string)($input["summary"] ?? ""));
        $status = trim((string)($input["status"] ?? "Draft"));
        if ($id <= 0) {
            json_reply(["status" => false, "message" => "id is required"], 400);
        }

        $stmt = mysqli_prepare($conn, "UPDATE moderation_reports SET exam_id = ?, summary = ?, status = ? WHERE id = ?");
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, "issi", $examId, $summary, $status, $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
        json_reply(["status" => true, "message" => "Moderation report updated"]);

    case "delete_moderation_report":
        $id = (int)($_GET["id"] ?? 0);
        if ($id <= 0) {
            json_reply(["status" => false, "message" => "id is required"], 400);
        }

        $stmt = mysqli_prepare($conn, "DELETE FROM moderation_reports WHERE id = ?");
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, "i", $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
        json_reply(["status" => true, "message" => "Moderation report deleted"]);

    case "get_revaluation_requests":
        $examId = trim((string)($_GET["exam_id"] ?? ""));
        $status = trim((string)($_GET["status"] ?? ""));

        $where = ["1=1"];
        if ($examId !== "") {
            $examEsc = mysqli_real_escape_string($conn, $examId);
            $where[] = "CAST(rr.exam_id AS CHAR) = '$examEsc'";
        }
        if ($status !== "") {
            $statusEsc = mysqli_real_escape_string($conn, $status);
            $where[] = "rr.status = '$statusEsc'";
        }

        $requests = [];
        $sql = "
            SELECT
                rr.id,
                rr.exam_id,
                rr.student_id,
                rr.reason,
                rr.status,
                rr.updated_marks,
                rr.updated_grade,
                rr.created_at,
                rr.updated_at,
                e.exam_name,
                s.reg_no,
                s.name
            FROM revaluation_requests rr
            LEFT JOIN exam_schedules e ON e.id = rr.exam_id
            LEFT JOIN students s ON s.id = rr.student_id
            WHERE " . implode(" AND ", $where) . "
            ORDER BY rr.updated_at DESC, rr.id DESC
        ";
        $query = mysqli_query($conn, $sql);
        if ($query) {
            while ($row = mysqli_fetch_assoc($query)) {
                $requests[] = $row;
            }
        }
        json_reply(["status" => true, "requests" => $requests]);

    case "add_revaluation_request":
        if ($_SERVER["REQUEST_METHOD"] !== "POST") {
            json_reply(["status" => false, "message" => "POST required"], 405);
        }

        $input = get_input();
        $examId = (int)($input["exam_id"] ?? 0);
        $studentId = (int)($input["student_id"] ?? 0);
        $reason = trim((string)($input["reason"] ?? ""));
        $status = trim((string)($input["status"] ?? "Pending"));
        $updatedMarks = isset($input["updated_marks"]) && $input["updated_marks"] !== "" ? (float)$input["updated_marks"] : null;
        $updatedGrade = trim((string)($input["updated_grade"] ?? ""));

        if ($examId <= 0 || $studentId <= 0) {
            json_reply(["status" => false, "message" => "exam_id and student_id are required"], 400);
        }

        $stmt = mysqli_prepare($conn, "
            INSERT INTO revaluation_requests (exam_id, student_id, reason, status, updated_marks, updated_grade)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, "iissds", $examId, $studentId, $reason, $status, $updatedMarks, $updatedGrade);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }

        json_reply(["status" => true, "message" => "Revaluation request added"]);

    case "update_revaluation_request":
        if ($_SERVER["REQUEST_METHOD"] !== "POST") {
            json_reply(["status" => false, "message" => "POST required"], 405);
        }

        $input = get_input();
        $id = (int)($input["id"] ?? 0);
        $examId = (int)($input["exam_id"] ?? 0);
        $studentId = (int)($input["student_id"] ?? 0);
        $reason = trim((string)($input["reason"] ?? ""));
        $status = trim((string)($input["status"] ?? "Pending"));
        $updatedMarks = isset($input["updated_marks"]) && $input["updated_marks"] !== "" ? (float)$input["updated_marks"] : null;
        $updatedGrade = trim((string)($input["updated_grade"] ?? ""));

        if ($id <= 0) {
            json_reply(["status" => false, "message" => "id is required"], 400);
        }

        $stmt = mysqli_prepare($conn, "
            UPDATE revaluation_requests
            SET exam_id = ?, student_id = ?, reason = ?, status = ?, updated_marks = ?, updated_grade = ?
            WHERE id = ?
        ");
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, "iissdsi", $examId, $studentId, $reason, $status, $updatedMarks, $updatedGrade, $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }

        if ($status === "Approved" && $examId > 0 && $studentId > 0 && $updatedMarks !== null) {
            $marksUpsert = mysqli_prepare($conn, "
                INSERT INTO exam_marks (exam_id, student_id, marks, grade)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE marks = VALUES(marks), grade = VALUES(grade), updated_at = NOW()
            ");
            if ($marksUpsert) {
                mysqli_stmt_bind_param($marksUpsert, "iids", $examId, $studentId, $updatedMarks, $updatedGrade);
                mysqli_stmt_execute($marksUpsert);
                mysqli_stmt_close($marksUpsert);
            }
        }

        json_reply(["status" => true, "message" => "Revaluation request updated"]);

    case "delete_revaluation_request":
        $id = (int)($_GET["id"] ?? 0);
        if ($id <= 0) {
            json_reply(["status" => false, "message" => "id is required"], 400);
        }

        $stmt = mysqli_prepare($conn, "DELETE FROM revaluation_requests WHERE id = ?");
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, "i", $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }

        json_reply(["status" => true, "message" => "Revaluation request deleted"]);

    default:
        json_reply([
            "status" => false,
            "message" => "Unknown action"
        ], 400);
}
?>
