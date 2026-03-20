import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function CoordinatorAssignTeachers() {

  const stored = JSON.parse(localStorage.getItem("user")) || {};
  const user = stored.user || stored;
  const coordinator_id =
    user?.teacher_id ||
    user?.linked_id ||
    user?.user?.linked_id ||
    user?.user?.teacher_id ||
    user?.user_id ||
    user?.id;
  const [department, setDepartment] = useState(user?.department || "");

  const [teachers, setTeachers] = useState([]);
  const [assignedTeachers, setAssignedTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [subject, setSubject] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  // Load available teachers in the department
  const loadTeachers = async () => {
    try {
      const data = await apiCall(
        buildUrl(
          `get_department_teachers.php?department=${encodeURIComponent(
            department
          )}&coordinator_id=${coordinator_id}`
        )
      );

      if (data.status) {
        setTeachers(data.teachers);
      } else {
        setMsg("No teachers found in your department");
      }
    } catch (err) {
      console.error(err);
      setMsg("Error loading teachers");
    }
  };

  // Load already assigned teachers
  const loadAssignedTeachers = async () => {
    try {
      const data = await apiCall(
        buildUrl(`get_coordinator_assigned_teachers.php?coordinator_id=${coordinator_id}`)
      );

      if (data.status) {
        setAssignedTeachers(data.assigned_teachers);
      }
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  // Start assigning a teacher
  const startAssign = (teacher) => {
    setSelectedTeacher(teacher);
    setSubject("");
    setMsg("");
  };

  // Confirm assignment
  const confirmAssign = async () => {
    if (!subject.trim()) {
      alert("Please enter subject name");
      return;
    }

    try {
      const data = await apiCall(
        buildUrl("assign_teacher_to_coordinator.php"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            coordinator_id,
            teacher_id: selectedTeacher.id,
            subject: subject.trim(),
            assigned_by: coordinator_id
          })
        }
      );

      if (data.status) {
        setMsg("✅ Teacher assigned successfully");
        setSelectedTeacher(null);
        loadAssignedTeachers();
        loadTeachers();
      } else {
        setMsg("❌ " + (data.message || "Error assigning teacher"));
      }
    } catch (err) {
      console.error(err);
      setMsg("❌ Error assigning teacher");
    }
  };

  // Remove assigned teacher
  const removeTeacher = async (teacherId) => {
    if (!confirm("Are you sure you want to remove this teacher?")) return;

    try {
      const data = await apiCall(
        buildUrl("remove_coordinator_teacher.php"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            coordinator_id,
            teacher_id: teacherId
          })
        }
      );

      if (data.status) {
        setMsg("✅ Teacher removed successfully");
        loadAssignedTeachers();
        loadTeachers();
      } else {
        setMsg("❌ " + (data.message || "Error removing teacher"));
      }
    } catch (err) {
      console.error(err);
      setMsg("❌ Error removing teacher");
    }
  };

  const resolveDepartment = async () => {
    if (department || !coordinator_id) return;

    const data = await apiCall(
      buildUrl(`get_teacher_profile.php?id=${coordinator_id}`)
    );
    if (data.status && data.teacher?.dept) {
      setDepartment(data.teacher.dept);
    } else {
      setMsg("Unable to resolve department for coordinator");
    }
  };

  useEffect(() => {
    resolveDepartment();
  }, [coordinator_id]);

  useEffect(() => {
    if (coordinator_id && department) {
      loadTeachers();
      loadAssignedTeachers();
    }
  }, [coordinator_id, department]);

  return (
    <div className="container mt-4">
      <h3>📚 Assign Subject Teachers to Your Class</h3>

      {msg && (
        <div className={`alert ${msg.includes("✅") ? "alert-success" : "alert-danger"} mt-3`}>
          {msg}
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {/* Already Assigned Teachers */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Assigned Teachers</h5>
            </div>
            <div className="card-body">
              {assignedTeachers.length === 0 ? (
                <p className="text-muted">No teachers assigned yet</p>
              ) : (
                <table className="table table-striped">
                  <thead className="table-light">
                    <tr>
                      <th>Teacher Name</th>
                      <th>Subject</th>
                      <th>Department</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedTeachers.map((teacher) => (
                      <tr key={teacher.id}>
                        <td>{teacher.name}</td>
                        <td>{teacher.subject}</td>
                        <td>{teacher.dept}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => removeTeacher(teacher.id)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Assignment form (only after clicking Assign) */}
          {selectedTeacher && (
            <div className="card p-3 mb-3 border-warning">
              <h5>
                Assign <b>{selectedTeacher.name}</b> as Subject Teacher
              </h5>

              <div className="row mt-2">
                <div className="col-md-12">
                  <label className="form-label">Subject</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Mathematics, Physics, English..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-3">
                <button className="btn btn-success me-2" onClick={confirmAssign}>
                  ✅ Confirm Assignment
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

          {/* Available Teachers list */}
          <div className="card">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">Available Teachers</h5>
            </div>
            <div className="card-body">
              {teachers.length === 0 ? (
                <p className="text-muted">No teachers available in your department</p>
              ) : (
                <table className="table table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {teachers.map((teacher) => (
                      <tr key={teacher.id}>
                        <td>{teacher.name}</td>
                        <td>{teacher.dept}</td>
                        <td>
                          {teacher.status === "active" ? (
                            <span className="badge bg-success">Active</span>
                          ) : (
                            <span className="badge bg-danger">Inactive</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => startAssign(teacher)}
                          >
                            Assign
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
