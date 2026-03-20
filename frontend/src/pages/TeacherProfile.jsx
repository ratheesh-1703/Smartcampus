import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function TeacherProfile(){

  const { id } = useParams();
  const [t,setT] = useState(null);

  const load = async ()=>{
    if (!id) return;
    const data = await apiCall(
      buildUrl(`get_teacher_profile.php?id=${id}`)
    );
    if(data.status) setT(data.teacher);
  };

  useEffect(()=>{ load(); },[]);

  if(!t) return <h3 className="m-5">Loading...</h3>;

  return (
    <div className="container mt-4">

      <div className="card p-4 shadow">

        {/* Photo */}
        <div style={{textAlign:"center"}}>
          <img
                        src={
                          t.photo
                          ? buildUrl(`uploads/teachers/${t.photo}`)
                          : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                        }
            style={{
              width:"140px",
              height:"140px",
              borderRadius:"50%",
              objectFit:"cover",
              border:"3px solid #0d6efd"
            }}
          />
        </div>

        {/* Upload */}
        <input 
          type="file"
          className="form-control my-2"
          onChange={async (e)=>{

            const f = new FormData();
            f.append("id", id);
            f.append("photo", e.target.files[0]);

                        let res = await fetch(
                          buildUrl("upload_teacher_photo.php"),
                          { method:"POST", body:f }
                        );

                        let data = await res.json();
            alert(data.message);
            window.location.reload();
          }}
        />

        <h3 className="text-center">{t.name}</h3>

        <p><b>Staff ID:</b> {t.staff_id}</p>
        <p><b>Department:</b> {t.dept}</p>
        <p><b>Phone:</b> {t.phone}</p>
        <p><b>Email:</b> {t.email}</p>

      </div>

    </div>
  );
}
