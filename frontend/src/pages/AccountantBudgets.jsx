import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function AccountantBudgets() {
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState([]);
  const [centers, setCenters] = useState([]);
  const [form, setForm] = useState({
    id: "",
    cost_center_id: "",
    fiscal_year: "",
    period: "",
    allocated_amount: "",
    spent_amount: "",
    status: "Open"
  });
  const [error, setError] = useState("");

  const loadCenters = async () => {
    const data = await apiCall(buildUrl("accountant_endpoints.php?action=get_cost_centers"));
    if (data.status) {
      setCenters(data.centers || []);
    }
  };

  const loadBudgets = async () => {
    const data = await apiCall(buildUrl("accountant_endpoints.php?action=get_budgets"));
    if (data.status) {
      setBudgets(data.budgets || []);
      setError("");
    } else {
      setError(data.message || "Failed to load budgets");
    }
  };

  const loadSummary = async () => {
    const data = await apiCall(buildUrl("accountant_endpoints.php?action=get_budget_summary"));
    if (data.status) {
      setSummary(data.summary || []);
    }
  };

  const submitBudget = async (e) => {
    e.preventDefault();
    const action = form.id ? "update_budget" : "add_budget";
    const payload = {
      ...form,
      cost_center_id: form.cost_center_id ? parseInt(form.cost_center_id, 10) : 0,
      allocated_amount: form.allocated_amount ? parseFloat(form.allocated_amount) : 0,
      spent_amount: form.spent_amount ? parseFloat(form.spent_amount) : 0
    };

    const data = await apiCall(buildUrl(`accountant_endpoints.php?action=${action}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!data.status) {
      setError(data.message || "Failed to save budget");
      return;
    }

    setForm({ id: "", cost_center_id: "", fiscal_year: "", period: "", allocated_amount: "", spent_amount: "", status: "Open" });
    await loadBudgets();
    await loadSummary();
  };

  const editBudget = (row) => {
    setForm({
      id: row.id,
      cost_center_id: row.cost_center_id || "",
      fiscal_year: row.fiscal_year || "",
      period: row.period || "",
      allocated_amount: row.allocated_amount || "",
      spent_amount: row.spent_amount || "",
      status: row.status || "Open"
    });
  };

  const deleteBudget = async (id) => {
    const data = await apiCall(buildUrl(`accountant_endpoints.php?action=delete_budget&id=${id}`));
    if (!data.status) {
      setError(data.message || "Failed to delete budget");
      return;
    }
    await loadBudgets();
    await loadSummary();
  };

  useEffect(() => {
    loadCenters();
    loadBudgets();
    loadSummary();
  }, []);

  return (
    <div>
      <h2 className="mb-4">Budget Planning</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Budget Form</h5>
        </div>
        <div className="card-body">
          <form onSubmit={submitBudget}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Cost Center</label>
                <select
                  className="form-select"
                  value={form.cost_center_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, cost_center_id: e.target.value }))}
                  required
                >
                  <option value="">Select...</option>
                  {centers.map((center) => (
                    <option key={center.id} value={center.id}>
                      {center.name} ({center.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label">Fiscal Year</label>
                <input
                  className="form-control"
                  value={form.fiscal_year}
                  onChange={(e) => setForm((prev) => ({ ...prev, fiscal_year: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Period</label>
                <input
                  className="form-control"
                  value={form.period}
                  onChange={(e) => setForm((prev) => ({ ...prev, period: e.target.value }))}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Allocated</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={form.allocated_amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, allocated_amount: e.target.value }))}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Spent</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={form.spent_amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, spent_amount: e.target.value }))}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                  <option value="On Hold">On Hold</option>
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
                onClick={() => setForm({ id: "", cost_center_id: "", fiscal_year: "", period: "", allocated_amount: "", spent_amount: "", status: "Open" })}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Budget Summary</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Cost Center</th>
                  <th>Allocated</th>
                  <th>Spent</th>
                  <th>Remaining</th>
                </tr>
              </thead>
              <tbody>
                {summary.length ? (
                  summary.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name} ({row.code})</td>
                      <td>{row.allocated_total}</td>
                      <td>{row.spent_total}</td>
                      <td>{row.remaining_total}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-muted">
                      No summary available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-light">
          <h5 className="mb-0">Budgets</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Cost Center</th>
                  <th>Fiscal Year</th>
                  <th>Period</th>
                  <th>Allocated</th>
                  <th>Spent</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {budgets.length ? (
                  budgets.map((row) => (
                    <tr key={row.id}>
                      <td>{row.cost_center_name} ({row.cost_center_code})</td>
                      <td>{row.fiscal_year}</td>
                      <td>{row.period || "-"}</td>
                      <td>{row.allocated_amount}</td>
                      <td>{row.spent_amount}</td>
                      <td>{row.status}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => editBudget(row)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteBudget(row.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-muted">
                      No budgets found.
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
