import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiCall, buildUrl } from "../utils/apiClient";

function StatCard({ title, value, icon, color }) {
  return (
    <div className="col-md-4 mb-3">
      <div className="card h-100 border-0 shadow-sm">
        <div className="card-body d-flex justify-content-between align-items-start">
          <div>
            <div className="text-muted small mb-1">{title}</div>
            <div className={`fs-3 fw-bold text-${color}`}>{value}</div>
          </div>
          <div style={{ fontSize: 28, opacity: 0.25 }}>{icon}</div>
        </div>
      </div>
    </div>
  );
}

export default function SubjectControllerDashboard() {
  const stored = JSON.parse(localStorage.getItem("user") || "{}");
  const teacherId =
    stored?.teacher_id ||
    stored?.linked_id ||
    stored?.user?.linked_id ||
    stored?.user?.teacher_id ||
    stored?.user?.user_id ||
    stored?.user?.id ||
    stored?.user_id ||
    stored?.id;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    my_students: 0,
    classes_scheduled: 0,
    attendance_pending: 0,
    upcoming_classes: []
  });
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!teacherId) {
        setNotice("Teacher ID not found. Please log in again.");
        setLoading(false);
        return;
      }

      const data = await apiCall(buildUrl(`get_teacher_stats.php?teacher_id=${teacherId}`));
      if (data.status && data.stats) {
        setStats(data.stats);
        setNotice("");
      } else {
        setNotice(data.message || "Failed to load dashboard stats");
      }
      setLoading(false);
    };

    load();
  }, [teacherId]);

  return (
    <div className="container mt-3">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div>
          <h3 className="mb-1">🧭 Subject Controller Dashboard</h3>
          <p className="text-muted mb-0">Quick summary for subject control, attendance and planning.</p>
        </div>
        <Link to="/subject-controller/planning" className="btn btn-primary">
          Open Planning Workspace
        </Link>
      </div>

      {notice && <div className="alert alert-warning">{notice}</div>}

      {loading ? (
        <div className="card p-4 shadow">Loading...</div>
      ) : (
        <>
          <div className="row">
            <StatCard title="My Students" value={stats.my_students || 0} icon="👥" color="primary" />
            <StatCard title="Classes Scheduled" value={stats.classes_scheduled || 0} icon="📅" color="success" />
            <StatCard title="Attendance Pending" value={stats.attendance_pending || 0} icon="✅" color="warning" />
          </div>

          <div className="row mt-2">
            <div className="col-lg-8 mb-3">
              <div className="card shadow-sm border-0">
                <div className="card-header bg-light">
                  <h5 className="mb-0">Today&apos;s Classes</h5>
                </div>
                <div className="card-body">
                  {stats.upcoming_classes?.length > 0 ? (
                    <table className="table table-sm mb-0">
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>Dept</th>
                          <th>Year</th>
                          <th>Section</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.upcoming_classes.map((cls, index) => (
                          <tr key={`${cls.subject}-${index}`}>
                            <td>{cls.subject}</td>
                            <td>{cls.dept || "-"}</td>
                            <td>{cls.year || "-"}</td>
                            <td>{cls.section || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-muted mb-0">No classes scheduled for today.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-4 mb-3">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-header bg-light">
                  <h5 className="mb-0">Quick Actions</h5>
                </div>
                <div className="card-body">
                  <div className="list-group list-group-flush">
                    <Link to="/subject-controller/planning" className="list-group-item list-group-item-action border-0 px-0">
                      Subject Planning Workspace
                    </Link>
                    <Link to="/teacher/attendance" className="list-group-item list-group-item-action border-0 px-0">
                      Start Attendance
                    </Link>
                    <Link to="/teacher/marks" className="list-group-item list-group-item-action border-0 px-0">
                      Enter Marks
                    </Link>
                    <Link to="/teacher/timetable" className="list-group-item list-group-item-action border-0 px-0">
                      View Timetable
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}