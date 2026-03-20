import { useEffect, useState } from "react";
import { buildUrl } from "../utils/apiClient";

export default function LiveLocation(){

  // 🔐 Role protection
  const auth = JSON.parse(localStorage.getItem("user"));
  const isAuthorized = !!auth && auth.role === "affairs";

  const [students,setStudents] = useState([]);
  const [msg,setMsg] = useState("");

  useEffect(() => {
    if (!isAuthorized) {
      window.location.href = "/";
    }
  }, [isAuthorized]);

  const load = async ()=>{
    if (!isAuthorized) return;

    try{
      let res = await fetch(
        buildUrl("get_live_locations.php")
      );
      let data = await res.json();

      if(data.status){
        setStudents(data.students);
      } else {
        setStudents([]);
        setMsg(data.message || "No data available");
      }
    } catch{
      setMsg("Server not reachable");
    }
  };

  useEffect(()=>{
    load();
    const i = setInterval(load, 5000);
    return ()=>clearInterval(i);
  },[isAuthorized]);

  if (!isAuthorized) {
    return null;
  }

  return(
    <div className="container mt-4">
      <div className="card p-4 shadow">

        <h3>Campus Live Location</h3>

        {msg && <p className="text-danger">{msg}</p>}

        <table className="table table-bordered">
          <thead className="table-dark">
            <tr>
              <th>Reg No</th>
              <th>Name</th>
              <th>Dept</th>
              <th>Map</th>
              <th>Last Seen</th>
            </tr>
          </thead>

          <tbody>
            {students.map((s,i)=>(
              <tr key={i}>
                <td>{s.reg_no}</td>
                <td>{s.name}</td>
                <td>{s.dept}</td>
                <td>
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href={`https://www.google.com/maps?q=${s.latitude},${s.longitude}`}
                  >
                    View
                  </a>
                </td>
                <td>{s.last_seen}</td>
              </tr>
            ))}

            {students.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center">
                  No students online
                </td>
              </tr>
            )}
          </tbody>
        </table>

      </div>
    </div>
  );
}
