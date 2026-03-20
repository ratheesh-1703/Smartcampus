import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function StudentHistory(){

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
    present:0,
    absent:0,
    percentage:0
  });

  const [history,setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [subject,setSubject] = useState("");
  const [from,setFrom] = useState("");
  const [to,setTo] = useState("");

  const loadHistory = async ()=>{

    if (!student_id) {
      setError("Student ID not found. Please log in again.");
      return;
    }

    setLoading(true);
    setError("");

    const params = new URLSearchParams({ student_id });
    if (subject) params.append("subject", subject);
    if (from) params.append("from", from);
    if (to) params.append("to", to);

    const data = await apiCall(buildUrl(`get_student_history.php?${params.toString()}`));

    if(data.status){
      setSummary(data);
      setHistory(data.history || []);
    } else {
      setError(data.message || "Failed to load history");
    }

    setLoading(false);
  };

  useEffect(()=>{ loadHistory(); },[]);

  return(
    <div className="container mt-4">

      <div className="card p-4 shadow">

        <h3>Attendance History</h3>

        {/* FILTERS */}
        <div className="row mt-3">

          <div className="col-md-3">
            <input 
              placeholder="Subject"
              className="form-control"
              value={subject}
              onChange={e=>setSubject(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <input 
              type="date"
              className="form-control"
              value={from}
              onChange={e=>setFrom(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <input 
              type="date"
              className="form-control"
              value={to}
              onChange={e=>setTo(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <button className="btn btn-primary w-100"
              onClick={loadHistory}>
              Apply Filters
            </button>
          </div>

        </div>

        <hr/>

        {error && (
          <div className="alert alert-danger text-center fw-bold">
            {error}
          </div>
        )}

        {loading && (
          <div className="alert alert-info text-center">Loading...</div>
        )}

        {/* WARNING BANNERS */}
        {summary.total > 0 && summary.percentage < 75 && (
          <div className="alert alert-danger text-center fw-bold">
            ⚠ LOW ATTENDANCE WARNING — Your attendance is {summary.percentage}%.
            Minimum 75% attendance is required!
          </div>
        )}

        {summary.percentage >= 75 && summary.percentage < 80 && (
          <div className="alert alert-warning text-center fw-bold">
            🟡 CAUTION — Attendance is {summary.percentage}%. Maintain consistency!
          </div>
        )}

        {summary.percentage >= 80 && summary.total > 0 && (
          <div className="alert alert-success text-center fw-bold">
            ✅ Good! Your attendance is {summary.percentage}%.
          </div>
        )}

        {/* SUMMARY */}
        <div className="row text-center mb-3">

          <div className="col-md-3">
            <div className="card p-3 shadow">
              <h6>Total Classes</h6>
              <h2>{summary.total}</h2>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card p-3 shadow text-success">
              <h6>Present</h6>
              <h2>{summary.present}</h2>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card p-3 shadow text-danger">
              <h6>Absent</h6>
              <h2>{summary.absent}</h2>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card p-3 shadow text-primary">
              <h6>Percentage</h6>
              <h2>{summary.percentage}%</h2>
            </div>
          </div>

        </div>

        {/* HISTORY TABLE */}
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {history.map((h,i)=>(
              <tr key={i}>
                <td>{h.subject}</td>
                <td>{h.started_at}</td>
                <td className={h.status === "Present" ? "text-success" : "text-danger"}>
                  {h.status}
                </td>
              </tr>
            ))}

            {history.length === 0 && 
              <tr>
                <td colSpan="3" className="text-center">No Data Found</td>
              </tr>
            }
          </tbody>
        </table>

      </div>

    </div>
  );
}
