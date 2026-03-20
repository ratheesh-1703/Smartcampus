import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function ExamMarks() {
  const [marks, setMarks] = useState([]);
  const [examId, setExamId] = useState("");
  const [form, setForm] = useState({ exam_id: "", student_id: "", marks: "", grade: "" });
  const [error, setError] = useState("");

  const loadMarks = async () => {
    if (!examId) return;
    const data = await apiCall(buildUrl(`exam_controller_endpoints.php?action=get_marks&exam_id=${examId}`));
    if (data.status) {
      setMarks(data.marks || []);
      setError("");
    } else {
      setError(data.message || "Failed to load marks");
    }
  };

  const submitMark = async (e) => {
    e.preventDefault();
    const payload = {
      exam_id: parseInt(form.exam_id, 10),
      student_id: parseInt(form.student_id, 10),
      marks: parseFloat(form.marks),
      grade: form.grade
    };

    const data = await apiCall(buildUrl("exam_controller_endpoints.php?action=upload_marks"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!data.status) {
      setError(data.message || "Failed to save mark");
      return;
    }

    setForm({ exam_id: "", student_id: "", marks: "", grade: "" });
    await loadMarks();
  };

  const deleteMark = async (exam_id, student_id) => {
    const data = await apiCall(
      buildUrl(`exam_controller_endpoints.php?action=delete_mark&exam_id=${exam_id}&student_id=${student_id}`)
    );
    if (!data.status) {
      setError(data.message || "Failed to delete mark");
      return;
    }
    await loadMarks();
  };

  useEffect(() => {
    if (examId) loadMarks();
  }, [examId]);

  return (
    <div>
      <h2 className="mb-4">Marks Entry</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Load Exam Marks</h5>
        </div>
        <div className="card-body">
          <div className="d-flex gap-2">
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
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Add or Update Mark</h5>
        </div>
        <div className="card-body">
          <form onSubmit={submitMark}>
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
                <label className="form-label">Student ID</label>
                <input
                  className="form-control"
                  value={form.student_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, student_id: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Marks</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={form.marks}
                  onChange={(e) => setForm((prev) => ({ ...prev, marks: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Grade</label>
                <input
                  className="form-control"
                  value={form.grade}
                  onChange={(e) => setForm((prev) => ({ ...prev, grade: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-3">
              <button className="btn btn-primary" type="submit">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-light">
          <h5 className="mb-0">Marks</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Reg No</th>
                  <th>Name</th>
                  <th>Marks</th>
                  <th>Grade</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {marks.length ? (
                  marks.map((row) => (
                    <tr key={`${row.exam_id}-${row.student_id}`}
                    >
                      <td>{row.reg_no}</td>
                      <td>{row.name}</td>
                      <td>{row.marks}</td>
                      <td>{row.grade}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteMark(row.exam_id, row.student_id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-muted">
                      No marks available.
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
