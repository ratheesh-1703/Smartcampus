import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function PlacementPlacements() {
  const [placements, setPlacements] = useState([]);
  const [form, setForm] = useState({
    id: "",
    student_id: "",
    company_name: "",
    position: "",
    salary: "",
    placement_date: ""
  });
  const [error, setError] = useState("");

  const loadPlacements = async () => {
    const data = await apiCall(buildUrl("placement_officer_endpoints.php?action=get_student_placements"));
    if (data.status) {
      setPlacements(data.placements || []);
      setError("");
    } else {
      setError(data.message || "Failed to load placements");
    }
  };

  const submitPlacement = async (e) => {
    e.preventDefault();
    const action = form.id ? "update_placement" : "record_placement";
    const data = await apiCall(buildUrl(`placement_officer_endpoints.php?action=${action}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (!data.status) {
      setError(data.message || "Failed to save placement");
      return;
    }

    setForm({ id: "", student_id: "", company_name: "", position: "", salary: "", placement_date: "" });
    await loadPlacements();
  };

  const editPlacement = (row) => {
    setForm({
      id: row.id,
      student_id: row.student_id || "",
      company_name: row.company_name || "",
      position: row.position || "",
      salary: row.salary || "",
      placement_date: row.placement_date || ""
    });
  };

  const deletePlacement = async (id) => {
    const data = await apiCall(buildUrl(`placement_officer_endpoints.php?action=delete_placement&id=${id}`));
    if (!data.status) {
      setError(data.message || "Failed to delete placement");
      return;
    }
    await loadPlacements();
  };

  useEffect(() => {
    loadPlacements();
  }, []);

  return (
    <div>
      <h2 className="mb-4">Student Placements</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Placement Form</h5>
        </div>
        <div className="card-body">
          <form onSubmit={submitPlacement}>
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
                <label className="form-label">Company</label>
                <input
                  className="form-control"
                  value={form.company_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, company_name: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Position</label>
                <input
                  className="form-control"
                  value={form.position}
                  onChange={(e) => setForm((prev) => ({ ...prev, position: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Salary</label>
                <input
                  className="form-control"
                  value={form.salary}
                  onChange={(e) => setForm((prev) => ({ ...prev, salary: e.target.value }))}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Placement Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.placement_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, placement_date: e.target.value }))}
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
                onClick={() => setForm({ id: "", student_id: "", company_name: "", position: "", salary: "", placement_date: "" })}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-light">
          <h5 className="mb-0">Placements</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Company</th>
                  <th>Position</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {placements.length ? (
                  placements.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name || row.reg_no}</td>
                      <td>{row.company_name}</td>
                      <td>{row.position}</td>
                      <td>{row.placement_date}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => editPlacement(row)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deletePlacement(row.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-muted">
                      No placements recorded.
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
