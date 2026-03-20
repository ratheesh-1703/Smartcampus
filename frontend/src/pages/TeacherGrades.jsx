import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function TeacherGrades(){
  const saved = localStorage.getItem("user");
  const user = saved ? JSON.parse(saved) : null;
  const isAuthorized = !!user;

  const [search, setSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [grades, setGrades] = useState([]);
  const [cgpa, setCgpa] = useState(0);
  const [gpa, setGpa] = useState("");
  const [semester, setSemester] = useState("");
  const [result, setResult] = useState("PASS");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if(!isAuthorized){
      window.location.href = "/";
    }
  }, [isAuthorized]);

  const searchStudents = async ()=>{
    try{
      const url = new URL(buildUrl("get_students_advanced.php"));
      if(search) url.searchParams.set("search", search);
      const data = await apiCall(url.toString());
      if(data.status) setStudents(data.students || []);
    }catch(e){ console.error(e); }
  };

  const loadGrades = async (student_id)=>{
    try{
      const data = await apiCall(buildUrl(`get_student_grades.php?student_id=${student_id}`));
      if(data.status){
        setGrades(data.grades || []);
        setCgpa(data.summary?.cgpa || 0);
      }
    }catch(e){ console.error(e); }
  };

  const saveGrade = async ()=>{
    if(!selected || !gpa || !semester){ alert("Fill all fields"); return; }
    try{
      const data = await apiCall(buildUrl("save_grade.php"),{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({student_id:selected.id, gpa: parseFloat(gpa), semester: parseInt(semester,10), result})
      });
      setMsg(data.message);
      loadGrades(selected.id);
      setGpa("");setSemester("");setResult("PASS");
    }catch(e){ console.error(e); }
  };

  useEffect(()=>{ if(selected) loadGrades(selected.id); },[selected]);

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="card p-4 shadow">
      <h3>🧾 Manage Student Grades</h3>

      <div className="mb-3 d-flex gap-2">
        <input className="form-control" placeholder="Search students by name or regno" value={search} onChange={e=>setSearch(e.target.value)} />
        <button className="btn btn-primary" onClick={searchStudents}>Search</button>
      </div>

      {msg && <div className={`alert ${msg.includes("success")||msg.includes("Successfully")?"alert-success":"alert-danger"}`}>{msg}</div>}

      <div className="row">
        <div className="col-md-4">
          <h6>Students</h6>
          <ul className="list-group">
            {students.map(s=> (
              <li key={s.id} className={`list-group-item ${selected?.id===s.id? 'active' : ''}`} onClick={()=>setSelected(s)} style={{cursor:'pointer'}}>
                {s.reg_no} - {s.name}
              </li>
            ))}
            {students.length===0 && <li className="list-group-item">No students</li>}
          </ul>
        </div>

        <div className="col-md-8">
          {selected ? (
            <>
              <h6>Grades for {selected.name} (CGPA: {cgpa.toFixed(2)})</h6>

              <div className="card p-3 mb-3 bg-light">
                <h6>Add/Update Grade</h6>
                <div className="row">
                  <div className="col-md-4">
                    <input className="form-control form-control-sm mb-2" placeholder="GPA" type="number" step="0.01" value={gpa} onChange={e=>setGpa(e.target.value)} />
                  </div>
                  <div className="col-md-4">
                    <input className="form-control form-control-sm mb-2" placeholder="Semester" type="number" value={semester} onChange={e=>setSemester(e.target.value)} />
                  </div>
                  <div className="col-md-4">
                    <select className="form-control form-control-sm mb-2" value={result} onChange={e=>setResult(e.target.value)}>
                      <option>PASS</option>
                      <option>FAIL</option>
                      <option>ABSENT</option>
                    </select>
                  </div>
                </div>
                <button className="btn btn-success btn-sm" onClick={saveGrade}>Save Grade</button>
              </div>

              <table className="table table-sm">
                <thead>
                  <tr><th>Semester</th><th>GPA</th><th>Result</th></tr>
                </thead>
                <tbody>
                  {grades.map((g,i)=>(
                    <tr key={`${g.semester}-${g.gpa}-${i}`}>
                      <td>{g.semester}</td>
                      <td>{parseFloat(g.gpa).toFixed(2)}</td>
                      <td>{g.result}</td>
                    </tr>
                  ))}
                  {grades.length===0 && <tr><td colSpan={3}>No grades recorded</td></tr>}
                </tbody>
              </table>
            </>
          ) : (
            <p>Select a student to manage grades.</p>
          )}
        </div>
      </div>
    </div>
  );
}
