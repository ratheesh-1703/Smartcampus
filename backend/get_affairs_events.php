<?php
include "config.php";

try {
    $q = trim($_GET["q"] ?? "");
    $status = trim($_GET["status"] ?? "");

    $sql = "
        SELECT
            e.id,
            COALESCE(e.title, '') AS title,
            COALESCE(e.event_date, '') AS event_date,
            COALESCE(e.venue, '') AS location,
            '' AS organizer,
            COALESCE(e.status, 'Planned') AS status,
            COALESCE(e.details, '') AS description,
            e.created_at,
            e.updated_at
        FROM affairs_events e
        WHERE 1=1
    ";

    if ($q !== "") {
        $qEsc = mysqli_real_escape_string($conn, $q);
        $sql .= " AND (e.title LIKE '%$qEsc%' OR e.venue LIKE '%$qEsc%' OR e.details LIKE '%$qEsc%')";
    }

    if ($status !== "") {
        $statusEsc = mysqli_real_escape_string($conn, $status);
        $sql .= " AND e.status = '$statusEsc'";
    }

    $sql .= " ORDER BY COALESCE(e.event_date, DATE(e.created_at)) DESC, e.id DESC";

    $res = mysqli_query($conn, $sql);
    $rows = [];
    while ($res && $r = mysqli_fetch_assoc($res)) {
        $rows[] = $r;
    }

    echo json_encode([
        "status" => true,
        "events" => $rows
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => false,
        "message" => "Failed to load events"
    ]);
}
?>
