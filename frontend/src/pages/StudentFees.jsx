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

  const [fees,setFees] = useState([]);
  const [payments,setPayments] = useState([]);
  const [loading,setLoading] = useState(true);

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
        setFees(data.fees || []);
        setPayments(data.payments || []);
      }

    }catch(e){
      console.log("FEES ERROR:",e);
    }

    setLoading(false);
  };

  useEffect(()=>{ loadFees(); },[]);

  return(
    <div className="container mt-4">

      <div className="card p-4 shadow">

        <h3>Fees & Payments</h3>
        <p className="text-secondary">View your outstanding & paid fee details</p>

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

                {fees.map((f,i)=>(
                  <tr key={i}>
                    <td>₹{f.total_amount}</td>
                    <td>₹{f.paid_amount || 0}</td>
                    <td>₹{f.balance}</td>
                    <td>{f.due_date || "-"}</td>
                    <td className={f.status === "PAID" || f.status === "Paid" ? "text-success" : "text-danger"}>
                      <b>{f.status || "PENDING"}</b>
                    </td>
                  </tr>
                ))}

                {fees.length===0 && (
                  <tr>
                    <td colSpan="6" className="text-center">
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
                  <tr key={p.id}>
                    <td>₹{p.amount}</td>
                    <td>{p.method || "-"}</td>
                    <td>{p.transaction_id || "-"}</td>
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
