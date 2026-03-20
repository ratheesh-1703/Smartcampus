import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function RegistrarCertificates() {
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ id: "", student_id: "", request_type: "", reason: "", status: "Pending" });
  const [error, setError] = useState("");

  const loadRequests = async () => {
    const data = await apiCall(buildUrl("registrar_endpoints.php?action=get_certificate_requests"));
    if (data.status) {
      setRequests(data.requests || []);
      setError("");
    } else {
      setError(data.message || "Failed to load requests");
    }
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    const action = form.id ? "update_certificate_request" : "add_certificate_request";
    const payload = {
      id: form.id ? parseInt(form.id, 10) : undefined,
      student_id: form.student_id ? parseInt(form.student_id, 10) : undefined,
      request_type: form.request_type,
      reason: form.reason,
      status: form.status
    };

    const data = await apiCall(buildUrl(`registrar_endpoints.php?action=${action}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!data.status) {
      setError(data.message || "Failed to save request");
      return;
    }

    setForm({ id: "", student_id: "", request_type: "", reason: "", status: "Pending" });
    await loadRequests();
  };

  const editRequest = (req) => {
    setForm({
      id: req.id,
      student_id: req.student_id || "",
      request_type: req.request_type || "",
      reason: req.reason || "",
      status: req.status || "Pending"
    });
  };

  const deleteRequest = async (id) => {
    const data = await apiCall(buildUrl(`registrar_endpoints.php?action=delete_certificate_request&id=${id}`));
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
      <h2 className="mb-4">Certificate Requests</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Request Form</h5>
        </div>
        <div className="card-body">
          <form onSubmit={submitRequest}>
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
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
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
                onClick={() => setForm({ id: "", student_id: "", request_type: "", reason: "", status: "Pending" })}
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
                  <th>Status</th>
                  <th>Reason</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {requests.length ? (
                  requests.map((req) => (
                    <tr key={req.id}>
                      <td>{req.name || req.reg_no || req.student_id}</td>
                      <td>{req.request_type}</td>
                      <td>{req.status}</td>
                      <td>{req.reason || "-"}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => editRequest(req)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteRequest(req.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-muted">
                      No requests found.
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
