import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

const emptyForm = {
  student_name: "",
  reg_no: "",
  incident_type: "",
  severity: "Low",
  description: "",
  location: "",
  action_taken: "",
  status: "Open"
};

export default function AffairsIncidentLog() {
  const [form, setForm] = useState(emptyForm);
  const [filters, setFilters] = useState({ q: "", status: "", severity: "" });
  const [incidents, setIncidents] = useState([]);
  const [rowEdits, setRowEdits] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadIncidents = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.q.trim()) params.set("q", filters.q.trim());
    if (filters.status) params.set("status", filters.status);
    if (filters.severity) params.set("severity", filters.severity);

    const url = buildUrl(
      `get_affairs_incidents.php${params.toString() ? `?${params.toString()}` : ""}`
    );

    const data = await apiCall(url);
    if (data.status) {
      setIncidents(data.incidents || []);
      setError("");
    } else {
      setIncidents([]);
      setError(data.message || "Failed to load incidents");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.incident_type.trim()) return;

    const data = await apiCall(buildUrl("add_affairs_incident.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (data.status) {
      setForm(emptyForm);
      loadIncidents();
    } else {
      setError(data.message || "Failed to add incident");
    }
  };

  const updateIncident = async (id) => {
    const edit = rowEdits[id] || {};
    const status = edit.status || incidents.find((i) => i.id === id)?.status || "Open";
    const action_taken = edit.action_taken || "";

    const data = await apiCall(buildUrl("update_affairs_incident.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, action_taken })
    });

    if (data.status) {
      loadIncidents();
    } else {
      setError(data.message || "Failed to update incident");
    }
  };

  const deleteIncident = async (id) => {
    if (!window.confirm("Delete this incident?")) return;
    const data = await apiCall(buildUrl(`delete_affairs_incident.php?id=${id}`));
    if (data.status) {
      loadIncidents();
    } else {
      setError(data.message || "Failed to delete incident");
    }
  };

  return (
    <div className="container mt-3">
      <h2>Incident Log</h2>

      <div className="card p-3 mt-3">
        <h5 className="mb-3">Log Incident</h5>
        <form className="row g-3" onSubmit={handleSubmit}>
          <div className="col-md-3">
            <label className="form-label">Student Name</label>
            <input
              className="form-control"
              name="student_name"
              value={form.student_name}
              onChange={handleFormChange}
              placeholder="Student name"
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Reg No</label>
            <input
              className="form-control"
              name="reg_no"
              value={form.reg_no}
              onChange={handleFormChange}
              placeholder="Reg no"
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Incident Type</label>
            <input
              className="form-control"
              name="incident_type"
              value={form.incident_type}
              onChange={handleFormChange}
              placeholder="Incident type"
              required
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Severity</label>
            <select
              className="form-select"
              name="severity"
              value={form.severity}
              onChange={handleFormChange}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              name="status"
              value={form.status}
              onChange={handleFormChange}
            >
              <option>Open</option>
              <option>Investigating</option>
              <option>Closed</option>
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label">Location</label>
            <input
              className="form-control"
              name="location"
              value={form.location}
              onChange={handleFormChange}
              placeholder="Location"
            />
          </div>
          <div className="col-md-8">
            <label className="form-label">Description</label>
            <input
              className="form-control"
              name="description"
              value={form.description}
              onChange={handleFormChange}
              placeholder="Short description"
            />
          </div>
          <div className="col-12">
            <label className="form-label">Action Taken</label>
            <input
              className="form-control"
              name="action_taken"
              value={form.action_taken}
              onChange={handleFormChange}
              placeholder="Action taken"
            />
          </div>
          <div className="col-12">
            <button className="btn btn-primary" type="submit">
              Add Incident
            </button>
          </div>
        </form>
      </div>

      <div className="card p-3 mt-3">
        <div className="d-flex flex-wrap gap-2 align-items-end">
          <div className="flex-grow-1">
            <label className="form-label">Search</label>
            <input
              className="form-control"
              name="q"
              value={filters.q}
              onChange={handleFilterChange}
              placeholder="Search by student, reg no, type"
            />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select
              className="form-select"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All</option>
              <option>Open</option>
              <option>Investigating</option>
              <option>Closed</option>
            </select>
          </div>
          <div>
            <label className="form-label">Severity</label>
            <select
              className="form-select"
              name="severity"
              value={filters.severity}
              onChange={handleFilterChange}
            >
              <option value="">All</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
          <div>
            <button className="btn btn-outline-primary" onClick={loadIncidents}>
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      <div className="card p-3 mt-3">
        <h5 className="mb-3">Recent Incidents</h5>
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Action</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((item) => {
                  const edit = rowEdits[item.id] || {};
                  return (
                    <tr key={item.id}>
                      <td>
                        <div>{item.student_name || "-"}</div>
                        <div className="text-muted small">{item.reg_no || ""}</div>
                      </td>
                      <td>{item.incident_type}</td>
                      <td>{item.severity}</td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={edit.status || item.status}
                          onChange={(e) =>
                            setRowEdits((prev) => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], status: e.target.value }
                            }))
                          }
                        >
                          <option>Open</option>
                          <option>Investigating</option>
                          <option>Closed</option>
                        </select>
                      </td>
                      <td>{item.location || "-"}</td>
                      <td>
                        <input
                          className="form-control form-control-sm"
                          placeholder="Action taken"
                          value={edit.action_taken ?? ""}
                          onChange={(e) =>
                            setRowEdits((prev) => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], action_taken: e.target.value }
                            }))
                          }
                        />
                      </td>
                      <td className="text-nowrap">
                        <button
                          className="btn btn-sm btn-primary me-2"
                          onClick={() => updateIncident(item.id)}
                        >
                          Save
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteIncident(item.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {incidents.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center">No incidents found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
