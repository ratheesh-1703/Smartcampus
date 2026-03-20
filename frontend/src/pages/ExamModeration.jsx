import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function ExamModeration() {
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState({ id: "", exam_id: "", summary: "", status: "Draft" });
  const [error, setError] = useState("");

  const loadReports = async () => {
    const data = await apiCall(buildUrl("exam_controller_endpoints.php?action=get_moderation_reports"));
    if (data.status) {
      setReports(data.reports || []);
      setError("");
    } else {
      setError(data.message || "Failed to load reports");
    }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    const action = form.id ? "update_moderation_report" : "add_moderation_report";
    const payload = {
      ...form,
      exam_id: form.exam_id ? parseInt(form.exam_id, 10) : 0
    };

    const data = await apiCall(buildUrl(`exam_controller_endpoints.php?action=${action}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!data.status) {
      setError(data.message || "Failed to save report");
      return;
    }

    setForm({ id: "", exam_id: "", summary: "", status: "Draft" });
    await loadReports();
  };

  const editReport = (row) => {
    setForm({
      id: row.id,
      exam_id: row.exam_id || "",
      summary: row.summary || "",
      status: row.status || "Draft"
    });
  };

  const deleteReport = async (id) => {
    const data = await apiCall(buildUrl(`exam_controller_endpoints.php?action=delete_moderation_report&id=${id}`));
    if (!data.status) {
      setError(data.message || "Failed to delete report");
      return;
    }
    await loadReports();
  };

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div>
      <h2 className="mb-4">Moderation Reports</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Report Form</h5>
        </div>
        <div className="card-body">
          <form onSubmit={submitReport}>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Exam ID</label>
                <input
                  className="form-control"
                  value={form.exam_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, exam_id: e.target.value }))}
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
                  <option value="Draft">Draft</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Finalized">Finalized</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Summary</label>
                <input
                  className="form-control"
                  value={form.summary}
                  onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
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
                onClick={() => setForm({ id: "", exam_id: "", summary: "", status: "Draft" })}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-light">
          <h5 className="mb-0">Reports</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Status</th>
                  <th>Summary</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reports.length ? (
                  reports.map((row) => (
                    <tr key={row.id}>
                      <td>{row.exam_name || row.exam_id}</td>
                      <td>{row.status}</td>
                      <td>{row.summary || "-"}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => editReport(row)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteReport(row.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-muted">
                      No reports found.
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
