import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function HODSubjectControllers() {
  const [loading, setLoading] = useState(true);
  const [dept, setDept] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [notice, setNotice] = useState("");

  const isAssigned = (value) => Number(value) === 1;
  const currentController = teachers.find((t) => isAssigned(t.is_subject_controller));

  const loadControllers = async () => {
    setLoading(true);
    setNotice("");

    const res = await apiCall(buildUrl("get_subject_controllers.php"));
    if (res.status) {
      setDept(res.dept || "");
      setTeachers(res.teachers || []);
    } else {
      setNotice(res.message || "Failed to load subject controllers");
    }

    setLoading(false);
  };

  useEffect(() => {
    loadControllers();
  }, []);

  const updateController = async (teacherId, action) => {
    const res = await apiCall(buildUrl("assign_subject_controller.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacher_id: teacherId, action })
    });

    setNotice(res.message || "");
    if (res.status) {
      loadControllers();
    }
  };

  return (
    <div className="card p-4 shadow">
      <h3>🧑‍🏫 Subject Controllers {dept ? `— ${dept}` : ""}</h3>
      {currentController && (
        <div className="alert alert-warning">
          Current subject controller: <strong>{currentController.name}</strong>
        </div>
      )}
      {notice && <div className="alert alert-info">{notice}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Staff</th>
                <th>Staff ID</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{t.staff_id || "-"}</td>
                  <td>
                    {isAssigned(t.is_subject_controller) ? (
                      <span className="badge bg-success">Assigned</span>
                    ) : (
                      <span className="badge bg-secondary">Not Assigned</span>
                    )}
                  </td>
                  <td>
                    {isAssigned(t.is_subject_controller) ? (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => updateController(t.id, "remove")}
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => updateController(t.id, "assign")}
                      >
                        {currentController ? "Assign (Replace)" : "Assign"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {teachers.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-muted">
                    No teachers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
