import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

const emptyForm = {
  student_name: "",
  reg_no: "",
  topic: "",
  session_date: "",
  status: "Scheduled",
  notes: ""
};

export default function AffairsCounseling() {
  const [form, setForm] = useState(emptyForm);
  const [filters, setFilters] = useState({ q: "", status: "" });
  const [sessions, setSessions] = useState([]);
  const [rowEdits, setRowEdits] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSessions = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.q.trim()) params.set("q", filters.q.trim());
    if (filters.status) params.set("status", filters.status);

    const url = buildUrl(
      `get_affairs_counseling.php${params.toString() ? `?${params.toString()}` : ""}`
    );

    const data = await apiCall(url);
    if (data.status) {
      setSessions(data.sessions || []);
      setError("");
    } else {
      setSessions([]);
      setError(data.message || "Failed to load sessions");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.topic.trim() || !form.session_date) return;

    const data = await apiCall(buildUrl("add_affairs_counseling.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (data.status) {
      setForm(emptyForm);
      loadSessions();
    } else {
      setError(data.message || "Failed to add session");
    }
  };

  const updateSession = async (id) => {
    const edit = rowEdits[id] || {};
    const status = edit.status || sessions.find((s) => s.id === id)?.status || "Scheduled";
    const notes = edit.notes || "";

    const data = await apiCall(buildUrl("update_affairs_counseling.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, notes })
    });

    if (data.status) {
      loadSessions();
    } else {
      setError(data.message || "Failed to update session");
    }
  };

  return (
    <div className="container mt-3">
      <h2>Student Counseling</h2>

      <div className="card p-3 mt-3">
        <h5 className="mb-3">Log Counseling Session</h5>
        <form className="row g-3" onSubmit={handleSubmit}>
          <div className="col-md-4">
            <label className="form-label">Student Name</label>
            <input
              className="form-control"
              name="student_name"
              value={form.student_name}
              onChange={handleChange}
              placeholder="Student name"
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Reg No</label>
            <input
              className="form-control"
              name="reg_no"
              value={form.reg_no}
              onChange={handleChange}
              placeholder="Reg no"
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Topic</label>
            <input
              className="form-control"
              name="topic"
              value={form.topic}
              onChange={handleChange}
              placeholder="Reason or topic"
              required
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-control"
              name="session_date"
              value={form.session_date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              <option>Scheduled</option>
              <option>Completed</option>
              <option>Follow-up</option>
            </select>
          </div>
          <div className="col-md-10">
            <label className="form-label">Notes</label>
            <input
              className="form-control"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Notes"
            />
          </div>
          <div className="col-12">
            <button className="btn btn-primary" type="submit">
              Add Session
            </button>
          </div>
        </form>
      </div>

      <div className="card p-3 mt-3">
        <div className="d-flex flex-wrap gap-2 align-items-end">
          <div className="flex-grow-1">
            <label className="form-label">Search</label>
            <input
              className="form-control"
              name="q"
              value={filters.q}
              onChange={handleFilterChange}
              placeholder="Search by student, reg no, topic"
            />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select
              className="form-select"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All</option>
              <option>Scheduled</option>
              <option>Completed</option>
              <option>Follow-up</option>
            </select>
          </div>
          <div>
            <button className="btn btn-outline-primary" onClick={loadSessions}>
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      <div className="card p-3 mt-3">
        <h5 className="mb-3">Recent Sessions</h5>
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Topic</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => {
                  const edit = rowEdits[session.id] || {};
                  return (
                    <tr key={session.id}>
                      <td>
                        <div>{session.student_name || "-"}</div>
                        <div className="text-muted small">{session.reg_no || ""}</div>
                      </td>
                      <td>{session.topic}</td>
                      <td>{session.session_date}</td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={edit.status || session.status}
                          onChange={(e) =>
                            setRowEdits((prev) => ({
                              ...prev,
                              [session.id]: { ...prev[session.id], status: e.target.value }
                            }))
                          }
                        >
                          <option>Scheduled</option>
                          <option>Completed</option>
                          <option>Follow-up</option>
                        </select>
                      </td>
                      <td>
                        <input
                          className="form-control form-control-sm"
                          value={edit.notes ?? ""}
                          onChange={(e) =>
                            setRowEdits((prev) => ({
                              ...prev,
                              [session.id]: { ...prev[session.id], notes: e.target.value }
                            }))
                          }
                        />
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => updateSession(session.id)}
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center">No sessions yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
