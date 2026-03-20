import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function ParentPermissions() {
  const [permissions, setPermissions] = useState([]);
  const [form, setForm] = useState({ id: "", student_id: "", request_type: "", start_date: "", end_date: "", reason: "", status: "Requested" });
  const [error, setError] = useState("");

  const loadPermissions = async () => {
    const data = await apiCall(buildUrl("parent_endpoints.php?action=get_permissions"));
    if (data.status) {
      setPermissions(data.permissions || []);
      setError("");
    } else {
      setError(data.message || "Failed to load requests");
    }
  };

  const submitPermission = async (e) => {
    e.preventDefault();
    const action = form.id ? "update_permission" : "add_permission";
    const data = await apiCall(buildUrl(`parent_endpoints.php?action=${action}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (!data.status) {
      setError(data.message || "Failed to save request");
      return;
    }

    setForm({ id: "", student_id: "", request_type: "", start_date: "", end_date: "", reason: "", status: "Requested" });
    await loadPermissions();
  };

  const editPermission = (row) => {
    setForm({
      id: row.id,
      student_id: row.student_id || "",
      request_type: row.request_type || "",
      start_date: row.start_date || "",
      end_date: row.end_date || "",
      reason: row.reason || "",
      status: row.status || "Requested"
    });
  };

  const deletePermission = async (id) => {
    const data = await apiCall(buildUrl(`parent_endpoints.php?action=delete_permission&id=${id}`));
    if (!data.status) {
      setError(data.message || "Failed to delete request");
      return;
    }
    await loadPermissions();
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  return (
    <div>
      <h2 className="mb-4">Permissions & Leave</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Request Form</h5>
        </div>
        <div className="card-body">
          <form onSubmit={submitPermission}>
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
                <label className="form-label">Request Type</label>
                <input
                  className="form-control"
                  value={form.request_type}
                  onChange={(e) => setForm((prev) => ({ ...prev, request_type: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.start_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.end_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Requested">Requested</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div className="col-md-9">
                <label className="form-label">Reason</label>
                <input
                  className="form-control"
                  value={form.reason}
                  onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
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
                onClick={() => setForm({ id: "", student_id: "", request_type: "", start_date: "", end_date: "", reason: "", status: "Requested" })}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-light">
          <h5 className="mb-0">Requests</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {permissions.length ? (
                  permissions.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name || row.reg_no || row.student_id}</td>
                      <td>{row.request_type}</td>
                      <td>{row.start_date || "-"} to {row.end_date || "-"}</td>
                      <td>{row.status}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => editPermission(row)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deletePermission(row.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-muted">
                      No permission requests found.
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
