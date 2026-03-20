import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function PlacementJobs() {
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({
    id: "",
    company_name: "",
    position: "",
    salary: "",
    eligibility: "",
    application_deadline: ""
  });
  const [error, setError] = useState("");

  const loadJobs = async () => {
    const data = await apiCall(buildUrl("placement_officer_endpoints.php?action=get_job_postings"));
    if (data.status) {
      setJobs(data.job_postings || []);
      setError("");
    } else {
      setError(data.message || "Failed to load job postings");
    }
  };

  const submitJob = async (e) => {
    e.preventDefault();
    const action = form.id ? "update_job_posting" : "add_job_posting";
    const data = await apiCall(buildUrl(`placement_officer_endpoints.php?action=${action}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (!data.status) {
      setError(data.message || "Failed to save job posting");
      return;
    }

    setForm({ id: "", company_name: "", position: "", salary: "", eligibility: "", application_deadline: "" });
    await loadJobs();
  };

  const editJob = (job) => {
    setForm({
      id: job.id,
      company_name: job.company_name || "",
      position: job.position || "",
      salary: job.salary || "",
      eligibility: job.eligibility || "",
      application_deadline: job.application_deadline || ""
    });
  };

  const deleteJob = async (id) => {
    const data = await apiCall(buildUrl(`placement_officer_endpoints.php?action=delete_job_posting&id=${id}`));
    if (!data.status) {
      setError(data.message || "Failed to delete job posting");
      return;
    }
    await loadJobs();
  };

  useEffect(() => {
    loadJobs();
  }, []);

  return (
    <div>
      <h2 className="mb-4">Job Postings</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Job Posting Form</h5>
        </div>
        <div className="card-body">
          <form onSubmit={submitJob}>
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
                <label className="form-label">Position</label>
                <input
                  className="form-control"
                  value={form.position}
                  onChange={(e) => setForm((prev) => ({ ...prev, position: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Salary</label>
                <input
                  className="form-control"
                  value={form.salary}
                  onChange={(e) => setForm((prev) => ({ ...prev, salary: e.target.value }))}
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
              <div className="col-md-6">
                <label className="form-label">Deadline</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.application_deadline}
                  onChange={(e) => setForm((prev) => ({ ...prev, application_deadline: e.target.value }))}
                  required
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
                onClick={() => setForm({ id: "", company_name: "", position: "", salary: "", eligibility: "", application_deadline: "" })}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-light">
          <h5 className="mb-0">Active Jobs</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Position</th>
                  <th>Deadline</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {jobs.length ? (
                  jobs.map((row) => (
                    <tr key={row.id}>
                      <td>{row.company_name}</td>
                      <td>{row.position}</td>
                      <td>{row.application_deadline}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => editJob(row)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteJob(row.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-muted">
                      No job postings available.
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
