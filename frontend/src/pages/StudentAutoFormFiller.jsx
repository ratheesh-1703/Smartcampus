import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

const formOptions = [
  { value: "hostel", label: "Hostel Form" },
  { value: "exam", label: "Exam Form" },
  { value: "scholarship", label: "Scholarship Form" },
  { value: "id_card", label: "ID Card Form" },
  { value: "transport", label: "Transport Form" }
];

const finalOfficeByForm = {
  hostel: "Hostel Warden",
  exam: "Exam Controller",
  scholarship: "Accounts Office",
  id_card: "Registrar Office",
  transport: "Student Affairs Office"
};

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

export default function StudentAutoFormFiller() {
  const [formType, setFormType] = useState("hostel");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [result, setResult] = useState(null);
  const [editableFields, setEditableFields] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [activeSubmissionId, setActiveSubmissionId] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const validateField = (field, value) => {
    const raw = String(value ?? "").trim();
    const required = !!field.required;
    const type = field.type || "text";

    if (required && raw === "") {
      return { is_valid: false, validation_message: "Required field missing", confidence: 0 };
    }

    if (raw === "") {
      return { is_valid: true, validation_message: "Optional and empty", confidence: 0 };
    }

    if (type === "email") {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
      return {
        is_valid: emailOk,
        validation_message: emailOk ? "Valid" : "Invalid email format",
        confidence: emailOk ? 0.95 : 0.4
      };
    }

    if (type === "phone") {
      const digits = raw.replace(/\D+/g, "");
      const phoneOk = digits.length >= 10 && digits.length <= 13;
      return {
        is_valid: phoneOk,
        validation_message: phoneOk ? "Valid" : "Phone should contain 10-13 digits",
        confidence: phoneOk ? 0.95 : 0.4
      };
    }

    if (type === "number") {
      const numOk = !Number.isNaN(Number(raw));
      return {
        is_valid: numOk,
        validation_message: numOk ? "Valid" : "Must be numeric",
        confidence: numOk ? 0.95 : 0.4
      };
    }

    if (type === "date") {
      const dateOk = !Number.isNaN(Date.parse(raw));
      return {
        is_valid: dateOk,
        validation_message: dateOk ? "Valid" : "Invalid date",
        confidence: dateOk ? 0.95 : 0.4
      };
    }

    return { is_valid: true, validation_message: "Valid", confidence: 0.95 };
  };

  const buildSummary = (fields) => {
    const total = fields.length;
    const valid = fields.filter((f) => !!f.is_valid).length;
    const requiredMissing = fields.filter((f) => !!f.required && String(f.value ?? "").trim() === "").length;
    const completion = total > 0 ? Number(((valid / total) * 100).toFixed(2)) : 0;

    return {
      total_fields: total,
      valid_fields: valid,
      required_missing: requiredMissing,
      completion_percent: completion
    };
  };

  const loadSubmissions = async () => {
    const data = await apiCall(buildUrl("get_form_submissions.php?limit=50"));
    if (data?.status) {
      setSubmissions(Array.isArray(data.submissions) ? data.submissions : []);
    }
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

  const loadAutoFill = async () => {
    setLoading(true);
    setError("");
    setStatusMessage("");

    const data = await apiCall(buildUrl(`get_form_autofill.php?form_type=${encodeURIComponent(formType)}`));

    if (!data?.status) {
      setError(data?.message || "Failed to auto-fill form");
      setResult(null);
      setEditableFields([]);
      setLoading(false);
      return;
    }

    setResult(data);
    setEditableFields(Array.isArray(data.filled_fields) ? data.filled_fields : []);
    setActiveSubmissionId(0);
    setLoading(false);
  };

  const saveForm = async (mode) => {
    if (!editableFields.length) {
      setError("Generate auto-fill fields first.");
      return;
    }

    setSaving(true);
    setError("");
    setStatusMessage("");

    const payload = {
      submission_id: activeSubmissionId || undefined,
      form_type: formType,
      mode,
      fields: editableFields
    };

    const data = await apiCall(buildUrl("save_form_submission.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!data?.status) {
      setError(data?.message || "Failed to save form");
      setSaving(false);
      return;
    }

    if (data?.submission_id) {
      setActiveSubmissionId(data.submission_id);
    }

    setStatusMessage(data.message || "Saved successfully");
    await loadSubmissions();
    setSaving(false);
  };

  const loadSubmissionToEditor = (submission) => {
    const fields = Array.isArray(submission.fields) ? submission.fields : [];
    setFormType(submission.form_type || "hostel");
    setEditableFields(fields);
    setResult({
      form_type: submission.form_type,
      filled_fields: fields,
      summary: submission.summary || buildSummary(fields)
    });
    setActiveSubmissionId(submission.id);
    setError("");
    setStatusMessage(`Loaded submission #${submission.id}`);
  };

  const onFieldChange = (index, value) => {
    setEditableFields((prev) => {
      const next = [...prev];
      const current = { ...next[index] };
      current.value = value;
      const status = validateField(current, value);
      current.is_valid = status.is_valid;
      current.validation_message = status.validation_message;
      current.confidence = status.confidence;
      next[index] = current;

      setResult((old) => ({
        ...(old || {}),
        form_type: formType,
        filled_fields: next,
        summary: buildSummary(next)
      }));

      return next;
    });
  };

  useEffect(() => {
    loadSubmissions();
    loadNotifications();
  }, []);

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

  const summary = result?.summary || (editableFields.length ? buildSummary(editableFields) : null);
  const filledFields = editableFields;
  const selectedFinalOffice = finalOfficeByForm[formType] || "Office";
  const activeSubmission = submissions.find((s) => Number(s.id) === Number(activeSubmissionId)) || null;

  return (
    <div className="container mt-4">
      <div className="card shadow-sm border-0 mb-4">
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

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Auto-Form Filler</h5>
          <span className="text-muted small">Uses your verified profile data</span>
        </div>
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label">Select Form Type</label>
              <select
                className="form-select"
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
              >
                {formOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <button className="btn btn-primary" onClick={loadAutoFill} disabled={loading}>
                {loading ? "Generating..." : "Generate Auto-Fill"}
              </button>
            </div>
          </div>

          <div className="mt-3">
            <span className="badge bg-info text-dark">Final Approval Office: {selectedFinalOffice}</span>
          </div>

          {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
          {statusMessage && <div className="alert alert-success mt-3 mb-0">{statusMessage}</div>}
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h6 className="mb-0">Workflow Legend</h6>
        </div>
        <div className="card-body d-flex flex-wrap gap-2">
          {workflowRoles.map((role) => (
            <span key={role} className={`badge ${roleBadgeClass(role)}`}>
              {roleLabel(role)}
            </span>
          ))}
        </div>
      </div>

      {summary && (
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm"><div className="card-body"><div className="text-muted small">Total Fields</div><h4 className="mb-0">{summary.total_fields}</h4></div></div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm"><div className="card-body"><div className="text-muted small">Valid Fields</div><h4 className="mb-0 text-success">{summary.valid_fields}</h4></div></div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm"><div className="card-body"><div className="text-muted small">Required Missing</div><h4 className="mb-0 text-danger">{summary.required_missing}</h4></div></div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm"><div className="card-body"><div className="text-muted small">Completion</div><h4 className="mb-0">{summary.completion_percent}%</h4></div></div>
          </div>
        </div>
      )}

      {filledFields.length > 0 && (
        <div className="card shadow-sm border-0">
          <div className="card-header bg-light">
            <h6 className="mb-0">Auto-Filled Fields ({result.form_type})</h6>
          </div>
          <div className="card-body">
            <div className="d-flex gap-2 mb-3">
              <button className="btn btn-outline-primary" onClick={() => saveForm("draft")} disabled={saving || loading}>
                {saving ? "Saving..." : "Save Draft"}
              </button>
              <button className="btn btn-success" onClick={() => saveForm("submit")} disabled={saving || loading}>
                {saving ? "Submitting..." : "Submit Form"}
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-sm table-bordered align-middle">
                <thead>
                  <tr>
                    <th>Target Field</th>
                    <th>Value</th>
                    <th>Source</th>
                    <th>Confidence</th>
                    <th>Validation</th>
                  </tr>
                </thead>
                <tbody>
                  {filledFields.map((field, index) => (
                    <tr key={field.target_field}>
                      <td>
                        {field.target_field}
                        {field.required && <span className="text-danger ms-1">*</span>}
                      </td>
                      <td>
                        <input
                          className="form-control form-control-sm"
                          value={String(field.value ?? "")}
                          onChange={(e) => onFieldChange(index, e.target.value)}
                        />
                      </td>
                      <td>{field.source_field}</td>
                      <td>
                        <span className={`badge ${field.confidence >= 0.9 ? "bg-success" : field.confidence >= 0.5 ? "bg-warning text-dark" : "bg-secondary"}`}>
                          {(Number(field.confidence || 0) * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${field.is_valid ? "bg-success" : "bg-danger"}`}>
                          {field.validation_message}
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

      <div className="card shadow-sm border-0 mt-4">
        <div className="card-header bg-light">
          <h6 className="mb-0">My Form Submissions</h6>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Form Type</th>
                  <th>Ticket</th>
                  <th>Form Status</th>
                  <th>Review</th>
                  <th>Current Desk</th>
                  <th>Final Office</th>
                  <th>Reviewer Comment</th>
                  <th>Completion</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {submissions.length > 0 ? (
                  submissions.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.form_type}</td>
                      <td>{item.ticket_no ? <span className="badge bg-dark">{item.ticket_no}</span> : "-"}</td>
                      <td>
                        <span className={`badge ${item.status === "submitted" ? "bg-success" : "bg-secondary"}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${item.review_status === "approved" ? "bg-success" : item.review_status === "rejected" ? "bg-danger" : "bg-warning text-dark"}`}>
                          {item.review_status || "pending"}
                        </span>
                      </td>
                      <td>
                        {item.current_reviewer_role ? (
                          <span className={`badge ${roleBadgeClass(item.current_reviewer_role)}`}>
                            {roleLabel(item.current_reviewer_role)}
                          </span>
                        ) : (
                          (item.review_status === "approved" ? "Completed" : "-")
                        )}
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
                        {Array.isArray(item.workflow) && item.workflow.length > 0 ? (
                          <span className={`badge ${roleBadgeClass(item.workflow[item.workflow.length - 1])}`}>
                            {roleLabel(item.workflow[item.workflow.length - 1])}
                          </span>
                        ) : (
                          finalOfficeByForm[item.form_type] || "-"
                        )}
                        {item.review_deadline_at && item.review_status === "pending" && (
                          <div className="mt-1">
                            <span className={`badge ${item.is_overdue ? "bg-danger" : "bg-info text-dark"}`}>
                              {item.is_overdue ? "Overdue" : "Due"}: {new Date(item.review_deadline_at).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </td>
                      <td>{item.review_comment || "-"}</td>
                      <td>{item.summary?.completion_percent ?? 0}%</td>
                      <td>{item.updated_at ? new Date(item.updated_at).toLocaleString() : "-"}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary" onClick={() => loadSubmissionToEditor(item)}>
                          Load
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="text-muted">No submissions yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {activeSubmission && (
        <div className="card shadow-sm border-0 mt-4">
          <div className="card-header bg-light">
            <h6 className="mb-0">Submission #{activeSubmission.id} Progress</h6>
          </div>
          <div className="card-body">
            <div className="mb-2 d-flex justify-content-between">
              <span className="small text-muted">Workflow Progress</span>
              <span className="small fw-semibold">{getWorkflowProgress(activeSubmission)}%</span>
            </div>
            <div className="progress mb-3" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={getWorkflowProgress(activeSubmission)}>
              <div className="progress-bar" style={{ width: `${getWorkflowProgress(activeSubmission)}%` }} />
            </div>

            <h6 className="mb-2">Stage Timeline</h6>
            {Array.isArray(activeSubmission.review_history) && activeSubmission.review_history.length > 0 ? (
              <ul className="list-group list-group-flush">
                {activeSubmission.review_history.map((step, index) => (
                  <li key={`${activeSubmission.id}-step-${index}`} className="list-group-item px-0">
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
              <div className="text-muted small">No review actions yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
