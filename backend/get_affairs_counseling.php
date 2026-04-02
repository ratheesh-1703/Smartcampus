<?php
include "config.php";

try {
    $q = trim($_GET["q"] ?? "");
    $status = trim($_GET["status"] ?? "");

    $sql = "
        SELECT
            c.id,
            c.student_id,
            COALESCE(s.name, '') AS student_name,
            COALESCE(s.reg_no, '') AS reg_no,
            COALESCE(c.notes, '') AS topic,
            COALESCE(c.session_date, '') AS session_date,
            COALESCE(c.status, 'Scheduled') AS status,
            COALESCE(c.notes, '') AS notes,
            c.created_at,
            c.updated_at
        FROM affairs_counseling c
        LEFT JOIN students s ON s.id = c.student_id
        WHERE 1=1
    ";

    if ($q !== "") {
        $qEsc = mysqli_real_escape_string($conn, $q);
        $sql .= " AND (s.name LIKE '%$qEsc%' OR s.reg_no LIKE '%$qEsc%' OR c.notes LIKE '%$qEsc%')";
    }

    if ($status !== "") {
        $statusEsc = mysqli_real_escape_string($conn, $status);
        $sql .= " AND c.status = '$statusEsc'";
    }

    $sql .= " ORDER BY COALESCE(c.session_date, DATE(c.created_at)) DESC, c.id DESC";

    $res = mysqli_query($conn, $sql);
    $rows = [];
    while ($res && $r = mysqli_fetch_assoc($res)) {
        $rows[] = $r;
    }

    echo json_encode([
        "status" => true,
        "sessions" => $rows
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => false,
        "message" => "Failed to load sessions"
    ]);
}
?>
