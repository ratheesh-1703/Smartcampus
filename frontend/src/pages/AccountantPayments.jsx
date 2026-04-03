import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function AccountantPayments() {
  const [payments, setPayments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ student_id: "", amount: "", payment_date: "" });
  const [decisionForm, setDecisionForm] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadPayments = async () => {
    const [paymentsRes, requestsRes] = await Promise.all([
      apiCall(buildUrl("accountant_endpoints.php?action=get_payments")),
      apiCall(buildUrl("accountant_endpoints.php?action=get_payment_requests&status=pending"))
    ]);

    if (paymentsRes.status) {
      setPayments(paymentsRes.payments || []);
    }
    if (requestsRes.status) {
      setRequests(requestsRes.requests || []);
    }

    if (!paymentsRes.status || !requestsRes.status) {
      setError(paymentsRes.message || requestsRes.message || "Failed to load payment data");
    } else {
      setError("");
    }
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    const payload = {
      student_id: parseInt(form.student_id, 10),
      amount: parseFloat(form.amount),
      payment_date: form.payment_date || undefined
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

    setNotice(data.message || "Payment recorded");
    setForm({ student_id: "", amount: "", payment_date: "" });
    await loadPayments();
  };

  const verifyRequest = async (requestId, decision) => {
    const note = decisionForm[requestId] || "";
    const data = await apiCall(buildUrl("accountant_endpoints.php?action=verify_payment_request"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request_id: requestId, decision, note })
    });

    if (!data.status) {
      setError(data.message || "Failed to process payment request");
      return;
    }

    setNotice(data.message || "Payment request updated");
    await loadPayments();
  };

  const deletePayment = async (paymentId) => {
    const data = await apiCall(
      buildUrl(`accountant_endpoints.php?action=delete_payment&payment_id=${paymentId}`)
    );
    if (!data.status) {
      setError(data.message || "Failed to delete payment");
      return;
    }
    setNotice(data.message || "Payment deleted");
    await loadPayments();
  };

  useEffect(() => {
    loadPayments();
  }, []);

  return (
    <div>
      <h2 className="mb-4">Payments</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Pending Payment Requests</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Amount</th>
                  <th>Mode</th>
                  <th>UTR</th>
                  <th>Requested At</th>
                  <th>Verifier Note</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.length ? (
                  requests.map((req) => (
                    <tr key={req.id}>
                      <td>{req.name ? `${req.name} (${req.reg_no || req.student_id})` : req.student_id}</td>
                      <td>{req.amount}</td>
                      <td>{req.payment_mode || "UPI"}</td>
                      <td>{req.reference_no || "-"}</td>
                      <td>{req.requested_at ? new Date(req.requested_at).toLocaleString() : "-"}</td>
                      <td>
                        <input
                          className="form-control form-control-sm"
                          placeholder="Optional note"
                          value={decisionForm[req.id] || ""}
                          onChange={(e) => setDecisionForm((prev) => ({ ...prev, [req.id]: e.target.value }))}
                        />
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button className="btn btn-sm btn-success" onClick={() => verifyRequest(req.id, "approved")}>
                            Approve
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => verifyRequest(req.id, "rejected")}>
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-muted">No pending payment requests.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Record Payment</h5>
        </div>
        <div className="card-body">
          <form onSubmit={submitPayment}>
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
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={form.amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Payment Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.payment_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, payment_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-3">
              <button className="btn btn-primary" type="submit">
                Record
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-light">
          <h5 className="mb-0">Payment Log</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Recorded By</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {payments.length ? (
                  payments.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name || row.reg_no}</td>
                      <td>{row.amount}</td>
                      <td>{row.payment_date}</td>
                      <td>{row.recorded_by || "-"}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deletePayment(row.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-muted">
                      No payments recorded.
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
