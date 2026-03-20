import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function PlacementInternshipApplications() {
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState({ id: "", internship_id: "", student_id: "", status: "Applied", notes: "" });
  const [filterId, setFilterId] = useState("");
  const [error, setError] = useState("");

  const loadApplications = async () => {
    const url = buildUrl(
      `placement_officer_endpoints.php?action=get_internship_applications&internship_id=${encodeURIComponent(filterId)}`
    );
    const data = await apiCall(url);
    if (data.status) {
      setApplications(data.applications || []);
      setError("");
    } else {
      setError(data.message || "Failed to load applications");
    }
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    const action = form.id ? "update_internship_application" : "add_internship_application";
    const payload = {
      ...form,
      id: form.id ? parseInt(form.id, 10) : undefined,
      internship_id: form.internship_id ? parseInt(form.internship_id, 10) : 0,
      student_id: form.student_id ? parseInt(form.student_id, 10) : 0
    };

    const data = await apiCall(buildUrl(`placement_officer_endpoints.php?action=${action}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!data.status) {
      setError(data.message || "Failed to save application");
      return;
    }

    setForm({ id: "", internship_id: "", student_id: "", status: "Applied", notes: "" });
    await loadApplications();
  };

  const editApplication = (row) => {
    setForm({
      id: row.id,
      internship_id: row.internship_id || "",
      student_id: row.student_id || "",
      status: row.status || "Applied",
      notes: row.notes || ""
    });
  };

  const deleteApplication = async (id) => {
    const data = await apiCall(buildUrl(`placement_officer_endpoints.php?action=delete_internship_application&id=${id}`));
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
      <h2 className="mb-4">Internship Applications</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Application Form</h5>
        </div>
        <div className="card-body">
          <form onSubmit={submitApplication}>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Internship ID</label>
                <input
                  className="form-control"
                  value={form.internship_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, internship_id: e.target.value }))}
                  required={!form.id}
                />
              </div>
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
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Applied">Applied</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Selected">Selected</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Notes</label>
                <input
                  className="form-control"
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
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
                onClick={() => setForm({ id: "", internship_id: "", student_id: "", status: "Applied", notes: "" })}
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
            <input
              className="form-control form-control-sm"
              placeholder="Internship ID"
              value={filterId}
              onChange={(e) => setFilterId(e.target.value)}
            />
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
                  <th>Student</th>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {applications.length ? (
                  applications.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name || row.reg_no || row.student_id}</td>
                      <td>{row.company_name || "-"}</td>
                      <td>{row.role_title || "-"}</td>
                      <td>{row.status}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => editApplication(row)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteApplication(row.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-muted">
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
