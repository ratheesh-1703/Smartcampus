import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function AccountantFees() {
  const [fees, setFees] = useState([]);
  const [form, setForm] = useState({ student_id: "", total_fees: "" });
  const [error, setError] = useState("");

  const loadFees = async () => {
    const data = await apiCall(buildUrl("accountant_endpoints.php?action=get_fees"));
    if (data.status) {
      setFees(data.fees || []);
      setError("");
    } else {
      setError(data.message || "Failed to load fees");
    }
  };

  const submitFee = async (e) => {
    e.preventDefault();
    const payload = {
      student_id: parseInt(form.student_id, 10),
      total_fees: parseFloat(form.total_fees)
    };

    const data = await apiCall(buildUrl("accountant_endpoints.php?action=upsert_fee"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!data.status) {
      setError(data.message || "Failed to save fee record");
      return;
    }

    setForm({ student_id: "", total_fees: "" });
    await loadFees();
  };

  const deleteFee = async (studentId) => {
    const data = await apiCall(
      buildUrl(`accountant_endpoints.php?action=delete_fee&student_id=${studentId}`)
    );
    if (!data.status) {
      setError(data.message || "Failed to delete fee record");
      return;
    }
    await loadFees();
  };

  useEffect(() => {
    loadFees();
  }, []);

  return (
    <div>
      <h2 className="mb-4">Fees Management</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Add or Update Fees</h5>
        </div>
        <div className="card-body">
          <form onSubmit={submitFee}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Student ID</label>
                <input
                  className="form-control"
                  value={form.student_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, student_id: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Total Fees</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={form.total_fees}
                  onChange={(e) => setForm((prev) => ({ ...prev, total_fees: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-4 d-flex align-items-end">
                <button className="btn btn-primary" type="submit">
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-light">
          <h5 className="mb-0">Fee Records</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Reg No</th>
                  <th>Name</th>
                  <th>Year</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Outstanding</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {fees.length ? (
                  fees.map((row) => (
                    <tr key={row.id}>
                      <td>{row.reg_no}</td>
                      <td>{row.name}</td>
                      <td>{row.year}</td>
                      <td>{row.total_fees}</td>
                      <td>{row.paid_amount}</td>
                      <td>{row.outstanding}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteFee(row.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-muted">
                      No fee records found.
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
