<?php
include "config.php";

try {
    $q = trim($_GET["q"] ?? "");
    $status = trim($_GET["status"] ?? "");
    $severity = trim($_GET["severity"] ?? ""); // UI filter compatibility (table has no severity column)

    $sql = "
        SELECT
            i.id,
            i.student_id,
            COALESCE(s.name, '') AS student_name,
            COALESCE(s.reg_no, '') AS reg_no,
            i.incident_type,
            'Low' AS severity,
            i.details AS description,
            '' AS location,
            COALESCE(i.action_taken, '') AS action_taken,
            COALESCE(i.status, 'Open') AS status,
            i.incident_date,
            i.created_at,
            i.updated_at
        FROM affairs_incidents i
        LEFT JOIN students s ON s.id = i.student_id
        WHERE 1=1
    ";

    if ($q !== "") {
        $qEsc = mysqli_real_escape_string($conn, $q);
        $sql .= " AND (s.name LIKE '%$qEsc%' OR s.reg_no LIKE '%$qEsc%' OR i.incident_type LIKE '%$qEsc%' OR i.details LIKE '%$qEsc%')";
    }

    if ($status !== "") {
        $statusEsc = mysqli_real_escape_string($conn, $status);
        $sql .= " AND i.status = '$statusEsc'";
    }

    if ($severity !== "") {
        // Kept for API compatibility; currently no severity column in schema.
    }

    $sql .= " ORDER BY COALESCE(i.incident_date, DATE(i.created_at)) DESC, i.id DESC";

    $res = mysqli_query($conn, $sql);
    $rows = [];
    while ($res && $r = mysqli_fetch_assoc($res)) {
        $rows[] = $r;
    }

    echo json_encode([
        "status" => true,
        "incidents" => $rows
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => false,
        "message" => "Failed to load incidents"
    ]);
}
?>
