import { useState } from "react";
import { buildUrl } from "../utils/apiClient";

export default function StudentSOS() {

  const user = JSON.parse(localStorage.getItem("user"));
  const student_id =
    user?.student_id ||
    user?.linked_id ||
    user?.user?.student_id ||
    user?.user?.linked_id ||
    user?.user?.user_id ||
    user?.user?.id ||
    user?.user_id ||
    user?.id;   // IMPORTANT

  const [message, setMessage] = useState("");
  const [photo, setPhoto] = useState(null);
  const [status, setStatus] = useState("");

  const sendSOS = async ()=>{

    if(!student_id){
      alert("Student ID Not Found — Login Again");
      return;
    }

    if(message.trim() === ""){
      alert("Enter SOS message");
      return;
    }

    let form = new FormData();
    form.append("student_id", student_id);
    form.append("message", message);

    if(photo){
      form.append("photo", photo);
    }

    setStatus("Sending SOS...");
    try {
      let res = await fetch(buildUrl("send_sos.php"),{
        method:"POST",
        body: form
      });

      let data = await res.json();
      console.log("SOS RESPONSE", data);

      if (!res.ok || !data?.status) {
        setStatus(data?.message || "Failed to send SOS");
        return;
      }

      setStatus(data.message || "SOS sent");
      setMessage("");
      setPhoto(null);
    } catch (error) {
      console.error("SOS send failed", error);
      setStatus("Network error while sending SOS");
    }
  };

  return(
    <div className="container mt-4">
      <div className="card p-4 shadow">

        <h2>Emergency SOS</h2>
        <p>If you are in danger, raise SOS immediately.</p>

        <textarea 
          className="form-control"
          rows={3}
          placeholder="Explain your problem"
          value={message}
          onChange={e=>setMessage(e.target.value)}
        />

        <label className="mt-3">Upload Photo Evidence (Optional)</label>
        <input 
          type="file"
          className="form-control"
          onChange={(e)=>setPhoto(e.target.files[0])}
        />

        {status && <div className="alert alert-info mt-3">{status}</div>}

        <button 
          className="btn btn-danger mt-3 w-100"
          onClick={sendSOS}
        >
          🚨 Send SOS Alert
        </button>

      </div>
    </div>
  );
}
