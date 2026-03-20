import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function HODRisk(){
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({High:0,Medium:0,Low:0});
  const [top, setTop] = useState([]);
  const [fetchedDepartment, setFetchedDepartment] = useState(null);
  const [error, setError] = useState("");
  
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const linked_id = user?.user?.linked_id;
  let department = user?.user?.dept;

  useEffect(() => {
    const loadDepartment = async () => {
      let dept = department;
      
      // If department is missing, fetch it from teacher profile
      if (!dept && linked_id) {
        console.log("Department missing, fetching from teacher profile...");
        try {
          const data = await apiCall(
            buildUrl(`get_teacher_profile.php?id=${linked_id}`)
          );
          if (data.status && data.teacher?.dept) {
            console.log("Fetched department:", data.teacher.dept);
            dept = data.teacher.dept;
            setFetchedDepartment(dept);
          } else {
            setError("Could not fetch department info");
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error("Error fetching teacher profile:", err);
          setError("Error fetching department info");
          setLoading(false);
          return;
        }
      } else if (dept) {
        setFetchedDepartment(dept);
      }
    };
    
    loadDepartment();
  }, [linked_id, department]);

  const loadRiskData = async () => {
    if (!fetchedDepartment) {
      console.warn("department not available");
      setLoading(false);
      return;
    }
    setLoading(true);
    try{
      const data = await apiCall(
        buildUrl(
          `get_risk_summary.php?role=hod&linked_id=${encodeURIComponent(
            fetchedDepartment
          )}`
        )
      );
      if(data.status){
        setSummary(data.summary || {High:0,Medium:0,Low:0});
        setTop(data.top_high || []);
        setError("");
      } else {
        console.error("API error:", data.message);
        setError(data.message || "Error loading risk summary");
      }
    }catch(err){ 
      console.error("Error loading risk summary:", err); 
      setError("Error loading risk summary");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (fetchedDepartment) {
      loadRiskData();
    }
  }, [fetchedDepartment]);

  const runPrediction = async ()=>{
    if(!fetchedDepartment) return;
    try{
      const data = await apiCall(buildUrl('predict_risk.php'), {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ department: fetchedDepartment })
      });
      if(data.status){
        alert('Prediction run completed: ' + data.processed + ' students');
        loadRiskData();
      }else alert('Prediction failed: ' + (data.message || 'Unknown error'));
    }catch(err){ console.error(err); alert('Error running prediction'); }
  }

  if(!user || user.role !== 'hod') return <div className="card p-4 shadow"><p className="text-danger">⚠️ Unauthorized. You must be logged in as an HOD.</p></div>;
  if(!fetchedDepartment && !loading) return <div className="card p-4 shadow"><p className="text-danger">⚠️ Error: Could not load department information. Please log in again.</p></div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Department Risk Summary</h4>
        <button className="btn btn-primary" onClick={runPrediction} disabled={!fetchedDepartment}>Run Prediction for Department</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="d-flex gap-3 mb-3">
        <div className="card p-3 text-center">
          <h6>High Risk</h6>
          <h3 className="text-danger">{summary.High}</h3>
        </div>
        <div className="card p-3 text-center">
          <h6>Medium Risk</h6>
          <h3 className="text-warning">{summary.Medium}</h3>
        </div>
        <div className="card p-3 text-center">
          <h6>Low Risk</h6>
          <h3 className="text-success">{summary.Low}</h3>
        </div>
      </div>

      <div className="card p-3">
        <h5>Top High-Risk Students (Dept)</h5>
        {loading ? <p>Loading...</p> : (
          top.length ? (
            <ul className="list-group">
              {top.map(t=> (
                <li key={t.student_id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{t.name || t.reg_no}</strong> <small className="text-muted">{t.reg_no}</small>
                    <div className="small">Score: {t.risk_score}</div>
                    <div className="small text-muted">{Array.isArray(t.reasons)?t.reasons.join(', '):t.reasons}</div>
                  </div>
                  <div className="d-flex flex-column align-items-end">
                    <Link className="btn btn-sm btn-primary mb-1" to={`/student/profile?student_id=${t.student_id}`}>View</Link>
                    <a className="btn btn-sm btn-outline-secondary" href={`/admin/student/${t.student_id}`}>Open</a>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="text-muted">No high-risk students found.</p>
        )}
      </div>
    </div>
  );
}
