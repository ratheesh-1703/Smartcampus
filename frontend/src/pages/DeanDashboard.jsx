import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function DeanDashboard() {
  const [incidents, setIncidents] = useState([]);
  const [actions, setActions] = useState([]);
  const [counseling, setCounseling] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  const [actionForm, setActionForm] = useState({
    student_id: "",
    action_type: "",
    reason: ""
  });

  const loadAll = async () => {
    const [incData, actionData, counselingData, reportData] = await Promise.all([
      apiCall(buildUrl("dean_endpoints.php?action=get_incidents")),
      apiCall(buildUrl("dean_endpoints.php?action=get_disciplinary_actions")),
      apiCall(buildUrl("dean_endpoints.php?action=get_student_affairs_counseling")),
      apiCall(buildUrl("dean_endpoints.php?action=get_dean_reports"))
    ]);

    if (incData.status) setIncidents(incData.incidents || []);
    if (actionData.status) setActions(actionData.actions || []);
    if (counselingData.status) setCounseling(counselingData.counseling || []);
    if (reportData.status) setReport(reportData.report || null);

    if (!incData.status || !actionData.status || !counselingData.status || !reportData.status) {
      setError(
        incData.message || actionData.message || counselingData.message || reportData.message || "Failed to load dean dashboard"
      );
    } else {
      setError("");
    }
  };

  const submitAction = async (e) => {
    e.preventDefault();
    const data = await apiCall(buildUrl("dean_endpoints.php?action=record_disciplinary_action"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(actionForm)
    });

    if (!data.status) {
      setError(data.message || "Failed to record action");
      return;
    }

    setActionForm({ student_id: "", action_type: "", reason: "" });
    await loadAll();
  };

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <div>
      <h2 className="mb-4">🎓 Dean Dashboard</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row mb-4">
        <div className="col-md-6 col-lg-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Total Students</h6>
              <h3 className="mb-0 fw-bold text-primary">{report?.total_students || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Recent Incidents</h6>
              <h3 className="mb-0 fw-bold text-warning">{report?.recent_incidents || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Active Disciplinary</h6>
              <h3 className="mb-0 fw-bold text-danger">{report?.active_disciplinary_cases || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Pending SOS</h6>
              <h3 className="mb-0 fw-bold text-info">{report?.pending_sos_alerts || 0}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-light">
              <h5 className="mb-0">⚖️ Record Disciplinary Action</h5>
            </div>
            <div className="card-body">
              <form onSubmit={submitAction}>
                <div className="mb-2">
                  <label className="form-label">Student ID</label>
                  <input
                    className="form-control"
                    value={actionForm.student_id}
                    onChange={(e) => setActionForm((prev) => ({ ...prev, student_id: e.target.value }))}
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">Action Type</label>
                  <input
                    className="form-control"
                    value={actionForm.action_type}
                    onChange={(e) => setActionForm((prev) => ({ ...prev, action_type: e.target.value }))}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Reason</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={actionForm.reason}
                    onChange={(e) => setActionForm((prev) => ({ ...prev, reason: e.target.value }))}
                  ></textarea>
                </div>
                <button className="btn btn-primary" type="submit">
                  Record Action
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-light">
              <h5 className="mb-0">💬 Counseling Sessions</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Topic</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {counseling.length ? (
                      counseling.map((row) => (
                        <tr key={row.id}>
                          <td>{row.student_name || row.reg_no}</td>
                          <td>{row.topic}</td>
                          <td>{row.session_date}</td>
                          <td>{row.status}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-muted">No counseling sessions.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-light">
              <h5 className="mb-0">🚨 Recent Incidents</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Type</th>
                      <th>Severity</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.length ? (
                      incidents.map((row) => (
                        <tr key={row.id}>
                          <td>{row.student_id}</td>
                          <td>{row.incident_type}</td>
                          <td>{row.severity}</td>
                          <td>{row.status}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-muted">No incidents reported.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-light">
              <h5 className="mb-0">📋 Disciplinary Actions</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Action</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actions.length ? (
                      actions.map((row) => (
                        <tr key={row.id}>
                          <td>{row.name || row.reg_no}</td>
                          <td>{row.action_type}</td>
                          <td>{row.status}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-muted">No disciplinary actions.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
