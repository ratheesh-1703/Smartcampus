import { useState, useEffect } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

function StatCard({ icon, title, value, color }) {
  return (
    <div className="col-md-6 col-lg-3 mb-3">
      <div className="card h-100 border-0 shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h6 className="text-muted mb-1">{title}</h6>
              <h3 className={`mb-0 fw-bold text-${color}`}>{value}</h3>
            </div>
            <div style={{ fontSize: "32px", opacity: 0.2 }}>{icon}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const teacher_id =
    user?.teacher_id ||
    user?.linked_id ||
    user?.user?.linked_id ||
    user?.user?.teacher_id ||
    user?.user?.user_id ||
    user?.user?.id ||
    user?.user_id ||
    user?.id;

  const [stats, setStats] = useState({
    myStudents: 0,
    classesScheduled: 0,
    attendancePending: 0,
    upcomingClasses: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isController, setIsController] = useState(false);

  async function fetchStats() {
    if (!teacher_id) {
      setError("Teacher ID not found. Please log in again.");
      setLoading(false);
      return;
    }

    const data = await apiCall(buildUrl(`get_teacher_stats.php?teacher_id=${teacher_id}`));
    const controller = await apiCall(
      buildUrl(`get_subject_controller_status.php?teacher_id=${teacher_id}`)
    );

    if (controller.status) {
      setIsController(Boolean(controller.is_subject_controller));
    }

    if (data.status && data.stats) {
      setStats({
        myStudents: data.stats.my_students || 0,
        classesScheduled: data.stats.classes_scheduled || 0,
        attendancePending: data.stats.attendance_pending || 0,
        upcomingClasses: data.stats.upcoming_classes || []
      });
      setError("");
    } else {
      setError(data.message || "Failed to load dashboard stats");
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-4">
        <h2 className="mb-0">👨‍🏫 Teacher Dashboard</h2>
        {isController && (
          <span className="badge bg-info text-dark">Subject Controller</span>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row mb-4">
        <StatCard icon="👨‍🎓" title="My Students" value={stats.myStudents} color="primary" />
        <StatCard icon="📚" title="Classes Assigned" value={stats.classesScheduled} color="info" />
        <StatCard icon="✓" title="Attendance Pending" value={stats.attendancePending} color="warning" />
        <StatCard icon="⭐" title="Avg Grade Given" value={loading ? "-" : "N/A"} color="success" />
      </div>

      <div className="row">
        <div className="col-lg-8 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-light">
              <h5 className="mb-0">📅 Today's Classes</h5>
            </div>
            <div className="card-body">
              {stats.upcomingClasses.length > 0 ? (
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Dept</th>
                      <th>Year</th>
                      <th>Section</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.upcomingClasses.map((cls, i) => (
                      <tr key={`${cls.subject}-${cls.dept}-${cls.year}-${cls.section}-${i}`}>
                        <td>{cls.subject}</td>
                        <td>{cls.dept || "-"}</td>
                        <td>{cls.year || "-"}</td>
                        <td>{cls.section || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted">No classes scheduled for today</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-light">
              <h5 className="mb-0">⚡ Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                <a href="/teacher/attendance" className="list-group-item list-group-item-action border-0 px-0">
                  <i className="bi bi-clipboard-check-fill text-success"></i> Start Attendance
                </a>
                <a href="/teacher/marks" className="list-group-item list-group-item-action border-0 px-0">
                  <i className="bi bi-pencil-fill text-primary"></i> Enter Marks
                </a>
                <a href="/teacher/courses" className="list-group-item list-group-item-action border-0 px-0">
                  <i className="bi bi-book-fill text-info"></i> View Courses
                </a>
                {isController && (
                  <a href="/teacher/subject-controller" className="list-group-item list-group-item-action border-0 px-0">
                    <i className="bi bi-diagram-3-fill text-primary"></i> Subject Controller Tools
                  </a>
                )}
                <a href="/teacher/students" className="list-group-item list-group-item-action border-0 px-0">
                  <i className="bi bi-people-fill text-warning"></i> Manage Students
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
