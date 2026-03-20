import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

const emptyForm = {
  student_name: "",
  reg_no: "",
  category: "",
  record_date: "",
  status: "Open",
  notes: ""
};

export default function AffairsHealth() {
  const [form, setForm] = useState(emptyForm);
  const [filters, setFilters] = useState({ q: "", status: "" });
  const [records, setRecords] = useState([]);
  const [rowEdits, setRowEdits] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecords = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.q.trim()) params.set("q", filters.q.trim());
    if (filters.status) params.set("status", filters.status);

    const url = buildUrl(
      `get_affairs_health.php${params.toString() ? `?${params.toString()}` : ""}`
    );

    const data = await apiCall(url);
    if (data.status) {
      setRecords(data.records || []);
      setError("");
    } else {
      setRecords([]);
      setError(data.message || "Failed to load records");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRecords();
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
    if (!form.category.trim() || !form.record_date) return;

    const data = await apiCall(buildUrl("add_affairs_health.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (data.status) {
      setForm(emptyForm);
      loadRecords();
    } else {
      setError(data.message || "Failed to add record");
    }
  };

  const updateRecord = async (id) => {
    const edit = rowEdits[id] || {};
    const status = edit.status || records.find((r) => r.id === id)?.status || "Open";
    const notes = edit.notes || "";

    const data = await apiCall(buildUrl("update_affairs_health.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, notes })
    });

    if (data.status) {
      loadRecords();
    } else {
      setError(data.message || "Failed to update record");
    }
  };

  return (
    <div className="container mt-3">
      <h2>Health Records</h2>

      <div className="card p-3 mt-3">
        <h5 className="mb-3">Add Health Record</h5>
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
          <div className="col-md-3">
            <label className="form-label">Category</label>
            <input
              className="form-control"
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="Category"
              required
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Record Date</label>
            <input
              type="date"
              className="form-control"
              name="record_date"
              value={form.record_date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              <option>Open</option>
              <option>Resolved</option>
              <option>Monitor</option>
            </select>
          </div>
          <div className="col-md-9">
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
              Add Record
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
              placeholder="Search by student, reg no, category"
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
              <option>Open</option>
              <option>Resolved</option>
              <option>Monitor</option>
            </select>
          </div>
          <div>
            <button className="btn btn-outline-primary" onClick={loadRecords}>
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      <div className="card p-3 mt-3">
        <h5 className="mb-3">Health Records</h5>
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => {
                  const edit = rowEdits[record.id] || {};
                  return (
                    <tr key={record.id}>
                      <td>
                        <div>{record.student_name || "-"}</div>
                        <div className="text-muted small">{record.reg_no || ""}</div>
                      </td>
                      <td>{record.category}</td>
                      <td>{record.record_date}</td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={edit.status || record.status}
                          onChange={(e) =>
                            setRowEdits((prev) => ({
                              ...prev,
                              [record.id]: { ...prev[record.id], status: e.target.value }
                            }))
                          }
                        >
                          <option>Open</option>
                          <option>Resolved</option>
                          <option>Monitor</option>
                        </select>
                      </td>
                      <td>
                        <input
                          className="form-control form-control-sm"
                          value={edit.notes ?? ""}
                          onChange={(e) =>
                            setRowEdits((prev) => ({
                              ...prev,
                              [record.id]: { ...prev[record.id], notes: e.target.value }
                            }))
                          }
                        />
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => updateRecord(record.id)}
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {records.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center">No records found.</td>
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
