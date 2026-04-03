import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function AccountantFees() {
  const [fees, setFees] = useState([]);
  const [structures, setStructures] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [structureForm, setStructureForm] = useState({ id: "", dept: "", year: "", amount: "" });
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [form, setForm] = useState({ student_id: "", total_fees: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const departmentOptions = departments.length
    ? departments
    : ["CSE", "BSC(IT&CS)", "IT", "ECE", "EEE", "MECH"];

  const loadDepartments = async () => {
    try {
      const data = await apiCall(buildUrl("get_departments.php"));
      if (data.status && Array.isArray(data.departments)) {
        const parsed = data.departments
          .map((item) => (typeof item === "string" ? item : item.dept_name || item.name || ""))
          .filter(Boolean);
        setDepartments(parsed);
      }
    } catch {
      // Keep fallback options when department endpoint is unavailable.
    }
  };

  const loadStructures = async () => {
    const data = await apiCall(buildUrl("accountant_endpoints.php?action=get_fee_structures"));
    if (data.status) {
      setStructures(data.structures || []);
      setError("");
    } else {
      setError(data.message || "Failed to load fee structures");
    }
  };

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

    setNotice("Student fee updated successfully.");
    setForm({ student_id: "", total_fees: "" });
    await loadFees();
  };

  const submitStructure = async (e) => {
    e.preventDefault();
    const payload = {
      id: structureForm.id ? parseInt(structureForm.id, 10) : undefined,
      dept: structureForm.dept,
      year: structureForm.year,
      amount: parseFloat(structureForm.amount)
    };

    const data = await apiCall(buildUrl("accountant_endpoints.php?action=upsert_fee_structure"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!data.status) {
      setError(data.message || "Failed to save fee structure");
      return;
    }

    setNotice(data.message || "Fee structure saved.");
    setStructureForm({ id: "", dept: "", year: "", amount: "" });
    await loadStructures();
  };

  const editStructure = (row) => {
    setStructureForm({
      id: row.id,
      dept: row.dept || "",
      year: row.year || "",
      amount: row.amount || ""
    });
  };

  const deleteStructure = async (id) => {
    const data = await apiCall(buildUrl(`accountant_endpoints.php?action=delete_fee_structure&id=${id}`));
    if (!data.status) {
      setError(data.message || "Failed to delete fee structure");
      return;
    }
    setNotice(data.message || "Fee structure deleted.");
    await loadStructures();
  };

  const applyStructure = async (structureId) => {
    const data = await apiCall(buildUrl("accountant_endpoints.php?action=apply_fee_structure"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ structure_id: structureId, overwrite: overwriteExisting })
    });

    if (!data.status) {
      setError(data.message || "Failed to apply fee structure");
      return;
    }

    const result = data.result || {};
    setNotice(
      `Applied structure: targeted ${result.targeted || 0}, created ${result.created || 0}, updated ${result.updated || 0}, skipped ${result.skipped || 0}.`
    );
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
    setNotice(data.message || "Fee record deleted.");
    await loadFees();
  };

  useEffect(() => {
    loadDepartments();
    loadStructures();
    loadFees();
  }, []);

  return (
    <div>
      <h2 className="mb-4">Fees Management</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Fee Structure (Department / Academic Year)</h5>
        </div>
        <div className="card-body">
          <form onSubmit={submitStructure}>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Department</label>
                <select
                  className="form-select"
                  value={structureForm.dept}
                  onChange={(e) => setStructureForm((prev) => ({ ...prev, dept: e.target.value }))}
                  required
                >
                  <option value="">Select department</option>
                  {departmentOptions.map((deptName) => (
                    <option key={deptName} value={deptName}>{deptName}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label">Academic Year</label>
                <input
                  className="form-control"
                  value={structureForm.year}
                  onChange={(e) => setStructureForm((prev) => ({ ...prev, year: e.target.value }))}
                  placeholder="1 / 2 / 3 / 4"
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={structureForm.amount}
                  onChange={(e) => setStructureForm((prev) => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button className="btn btn-primary w-100" type="submit">
                  {structureForm.id ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </form>

          <div className="form-check mt-3">
            <input
              id="overwrite-existing-fees"
              type="checkbox"
              className="form-check-input"
              checked={overwriteExisting}
              onChange={(e) => setOverwriteExisting(e.target.checked)}
            />
            <label htmlFor="overwrite-existing-fees" className="form-check-label">
              Overwrite existing student fee records when bulk-applying
            </label>
          </div>

          <div className="table-responsive mt-3">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Dept</th>
                  <th>Academic Year</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {structures.length ? (
                  structures.map((row) => (
                    <tr key={row.id}>
                      <td>{row.dept}</td>
                      <td>{row.year}</td>
                      <td>{row.amount}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-success me-2" onClick={() => applyStructure(row.id)}>
                          Apply to Students
                        </button>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => editStructure(row)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteStructure(row.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-muted">No fee structures found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Student Fee Exception (Individual Override)</h5>
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
