import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function StudentProfilePage(){

  const user = JSON.parse(localStorage.getItem("user")) || {};
  // Extract student_id like other student pages
  const student_id =
    user?.student_id ||
    user?.linked_id ||
    user?.user?.student_id ||
    user?.user?.linked_id ||
    user?.user?.user_id ||
    user?.user?.id ||
    user?.user_id ||
    user?.id;

  const [s,setS] = useState(null);
  const [error, setError] = useState(null);

  const loadProfile = async ()=>{
    try{
      setError(null);
      const data = await apiCall(buildUrl(`get_student_profile_portal.php?student_id=${student_id}`));

      if(data?.status){
        setS(data.student);
      } else {
        if(data?.message === "Student Not Found"){
          setError("Student profile data not found. Please contact administrator.");
        } else {
          setError(data?.message || 'Failed to load profile');
        }
      }
    }catch(err){
      console.error('Failed to load student profile (portal)', err);
      setError(err.message || 'Network error');
    }
  };

  useEffect(()=>{
    if(!student_id){
      setError('Student ID not found. Please log in again.');
      return;
    }
    loadProfile();
  },[student_id]);

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
                <p><b>Department:</b> {s.dept}</p>
                <p><b>Year:</b> {s.year}</p>
                <p><b>Semester:</b> {s.semester}</p>
                <p><b>Registration No:</b> {s.reg_no}</p>
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
                <p><b>Email:</b> {s.student_email}</p>
                <p><b>Phone:</b> {s.student_phone}</p>
                <p><b>Address:</b> {s.address}</p>
                <p><b>City:</b> {s.city}</p>
                <p><b>State:</b> {s.state}</p>
                <p><b>Pincode:</b> {s.pincode}</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
