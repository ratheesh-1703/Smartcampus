import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function StudentFees(){

  const user = JSON.parse(localStorage.getItem("user"));
  const student_id =
    user?.student_id ||
    user?.linked_id ||
    user?.user?.student_id ||
    user?.user?.linked_id ||
    user?.user?.user_id ||
    user?.user?.id ||
    user?.user_id ||
    user?.id;

  const [summary,setSummary] = useState({
    total:0,
    paid:0,
    pending:0
  });

  const [fee,setFee] = useState(null);
  const [payments,setPayments] = useState([]);
  const [requests,setRequests] = useState([]);
  const [paymentForm,setPaymentForm] = useState({ amount: "", method: "UPI", transaction_id: "" });
  const [notice,setNotice] = useState("");
  const [error,setError] = useState("");
  const [loading,setLoading] = useState(true);
  const upiConfig = {
    upiId: "smartcampusfees@upi",
    payeeName: "Smart Campus",
    notePrefix: "Fee"
  };

  const amountValue = Number(paymentForm.amount || 0);
  const isMobileDevice = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
  const canOpenUpi = amountValue > 0 && isMobileDevice;
  const upiNote = `${upiConfig.notePrefix}-${student_id || "student"}`;
  const upiLink = `upi://pay?pa=${encodeURIComponent(upiConfig.upiId)}&pn=${encodeURIComponent(
    upiConfig.payeeName
  )}&am=${encodeURIComponent(amountValue > 0 ? amountValue.toFixed(2) : "0")}&cu=INR&tn=${encodeURIComponent(upiNote)}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiLink)}`;

  const loadFees = async ()=>{
    try{
      if (!student_id) {
        setLoading(false);
        return;
      }
      const data = await apiCall(
        buildUrl(`get_student_fees.php?student_id=${student_id}`)
      );

      if(data.status){
        setSummary(data.summary || { total: 0, paid: 0, pending: 0 });
        setFee(data.fee || null);
        setPayments(data.history || []);
        setRequests(data.payment_requests || []);
        setError("");
      } else {
        setError(data.message || "Failed to load fee data");
      }

    }catch(e){
      console.log("FEES ERROR:",e);
      setError("Failed to load fee data");
    }

    setLoading(false);
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    if (!student_id) return;

    const payload = {
      student_id: Number(student_id),
      amount: parseFloat(paymentForm.amount),
      payment_mode: paymentForm.method,
      transaction_id: paymentForm.transaction_id
    };

    if (!payload.amount || payload.amount <= 0) {
      setError("Enter a valid payment amount");
      return;
    }

    if (!payload.transaction_id || String(payload.transaction_id).trim() === "") {
      setError("Enter UTR / transaction reference for verification");
      return;
    }

    const data = await apiCall(buildUrl("accountant_endpoints.php?action=submit_payment_request"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!data.status) {
      setError(data.message || "Payment failed");
      return;
    }

  setNotice(data.message || "Payment request submitted successfully");
    setError("");
    setPaymentForm({ amount: "", method: "UPI", transaction_id: "" });
    await loadFees();
  };

  useEffect(()=>{ loadFees(); },[]);

  return(
    <div className="container mt-4">

      <div className="card p-4 shadow">

        <h3>Fees & Payments</h3>
        <p className="text-secondary">View your outstanding & paid fee details</p>
        {error && <div className="alert alert-danger mt-3">{error}</div>}
        {notice && <div className="alert alert-success mt-3">{notice}</div>}

        <hr/>

        {loading && <h5>Loading...</h5>}

        {!loading && (
          <>
            {/* SUMMARY CARDS */}
            <div className="row text-center mb-4">

              <div className="col-md-4">
                <div className="card p-3 shadow">
                  <h6>Total Fees</h6>
                  <h2>₹{summary.total}</h2>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card p-3 shadow text-success">
                  <h6>Paid</h6>
                  <h2>₹{summary.paid}</h2>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card p-3 shadow text-danger">
                  <h6>Pending</h6>
                  <h2>₹{summary.pending}</h2>
                </div>
              </div>

            </div>

            <div className="card p-3 shadow-sm mb-4">
              <h5 className="mb-3">Pay Fees (UPI / QR)</h5>
              <p className="text-muted mb-2">
                Pay via your UPI app using button/QR, then submit UTR for accountant verification.
              </p>
              <form onSubmit={submitPayment}>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Amount</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-control"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Payment Method</label>
                    <select
                      className="form-select"
                      value={paymentForm.method}
                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, method: e.target.value }))}
                    >
                      <option value="UPI">UPI</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Reference / Txn ID</label>
                    <input
                      className="form-control"
                      value={paymentForm.transaction_id}
                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, transaction_id: e.target.value }))}
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="d-flex flex-wrap align-items-center gap-3 mt-3">
                  <a
                    className={`btn ${canOpenUpi ? "btn-outline-primary" : "btn-outline-secondary disabled"}`}
                    href={canOpenUpi ? upiLink : "#"}
                    aria-disabled={!canOpenUpi}
                    onClick={(e) => {
                      if (!canOpenUpi) {
                        e.preventDefault();
                      }
                    }}
                  >
                    Open UPI App
                  </a>
                  <button className="btn btn-primary" type="submit">Submit UTR For Verification</button>
                </div>
                {!isMobileDevice && (
                  <div className="small text-muted mt-2">
                    UPI app launch works on mobile devices with a UPI app installed. On desktop, scan the QR using your phone.
                  </div>
                )}
                {amountValue <= 0 && (
                  <div className="small text-muted mt-1">Enter an amount to enable UPI launch.</div>
                )}
                <div className="mt-3">
                  <img src={qrImageUrl} alt="UPI QR" style={{ width: 220, height: 220, border: "1px solid #ddd", borderRadius: 8 }} />
                  <div className="small text-muted mt-2">UPI ID: {upiConfig.upiId}</div>
                </div>
              </form>
            </div>

            <div className="card p-3 shadow-sm mb-4">
              <h5 className="mb-3">Payment Requests</h5>
              <div className="table-responsive">
                <table className="table table-bordered mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Amount</th>
                      <th>Mode</th>
                      <th>UTR</th>
                      <th>Requested At</th>
                      <th>Status</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.length ? requests.map((req) => (
                      <tr key={req.id}>
                        <td>₹{req.amount}</td>
                        <td>{req.payment_mode || "UPI"}</td>
                        <td>{req.reference_no || "-"}</td>
                        <td>{req.requested_at ? new Date(req.requested_at).toLocaleString() : "-"}</td>
                        <td>
                          <span className={`badge ${req.status === "approved" ? "text-bg-success" : req.status === "rejected" ? "text-bg-danger" : "text-bg-warning"}`}>
                            {req.status}
                          </span>
                        </td>
                        <td>{req.verifier_note || "-"}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="6" className="text-center text-muted">No payment requests submitted.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* FEES TABLE */}
            <table className="table table-bordered">
              <thead style={{background:"#0d6efd", color:"white"}}>
                <tr>
                  <th>Total Amount</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {fee ? (
                  <tr>
                    <td>₹{fee.total_amount || summary.total || 0}</td>
                    <td>₹{fee.paid_amount || summary.paid || 0}</td>
                    <td>₹{fee.due_amount ?? summary.pending ?? 0}</td>
                    <td>{fee.due_date || "-"}</td>
                    <td className={(fee.status || "pending").toLowerCase() === "paid" ? "text-success" : "text-danger"}>
                      <b>{fee.status || "pending"}</b>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center">
                      No Fee Records Found
                    </td>
                  </tr>
                )}

              </tbody>
            </table>

            <hr/>

            {/* PAYMENTS */}
            <h5>Payment History</h5>
            <table className="table table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Transaction</th>
                  <th>Paid On</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={`${p.paid_on}-${p.reference_no}-${p.amount}`}>
                    <td>₹{p.amount}</td>
                    <td>{p.payment_mode || "-"}</td>
                    <td>{p.reference_no || "-"}</td>
                    <td>{p.paid_on ? new Date(p.paid_on).toLocaleString() : "-"}</td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center">
                      No payments recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

          </>
        )}

      </div>

    </div>
  );
}
