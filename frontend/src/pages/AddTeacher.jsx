import { useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function AddTeacher(){

  const [t,setT] = useState({
    name:"",
    staff_id:"",
    dept:"",
    phone:""
  });

  const save = async ()=>{
    const res = await apiCall(buildUrl('add_teacher.php'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(t)
    });

    alert(res.message || (res.error ? res.message : 'Unknown response'));
  };

  return (
    <div className="container mt-4">

      <div className="card p-4 shadow">

        <h3>Add Teacher</h3>

        <input className="form-control mb-2" placeholder="Teacher Name"
          onChange={e=>setT({...t,name:e.target.value})}
        />

        <input className="form-control mb-2" placeholder="Staff ID"
          onChange={e=>setT({...t,staff_id:e.target.value})}
        />

        <input className="form-control mb-2" placeholder="Department"
          onChange={e=>setT({...t,dept:e.target.value})}
        />

        <input className="form-control mb-2" placeholder="Phone"
          onChange={e=>setT({...t,phone:e.target.value})}
        />

        <button className="btn btn-primary" onClick={save}>Save</button>

      </div>
    </div>
  );
}
