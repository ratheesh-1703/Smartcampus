import { useEffect, useState } from "react";
import { BASE_URL, buildUrl } from "../utils/apiClient";

export default function AffairsSOS(){

  const [alerts,setAlerts] = useState([]);
  const [msg,setMsg] = useState("");
  const [busyId, setBusyId] = useState(null);

  const loadAlerts = async ()=>{
    let res = await fetch(buildUrl("get_sos.php"));
    let data = await res.json();

    console.log("SOS FETCH", data);

    if(data.status){
      setAlerts(data.alerts || []);   // 👈 IMPORTANT (prevents undefined)
      setMsg("");
    } else {
      setAlerts([]);
      setMsg("No SOS Alerts Found");
    }
  };

  useEffect(()=>{
    loadAlerts();

    const i = setInterval(loadAlerts, 5000);
    return ()=>clearInterval(i);
  },[]);

  const completeSOS = async (id)=>{
    if(!id || busyId) return;
    setBusyId(id);

    try {
      const res = await fetch(buildUrl("resolve_sos.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });

      const data = await res.json();
      if(data?.status){
        setMsg("SOS marked as completed");
        await loadAlerts();
      } else {
        setMsg(data?.message || "Failed to complete SOS");
      }
    } catch {
      setMsg("Network error while completing SOS");
    } finally {
      setBusyId(null);
    }
  };

  return(
    <div className="container mt-4">
      <div className="card p-4 shadow">

        <h3>🚨 Live SOS Alerts</h3>
        <p className="text-danger">
          System checks every 5 seconds.
        </p>

        {msg && <p className="text-danger">{msg}</p>}

        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Student</th>
              <th>Message</th>
              <th>Location</th>
              <th>Photo</th>
              <th>Time</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            {alerts.map((s,i)=>(
              <tr key={i}>
                <td>{s.name} ({s.reg_no})</td>
                <td>{s.message}</td>

                <td>
                  <a target="_blank"
                     href={`https://www.google.com/maps?q=${s.latitude},${s.longitude}`}>
                     View Location
                  </a>
                </td>

                <td>
                  {s.photo
                    ? <a target="_blank"
                         href={`${BASE_URL.replace(/\/backend$/, "")}/uploads/${s.photo}`}>
                        View Photo
                      </a>
                    : "No Photo"}
                </td>

                <td>{s.created_at}</td>
                <td className="text-nowrap">
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => completeSOS(s.id)}
                    disabled={busyId === s.id}
                  >
                    {busyId === s.id ? "Completing..." : "Complete"}
                  </button>
                </td>
              </tr>
            ))}

            {alerts.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center">
                  No Active SOS Alerts
                </td>
              </tr>
            )}

          </tbody>
        </table>

      </div>
    </div>
  );
}
