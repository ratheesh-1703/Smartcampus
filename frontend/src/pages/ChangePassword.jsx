import { useState } from "react";
import { buildUrl } from "../utils/apiClient";

export default function ChangePassword(){
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async () => {
    setMsg("");
    if(!oldPwd || !newPwd || !confirmPwd){
      setMsg("All fields are required");
      return;
    }
    if(newPwd !== confirmPwd){
      setMsg("New password and confirm password do not match");
      return;
    }
    if(newPwd.length < 6){
      setMsg("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try{
      const res = await fetch(buildUrl("change_password.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id || user.userId || user.id, old_password: oldPwd, new_password: newPwd })
      });

      const data = await res.json();

      if(data.status){
        setMsg("Password changed successfully. Please login again.");
        // clear localstorage and redirect after short delay
        setTimeout(()=>{
          localStorage.clear();
          window.location.href = "/";
        },1200);
      }else{
        setMsg(data.message || "Failed to change password");
      }

    }catch{
      setMsg("Connection error");
    }

    setLoading(false);
  };

  return (
    <div className="card p-4 shadow" style={{maxWidth:600}}>
      <h4>Change Password</h4>
      <p className="text-muted">Change your account password. You will be logged out after a successful change.</p>

      {msg && <div className="alert alert-info">{msg}</div>}

      <div className="mb-3">
        <label className="form-label">Old Password</label>
        <input type="password" className="form-control" value={oldPwd} onChange={e=>setOldPwd(e.target.value)} />
      </div>

      <div className="mb-3">
        <label className="form-label">New Password</label>
        <input type="password" className="form-control" value={newPwd} onChange={e=>setNewPwd(e.target.value)} />
      </div>

      <div className="mb-3">
        <label className="form-label">Confirm New Password</label>
        <input type="password" className="form-control" value={confirmPwd} onChange={e=>setConfirmPwd(e.target.value)} />
      </div>

      <button className="btn btn-primary" disabled={loading} onClick={submit}>{loading?"Saving...":"Change Password"}</button>
    </div>
  );
}
