import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function TeacherMarks(){
  const saved = localStorage.getItem("user");
  const user = saved ? JSON.parse(saved) : null;
  const isAuthorized = !!user;

  const [search, setSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [marks, setMarks] = useState([]);

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

  const loadMarks = async (student_id)=>{
    try{
      const data = await apiCall(buildUrl(`get_student_marks.php?student_id=${student_id}`));
      if(data.status) setMarks(data.marks || []);
    }catch(e){ console.error(e); }
  };

  useEffect(()=>{ if(selected) loadMarks(selected.id); },[selected]);

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="card p-4 shadow">
      <h3>🧪 View Student Marks</h3>

      <div className="mb-3 d-flex gap-2">
        <input className="form-control" placeholder="Search students by name or regno" value={search} onChange={e=>setSearch(e.target.value)} />
        <button className="btn btn-primary" onClick={searchStudents}>Search</button>
      </div>

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
          <h6>Marks {selected ? `for ${selected.name}` : ''}</h6>
          {selected ? (
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Semester</th>
                  <th>CIA 1</th>
                  <th>CIA 2</th>
                  <th>CIA 3</th>
                  <th>Attendance</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {marks.map((m)=>(
                  <tr key={m.id}>
                    <td>{m.subject}</td>
                    <td>{m.semester}</td>
                    <td>{m.cia1}</td>
                    <td>{m.cia2}</td>
                    <td>{m.cia3}</td>
                    <td>{m.attendance_mark}</td>
                    <td><b>{m.total}</b></td>
                  </tr>
                ))}
                {marks.length===0 && <tr><td colSpan={7}>No marks found</td></tr>}
              </tbody>
            </table>
          ) : (
            <p>Select a student to load marks.</p>
          )}
        </div>
      </div>
    </div>
  );
}
