import { useEffect, useMemo, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

const roleLabel = (role) => String(role || "").replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

const roleBadgeClass = (role) => {
  const key = String(role || "").toLowerCase();
  const map = {
    coordinator: "bg-primary",
    hod: "bg-warning text-dark",
    hostel_warden: "bg-info text-dark",
    exam_controller: "bg-danger",
    accountant: "bg-success",
    affairs: "bg-secondary",
    registrar: "bg-dark"
  };
  return map[key] || "bg-secondary";
};

const workflowRoles = ["coordinator", "hod", "hostel_warden", "exam_controller", "accountant", "affairs", "registrar"];

export default function RegistrarFormReviews() {
  const stored = JSON.parse(localStorage.getItem("user") || "{}");
  const role = (stored?.role || stored?.user?.role || "reviewer").toString();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(0);
  const [comment, setComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [analytics, setAnalytics] = useState({ pending: 0, overdue: 0, approved_today: 0 });

  const loadPending = async () => {
    setLoading(true);
    setError("");

    const data = await apiCall(buildUrl("get_form_submissions.php?for_my_stage=1&status=submitted&review_status=pending&limit=200&include_analytics=1"));
    if (!data?.status) {
      setError(data?.message || "Failed to load submissions");
      setSubmissions([]);
      setLoading(false);
      return;
    }

    setSubmissions(Array.isArray(data.submissions) ? data.submissions : []);
    setAnalytics(data.analytics || { pending: 0, overdue: 0, approved_today: 0 });
    setLoading(false);
  };

  const loadNotifications = async () => {
    const data = await apiCall(buildUrl("get_form_notifications.php?limit=8"));
    if (data?.status) {
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadNotifications(Number(data.unread_count || 0));
    }
  };

  const markAllNotificationsRead = async () => {
    const data = await apiCall(buildUrl("mark_form_notifications.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    if (data?.status) {
      await loadNotifications();
    }
  };

  useEffect(() => {
    loadPending();
    loadNotifications();
  }, []);

  const selected = useMemo(
    () => submissions.find((item) => Number(item.id) === Number(selectedId)) || null,
    [submissions, selectedId]
  );

  const review = async (decision) => {
    if (!selected) {
      setError("Select a submission first");
      return;
    }

    setActionLoading(true);
    setError("");

    const data = await apiCall(buildUrl("review_form_submission.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submission_id: selected.id,
        decision,
        comment
      })
    });

    if (!data?.status) {
      setError(data?.message || "Review action failed");
      setActionLoading(false);
      return;
    }

    setComment("");
    await loadPending();
    setActionLoading(false);
  };

  const pendingCount = submissions.filter((s) => s.review_status === "pending" || s.review_status === null).length;

  const getWorkflowProgress = (item) => {
    const workflow = Array.isArray(item?.workflow) ? item.workflow : [];
    if (!workflow.length) {
      return 0;
    }

    if (item?.review_status === "approved") {
      return 100;
    }

    const approvedStages = Array.isArray(item?.review_history)
      ? item.review_history.filter((h) => h?.decision === "approved").length
      : 0;

    return Math.min(100, Math.round((approvedStages / workflow.length) * 100));
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">{role.replace(/_/g, " ")} Review Queue</h3>
        <button className="btn btn-outline-primary" onClick={loadPending} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 mb-3">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <h6 className="mb-0">Workflow Notifications</h6>
          <button className="btn btn-sm btn-outline-secondary" onClick={markAllNotificationsRead} disabled={unreadNotifications === 0}>
            Mark all read ({unreadNotifications})
          </button>
        </div>
        <div className="card-body">
          {notifications.length > 0 ? (
            <ul className="list-group list-group-flush">
              {notifications.map((n) => (
                <li key={n.id} className="list-group-item d-flex justify-content-between align-items-start px-0">
                  <div>
                    <div className="small">{n.message}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                    </div>
                  </div>
                  {!n.is_read && <span className="badge bg-danger">New</span>}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-muted small">No notifications yet.</div>
          )}
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-3">
        <div className="card-header bg-light">
          <h6 className="mb-0">Workflow Legend</h6>
        </div>
        <div className="card-body d-flex flex-wrap gap-2">
          {workflowRoles.map((r) => (
            <span key={r} className={`badge ${roleBadgeClass(r)}`}>
              {roleLabel(r)}
            </span>
          ))}
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm"><div className="card-body"><div className="text-muted small">Total Submitted</div><h4 className="mb-0">{submissions.length}</h4></div></div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm"><div className="card-body"><div className="text-muted small">Pending Review</div><h4 className="mb-0 text-warning">{pendingCount}</h4></div></div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm"><div className="card-body"><div className="text-muted small">Overdue</div><h4 className="mb-0 text-danger">{analytics.overdue ?? 0}</h4></div></div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm"><div className="card-body"><div className="text-muted small">Approved Today</div><h4 className="mb-0 text-success">{analytics.approved_today ?? 0}</h4></div></div>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h6 className="mb-0">Submitted Forms</h6>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm table-bordered align-middle">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ticket</th>
                  <th>Student</th>
                  <th>Reg No</th>
                  <th>Form Type</th>
                  <th>Completion</th>
                  <th>Progress</th>
                  <th>Current Desk</th>
                  <th>SLA</th>
                  <th>Review Status</th>
                  <th>Submitted At</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {submissions.length ? (
                  submissions.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.ticket_no ? <span className="badge bg-dark">{item.ticket_no}</span> : "-"}</td>
                      <td>{item.student_name}</td>
                      <td>{item.reg_no}</td>
                      <td>{item.form_type}</td>
                      <td>{item.summary?.completion_percent ?? 0}%</td>
                      <td>
                        <div className="small fw-semibold mb-1">{getWorkflowProgress(item)}%</div>
                        <div className="progress" style={{ height: 6 }}>
                          <div className="progress-bar" style={{ width: `${getWorkflowProgress(item)}%` }} />
                        </div>
                      </td>
                      <td>
                        {item.current_reviewer_role ? (
                          <span className={`badge ${roleBadgeClass(item.current_reviewer_role)}`}>
                            {roleLabel(item.current_reviewer_role)}
                          </span>
                        ) : "-"}
                        {Array.isArray(item.workflow) && item.workflow.length > 0 && (
                          <div className="mt-1 d-flex flex-wrap gap-1">
                            {item.workflow.map((stage) => (
                              <span key={`${item.id}-${stage}`} className={`badge ${roleBadgeClass(stage)}`}>
                                {roleLabel(stage)}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        {item.review_deadline_at ? (
                          <span className={`badge ${item.is_overdue ? "bg-danger" : "bg-info text-dark"}`}>
                            {item.is_overdue ? "Overdue" : "Due"}: {new Date(item.review_deadline_at).toLocaleString()}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        <span className={`badge ${item.review_status === "approved" ? "bg-success" : item.review_status === "rejected" ? "bg-danger" : "bg-warning text-dark"}`}>
                          {item.review_status || "pending"}
                        </span>
                      </td>
                      <td>{item.submitted_at ? new Date(item.submitted_at).toLocaleString() : "-"}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary" onClick={() => setSelectedId(item.id)}>
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={12} className="text-muted">No submissions in your queue.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selected && (
        <div className="card shadow-sm border-0">
          <div className="card-header bg-light d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Review Submission #{selected.id}</h6>
            <span className="text-muted small">{selected.student_name} ({selected.reg_no})</span>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">Reviewer Comment</label>
              <textarea
                className="form-control"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add note for student (optional)"
              />
            </div>

            <div className="d-flex gap-2">
              <button className="btn btn-success" onClick={() => review("approved")} disabled={actionLoading}>
                {actionLoading ? "Processing..." : "Approve"}
              </button>
              <button className="btn btn-danger" onClick={() => review("rejected")} disabled={actionLoading}>
                {actionLoading ? "Processing..." : "Reject"}
              </button>
            </div>

            <hr />

            <div className="mb-3">
              <div className="mb-2 d-flex justify-content-between">
                <span className="small text-muted">Workflow Progress</span>
                <span className="small fw-semibold">{getWorkflowProgress(selected)}%</span>
              </div>
              <div className="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={getWorkflowProgress(selected)}>
                <div className="progress-bar" style={{ width: `${getWorkflowProgress(selected)}%` }} />
              </div>
            </div>

            <h6>Stage Timeline</h6>
            {Array.isArray(selected.review_history) && selected.review_history.length > 0 ? (
              <ul className="list-group list-group-flush mb-3">
                {selected.review_history.map((step, index) => (
                  <li key={`${selected.id}-history-${index}`} className="list-group-item px-0">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <div>
                        <span className={`badge ${roleBadgeClass(step.expected_role)}`}>{roleLabel(step.expected_role)}</span>
                        <span className={`badge ms-2 ${step.decision === "approved" ? "bg-success" : "bg-danger"}`}>{step.decision}</span>
                        {step.comment && <span className="ms-2 small text-muted">{step.comment}</span>}
                      </div>
                      <span className="small text-muted">{step.reviewed_at ? new Date(step.reviewed_at).toLocaleString() : ""}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-muted small mb-3">No prior actions in timeline.</div>
            )}

            <h6>Field Snapshot</h6>
            <div className="table-responsive">
              <table className="table table-sm table-bordered">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Value</th>
                    <th>Validation</th>
                  </tr>
                </thead>
                <tbody>
                  {(selected.fields || []).map((f) => (
                    <tr key={f.target_field}>
                      <td>{f.target_field}</td>
                      <td>{String(f.value || "-")}</td>
                      <td>
                        <span className={`badge ${f.is_valid ? "bg-success" : "bg-danger"}`}>
                          {f.validation_message}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
