import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function AccountantCostCenters() {
  const [centers, setCenters] = useState([]);
  const [form, setForm] = useState({ id: "", name: "", code: "", owner: "", status: "Active" });
  const [error, setError] = useState("");

  const loadCenters = async () => {
    const data = await apiCall(buildUrl("accountant_endpoints.php?action=get_cost_centers"));
    if (data.status) {
      setCenters(data.centers || []);
      setError("");
    } else {
      setError(data.message || "Failed to load cost centers");
    }
  };

  const submitCenter = async (e) => {
    e.preventDefault();
    const action = form.id ? "update_cost_center" : "add_cost_center";
    const data = await apiCall(buildUrl(`accountant_endpoints.php?action=${action}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (!data.status) {
      setError(data.message || "Failed to save cost center");
      return;
    }

    setForm({ id: "", name: "", code: "", owner: "", status: "Active" });
    await loadCenters();
  };

  const editCenter = (row) => {
    setForm({
      id: row.id,
      name: row.name || "",
      code: row.code || "",
      owner: row.owner || "",
      status: row.status || "Active"
    });
  };

  const deleteCenter = async (id) => {
    const data = await apiCall(buildUrl(`accountant_endpoints.php?action=delete_cost_center&id=${id}`));
    if (!data.status) {
      setError(data.message || "Failed to delete cost center");
      return;
    }
    await loadCenters();
  };

  useEffect(() => {
    loadCenters();
  }, []);

  return (
    <div>
      <h2 className="mb-4">Cost Centers</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Cost Center Form</h5>
        </div>
        <div className="card-body">
          <form onSubmit={submitCenter}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Name</label>
                <input
                  className="form-control"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Code</label>
                <input
                  className="form-control"
                  value={form.code}
                  onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Owner</label>
                <input
                  className="form-control"
                  value={form.owner}
                  onChange={(e) => setForm((prev) => ({ ...prev, owner: e.target.value }))}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
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
                onClick={() => setForm({ id: "", name: "", code: "", owner: "", status: "Active" })}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-light">
          <h5 className="mb-0">Cost Centers</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {centers.length ? (
                  centers.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name}</td>
                      <td>{row.code}</td>
                      <td>{row.owner || "-"}</td>
                      <td>{row.status}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => editCenter(row)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteCenter(row.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-muted">
                      No cost centers found.
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
