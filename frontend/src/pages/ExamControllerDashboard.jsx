import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function ExamControllerDashboard() {
  const [schedules, setSchedules] = useState([]);
  const [marks, setMarks] = useState([]);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({ dept: "", semester: "" });
  const [examId, setExamId] = useState("");
  const [markForm, setMarkForm] = useState({ exam_id: "", student_id: "", marks: "", grade: "" });
  const [resultFilters, setResultFilters] = useState({ semester: "", year: "" });

  const loadSchedules = async () => {
    const query = `exam_controller_endpoints.php?action=get_exam_schedules&dept=${encodeURIComponent(
      filters.dept
    )}&semester=${encodeURIComponent(filters.semester)}`;
    const data = await apiCall(buildUrl(query));
    if (data.status) {
      setSchedules(data.schedules || []);
      setError("");
    } else {
      setError(data.message || "Failed to load exam schedules");
    }
  };

  const loadMarks = async () => {
    if (!examId) return;
    const data = await apiCall(
      buildUrl(`exam_controller_endpoints.php?action=get_marks&exam_id=${examId}`)
    );
    if (data.status) {
      setMarks(data.marks || []);
      setError("");
    } else {
      setError(data.message || "Failed to load marks");
    }
  };

  const submitMarks = async (e) => {
    e.preventDefault();
    const payload = {
      exam_id: parseInt(markForm.exam_id, 10),
      student_id: parseInt(markForm.student_id, 10),
      marks: parseFloat(markForm.marks),
      grade: markForm.grade
    };

    const data = await apiCall(buildUrl("exam_controller_endpoints.php?action=upload_marks"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!data.status) {
      setError(data.message || "Failed to upload marks");
      return;
    }

    setMarkForm({ exam_id: "", student_id: "", marks: "", grade: "" });
    await loadMarks();
  };

  const loadResults = async () => {
    const query = `exam_controller_endpoints.php?action=get_results&semester=${encodeURIComponent(
      resultFilters.semester
    )}&year=${encodeURIComponent(resultFilters.year)}`;
    const data = await apiCall(buildUrl(query));
    if (data.status) {
      setResults(data.results || []);
      setError("");
    } else {
      setError(data.message || "Failed to load results");
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  return (
    <div>
      <h2 className="mb-4">📝 Exam Controller Dashboard</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">📅 Exam Schedules</h5>
        </div>
        <div className="card-body">
          <div className="row g-2 mb-3">
            <div className="col">
              <input
                className="form-control"
                placeholder="Department"
                value={filters.dept}
                onChange={(e) => setFilters((prev) => ({ ...prev, dept: e.target.value }))}
              />
            </div>
            <div className="col">
              <input
                className="form-control"
                placeholder="Semester"
                value={filters.semester}
                onChange={(e) => setFilters((prev) => ({ ...prev, semester: e.target.value }))}
              />
            </div>
            <div className="col-auto">
              <button className="btn btn-outline-primary" onClick={loadSchedules}>
                Filter
              </button>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Subject</th>
                  <th>Dept</th>
                  <th>Date</th>
                  <th>Time</th>
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-muted">No schedules available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-light">
              <h5 className="mb-0">📊 View Marks</h5>
            </div>
            <div className="card-body">
              <div className="d-flex gap-2 mb-3">
                <input
                  className="form-control"
                  placeholder="Exam ID"
                  value={examId}
                  onChange={(e) => setExamId(e.target.value)}
                />
                <button className="btn btn-outline-primary" onClick={loadMarks}>
                  Load
                </button>
              </div>
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Reg No</th>
                      <th>Name</th>
                      <th>Marks</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marks.length ? (
                      marks.map((row, idx) => (
                        <tr key={`${row.reg_no}-${idx}`}>
                          <td>{row.reg_no}</td>
                          <td>{row.name}</td>
                          <td>{row.marks}</td>
                          <td>{row.grade}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-muted">No marks available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-light">
              <h5 className="mb-0">➕ Upload Marks</h5>
            </div>
            <div className="card-body">
              <form onSubmit={submitMarks}>
                <div className="mb-2">
                  <label className="form-label">Exam ID</label>
                  <input
                    className="form-control"
                    value={markForm.exam_id}
                    onChange={(e) => setMarkForm((prev) => ({ ...prev, exam_id: e.target.value }))}
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">Student ID</label>
                  <input
                    className="form-control"
                    value={markForm.student_id}
                    onChange={(e) => setMarkForm((prev) => ({ ...prev, student_id: e.target.value }))}
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">Marks</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={markForm.marks}
                    onChange={(e) => setMarkForm((prev) => ({ ...prev, marks: e.target.value }))}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Grade</label>
                  <input
                    className="form-control"
                    value={markForm.grade}
                    onChange={(e) => setMarkForm((prev) => ({ ...prev, grade: e.target.value }))}
                  />
                </div>
                <button className="btn btn-primary" type="submit">
                  Save Marks
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-light">
          <h5 className="mb-0">📈 Results Overview</h5>
        </div>
        <div className="card-body">
          <div className="row g-2 mb-3">
            <div className="col">
              <input
                className="form-control"
                placeholder="Semester"
                value={resultFilters.semester}
                onChange={(e) => setResultFilters((prev) => ({ ...prev, semester: e.target.value }))}
              />
            </div>
            <div className="col">
              <input
                className="form-control"
                placeholder="Year"
                value={resultFilters.year}
                onChange={(e) => setResultFilters((prev) => ({ ...prev, year: e.target.value }))}
              />
            </div>
            <div className="col-auto">
              <button className="btn btn-outline-primary" onClick={loadResults}>
                Load
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
                    <tr key={`${row.reg_no}-${idx}`}>
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
                    <td colSpan="6" className="text-muted">No results available.</td>
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
