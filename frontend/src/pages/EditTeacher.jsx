import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { buildUrl } from "../utils/apiClient";

export default function EditTeacher(){

  const { id } = useParams();
  const [t,setT] = useState(null);

  const load = async ()=>{
    let res = await fetch(
      buildUrl(`get_teacher_profile.php?id=${id}`)
    );

    let data = await res.json();
    if(data.status) setT(data.teacher);
  };

  useEffect(()=>{ load(); },[]);

  const updateTeacher = async ()=>{
    let res = await fetch(
      buildUrl("update_teacher.php"),
      {
        method:"POST",
        headers:{ "Content-Type":"application/json"},
        body: JSON.stringify(t)
      }
    );

    let data = await res.json();
    alert(data.message);
  };

  if(!t) return <h3 className="m-5">Loading...</h3>;

  return(
    <div className="container mt-4">

      <div className="card p-4 shadow">

        <h3>Edit Teacher</h3>

        <input className="form-control mb-2"
          value={t.name}
          onChange={e=>setT({...t,name:e.target.value})}
        />

        <input className="form-control mb-2"
          value={t.dept}
          onChange={e=>setT({...t,dept:e.target.value})}
        />

        <input className="form-control mb-2"
          value={t.phone}
          onChange={e=>setT({...t,phone:e.target.value})}
        />

        <input className="form-control mb-2"
          value={t.email}
          onChange={e=>setT({...t,email:e.target.value})}
        />

        <button className="btn btn-primary" onClick={updateTeacher}>
          Update
        </button>

      </div>

    </div>
  );
}
