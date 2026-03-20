import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function PlacementInternships() {
  const [internships, setInternships] = useState([]);
  const [form, setForm] = useState({
    id: "",
    company_name: "",
    role_title: "",
    stipend: "",
    eligibility: "",
    deadline: "",
    status: "Open"
  });
  const [error, setError] = useState("");

  const loadInternships = async () => {
    const data = await apiCall(buildUrl("placement_officer_endpoints.php?action=get_internships"));
    if (data.status) {
      setInternships(data.internships || []);
      setError("");
    } else {
      setError(data.message || "Failed to load internships");
    }
  };

  const submitInternship = async (e) => {
    e.preventDefault();
    const action = form.id ? "update_internship" : "add_internship";
    const data = await apiCall(buildUrl(`placement_officer_endpoints.php?action=${action}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (!data.status) {
      setError(data.message || "Failed to save internship");
      return;
    }

    setForm({ id: "", company_name: "", role_title: "", stipend: "", eligibility: "", deadline: "", status: "Open" });
    await loadInternships();
  };

  const editInternship = (row) => {
    setForm({
      id: row.id,
      company_name: row.company_name || "",
      role_title: row.role_title || "",
      stipend: row.stipend || "",
      eligibility: row.eligibility || "",
      deadline: row.deadline || "",
      status: row.status || "Open"
    });
  };

  const deleteInternship = async (id) => {
    const data = await apiCall(buildUrl(`placement_officer_endpoints.php?action=delete_internship&id=${id}`));
    if (!data.status) {
      setError(data.message || "Failed to delete internship");
      return;
    }
    await loadInternships();
  };

  useEffect(() => {
    loadInternships();
  }, []);

  return (
    <div>
      <h2 className="mb-4">Internship Postings</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Internship Form</h5>
        </div>
        <div className="card-body">
          <form onSubmit={submitInternship}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Company</label>
                <input
                  className="form-control"
                  value={form.company_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, company_name: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Role</label>
                <input
                  className="form-control"
                  value={form.role_title}
                  onChange={(e) => setForm((prev) => ({ ...prev, role_title: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Stipend</label>
                <input
                  className="form-control"
                  value={form.stipend}
                  onChange={(e) => setForm((prev) => ({ ...prev, stipend: e.target.value }))}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Eligibility</label>
                <input
                  className="form-control"
                  value={form.eligibility}
                  onChange={(e) => setForm((prev) => ({ ...prev, eligibility: e.target.value }))}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Deadline</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.deadline}
                  onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
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
                onClick={() => setForm({ id: "", company_name: "", role_title: "", stipend: "", eligibility: "", deadline: "", status: "Open" })}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-light">
          <h5 className="mb-0">Internships</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {internships.length ? (
                  internships.map((row) => (
                    <tr key={row.id}>
                      <td>{row.company_name}</td>
                      <td>{row.role_title}</td>
                      <td>{row.deadline || "-"}</td>
                      <td>{row.status}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => editInternship(row)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteInternship(row.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-muted">
                      No internships found.
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
