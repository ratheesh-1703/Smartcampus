import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function DeanDiscipline() {
  const [actions, setActions] = useState([]);
  const [form, setForm] = useState({ id: "", student_id: "", action_type: "", reason: "", status: "Active" });
  const [error, setError] = useState("");

  const loadActions = async () => {
    const data = await apiCall(buildUrl("dean_endpoints.php?action=get_disciplinary_actions"));
    if (data.status) {
      setActions(data.actions || []);
      setError("");
    } else {
      setError(data.message || "Failed to load actions");
    }
  };

  const submitAction = async (e) => {
    e.preventDefault();
    const action = form.id ? "update_disciplinary_action" : "record_disciplinary_action";
    const data = await apiCall(buildUrl(`dean_endpoints.php?action=${action}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (!data.status) {
      setError(data.message || "Failed to save action");
      return;
    }

    setForm({ id: "", student_id: "", action_type: "", reason: "", status: "Active" });
    await loadActions();
  };

  const editAction = (row) => {
    setForm({
      id: row.id,
      student_id: row.student_id || "",
      action_type: row.action_type || "",
      reason: row.reason || "",
      status: row.status || "Active"
    });
  };

  const deleteAction = async (id) => {
    const data = await apiCall(buildUrl(`dean_endpoints.php?action=delete_disciplinary_action&id=${id}`));
    if (!data.status) {
      setError(data.message || "Failed to delete action");
      return;
    }
    await loadActions();
  };

  useEffect(() => {
    loadActions();
  }, []);

  return (
    <div>
      <h2 className="mb-4">Disciplinary Actions</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Action Form</h5>
        </div>
        <div className="card-body">
          <form onSubmit={submitAction}>
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
                <label className="form-label">Action Type</label>
                <input
                  className="form-control"
                  value={form.action_type}
                  onChange={(e) => setForm((prev) => ({ ...prev, action_type: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Active">Active</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div className="col-md-3">
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
                onClick={() => setForm({ id: "", student_id: "", action_type: "", reason: "", status: "Active" })}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-light">
          <h5 className="mb-0">Actions</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Action</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {actions.length ? (
                  actions.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name || row.reg_no || row.student_id}</td>
                      <td>{row.action_type}</td>
                      <td>{row.status}</td>
                      <td>{row.reason || "-"}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => editAction(row)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteAction(row.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-muted">
                      No actions recorded.
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
