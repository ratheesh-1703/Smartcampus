<?php
include "config.php";

try {
    $q = trim($_GET["q"] ?? "");
    $status = trim($_GET["status"] ?? "");

    $sql = "
        SELECT
            h.id,
            h.student_id,
            COALESCE(s.name, '') AS student_name,
            COALESCE(s.reg_no, '') AS reg_no,
            COALESCE(h.issue_type, '') AS category,
            DATE(COALESCE(h.reported_at, h.updated_at)) AS record_date,
            COALESCE(h.status, 'Open') AS status,
            COALESCE(h.notes, '') AS notes,
            h.reported_at,
            h.updated_at
        FROM affairs_health h
        LEFT JOIN students s ON s.id = h.student_id
        WHERE 1=1
    ";

    if ($q !== "") {
        $qEsc = mysqli_real_escape_string($conn, $q);
        $sql .= " AND (s.name LIKE '%$qEsc%' OR s.reg_no LIKE '%$qEsc%' OR h.issue_type LIKE '%$qEsc%' OR h.notes LIKE '%$qEsc%')";
    }

    if ($status !== "") {
        $statusEsc = mysqli_real_escape_string($conn, $status);
        $sql .= " AND h.status = '$statusEsc'";
    }

    $sql .= " ORDER BY COALESCE(h.reported_at, h.updated_at) DESC, h.id DESC";

    $res = mysqli_query($conn, $sql);
    $rows = [];
    while ($res && $r = mysqli_fetch_assoc($res)) {
        $rows[] = $r;
    }

    echo json_encode([
        "status" => true,
        "records" => $rows
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => false,
        "message" => "Failed to load records"
    ]);
}
?>
