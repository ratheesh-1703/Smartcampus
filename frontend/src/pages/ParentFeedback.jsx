import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function ParentFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [form, setForm] = useState({ student_id: "", feedback_type: "", message: "" });
  const [error, setError] = useState("");

  const loadFeedback = async () => {
    const data = await apiCall(buildUrl("parent_endpoints.php?action=get_feedback"));
    if (data.status) {
      setFeedback(data.feedback || []);
      setError("");
    } else {
      setError(data.message || "Failed to load feedback");
    }
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    const data = await apiCall(buildUrl("parent_endpoints.php?action=add_feedback"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (!data.status) {
      setError(data.message || "Failed to submit feedback");
      return;
    }

    setForm({ student_id: "", feedback_type: "", message: "" });
    await loadFeedback();
  };

  const deleteFeedback = async (id) => {
    const data = await apiCall(buildUrl(`parent_endpoints.php?action=delete_feedback&id=${id}`));
    if (!data.status) {
      setError(data.message || "Failed to delete feedback");
      return;
    }
    await loadFeedback();
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  return (
    <div>
      <h2 className="mb-4">Parent Feedback</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Submit Feedback</h5>
        </div>
        <div className="card-body">
          <form onSubmit={submitFeedback}>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Student ID</label>
                <input
                  className="form-control"
                  value={form.student_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, student_id: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Type</label>
                <input
                  className="form-control"
                  value={form.feedback_type}
                  onChange={(e) => setForm((prev) => ({ ...prev, feedback_type: e.target.value }))}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Message</label>
                <input
                  className="form-control"
                  value={form.message}
                  onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="mt-3">
              <button className="btn btn-primary" type="submit">
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-light">
          <h5 className="mb-0">Feedback History</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Message</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {feedback.length ? (
                  feedback.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name || row.reg_no || row.student_id}</td>
                      <td>{row.feedback_type || "-"}</td>
                      <td>{row.status}</td>
                      <td>{row.message}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteFeedback(row.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-muted">
                      No feedback submitted.
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
