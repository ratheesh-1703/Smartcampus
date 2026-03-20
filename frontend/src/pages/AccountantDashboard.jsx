import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function AccountantDashboard() {
  const [summary, setSummary] = useState(null);
  const [fees, setFees] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [paymentForm, setPaymentForm] = useState({
    student_id: "",
    amount: "",
    payment_date: ""
  });

  const [lookupId, setLookupId] = useState("");
  const [lookupResult, setLookupResult] = useState(null);

  const loadSummary = async () => {
    const data = await apiCall(buildUrl("accountant_endpoints.php?action=get_financial_summary"));
    if (data.status) {
      setSummary(data.summary || null);
      setError("");
    } else {
      setError(data.message || "Failed to load financial summary");
    }
  };

  const loadFees = async () => {
    const data = await apiCall(buildUrl("accountant_endpoints.php?action=get_fees"));
    if (data.status) {
      setFees(data.fees || []);
      setError("");
    } else {
      setError(data.message || "Failed to load fee records");
    }
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    const payload = {
      student_id: parseInt(paymentForm.student_id, 10),
      amount: parseFloat(paymentForm.amount),
      payment_date: paymentForm.payment_date || undefined
    };

    const data = await apiCall(buildUrl("accountant_endpoints.php?action=record_payment"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!data.status) {
      setError(data.message || "Failed to record payment");
      return;
    }

    setPaymentForm({ student_id: "", amount: "", payment_date: "" });
    await loadSummary();
    await loadFees();
  };

  const lookupFee = async () => {
    if (!lookupId.trim()) return;
    const data = await apiCall(
      buildUrl(`accountant_endpoints.php?action=get_fee_by_student&student_id=${lookupId}`)
    );
    if (data.status) {
      setLookupResult(data.fee || null);
      setError("");
    } else {
      setLookupResult(null);
      setError(data.message || "Failed to fetch student fee");
    }
  };

  useEffect(() => {
    const load = async () => {
      await Promise.all([loadSummary(), loadFees()]);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div>
      <h2 className="mb-4">💰 Accountant Dashboard</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row mb-4">
        <div className="col-md-6 col-lg-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Total Students</h6>
              <h3 className="mb-0 fw-bold text-primary">{summary?.total_students || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Total Fees Due</h6>
              <h3 className="mb-0 fw-bold text-info">{summary?.total_fees_due || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Fees Collected</h6>
              <h3 className="mb-0 fw-bold text-success">{summary?.total_fees_collected || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Outstanding</h6>
              <h3 className="mb-0 fw-bold text-danger">{summary?.total_outstanding || 0}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-light">
              <h5 className="mb-0">🧾 Record Payment</h5>
            </div>
            <div className="card-body">
              <form onSubmit={submitPayment}>
                <div className="mb-3">
                  <label className="form-label">Student ID</label>
                  <input
                    type="number"
                    className="form-control"
                    name="student_id"
                    value={paymentForm.student_id}
                    onChange={handlePaymentChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    name="amount"
                    value={paymentForm.amount}
                    onChange={handlePaymentChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Payment Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="payment_date"
                    value={paymentForm.payment_date}
                    onChange={handlePaymentChange}
                  />
                </div>
                <button className="btn btn-primary" type="submit">
                  Record Payment
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-light">
              <h5 className="mb-0">🔍 Lookup Fee by Student</h5>
            </div>
            <div className="card-body">
              <div className="d-flex gap-2 mb-3">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Student ID"
                  value={lookupId}
                  onChange={(e) => setLookupId(e.target.value)}
                />
                <button className="btn btn-outline-primary" onClick={lookupFee}>
                  Search
                </button>
              </div>

              {lookupResult ? (
                <div className="border rounded p-3 bg-light">
                  <div className="mb-2"><strong>{lookupResult.name || "Student"}</strong> ({lookupResult.reg_no || "-"})</div>
                  <div>Total Fees: {lookupResult.total_fees || 0}</div>
                  <div>Paid: {lookupResult.paid_amount || 0}</div>
                  <div>Outstanding: {lookupResult.total_fees - lookupResult.paid_amount || 0}</div>
                </div>
              ) : (
                <p className="text-muted mb-0">Enter a student ID to view fee details.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-light">
          <h5 className="mb-0">📊 Fee Records</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <p className="text-muted">Loading...</p>
          ) : fees.length ? (
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
                  </tr>
                </thead>
                <tbody>
                  {fees.map((row) => (
                    <tr key={`${row.id}-${row.reg_no}`}>
                      <td>{row.reg_no || "-"}</td>
                      <td>{row.name || "-"}</td>
                      <td>{row.year || "-"}</td>
                      <td>{row.total_fees || 0}</td>
                      <td>{row.paid_amount || 0}</td>
                      <td>{row.outstanding || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted">No fee records found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
