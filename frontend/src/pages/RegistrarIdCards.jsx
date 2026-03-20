import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function RegistrarIdCards() {
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ id: "", student_id: "", request_type: "", reason: "", status: "Pending" });
  const [filterStatus, setFilterStatus] = useState("");
  const [error, setError] = useState("");

  const loadRequests = async () => {
    const url = buildUrl(
      `registrar_endpoints.php?action=get_id_card_requests&status=${encodeURIComponent(filterStatus)}`
    );
    const data = await apiCall(url);
    if (data.status) {
      setRequests(data.requests || []);
      setError("");
    } else {
      setError(data.message || "Failed to load ID card requests");
    }
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    const action = form.id ? "update_id_card_request" : "add_id_card_request";
    const payload = {
      ...form,
      id: form.id ? parseInt(form.id, 10) : undefined,
      student_id: form.student_id ? parseInt(form.student_id, 10) : undefined
    };

    const data = await apiCall(buildUrl(`registrar_endpoints.php?action=${action}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!data.status) {
      setError(data.message || "Failed to save ID card request");
      return;
    }

    setForm({ id: "", student_id: "", request_type: "", reason: "", status: "Pending" });
    await loadRequests();
  };

  const editRequest = (row) => {
    setForm({
      id: row.id,
      student_id: row.student_id || "",
      request_type: row.request_type || "",
      reason: row.reason || "",
      status: row.status || "Pending"
    });
  };

  const deleteRequest = async (id) => {
    const data = await apiCall(buildUrl(`registrar_endpoints.php?action=delete_id_card_request&id=${id}`));
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
      <h2 className="mb-4">ID Card Requests</h2>
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
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Requests</h5>
          <div className="d-flex gap-2">
            <select
              className="form-select form-select-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All</option>
              <option value="Pending">Pending</option>
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
                  <th>Student</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {requests.length ? (
                  requests.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name || row.reg_no || row.student_id}</td>
                      <td>{row.request_type}</td>
                      <td>{row.status}</td>
                      <td>{row.reason || "-"}</td>
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
