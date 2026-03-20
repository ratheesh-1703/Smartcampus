import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function PlacementOfficerDashboard() {
  const [jobs, setJobs] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  const [jobForm, setJobForm] = useState({
    company_name: "",
    position: "",
    salary: "",
    eligibility: "",
    application_deadline: ""
  });

  const [placementForm, setPlacementForm] = useState({
    student_id: "",
    company_name: "",
    position: "",
    salary: "",
    placement_date: ""
  });

  const loadJobs = async () => {
    const data = await apiCall(buildUrl("placement_officer_endpoints.php?action=get_job_postings"));
    if (data.status) {
      setJobs(data.job_postings || []);
      setError("");
    } else {
      setError(data.message || "Failed to load job postings");
    }
  };

  const loadPlacements = async () => {
    const data = await apiCall(buildUrl("placement_officer_endpoints.php?action=get_student_placements"));
    if (data.status) {
      setPlacements(data.placements || []);
      setError("");
    } else {
      setError(data.message || "Failed to load placements");
    }
  };

  const loadStats = async () => {
    const data = await apiCall(buildUrl("placement_officer_endpoints.php?action=get_placement_stats"));
    if (data.status) {
      setStats(data);
      setError("");
    } else {
      setError(data.message || "Failed to load placement stats");
    }
  };

  const submitJob = async (e) => {
    e.preventDefault();
    const data = await apiCall(buildUrl("placement_officer_endpoints.php?action=add_job_posting"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jobForm)
    });

    if (!data.status) {
      setError(data.message || "Failed to add job posting");
      return;
    }

    setJobForm({ company_name: "", position: "", salary: "", eligibility: "", application_deadline: "" });
    await loadJobs();
  };

  const submitPlacement = async (e) => {
    e.preventDefault();
    const data = await apiCall(buildUrl("placement_officer_endpoints.php?action=record_placement"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(placementForm)
    });

    if (!data.status) {
      setError(data.message || "Failed to record placement");
      return;
    }

    setPlacementForm({ student_id: "", company_name: "", position: "", salary: "", placement_date: "" });
    await loadPlacements();
    await loadStats();
  };

  useEffect(() => {
    loadJobs();
    loadPlacements();
    loadStats();
  }, []);

  return (
    <div>
      <h2 className="mb-4">💼 Placement Officer Dashboard</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row mb-4">
        <div className="col-md-6 col-lg-4 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Placed Students</h6>
              <h3 className="mb-0 fw-bold text-success">{stats?.placed_students || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-4 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Final Year Students</h6>
              <h3 className="mb-0 fw-bold text-primary">{stats?.final_year_students || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-4 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Placement Rate</h6>
              <h3 className="mb-0 fw-bold text-info">{stats?.placement_rate || 0}%</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-light">
              <h5 className="mb-0">📣 Add Job Posting</h5>
            </div>
            <div className="card-body">
              <form onSubmit={submitJob}>
                <div className="mb-2">
                  <label className="form-label">Company</label>
                  <input
                    className="form-control"
                    value={jobForm.company_name}
                    onChange={(e) => setJobForm((prev) => ({ ...prev, company_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">Position</label>
                  <input
                    className="form-control"
                    value={jobForm.position}
                    onChange={(e) => setJobForm((prev) => ({ ...prev, position: e.target.value }))}
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">Salary</label>
                  <input
                    className="form-control"
                    value={jobForm.salary}
                    onChange={(e) => setJobForm((prev) => ({ ...prev, salary: e.target.value }))}
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">Eligibility</label>
                  <input
                    className="form-control"
                    value={jobForm.eligibility}
                    onChange={(e) => setJobForm((prev) => ({ ...prev, eligibility: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Deadline</label>
                  <input
                    type="date"
                    className="form-control"
                    value={jobForm.application_deadline}
                    onChange={(e) => setJobForm((prev) => ({ ...prev, application_deadline: e.target.value }))}
                    required
                  />
                </div>
                <button className="btn btn-primary" type="submit">
                  Add Job
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-light">
              <h5 className="mb-0">✅ Record Placement</h5>
            </div>
            <div className="card-body">
              <form onSubmit={submitPlacement}>
                <div className="mb-2">
                  <label className="form-label">Student ID</label>
                  <input
                    className="form-control"
                    value={placementForm.student_id}
                    onChange={(e) => setPlacementForm((prev) => ({ ...prev, student_id: e.target.value }))}
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">Company</label>
                  <input
                    className="form-control"
                    value={placementForm.company_name}
                    onChange={(e) => setPlacementForm((prev) => ({ ...prev, company_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">Position</label>
                  <input
                    className="form-control"
                    value={placementForm.position}
                    onChange={(e) => setPlacementForm((prev) => ({ ...prev, position: e.target.value }))}
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">Salary</label>
                  <input
                    className="form-control"
                    value={placementForm.salary}
                    onChange={(e) => setPlacementForm((prev) => ({ ...prev, salary: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Placement Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={placementForm.placement_date}
                    onChange={(e) => setPlacementForm((prev) => ({ ...prev, placement_date: e.target.value }))}
                  />
                </div>
                <button className="btn btn-primary" type="submit">
                  Record
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-light">
              <h5 className="mb-0">📄 Active Job Postings</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Position</th>
                      <th>Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.length ? (
                      jobs.map((row) => (
                        <tr key={row.id}>
                          <td>{row.company_name}</td>
                          <td>{row.position}</td>
                          <td>{row.application_deadline}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-muted">No job postings found.</td>
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
              <h5 className="mb-0">🎯 Student Placements</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Company</th>
                      <th>Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {placements.length ? (
                      placements.map((row, idx) => (
                        <tr key={`${row.reg_no}-${idx}`}>
                          <td>{row.name}</td>
                          <td>{row.company_name}</td>
                          <td>{row.position}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-muted">No placements recorded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
