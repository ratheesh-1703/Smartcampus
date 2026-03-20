import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function ParentMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [form, setForm] = useState({ id: "", student_id: "", topic: "", requested_date: "", notes: "", status: "Requested", scheduled_at: "" });
  const [error, setError] = useState("");

  const loadMeetings = async () => {
    const data = await apiCall(buildUrl("parent_endpoints.php?action=get_meetings"));
    if (data.status) {
      setMeetings(data.meetings || []);
      setError("");
    } else {
      setError(data.message || "Failed to load meetings");
    }
  };

  const submitMeeting = async (e) => {
    e.preventDefault();
    const action = form.id ? "update_meeting" : "add_meeting";
    const data = await apiCall(buildUrl(`parent_endpoints.php?action=${action}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (!data.status) {
      setError(data.message || "Failed to save meeting");
      return;
    }

    setForm({ id: "", student_id: "", topic: "", requested_date: "", notes: "", status: "Requested", scheduled_at: "" });
    await loadMeetings();
  };

  const editMeeting = (row) => {
    setForm({
      id: row.id,
      student_id: row.student_id || "",
      topic: row.topic || "",
      requested_date: row.requested_date || "",
      notes: row.notes || "",
      status: row.status || "Requested",
      scheduled_at: row.scheduled_at || ""
    });
  };

  const deleteMeeting = async (id) => {
    const data = await apiCall(buildUrl(`parent_endpoints.php?action=delete_meeting&id=${id}`));
    if (!data.status) {
      setError(data.message || "Failed to delete meeting");
      return;
    }
    await loadMeetings();
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  return (
    <div>
      <h2 className="mb-4">Meeting Requests</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Meeting Form</h5>
        </div>
        <div className="card-body">
          <form onSubmit={submitMeeting}>
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
                <label className="form-label">Topic</label>
                <input
                  className="form-control"
                  value={form.topic}
                  onChange={(e) => setForm((prev) => ({ ...prev, topic: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Requested Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.requested_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, requested_date: e.target.value }))}
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
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Notes</label>
                <input
                  className="form-control"
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Scheduled At</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={form.scheduled_at}
                  onChange={(e) => setForm((prev) => ({ ...prev, scheduled_at: e.target.value }))}
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
                onClick={() => setForm({ id: "", student_id: "", topic: "", requested_date: "", notes: "", status: "Requested", scheduled_at: "" })}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-light">
          <h5 className="mb-0">Meetings</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Topic</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {meetings.length ? (
                  meetings.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name || row.reg_no || row.student_id}</td>
                      <td>{row.topic}</td>
                      <td>{row.status}</td>
                      <td>{row.requested_date || "-"}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => editMeeting(row)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteMeeting(row.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-muted">
                      No meetings found.
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
