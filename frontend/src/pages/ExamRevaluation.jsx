import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function ExamRevaluation() {
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ id: "", exam_id: "", student_id: "", reason: "", status: "Pending", updated_marks: "", updated_grade: "" });
  const [filters, setFilters] = useState({ exam_id: "", status: "" });
  const [error, setError] = useState("");

  const loadRequests = async () => {
    const url = buildUrl(
      `exam_controller_endpoints.php?action=get_revaluation_requests&exam_id=${encodeURIComponent(filters.exam_id)}&status=${encodeURIComponent(filters.status)}`
    );
    const data = await apiCall(url);
    if (data.status) {
      setRequests(data.requests || []);
      setError("");
    } else {
      setError(data.message || "Failed to load requests");
    }
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    const action = form.id ? "update_revaluation_request" : "add_revaluation_request";
    const payload = {
      ...form,
      exam_id: form.exam_id ? parseInt(form.exam_id, 10) : 0,
      student_id: form.student_id ? parseInt(form.student_id, 10) : 0,
      updated_marks: form.updated_marks === "" ? undefined : parseFloat(form.updated_marks)
    };

    const data = await apiCall(buildUrl(`exam_controller_endpoints.php?action=${action}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!data.status) {
      setError(data.message || "Failed to save request");
      return;
    }

    setForm({ id: "", exam_id: "", student_id: "", reason: "", status: "Pending", updated_marks: "", updated_grade: "" });
    await loadRequests();
  };

  const editRequest = (row) => {
    setForm({
      id: row.id,
      exam_id: row.exam_id || "",
      student_id: row.student_id || "",
      reason: row.reason || "",
      status: row.status || "Pending",
      updated_marks: row.updated_marks ?? "",
      updated_grade: row.updated_grade || ""
    });
  };

  const deleteRequest = async (id) => {
    const data = await apiCall(buildUrl(`exam_controller_endpoints.php?action=delete_revaluation_request&id=${id}`));
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
      <h2 className="mb-4">Revaluation Requests</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Request Form</h5>
        </div>
        <div className="card-body">
          <form onSubmit={submitRequest}>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Exam ID</label>
                <input
                  className="form-control"
                  value={form.exam_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, exam_id: e.target.value }))}
                  required={!form.id}
                />
              </div>
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
                <label className="form-label">Updated Marks</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={form.updated_marks}
                  onChange={(e) => setForm((prev) => ({ ...prev, updated_marks: e.target.value }))}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Updated Grade</label>
                <input
                  className="form-control"
                  value={form.updated_grade}
                  onChange={(e) => setForm((prev) => ({ ...prev, updated_grade: e.target.value }))}
                />
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
                onClick={() => setForm({ id: "", exam_id: "", student_id: "", reason: "", status: "Pending", updated_marks: "", updated_grade: "" })}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Requests</h5>
          <div className="d-flex gap-2">
            <input
              className="form-control form-control-sm"
              placeholder="Exam ID"
              value={filters.exam_id}
              onChange={(e) => setFilters((prev) => ({ ...prev, exam_id: e.target.value }))}
            />
            <select
              className="form-select form-select-sm"
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
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
                  <th>Exam</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {requests.length ? (
                  requests.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name || row.reg_no || row.student_id}</td>
                      <td>{row.exam_name || row.exam_id}</td>
                      <td>{row.status}</td>
                      <td>{row.updated_marks ?? "-"}</td>
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
