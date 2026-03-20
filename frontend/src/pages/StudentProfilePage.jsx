import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function StudentProfilePage(){

  const user = JSON.parse(localStorage.getItem("user")) || {};
  // login may store { role, user: { user_id, ... } } or a flat user object
  const user_id = user?.user?.user_id || user?.user_id || user?.user?.id || user?.id;

  const [s,setS] = useState(null);
  const [error, setError] = useState(null);

  const loadProfile = async ()=>{
    try{
      setError(null);
      const data = await apiCall(buildUrl("get_student_profile_portal.php"), {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ user_id })
      });

      if(data?.status){
        setS(data.student);
      } else {
        setError(data?.message || 'Failed to load profile');
      }
    }catch(err){
      console.error('Failed to load student profile (portal)', err);
      setError(err.message || 'Network error');
    }
  };

  useEffect(()=>{
    if(!user_id){
      setError('Not logged in');
      return;
    }
    loadProfile();
  },[user_id]);

  if(error) return <h3 className="m-4 text-danger">Error: {error}</h3>;
  if(!s) return <h3 className="m-4">Loading Profile...</h3>;

  return(
    <div className="container mt-4">
      <div className="card p-4 shadow">

        <h3>Student Profile</h3>
        <p className="text-secondary">Academic & Personal Details</p>
        <hr/>

        <div className="row">

          {/* LEFT */}
          <div className="col-md-3 text-center">
            <img 
              src={
                s.photo
                  ? (s.photo.startsWith("http") ? s.photo : buildUrl(`uploads/students/${s.photo}`))
                  : "https://via.placeholder.com/150"
              }
              alt="profile"
              style={{
                width:"150px",
                height:"150px",
                objectFit:"cover",
                borderRadius:"8px",
                border:"2px solid #0d6efd"
              }}
            />
            <h5 className="mt-3">{s.name}</h5>
            <p className="text-secondary">{s.reg_no}</p>
          </div>

          {/* RIGHT */}
          <div className="col-md-9">
            <div className="row">

              <div className="col-md-6">
                <h6 className="text-primary">Academic</h6>
                <p><b>Course:</b> {s.course}</p>
                <p><b>Year:</b> {s.year}</p>
                <p><b>Section:</b> {s.section}</p>
                <p><b>Admission Year:</b> {s.admission_year}</p>
              </div>

              <div className="col-md-6">
                <h6 className="text-primary">Personal</h6>
                <p><b>Gender:</b> {s.gender}</p>
                <p><b>DOB:</b> {s.dob}</p>
                <p><b>Blood Group:</b> {s.blood_group}</p>
              </div>

            </div>

            <hr/>

            <div className="row">
              <div className="col-md-6">
                <h6 className="text-primary">Contact</h6>
                <p><b>Phone:</b> {s.student_phone}</p>
                <p><b>Address:</b> {s.address}</p>
                <p><b>City:</b> {s.city}</p>
              </div>

              <div className="col-md-6">
                <h6 className="text-primary">Parent</h6>
                <p><b>Father:</b> {s.father_name}</p>
                <p><b>Mother:</b> {s.mother_name}</p>
                <p><b>Parent Phone:</b> {s.parent_phone}</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
