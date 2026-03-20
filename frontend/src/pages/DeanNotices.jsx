import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function DeanNotices() {
  const [notices, setNotices] = useState([]);
  const [form, setForm] = useState({ id: "", title: "", body: "", priority: "Normal", status: "Active" });
  const [error, setError] = useState("");

  const loadNotices = async () => {
    const data = await apiCall(buildUrl("dean_endpoints.php?action=get_notices"));
    if (data.status) {
      setNotices(data.notices || []);
      setError("");
    } else {
      setError(data.message || "Failed to load notices");
    }
  };

  const submitNotice = async (e) => {
    e.preventDefault();
    const action = form.id ? "update_notice" : "add_notice";
    const data = await apiCall(buildUrl(`dean_endpoints.php?action=${action}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (!data.status) {
      setError(data.message || "Failed to save notice");
      return;
    }

    setForm({ id: "", title: "", body: "", priority: "Normal", status: "Active" });
    await loadNotices();
  };

  const editNotice = (row) => {
    setForm({
      id: row.id,
      title: row.title || "",
      body: row.body || "",
      priority: row.priority || "Normal",
      status: row.status || "Active"
    });
  };

  const deleteNotice = async (id) => {
    const data = await apiCall(buildUrl(`dean_endpoints.php?action=delete_notice&id=${id}`));
    if (!data.status) {
      setError(data.message || "Failed to delete notice");
      return;
    }
    await loadNotices();
  };

  useEffect(() => {
    loadNotices();
  }, []);

  return (
    <div>
      <h2 className="mb-4">Dean Notices</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Notice Form</h5>
        </div>
        <div className="card-body">
          <form onSubmit={submitNotice}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Title</label>
                <input
                  className="form-control"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={form.priority}
                  onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Active">Active</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label">Body</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={form.body}
                  onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
                ></textarea>
              </div>
            </div>
            <div className="mt-3">
              <button className="btn btn-primary" type="submit">
                {form.id ? "Update" : "Add"}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary ms-2"
                onClick={() => setForm({ id: "", title: "", body: "", priority: "Normal", status: "Active" })}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-light">
          <h5 className="mb-0">Notices</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Posted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {notices.length ? (
                  notices.map((row) => (
                    <tr key={row.id}>
                      <td>{row.title}</td>
                      <td>{row.priority}</td>
                      <td>{row.status}</td>
                      <td>{row.posted_at || "-"}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => editNotice(row)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteNotice(row.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-muted">
                      No notices found.
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
