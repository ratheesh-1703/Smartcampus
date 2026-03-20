import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function StudentTimeTable(){

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
  const [timetable,setTimetable] = useState([]);
  const [loading,setLoading] = useState(true);

  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  const loadTable = async ()=>{
    try{
      if (!student_id) {
        setLoading(false);
        return;
      }
      const data = await apiCall(
        buildUrl(`get_timetable.php?student_id=${student_id}`)
      );

      if(data.status){
        setTimetable(data.timetable || []);
      }

    }catch(e){
      console.log("TIMETABLE ERROR:",e);
    }

    setLoading(false);
  };

  useEffect(()=>{ loadTable(); },[]);

  const today = new Date().toLocaleString("en-US", { weekday: "long" });
  const hasEntries = timetable.some((row) =>
    ["p1", "p2", "p3", "p4", "p5", "p6"].some((p) => row?.[p])
  );

  return(
    <div className="container mt-4">

      <div className="card p-4 shadow">

        <h3>Class Time Table</h3>
        <p className="text-secondary">
          Your weekly lecture & lab schedule
        </p>

        <hr/>

        {loading && <h5>Loading...</h5>}

        {!loading && (
          <>
            <table className="table table-bordered text-center">

              <thead style={{background:"#0d6efd", color:"white"}}>
                <tr>
                  <th>Day</th>
                  <th>Period 1</th>
                  <th>Period 2</th>
                  <th>Period 3</th>
                  <th>Period 4</th>
                  <th>Period 5</th>
                  <th>Period 6</th>
                </tr>
              </thead>

              <tbody>

                {days.map((d,i)=>{

                  const row = timetable.find(t=>t.day === d);

                  return (
                    <tr 
                      key={i}
                      style={{
                        background: d===today ? "#e7f1ff" : "",
                        fontWeight: d===today ? "bold" : ""
                      }}
                    >
                      <td>{d}</td>

                      <td>{row?.p1 || "-"}</td>
                      <td>{row?.p2 || "-"}</td>
                      <td>{row?.p3 || "-"}</td>
                      <td>{row?.p4 || "-"}</td>
                      <td>{row?.p5 || "-"}</td>
                      <td>{row?.p6 || "-"}</td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

            {!hasEntries && 
              <h5 className="text-center text-danger">
                No Time Table Assigned Yet
              </h5>
            }

          </>
        )}

      </div>

    </div>
  );
}
