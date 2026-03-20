import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function DeanIncidents() {
  const [incidents, setIncidents] = useState([]);
  const [form, setForm] = useState({ id: "", student_id: "", incident_type: "", description: "", severity: "medium", status: "Open" });
  const [error, setError] = useState("");

  const loadIncidents = async () => {
    const data = await apiCall(buildUrl("dean_endpoints.php?action=get_incidents"));
    if (data.status) {
      setIncidents(data.incidents || []);
      setError("");
    } else {
      setError(data.message || "Failed to load incidents");
    }
  };

  const submitIncident = async (e) => {
    e.preventDefault();
    const action = form.id ? "update_incident" : "add_incident";
    const data = await apiCall(buildUrl(`dean_endpoints.php?action=${action}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (!data.status) {
      setError(data.message || "Failed to save incident");
      return;
    }

    setForm({ id: "", student_id: "", incident_type: "", description: "", severity: "medium", status: "Open" });
    await loadIncidents();
  };

  const editIncident = (row) => {
    setForm({
      id: row.id,
      student_id: row.student_id || "",
      incident_type: row.incident_type || "",
      description: row.description || "",
      severity: row.severity || "medium",
      status: row.status || "Open"
    });
  };

  const deleteIncident = async (id) => {
    const data = await apiCall(buildUrl(`dean_endpoints.php?action=delete_incident&id=${id}`));
    if (!data.status) {
      setError(data.message || "Failed to delete incident");
      return;
    }
    await loadIncidents();
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  return (
    <div>
      <h2 className="mb-4">Incidents</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Incident Form</h5>
        </div>
        <div className="card-body">
          <form onSubmit={submitIncident}>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Student ID</label>
                <input
                  className="form-control"
                  value={form.student_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, student_id: e.target.value }))}
                  required={!form.id}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Type</label>
                <input
                  className="form-control"
                  value={form.incident_type}
                  onChange={(e) => setForm((prev) => ({ ...prev, incident_type: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Severity</label>
                <select
                  className="form-select"
                  value={form.severity}
                  onChange={(e) => setForm((prev) => ({ ...prev, severity: e.target.value }))}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Open">Open</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label">Description</label>
                <input
                  className="form-control"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-3">
              <button className="btn btn-primary" type="submit">
                {form.id ? "Update" : "Add"}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary ms-2"
                onClick={() => setForm({ id: "", student_id: "", incident_type: "", description: "", severity: "medium", status: "Open" })}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-light">
          <h5 className="mb-0">Incident List</h5>
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
                  <th></th>
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
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => editIncident(row)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteIncident(row.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-muted">
                      No incidents found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
