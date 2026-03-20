import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function CoordinatorRisk(){
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({High:0,Medium:0,Low:0});
  const [top, setTop] = useState([]);
  const stored = JSON.parse(localStorage.getItem("user")) || {};
  const user = stored.user || stored;

  const coordinator_id =
    user?.teacher_id ||
    user?.linked_id ||
    user?.user?.linked_id ||
    user?.user?.teacher_id ||
    user?.user_id ||
    user?.id;
  const [classId, setClassId] = useState(null);

  useEffect(() => {
    const loadClass = async () => {
      if (!coordinator_id) return;
      const data = await apiCall(
        buildUrl(`get_coordinator_summary.php?coordinator_id=${coordinator_id}`)
      );
      if (data.status && data.summary?.class_id) {
        setClassId(data.summary.class_id);
      }
    };

    loadClass();
  }, [coordinator_id]);

  useEffect(()=>{
    const load = async ()=>{
      if (!classId) return;
      setLoading(true);
      try{
        const url = buildUrl(
          `get_risk_summary.php?role=coordinator&linked_id=${classId}`
        );
        const data = await apiCall(url);
        if(data.status){
          setSummary(data.summary || {High:0,Medium:0,Low:0});
          setTop(data.top_high || []);
        }
      }catch(err){
        console.error(err);
      }
      setLoading(false);
    }
    load();
  },[classId]);

  if(!user || user.role !== 'coordinator'){
    return <div className="card p-4 shadow">Unauthorized</div>;
  }

  return (
    <div>
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
        <h5>Top High-Risk Students</h5>
        {loading ? <p>Loading...</p> : (
          top.length ? (
            <ul className="list-group">
              {top.map(t=> (
                <li key={t.student_id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{t.name || t.regno}</strong> <small className="text-muted">{t.regno}</small>
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
