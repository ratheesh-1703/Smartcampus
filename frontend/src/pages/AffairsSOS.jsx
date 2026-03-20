import { useEffect, useState } from "react";
import { BASE_URL, buildUrl } from "../utils/apiClient";

export default function AffairsSOS(){

  const [alerts,setAlerts] = useState([]);
  const [msg,setMsg] = useState("");

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
              </tr>
            ))}

            {alerts.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center">
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
