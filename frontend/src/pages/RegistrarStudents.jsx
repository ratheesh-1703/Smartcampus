import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function RegistrarStudents() {
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({ dept: "", year: "" });
  const [form, setForm] = useState({ student_id: "", email: "", dept: "", year: "", section: "" });
  const [error, setError] = useState("");

  const loadRecords = async () => {
    const url = buildUrl(
      `registrar_endpoints.php?action=get_student_records&dept=${encodeURIComponent(filters.dept)}&year=${encodeURIComponent(filters.year)}`
    );
    const data = await apiCall(url);
    if (data.status) {
      setRecords(data.records || []);
      setError("");
    } else {
      setError(data.message || "Failed to load student records");
    }
  };

  const submitUpdate = async (e) => {
    e.preventDefault();
    const payload = {
      student_id: parseInt(form.student_id, 10),
      email: form.email,
      dept: form.dept,
      year: form.year ? parseInt(form.year, 10) : 0,
      section: form.section
    };

    const data = await apiCall(buildUrl("registrar_endpoints.php?action=update_student_record"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!data.status) {
      setError(data.message || "Failed to update record");
      return;
    }

    setForm({ student_id: "", email: "", dept: "", year: "", section: "" });
    await loadRecords();
  };

  const selectRecord = (record) => {
    setForm({
      student_id: record.id,
      email: record.email || "",
      dept: record.dept || "",
      year: record.year || "",
      section: record.section || ""
    });
  };

  useEffect(() => {
    loadRecords();
  }, []);

  return (
    <div>
      <h2 className="mb-4">Student Records</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Filter</h5>
        </div>
        <div className="card-body">
          <div className="row g-2">
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
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Update Student</h5>
        </div>
        <div className="card-body">
          <form onSubmit={submitUpdate}>
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
                <label className="form-label">Email</label>
                <input
                  className="form-control"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Department</label>
                <input
                  className="form-control"
                  value={form.dept}
                  onChange={(e) => setForm((prev) => ({ ...prev, dept: e.target.value }))}
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
                <label className="form-label">Section</label>
                <input
                  className="form-control"
                  value={form.section}
                  onChange={(e) => setForm((prev) => ({ ...prev, section: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-3">
              <button className="btn btn-primary" type="submit">
                Update
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-light">
          <h5 className="mb-0">Student List</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Reg No</th>
                  <th>Name</th>
                  <th>Dept</th>
                  <th>Year</th>
                  <th></th>
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
                      <td>
                        <button className="btn btn-sm btn-outline-primary" onClick={() => selectRecord(row)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-muted">
                      No students found.
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
