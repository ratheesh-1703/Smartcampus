import { useState } from "react";
import { buildUrl } from "../utils/apiClient";

export default function ImportStudents(){

  const [file,setFile] = useState(null);
  const [msg,setMsg] = useState("");

const uploadStudents = async ()=>{

  if(!file){
    setMsg("Please select CSV");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try{
    const res = await fetch(
      buildUrl("import_students.php"),
      { method:"POST", body: formData }
    );

    const text = await res.text();
    console.log("SERVER RESPONSE:", text);

    let data = {};
    try{
      data = JSON.parse(text);
    }catch{
      setMsg("Backend returned invalid JSON ❌ Check PHP error");
      return;
    }

    setMsg(data.message || "Done");

  }catch(err){
    const errorText = String(err?.message || "");
    if (errorText.includes("ERR_UPLOAD_FILE_CHANGED")) {
      setMsg("Selected file changed on disk. Please reselect the CSV and upload again.");
      return;
    }
    setMsg("Upload failed ❌ Please check server and retry.");
  }
};


  // 🔥 RETURN MUST BE INSIDE FUNCTION
  return(
    <div className="container mt-4">

      <div className="card p-4 shadow">

        <h3>Import Students (CSV Upload)</h3>

        <input 
          type="file"
          accept=".csv"
          onChange={e => setFile(e.target.files[0])}
        />

        <button 
          className="btn btn-primary mt-3"
          onClick={uploadStudents}
        >
          Upload CSV
        </button>

        <p className="text-info mt-2">{msg}</p>

      </div>

    </div>
  );
}
