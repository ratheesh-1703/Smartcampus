import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function ExamSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [form, setForm] = useState({
    id: "",
    exam_name: "",
    subject: "",
    dept: "",
    year: "",
    semester: "",
    exam_date: "",
    exam_time: "",
    duration: ""
  });
  const [error, setError] = useState("");

  const loadSchedules = async () => {
    const data = await apiCall(buildUrl("exam_controller_endpoints.php?action=get_exam_schedules"));
    if (data.status) {
      setSchedules(data.schedules || []);
      setError("");
    } else {
      setError(data.message || "Failed to load schedules");
    }
  };

  const submitSchedule = async (e) => {
    e.preventDefault();
    const action = form.id ? "update_exam_schedule" : "add_exam_schedule";
    const payload = {
      ...form,
      year: form.year ? parseInt(form.year, 10) : 0,
      semester: form.semester ? parseInt(form.semester, 10) : 0,
      duration: form.duration ? parseInt(form.duration, 10) : 0
    };

    const data = await apiCall(buildUrl(`exam_controller_endpoints.php?action=${action}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!data.status) {
      setError(data.message || "Failed to save schedule");
      return;
    }

    setForm({ id: "", exam_name: "", subject: "", dept: "", year: "", semester: "", exam_date: "", exam_time: "", duration: "" });
    await loadSchedules();
  };

  const editSchedule = (row) => {
    setForm({
      id: row.id,
      exam_name: row.exam_name || "",
      subject: row.subject || "",
      dept: row.dept || "",
      year: row.year || "",
      semester: row.semester || "",
      exam_date: row.exam_date || "",
      exam_time: row.exam_time || "",
      duration: row.duration || ""
    });
  };

  const deleteSchedule = async (id) => {
    const data = await apiCall(buildUrl(`exam_controller_endpoints.php?action=delete_exam_schedule&id=${id}`));
    if (!data.status) {
      setError(data.message || "Failed to delete schedule");
      return;
    }
    await loadSchedules();
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  return (
    <div>
      <h2 className="mb-4">Exam Schedules</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Schedule Form</h5>
        </div>
        <div className="card-body">
          <form onSubmit={submitSchedule}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Exam Name</label>
                <input
                  className="form-control"
                  value={form.exam_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, exam_name: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Subject</label>
                <input
                  className="form-control"
                  value={form.subject}
                  onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Department</label>
                <input
                  className="form-control"
                  value={form.dept}
                  onChange={(e) => setForm((prev) => ({ ...prev, dept: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Year</label>
                <input
                  className="form-control"
                  value={form.year}
                  onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Semester</label>
                <input
                  className="form-control"
                  value={form.semester}
                  onChange={(e) => setForm((prev) => ({ ...prev, semester: e.target.value }))}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Exam Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.exam_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, exam_date: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Exam Time</label>
                <input
                  type="time"
                  className="form-control"
                  value={form.exam_time}
                  onChange={(e) => setForm((prev) => ({ ...prev, exam_time: e.target.value }))}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Duration (mins)</label>
                <input
                  className="form-control"
                  value={form.duration}
                  onChange={(e) => setForm((prev) => ({ ...prev, duration: e.target.value }))}
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
                onClick={() => setForm({ id: "", exam_name: "", subject: "", dept: "", year: "", semester: "", exam_date: "", exam_time: "", duration: "" })}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-light">
          <h5 className="mb-0">Schedules</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Subject</th>
                  <th>Dept</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {schedules.length ? (
                  schedules.map((row) => (
                    <tr key={row.id}>
                      <td>{row.exam_name}</td>
                      <td>{row.subject}</td>
                      <td>{row.dept}</td>
                      <td>{row.exam_date}</td>
                      <td>{row.exam_time || "-"}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => editSchedule(row)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteSchedule(row.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-muted">
                      No schedules found.
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
