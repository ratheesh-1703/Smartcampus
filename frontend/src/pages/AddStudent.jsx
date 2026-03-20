import { useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function AddStudent(){

  const [student,setStudent] = useState({
    name:"",
    reg_no:"",
    dept:"",
    year:"",
    parent_phone:""
  });

  const handleChange = (e) =>{
    setStudent({...student, [e.target.name]:e.target.value});
  }

  const saveStudent = async () =>{
    const res = await apiCall(buildUrl('add_student.php'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student)
    });

    alert(res.message || (res.error ? res.message : 'Unknown response'));
  }

  return(
    <div className="container mt-4">
      <h3>Add Student</h3>

      <div className="card p-4 shadow">

        <input className="form-control mb-3"
          placeholder="Student Name"
          name="name"
          onChange={handleChange}
        />

        <input className="form-control mb-3"
          placeholder="Register Number"
          name="reg_no"
          onChange={handleChange}
        />

        <input className="form-control mb-3"
          placeholder="Department"
          name="dept"
          onChange={handleChange}
        />

        <input className="form-control mb-3"
          placeholder="Year"
          name="year"
          onChange={handleChange}
        />

        <input className="form-control mb-3"
          placeholder="Parent Phone"
          name="parent_phone"
          onChange={handleChange}
        />

        <button className="btn btn-primary" onClick={saveStudent}>
          Save Student
        </button>

      </div>
    </div>
  );
}
