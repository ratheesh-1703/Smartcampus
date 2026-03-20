import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function StudentGrades(){

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

  const [grades,setGrades] = useState([]);
  const [summary,setSummary] = useState({
    cgpa:0,
    semesters:0,
    arrears:0
  });
  const [loading,setLoading] = useState(true);

  const loadGrades = async ()=>{
    try{
      if (!student_id) {
        setLoading(false);
        return;
      }
      const data = await apiCall(
        buildUrl(`get_student_grades.php?student_id=${student_id}`)
      );

      if(data.status){
        setGrades(data.grades || []);
        setSummary(data.summary || { cgpa: 0, semesters: 0, arrears: 0 });
      }

    }catch(e){
      console.log(e);
    }

    setLoading(false);
  };

  useEffect(()=>{ loadGrades(); },[]);

  return(
    <div className="container mt-4">

      <div className="card p-4 shadow">

        <h3>Grade Details</h3>
        <p className="text-secondary">
          View your semester-wise grades and earned credits
        </p>

        <hr/>

        {loading && <h5>Loading...</h5>}

        {!loading && (
          <>
            {/* SUMMARY */}
            <div className="row text-center mb-4">

              <div className="col-md-4">
                <div className="card p-3 shadow">
                  <h6>CGPA</h6>
                  <h2>{summary.cgpa}</h2>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card p-3 shadow text-success">
                  <h6>Semesters</h6>
                  <h2>{summary.semesters}</h2>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card p-3 shadow text-danger">
                  <h6>No of Arrears</h6>
                  <h2>{summary.arrears}</h2>
                </div>
              </div>

            </div>

            {/* GRADES TABLE */}
            <table className="table table-bordered">
              <thead style={{background:"#0d6efd", color:"white"}}>
                <tr>
                  <th>Semester</th>
                  <th>GPA</th>
                  <th>Result</th>
                  <th>Recorded On</th>
                </tr>
              </thead>

              <tbody>

                {grades.map((g,i)=>(
                  <tr key={i}>
                    <td>{g.semester}</td>
                    <td><b>{g.gpa}</b></td>
                    <td>{g.result || "-"}</td>
                    <td>{g.created_at ? new Date(g.created_at).toLocaleDateString() : "-"}</td>
                  </tr>
                ))}

                {grades.length===0 && (
                  <tr>
                    <td colSpan="4" className="text-center">
                      No Grade Records Found
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
