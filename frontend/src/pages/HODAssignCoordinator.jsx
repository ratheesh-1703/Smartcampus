import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function HODAssignCoordinator() {

  // Read auth object from localStorage
  const auth = JSON.parse(localStorage.getItem("user") || "{}");

  const hodTeacherId =
    auth?.user?.linked_id ||
    auth?.linked_id ||
    auth?.user?.teacher_id ||
    auth?.teacher_id ||
    auth?.user?.id ||
    auth?.id ||
    null;

  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [year, setYear] = useState("");
  const [section, setSection] = useState("");
  const [msg, setMsg] = useState("");

  // Load teachers of HOD department
  const loadTeachers = async () => {
    if (!hodTeacherId) {
      setMsg("HOD teacher ID not found. Please login again.");
      return;
    }

    const data = await apiCall(buildUrl("get_hod_teachers.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacher_id: hodTeacherId })
    });

    if (data.status) {
      setTeachers(data.teachers || []);
      setMsg("");
    } else {
      setTeachers([]);
      setMsg(data.message || "No teachers found");
    }
  };

  // Start assigning a teacher
  const startAssign = (teacher) => {
    setSelectedTeacher(teacher);
    setYear("");
    setSection("");
    setMsg("");
  };

  // Confirm assign
  const confirmAssign = async () => {
    if (!year || !section) {
      alert("Enter year and section");
      return;
    }

    const data = await apiCall(buildUrl("assign_coordinator.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teacher_id: selectedTeacher.id,
        year,
        section,
        assigned_by: hodTeacherId
      })
    });

    if (data.status) {
      setMsg("✅ Coordinator Assigned Successfully");
      setSelectedTeacher(null);
      loadTeachers();
    } else {
      setMsg("❌ " + data.message);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  return (
    <div className="container mt-4">
      <h3>Assign Class Coordinator</h3>

      {msg && <p className="fw-bold">{msg}</p>}

      {/* Assignment form (only after clicking Assign) */}
      {selectedTeacher && (
        <div className="card p-3 mb-3 border-primary">
          <h5>
            Assign class to <b>{selectedTeacher.name}</b>
          </h5>

          <div className="row mt-2">
            <div className="col-md-6">
              <input
                className="form-control"
                placeholder="Year (e.g. 2)"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <input
                className="form-control"
                placeholder="Section (e.g. A)"
                value={section}
                onChange={(e) => setSection(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-3">
            <button className="btn btn-success me-2" onClick={confirmAssign}>
              Confirm Assign
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedTeacher(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Teachers list */}
      <table className="table table-bordered">
        <thead className="table-dark">
          <tr>
            <th>Name</th>
            <th>Department</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {teachers.length === 0 && (
            <tr>
              <td colSpan="4" className="text-center text-danger">
                No teachers available
              </td>
            </tr>
          )}

          {teachers.map((t) => (
            <tr key={t.id}>
              <td>{t.name}</td>
              <td>{t.dept}</td>
              <td>
                {Number(t.is_coordinator) === 1 ? (
                  <span className="badge bg-success">
                    Coordinator ({t.assigned_class})
                  </span>
                ) : (
                  <span className="badge bg-secondary">Teacher</span>
                )}
              </td>
              <td>
                {Number(t.is_coordinator) === 0 && (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => startAssign(t)}
                  >
                    Assign
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
