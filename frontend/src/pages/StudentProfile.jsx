import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BASE_URL, buildUrl } from "../utils/apiClient";

export default function StudentProfile(){

  const { id } = useParams();
  const [s,setS] = useState(null);
  const [error, setError] = useState(null);

  const load = async ()=>{
    try{
      setError(null);
      let res = await fetch(buildUrl(`get_student_profile.php?id=${id}`));
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      let data = await res.json();
      if(data.status) setS(data.student);
      else setError(data.message || 'Failed to load student');
    }catch(err){
      console.error('Failed to load student profile', err);
      setError(err.message || 'Network error');
    }
  }

  useEffect(()=>{ if(id) load(); },[id]);

  if(error) return <h3 className="m-5 text-danger">Error: {error}</h3>;
  if(!s) return <h3 className="m-5">Loading...</h3>;

  return(
    <div className="container mt-4">

      <div className="card p-4 shadow">

        {/* Student Photo */}
        <div style={{textAlign:"center"}}>
          <img 
            src={
              s.photo 
              ? `${BASE_URL}/uploads/students/${s.photo}` 
              : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
            }
            alt="student"
            style={{
              width:"140px",
              height:"140px",
              borderRadius:"50%",
              objectFit:"cover",
              border:"3px solid #0d6efd",
              marginBottom:"10px"
            }}
          />
        </div>

        {/* Upload Input */}
        <input 
          type="file"
          className="form-control mb-3"
          onChange={async (e)=>{

            const formData = new FormData();
            formData.append("id", id);
            formData.append("photo", e.target.files[0]);

            let res = await fetch(
              buildUrl("upload_student_photo.php"),
              {
                method:"POST",
                body: formData
              }
            );

            let data = await res.json();
            alert(data.message);
            window.location.reload();
          }}
        />

        <h3>{s.name}</h3>
        <p><b>Reg No:</b> {s.reg_no}</p>
        <p><b>Department:</b> {s.dept}</p>
        <p><b>Year:</b> {s.year}</p>
        <p><b>Semester:</b> {s.semester}</p>

        <hr/>

        <h5>Personal Details</h5>
        <p><b>Gender:</b> {s.gender}</p>
        <p><b>DOB:</b> {s.dob}</p>
        <p><b>Blood Group:</b> {s.blood_group}</p>

        <hr/>

        <h5>Contact</h5>
        <p><b>Phone:</b> {s.student_phone}</p>
        <p><b>Email:</b> {s.student_email}</p>
        <p><b>Address:</b> {s.address}, {s.city}, {s.state} - {s.pincode}</p>

        <hr/>

        <h5>Parent</h5>
        <p><b>Father:</b> {s.father_name}</p>
        <p><b>Mother:</b> {s.mother_name}</p>
        <p><b>Parent Phone:</b> {s.parent_phone}</p>

      </div>

    </div>
  );
}
