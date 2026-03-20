import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function RegistrarDashboard() {
  const [records, setRecords] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [transcript, setTranscript] = useState(null);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({ dept: "", year: "" });
  const [admissionYear, setAdmissionYear] = useState(new Date().getFullYear());
  const [studentId, setStudentId] = useState("");

  const loadRecords = async () => {
    const query = `registrar_endpoints.php?action=get_student_records&dept=${encodeURIComponent(
      filters.dept
    )}&year=${encodeURIComponent(filters.year)}`;
    const data = await apiCall(buildUrl(query));
    if (data.status) {
      setRecords(data.records || []);
      setError("");
    } else {
      setError(data.message || "Failed to load student records");
    }
  };

  const loadAdmissions = async () => {
    const data = await apiCall(
      buildUrl(`registrar_endpoints.php?action=get_admissions&year=${admissionYear}`)
    );
    if (data.status) {
      setAdmissions(data.admissions || []);
      setError("");
    } else {
      setError(data.message || "Failed to load admissions");
    }
  };

  const loadTranscript = async () => {
    if (!studentId.trim()) return;
    const data = await apiCall(
      buildUrl(`registrar_endpoints.php?action=get_academic_transcript&student_id=${studentId}`)
    );
    if (data.status) {
      setTranscript({ student: data.student, grades: data.grades || [] });
      setError("");
    } else {
      setTranscript(null);
      setError(data.message || "Failed to load transcript");
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  return (
    <div>
      <h2 className="mb-4">📋 Registrar Dashboard</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row mb-4">
        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-light">
              <h5 className="mb-0">🔎 Student Records</h5>
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
                    placeholder="Year"
                    value={filters.year}
                    onChange={(e) => setFilters((prev) => ({ ...prev, year: e.target.value }))}
                  />
                </div>
                <div className="col-auto">
                  <button className="btn btn-outline-primary" onClick={loadRecords}>
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
                      <th>Dept</th>
                      <th>Year</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.length ? (
                      records.map((row) => (
                        <tr key={row.id}>
                          <td>{row.reg_no}</td>
                          <td>{row.name}</td>
                          <td>{row.dept}</td>
                          <td>{row.year}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-muted">No records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-light">
              <h5 className="mb-0">🎓 Admissions</h5>
            </div>
            <div className="card-body">
              <div className="d-flex gap-2 mb-3">
                <input
                  className="form-control"
                  type="number"
                  value={admissionYear}
                  onChange={(e) => setAdmissionYear(e.target.value)}
                />
                <button className="btn btn-outline-primary" onClick={loadAdmissions}>
                  Load
                </button>
              </div>

              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Reg No</th>
                      <th>Name</th>
                      <th>Dept</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admissions.length ? (
                      admissions.map((row) => (
                        <tr key={row.id}>
                          <td>{row.reg_no}</td>
                          <td>{row.name}</td>
                          <td>{row.dept}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-muted">No admissions found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-light">
          <h5 className="mb-0">📑 Academic Transcript</h5>
        </div>
        <div className="card-body">
          <div className="d-flex gap-2 mb-3">
            <input
              className="form-control"
              placeholder="Student ID"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
            <button className="btn btn-outline-primary" onClick={loadTranscript}>
              Load
            </button>
          </div>

          {transcript ? (
            <div>
              <div className="mb-2">
                <strong>{transcript.student?.name || "Student"}</strong> ({transcript.student?.reg_no || "-"})
              </div>
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Semester</th>
                      <th>GPA</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transcript.grades.length ? (
                      transcript.grades.map((g, idx) => (
                        <tr key={`${g.semester}-${idx}`}>
                          <td>{g.semester}</td>
                          <td>{g.gpa}</td>
                          <td>{g.result}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-muted">No grades available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-muted">Enter a student ID to load transcript.</p>
          )}
        </div>
      </div>
    </div>
  );
}
