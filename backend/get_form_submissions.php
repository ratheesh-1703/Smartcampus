<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include "config.php";

$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
if ($limit <= 0) {
    $limit = 100;
}
$limit = min($limit, 500);

$status = isset($_GET['status']) ? trim((string)$_GET['status']) : '';
$reviewStatus = isset($_GET['review_status']) ? trim((string)$_GET['review_status']) : '';
$includeAnalytics = isset($_GET['include_analytics']) && (string)$_GET['include_analytics'] === '1';

$where = [];
if ($status !== '') {
    $statusEsc = mysqli_real_escape_string($conn, $status);
    $where[] = "fs.status = '$statusEsc'";
}
if ($reviewStatus !== '') {
    $reviewEsc = mysqli_real_escape_string($conn, $reviewStatus);
    $where[] = "fs.review_status = '$reviewEsc'";
}

$whereSql = count($where) ? ('WHERE ' . implode(' AND ', $where)) : '';

$q = mysqli_query($conn, "
  SELECT
    fs.id,
    fs.student_id,
    fs.form_type,
    fs.form_data,
    fs.status,
    fs.review_status,
    fs.submitted_at,
    fs.updated_at,
    s.name AS student_name,
    s.reg_no
  FROM form_submissions fs
  LEFT JOIN students s ON s.id = fs.student_id
  $whereSql
  ORDER BY fs.id DESC
  LIMIT $limit
");

if (!$q) {
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Failed to fetch submissions", "error" => mysqli_error($conn)]);
    exit;
}

$workflowTemplate = ["coordinator", "hod", "hostel_warden", "exam_controller", "accountant", "affairs", "registrar"];
$submissions = [];

while ($row = mysqli_fetch_assoc($q)) {
    $formData = [];
    if (!empty($row['form_data'])) {
        $decoded = json_decode($row['form_data'], true);
        if (is_array($decoded)) {
            $formData = $decoded;
        }
    }

    $fields = [];
    $filled = 0;
    $total = 0;
    foreach ($formData as $key => $value) {
        $total++;
        $isValid = !($value === null || $value === '' || (is_array($value) && count($value) === 0));
        if ($isValid) {
            $filled++;
        }
        $fields[] = [
            "target_field" => (string)$key,
            "value" => is_scalar($value) ? (string)$value : json_encode($value),
            "is_valid" => $isValid
        ];
    }

    $completionPercent = $total > 0 ? (int)round(($filled / $total) * 100) : 0;

    $auditRows = [];
    $aq = mysqli_query($conn, "
      SELECT fwa.action_name, fwa.remarks, fwa.created_at, u.role AS reviewer_role
      FROM form_workflow_audit fwa
      LEFT JOIN users u ON u.id = fwa.action_by
      WHERE fwa.form_submission_id = " . (int)$row['id'] . "
      ORDER BY fwa.id ASC
    ");
    if ($aq) {
        while ($ar = mysqli_fetch_assoc($aq)) {
            $auditRows[] = [
                "expected_role" => $ar['reviewer_role'] ?: 'reviewer',
                "decision" => $ar['action_name'] ?: 'updated',
                "comment" => $ar['remarks'] ?: '',
                "reviewed_at" => $ar['created_at']
            ];
        }
    }

    $submittedAt = $row['submitted_at'];
    $deadlineTs = $submittedAt ? strtotime($submittedAt . ' +2 days') : false;
    $deadline = $deadlineTs ? date('Y-m-d H:i:s', $deadlineTs) : null;
    $isOverdue = $deadlineTs ? (time() > $deadlineTs && ($row['review_status'] ?? '') === 'pending') : false;

    $submissions[] = [
        "id" => (int)$row['id'],
        "ticket_no" => "FM-" . str_pad((string)$row['id'], 6, '0', STR_PAD_LEFT),
        "student_name" => $row['student_name'] ?: 'Unknown Student',
        "reg_no" => $row['reg_no'] ?: '-',
        "form_type" => $row['form_type'] ?: 'General',
        "status" => $row['status'] ?: 'submitted',
        "review_status" => $row['review_status'] ?: 'pending',
        "submitted_at" => $submittedAt,
        "updated_at" => $row['updated_at'] ?? null,
        "summary" => [
            "completion_percent" => $completionPercent
        ],
        "fields" => $fields,
        "workflow" => $workflowTemplate,
        "current_reviewer_role" => ($row['review_status'] ?? '') === 'pending' ? 'coordinator' : null,
        "review_deadline_at" => $deadline,
        "is_overdue" => $isOverdue,
        "review_history" => $auditRows
    ];
}

$response = [
    "status" => true,
    "submissions" => $submissions
];

if ($includeAnalytics) {
    $pendingCount = 0;
    $overdueCount = 0;
    $approvedToday = 0;

    $today = date('Y-m-d');
    foreach ($submissions as $item) {
      if (($item['review_status'] ?? '') === 'pending') {
        $pendingCount++;
      }
      if (!empty($item['is_overdue'])) {
        $overdueCount++;
      }
      if (($item['review_status'] ?? '') === 'approved') {
        $updatedAt = (string)($item['updated_at'] ?? '');
        if ($updatedAt !== '' && strpos($updatedAt, $today) === 0) {
          $approvedToday++;
        }
      }
    }

    $response['analytics'] = [
      "pending" => $pendingCount,
      "overdue" => $overdueCount,
      "approved_today" => $approvedToday
    ];
}

echo json_encode($response);
?>
