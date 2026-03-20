import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function ExamResults() {
  const [results, setResults] = useState([]);
  const [publishing, setPublishing] = useState([]);
  const [filters, setFilters] = useState({ semester: "", year: "" });
  const [publishForm, setPublishForm] = useState({ exam_id: "", status: "Published" });
  const [error, setError] = useState("");

  const loadResults = async () => {
    const url = buildUrl(
      `exam_controller_endpoints.php?action=get_results&semester=${encodeURIComponent(filters.semester)}&year=${encodeURIComponent(filters.year)}`
    );
    const data = await apiCall(url);
    if (data.status) {
      setResults(data.results || []);
      setError("");
    } else {
      setError(data.message || "Failed to load results");
    }
  };

  const loadPublishing = async () => {
    const data = await apiCall(buildUrl("exam_controller_endpoints.php?action=get_result_publishing"));
    if (data.status) {
      setPublishing(data.publishing || []);
      setError("");
    } else {
      setError(data.message || "Failed to load publishing status");
    }
  };

  const submitPublish = async (e) => {
    e.preventDefault();
    const payload = {
      exam_id: parseInt(publishForm.exam_id, 10),
      status: publishForm.status
    };

    const data = await apiCall(buildUrl("exam_controller_endpoints.php?action=publish_results"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!data.status) {
      setError(data.message || "Failed to update publishing status");
      return;
    }

    setPublishForm({ exam_id: "", status: "Published" });
    await loadPublishing();
  };

  useEffect(() => {
    loadResults();
    loadPublishing();
  }, []);

  return (
    <div>
      <h2 className="mb-4">Results Publishing</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Publish Results</h5>
        </div>
        <div className="card-body">
          <form onSubmit={submitPublish}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Exam ID</label>
                <input
                  className="form-control"
                  value={publishForm.exam_id}
                  onChange={(e) => setPublishForm((prev) => ({ ...prev, exam_id: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={publishForm.status}
                  onChange={(e) => setPublishForm((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
              <div className="col-md-4 d-flex align-items-end">
                <button className="btn btn-primary" type="submit">
                  Update
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Publishing Status</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Exam ID</th>
                  <th>Status</th>
                  <th>Published At</th>
                  <th>Published By</th>
                </tr>
              </thead>
              <tbody>
                {publishing.length ? (
                  publishing.map((row) => (
                    <tr key={row.exam_id}>
                      <td>{row.exam_id}</td>
                      <td>{row.status}</td>
                      <td>{row.published_at || "-"}</td>
                      <td>{row.published_by || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-muted">
                      No publishing records.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-light">
          <h5 className="mb-0">Results</h5>
        </div>
        <div className="card-body">
          <div className="row g-2 mb-3">
            <div className="col">
              <input
                className="form-control"
                placeholder="Semester"
                value={filters.semester}
                onChange={(e) => setFilters((prev) => ({ ...prev, semester: e.target.value }))}
              />
            </div>
            <div className="col">
              <input
                className="form-control"
                placeholder="Year"
                value={filters.year}
                onChange={(e) => setFilters((prev) => ({ ...prev, year: e.target.value }))}
              />
            </div>
            <div className="col-auto">
              <button className="btn btn-outline-primary" onClick={loadResults}>
                Filter
              </button>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Reg No</th>
                  <th>Name</th>
                  <th>Exam</th>
                  <th>Subject</th>
                  <th>Marks</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {results.length ? (
                  results.map((row, idx) => (
                    <tr key={`${row.reg_no}-${row.exam_name}-${idx}`}>
                      <td>{row.reg_no}</td>
                      <td>{row.name}</td>
                      <td>{row.exam_name}</td>
                      <td>{row.subject}</td>
                      <td>{row.marks}</td>
                      <td>{row.grade}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-muted">
                      No results found.
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
