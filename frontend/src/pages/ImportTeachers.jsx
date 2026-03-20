import { useState } from "react";
import { buildUrl } from "../utils/apiClient";

export default function ImportTeachers(){

  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const uploadTeachers = async () => {

    if (!file) {
      alert("Please select a CSV file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setMsg("");

    try {
      const res = await fetch(
        buildUrl("import_teachers.php"),
        {
          method: "POST",
          body: formData
        }
      );

      // ✅ ALWAYS READ AS TEXT FIRST
      const raw = await res.text();
      console.log("SERVER RESPONSE:", raw);

      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        setMsg("❌ Server returned invalid response");
        setLoading(false);
        return;
      }

      if (data.status) {
        setMsg(
          `✅ Imported: ${data.inserted} | Skipped: ${data.skipped}`
        );
      } else {
        setMsg(`❌ ${data.message || "Import failed"}`);
      }

    } catch (err) {
      console.error(err);
      setMsg("❌ Server Error while uploading file");
    }

    setLoading(false);
  };

  return (
    <div className="container mt-4">
      <div className="card p-4 shadow">

        <h3>Import Teachers (Bulk CSV)</h3>
        <p className="text-muted">
          Upload teachers using CSV file
        </p>

        <input
          type="file"
          accept=".csv"
          className="form-control"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button
          className="btn btn-primary mt-3"
          onClick={uploadTeachers}
          disabled={loading}
        >
          {loading ? "Uploading..." : "Upload CSV"}
        </button>

        {msg && (
          <p className="mt-3 fw-bold">
            {msg}
          </p>
        )}

        <hr />

        <h6>CSV Columns Order</h6>
        <pre className="bg-light p-2">
name,staff_id,dept,phone,email,dob,gender
        </pre>

      </div>
    </div>
  );
}
