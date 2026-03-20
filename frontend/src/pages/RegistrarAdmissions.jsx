import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function RegistrarAdmissions() {
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState({
    id: "",
    full_name: "",
    email: "",
    phone: "",
    dept: "",
    program: "",
    year: "",
    status: "Pending"
  });
  const [filterStatus, setFilterStatus] = useState("");
  const [error, setError] = useState("");

  const loadApplications = async () => {
    const url = buildUrl(
      `registrar_endpoints.php?action=get_admission_applications&status=${encodeURIComponent(filterStatus)}`
    );
    const data = await apiCall(url);
    if (data.status) {
      setApplications(data.applications || []);
      setError("");
    } else {
      setError(data.message || "Failed to load applications");
    }
  };

  const submitForm = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      year: form.year ? parseInt(form.year, 10) : 0
    };

    const action = form.id ? "update_admission_application" : "add_admission_application";
    const data = await apiCall(buildUrl(`registrar_endpoints.php?action=${action}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!data.status) {
      setError(data.message || "Failed to save application");
      return;
    }

    setForm({ id: "", full_name: "", email: "", phone: "", dept: "", program: "", year: "", status: "Pending" });
    await loadApplications();
  };

  const editApplication = (app) => {
    setForm({
      id: app.id,
      full_name: app.full_name || "",
      email: app.email || "",
      phone: app.phone || "",
      dept: app.dept || "",
      program: app.program || "",
      year: app.year || "",
      status: app.status || "Pending"
    });
  };

  const deleteApplication = async (id) => {
    const data = await apiCall(buildUrl(`registrar_endpoints.php?action=delete_admission_application&id=${id}`));
    if (!data.status) {
      setError(data.message || "Failed to delete application");
      return;
    }
    await loadApplications();
  };

  useEffect(() => {
    loadApplications();
  }, []);

  return (
    <div>
      <h2 className="mb-4">Admissions Applications</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Application Form</h5>
        </div>
        <div className="card-body">
          <form onSubmit={submitForm}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Full Name</label>
                <input
                  className="form-control"
                  value={form.full_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Email</label>
                <input
                  className="form-control"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Phone</label>
                <input
                  className="form-control"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Department</label>
                <input
                  className="form-control"
                  value={form.dept}
                  onChange={(e) => setForm((prev) => ({ ...prev, dept: e.target.value }))}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Program</label>
                <input
                  className="form-control"
                  value={form.program}
                  onChange={(e) => setForm((prev) => ({ ...prev, program: e.target.value }))}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Year</label>
                <input
                  className="form-control"
                  value={form.year}
                  onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div className="mt-3">
              <button className="btn btn-primary" type="submit">
                {form.id ? "Update" : "Add"}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary ms-2"
                onClick={() => setForm({ id: "", full_name: "", email: "", phone: "", dept: "", program: "", year: "", status: "Pending" })}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Applications</h5>
          <div className="d-flex gap-2">
            <select
              className="form-select form-select-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <button className="btn btn-sm btn-outline-primary" onClick={loadApplications}>
              Filter
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Dept</th>
                  <th>Program</th>
                  <th>Year</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {applications.length ? (
                  applications.map((app) => (
                    <tr key={app.id}>
                      <td>{app.full_name}</td>
                      <td>{app.dept || "-"}</td>
                      <td>{app.program || "-"}</td>
                      <td>{app.year || "-"}</td>
                      <td>{app.status}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => editApplication(app)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteApplication(app.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-muted">
                      No applications found.
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
