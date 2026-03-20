import { useEffect, useState } from "react";
import { buildUrl } from "../utils/apiClient";

export default function AssignHOD(){

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // 🔹 Load teachers
  const loadTeachers = async () => {
    try{
      const res = await fetch(
        buildUrl("get_teachers.php")
      );
      const data = await res.json();   // ✅ data defined HERE

      if(data.status){
        setTeachers(data.teachers);
      }else{
        setMsg("❌ Failed to load teachers");
      }

    }catch(err){
      console.error(err);
      setMsg("❌ Server error");
    }

    setLoading(false);
  };

  // 🔹 Assign HOD
  const assignHOD = async (teacher_id, dept) => {
    try{
      const res = await fetch(
        buildUrl("assign_hod.php"),
        {
          method: "POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ teacher_id, dept })
        }
      );

      const data = await res.json();

      if(data.status){
        setMsg("✅ HOD Assigned Successfully");
        loadTeachers(); // 🔄 refresh list
      }else{
        setMsg("❌ " + data.message);
      }

    }catch(err){
      console.error(err);
      setMsg("❌ Assign failed");
    }
  };

  useEffect(()=>{
    loadTeachers();
  },[]);

  return (
    <div className="container mt-4">

      <h3>Assign HOD</h3>

      {msg && <p className="fw-bold">{msg}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="table table-bordered mt-3">
          <thead className="table-dark">
            <tr>
              <th>Name</th>
              <th>Staff ID</th>
              <th>Department</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
  {Array.from(
    new Map(teachers.map(t => [t.id, t])).values()
  ).map((t) => (
    <tr key={t.id}>
      <td>{t.name}</td>
      <td>{t.staff_id || "-"}</td>
      <td>{t.dept}</td>

      <td>
        {String(t.is_hod) === "1" ? (
          <span className="badge bg-success">HOD</span>
        ) : (
          <span className="badge bg-secondary">Teacher</span>
        )}
      </td>

      <td>
        {String(t.is_hod) !== "1" && (
          <button
            className="btn btn-sm btn-primary"
            onClick={() => assignHOD(t.id, t.dept)}
          >
            Assign HOD
          </button>
        )}
      </td>
    </tr>
  ))}
</tbody>

        </table>
      )}

    </div>
  );
}
