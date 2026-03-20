import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function PlacementCompanies() {
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({
    id: "",
    company_name: "",
    industry: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    status: "Active"
  });
  const [error, setError] = useState("");

  const loadCompanies = async () => {
    const data = await apiCall(buildUrl("placement_officer_endpoints.php?action=get_companies"));
    if (data.status) {
      setCompanies(data.companies || []);
      setError("");
    } else {
      setError(data.message || "Failed to load companies");
    }
  };

  const submitCompany = async (e) => {
    e.preventDefault();
    const action = form.id ? "update_company" : "add_company";
    const data = await apiCall(buildUrl(`placement_officer_endpoints.php?action=${action}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (!data.status) {
      setError(data.message || "Failed to save company");
      return;
    }

    setForm({ id: "", company_name: "", industry: "", contact_name: "", contact_email: "", contact_phone: "", address: "", status: "Active" });
    await loadCompanies();
  };

  const editCompany = (row) => {
    setForm({
      id: row.id,
      company_name: row.company_name || "",
      industry: row.industry || "",
      contact_name: row.contact_name || "",
      contact_email: row.contact_email || "",
      contact_phone: row.contact_phone || "",
      address: row.address || "",
      status: row.status || "Active"
    });
  };

  const deleteCompany = async (id) => {
    const data = await apiCall(buildUrl(`placement_officer_endpoints.php?action=delete_company&id=${id}`));
    if (!data.status) {
      setError(data.message || "Failed to delete company");
      return;
    }
    await loadCompanies();
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  return (
    <div>
      <h2 className="mb-4">Company Directory</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Company Form</h5>
        </div>
        <div className="card-body">
          <form onSubmit={submitCompany}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Company Name</label>
                <input
                  className="form-control"
                  value={form.company_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, company_name: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Industry</label>
                <input
                  className="form-control"
                  value={form.industry}
                  onChange={(e) => setForm((prev) => ({ ...prev, industry: e.target.value }))}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Contact Name</label>
                <input
                  className="form-control"
                  value={form.contact_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, contact_name: e.target.value }))}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Contact Email</label>
                <input
                  className="form-control"
                  value={form.contact_email}
                  onChange={(e) => setForm((prev) => ({ ...prev, contact_email: e.target.value }))}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Contact Phone</label>
                <input
                  className="form-control"
                  value={form.contact_phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, contact_phone: e.target.value }))}
                />
              </div>
              <div className="col-md-4">
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
              <div className="col-12">
                <label className="form-label">Address</label>
                <input
                  className="form-control"
                  value={form.address}
                  onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
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
                onClick={() => setForm({ id: "", company_name: "", industry: "", contact_name: "", contact_email: "", contact_phone: "", address: "", status: "Active" })}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-light">
          <h5 className="mb-0">Companies</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Industry</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {companies.length ? (
                  companies.map((row) => (
                    <tr key={row.id}>
                      <td>{row.company_name}</td>
                      <td>{row.industry || "-"}</td>
                      <td>{row.contact_name || "-"}</td>
                      <td>{row.status}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => editCompany(row)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteCompany(row.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-muted">
                      No companies found.
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
