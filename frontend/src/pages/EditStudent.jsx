import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { buildUrl } from "../utils/apiClient";

export default function EditStudent(){

  const { id } = useParams();
  const [s,setS] = useState(null);

  const load = async()=>{
    let res = await fetch(buildUrl(`get_student_profile.php?id=${id}`));
    let data = await res.json();
    if(data.status) setS(data.student);
  };

  useEffect(()=>{ load(); },[]);

  const updateStudent = async ()=>{
    let res = await fetch(buildUrl("update_student.php"),{
      method:"POST",
      headers:{ "Content-Type":"application/json"},
      body: JSON.stringify(s)
    });

    let data = await res.json();
    alert(data.message);
  };

  if(!s) return <h3 className="m-5">Loading...</h3>;

  return(
    <div className="container mt-4">

      <h3>Edit Student</h3>

      <div className="card p-4 shadow">
        
        <input className="form-control mb-2"
          value={s.name}
          onChange={e=>setS({...s,name:e.target.value})}
        />

        <input className="form-control mb-2"
          value={s.dept}
          onChange={e=>setS({...s,dept:e.target.value})}
        />

        <input className="form-control mb-2"
          value={s.year}
          onChange={e=>setS({...s,year:e.target.value})}
        />

        <input className="form-control mb-2"
          value={s.semester}
          onChange={e=>setS({...s,semester:e.target.value})}
        />

        <input className="form-control mb-2"
          value={s.student_phone}
          onChange={e=>setS({...s,student_phone:e.target.value})}
        />

        <input className="form-control mb-2"
          value={s.student_email}
          onChange={e=>setS({...s,student_email:e.target.value})}
        />

        <textarea className="form-control mb-2"
          value={s.address}
          onChange={e=>setS({...s,address:e.target.value})}
        />

        <button className="btn btn-primary" onClick={updateStudent}>
          Update
        </button>

      </div>

    </div>
  );
}
