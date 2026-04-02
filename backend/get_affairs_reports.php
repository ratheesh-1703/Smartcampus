<?php
include "config.php";

try {
    $summary = [
        "incidents" => [
            "total" => 0,
            "open" => 0,
            "investigating" => 0,
            "closed" => 0,
            "high" => 0,
            "medium" => 0,
            "low" => 0
        ],
        "counseling" => [
            "total" => 0,
            "scheduled" => 0,
            "completed" => 0,
            "follow_up" => 0
        ],
        "health" => [
            "total" => 0,
            "open" => 0,
            "resolved" => 0,
            "monitor" => 0
        ],
        "events" => [
            "total" => 0,
            "planned" => 0,
            "completed" => 0,
            "cancelled" => 0
        ],
        "sos" => [
            "total" => 0,
            "today" => 0
        ]
    ];

    $tableChecks = [
        "affairs_incidents" => false,
        "affairs_counseling" => false,
        "affairs_health" => false,
        "sos_alerts" => false,
        "affairs_events" => false
    ];

    foreach ($tableChecks as $table => $exists) {
        $q = mysqli_query($conn, "SHOW TABLES LIKE '$table'");
        $tableChecks[$table] = ($q && mysqli_num_rows($q) > 0);
    }

    if ($tableChecks["affairs_incidents"]) {
        $inc = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) AS c FROM affairs_incidents"));
        $summary["incidents"]["total"] = (int)($inc["c"] ?? 0);

        $incOpen = mysqli_fetch_assoc(mysqli_query($conn, "
            SELECT COUNT(*) AS c FROM affairs_incidents
            WHERE LOWER(COALESCE(status, '')) = 'open'
        "));
        $summary["incidents"]["open"] = (int)($incOpen["c"] ?? 0);

        $incInv = mysqli_fetch_assoc(mysqli_query($conn, "
            SELECT COUNT(*) AS c FROM affairs_incidents
            WHERE LOWER(COALESCE(status, '')) = 'investigating'
        "));
        $summary["incidents"]["investigating"] = (int)($incInv["c"] ?? 0);

        $incClosed = mysqli_fetch_assoc(mysqli_query($conn, "
            SELECT COUNT(*) AS c FROM affairs_incidents
            WHERE LOWER(COALESCE(status, '')) = 'closed'
        "));
        $summary["incidents"]["closed"] = (int)($incClosed["c"] ?? 0);

        // Current schema does not include severity, keep compatibility keys.
        $summary["incidents"]["low"] = $summary["incidents"]["total"];
    }

    if ($tableChecks["affairs_counseling"]) {
        $cTotal = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) AS c FROM affairs_counseling"));
        $summary["counseling"]["total"] = (int)($cTotal["c"] ?? 0);

        $scheduled = mysqli_fetch_assoc(mysqli_query($conn, "
            SELECT COUNT(*) AS c
            FROM affairs_counseling
            WHERE LOWER(COALESCE(status, '')) = 'scheduled'
        "));
        $summary["counseling"]["scheduled"] = (int)($scheduled["c"] ?? 0);

        $completed = mysqli_fetch_assoc(mysqli_query($conn, "
            SELECT COUNT(*) AS c
            FROM affairs_counseling
            WHERE LOWER(COALESCE(status, '')) = 'completed'
        "));
        $summary["counseling"]["completed"] = (int)($completed["c"] ?? 0);

        $followUp = mysqli_fetch_assoc(mysqli_query($conn, "
            SELECT COUNT(*) AS c
            FROM affairs_counseling
            WHERE LOWER(REPLACE(COALESCE(status, ''), '-', '_')) IN ('follow_up', 'followup')
        "));
        $summary["counseling"]["follow_up"] = (int)($followUp["c"] ?? 0);
    }

    if ($tableChecks["affairs_health"]) {
        $hTotal = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) AS c FROM affairs_health"));
        $summary["health"]["total"] = (int)($hTotal["c"] ?? 0);

        $open = mysqli_fetch_assoc(mysqli_query($conn, "
            SELECT COUNT(*) AS c
            FROM affairs_health
            WHERE LOWER(COALESCE(status, '')) IN ('open', 'active', 'pending')
        "));
        $summary["health"]["open"] = (int)($open["c"] ?? 0);

        $resolved = mysqli_fetch_assoc(mysqli_query($conn, "
            SELECT COUNT(*) AS c
            FROM affairs_health
            WHERE LOWER(COALESCE(status, '')) = 'resolved'
        "));
        $summary["health"]["resolved"] = (int)($resolved["c"] ?? 0);

        $monitor = mysqli_fetch_assoc(mysqli_query($conn, "
            SELECT COUNT(*) AS c
            FROM affairs_health
            WHERE LOWER(COALESCE(status, '')) = 'monitor'
        "));
        $summary["health"]["monitor"] = (int)($monitor["c"] ?? 0);
    }

    if ($tableChecks["affairs_events"]) {
        $eTotal = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) AS c FROM affairs_events"));
        $summary["events"]["total"] = (int)($eTotal["c"] ?? 0);

        $planned = mysqli_fetch_assoc(mysqli_query($conn, "
            SELECT COUNT(*) AS c
            FROM affairs_events
            WHERE LOWER(COALESCE(status, '')) = 'planned'
        "));
        $summary["events"]["planned"] = (int)($planned["c"] ?? 0);

        $completedEv = mysqli_fetch_assoc(mysqli_query($conn, "
            SELECT COUNT(*) AS c
            FROM affairs_events
            WHERE LOWER(COALESCE(status, '')) = 'completed'
        "));
        $summary["events"]["completed"] = (int)($completedEv["c"] ?? 0);

        $cancelled = mysqli_fetch_assoc(mysqli_query($conn, "
            SELECT COUNT(*) AS c
            FROM affairs_events
            WHERE LOWER(COALESCE(status, '')) = 'cancelled'
        "));
        $summary["events"]["cancelled"] = (int)($cancelled["c"] ?? 0);
    }

    if ($tableChecks["sos_alerts"]) {
        $sosTotal = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) AS c FROM sos_alerts"));
        $summary["sos"]["total"] = (int)($sosTotal["c"] ?? 0);

        $sosToday = mysqli_fetch_assoc(mysqli_query($conn, "
            SELECT COUNT(*) AS c
            FROM sos_alerts
            WHERE DATE(created_at) = CURDATE()
              AND LOWER(COALESCE(status, '')) NOT IN ('resolved', 'closed')
        "));
        $summary["sos"]["today"] = (int)($sosToday["c"] ?? 0);
    }

    echo json_encode([
        "status" => true,
        "summary" => $summary
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => false,
        "message" => "Failed to load affairs reports"
    ]);
}
?>
