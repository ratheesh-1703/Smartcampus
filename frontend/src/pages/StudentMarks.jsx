import React, { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function StudentMarks(){

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
  const [marks,setMarks] = useState([]);
  const [loading,setLoading] = useState(true);
  const [expanded,setExpanded] = useState(null);

  const loadMarks = async () => {
    if (!student_id) {
      setLoading(false);
      return;
    }
    const data = await apiCall(
      buildUrl(`get_student_marks.php?student_id=${student_id}`)
    );
    if (data.status) {
      setMarks(data.marks || []);
    }
    setLoading(false);
  };


  useEffect(()=>{ loadMarks(); },[]);

  return(
    <div className="container mt-4">
      
      <div className="card p-4 shadow">

        <h3>Marks Details</h3>
        <p className="text-secondary">
          Internal & Assessment marks for each registered course
        </p>

        <hr/>

        {loading && <h5>Loading...</h5>}

        {!loading && (
          <table className="table table-bordered table-striped">
            <thead style={{background:"#0d6efd",color:"white"}}>
              <tr>
                <th>#</th>
                <th>Subject</th>
                <th>Semester</th>
                <th>Total Marks</th>
                <th>View</th>
              </tr>
            </thead>

            <tbody>

              {marks.map((c,i)=>(
                <React.Fragment key={c.id || `${c.subject}-${c.semester}-${i}`}>
                  {/* MAIN ROW */}
                  <tr>
                    <td>{i+1}</td>
                    <td><b>{c.subject || "N/A"}</b></td>
                    <td>{c.semester}</td>
                    <td><b>{c.total || "-"}</b></td>

                    <td>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={()=> setExpanded(expanded === i ? null : i)}
                      >
                        {expanded === i ? "Hide" : "View"}
                      </button>
                    </td>
                  </tr>

                  {/* EXPANDED MARK TABLE */}
                  {expanded === i && (
                    <tr>
                      <td colSpan="5">
                        <table className="table table-bordered mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>S.No</th>
                              <th>Assessment</th>
                              <th>Marks</th>
                            </tr>
                          </thead>

                          <tbody>
                            <tr>
                              <td>1</td>
                              <td>CIA 1</td>
                              <td><b>{c.cia1 || 0}</b></td>
                            </tr>
                            <tr>
                              <td>2</td>
                              <td>CIA 2</td>
                              <td><b>{c.cia2 || 0}</b></td>
                            </tr>
                            <tr>
                              <td>3</td>
                              <td>CIA 3</td>
                              <td><b>{c.cia3 || 0}</b></td>
                            </tr>
                            <tr>
                              <td>4</td>
                              <td>Attendance Mark</td>
                              <td><b>{c.attendance_mark || 0}</b></td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}

                </React.Fragment>
              ))}

              {marks.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center">
                    No Marks Found
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        )}

      </div>
    </div>
  );
}
