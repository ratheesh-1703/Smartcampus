import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function DeanPolicies() {
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ id: "", title: "", description: "", status: "Submitted" });
  const [filterStatus, setFilterStatus] = useState("");
  const [error, setError] = useState("");

  const loadRequests = async () => {
    const url = buildUrl(
      `dean_endpoints.php?action=get_policy_requests&status=${encodeURIComponent(filterStatus)}`
    );
    const data = await apiCall(url);
    if (data.status) {
      setRequests(data.requests || []);
      setError("");
    } else {
      setError(data.message || "Failed to load policy requests");
    }
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    const action = form.id ? "update_policy_request" : "add_policy_request";
    const data = await apiCall(buildUrl(`dean_endpoints.php?action=${action}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (!data.status) {
      setError(data.message || "Failed to save policy request");
      return;
    }

    setForm({ id: "", title: "", description: "", status: "Submitted" });
    await loadRequests();
  };

  const editRequest = (row) => {
    setForm({
      id: row.id,
      title: row.title || "",
      description: row.description || "",
      status: row.status || "Submitted"
    });
  };

  const deleteRequest = async (id) => {
    const data = await apiCall(buildUrl(`dean_endpoints.php?action=delete_policy_request&id=${id}`));
    if (!data.status) {
      setError(data.message || "Failed to delete request");
      return;
    }
    await loadRequests();
  };

  useEffect(() => {
    loadRequests();
  }, []);

  return (
    <div>
      <h2 className="mb-4">Policy Requests</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Request Form</h5>
        </div>
        <div className="card-body">
          <form onSubmit={submitRequest}>
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
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Submitted">Submitted</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div className="col-md-12">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
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
                onClick={() => setForm({ id: "", title: "", description: "", status: "Submitted" })}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Requests</h5>
          <div className="d-flex gap-2">
            <select
              className="form-select form-select-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All</option>
              <option value="Submitted">Submitted</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <button className="btn btn-sm btn-outline-primary" onClick={loadRequests}>
              Filter
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Requested By</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {requests.length ? (
                  requests.map((row) => (
                    <tr key={row.id}>
                      <td>{row.title}</td>
                      <td>{row.status}</td>
                      <td>{row.requested_by_name || "-"}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => editRequest(row)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteRequest(row.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-muted">
                      No policy requests found.
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
