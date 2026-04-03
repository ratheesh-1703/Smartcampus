import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function HODDashboard() {
  const [loading, setLoading] = useState(true);
  const [dept, setDept] = useState(null);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    teachers: 0,
    students: 0,
    classes: 0,
    pending: 0
  });

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    const hodTeacherId =
      stored?.user?.linked_id ||
      stored?.linked_id ||
      stored?.user?.teacher_id ||
      stored?.teacher_id ||
      stored?.user?.id ||
      stored?.id ||
      null;

    const loadStats = async () => {
      setLoading(true);
      setError("");

      let detectedDept = stored?.user?.dept || stored?.dept || null;

      if (!detectedDept && hodTeacherId) {
        const profile = await apiCall(
          buildUrl(`get_teacher_profile.php?id=${hodTeacherId}`)
        );
        if (profile.status && profile.teacher) {
          detectedDept = profile.teacher.dept || profile.teacher.department || null;
        }
      }

      if (!hodTeacherId || !detectedDept) {
        setError("Department not found. Please login again.");
        setLoading(false);
        return;
      }

      setDept(detectedDept);

      const [teachersRes, classesRes, studentsRes] = await Promise.all([
        apiCall(buildUrl("get_hod_teachers.php"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teacher_id: hodTeacherId })
        }),
        apiCall(
          buildUrl(
            `get_department_classes.php?department=${encodeURIComponent(detectedDept)}`
          )
        ),
        apiCall(
          buildUrl(`get_students.php?department=${encodeURIComponent(detectedDept)}`)
        )
      ]);

      const teachersCount = teachersRes.status ? (teachersRes.teachers || []).length : 0;
      const classes = classesRes.status ? (classesRes.classes || []) : [];
      const studentsCount = studentsRes.status ? (studentsRes.students || []).length : 0;
      const pendingCount = classes.filter((c) => !c.coordinator_name).length;

      setStats({
        teachers: teachersCount,
        students: studentsCount,
        classes: classes.length,
        pending: pendingCount
      });
      setLoading(false);
    };

    loadStats();
  }, []);

  return (
    <div className="container-fluid px-2 px-md-4 py-3">
      <h2 className="mb-4 h4 h-md-2">👔 HOD Dashboard {dept ? `— ${dept}` : ""}</h2>

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      <div className="grid-4 mb-4">
        <div className="card h-100 border-0 shadow-sm">
          <div className="card-body p-3">
            <h6 className="text-muted mb-2 small">Department Teachers</h6>
            <h3 className="mb-0 fw-bold text-primary">
              {loading ? "..." : stats.teachers}
            </h3>
          </div>
        </div>
        <div className="card h-100 border-0 shadow-sm">
          <div className="card-body p-3">
            <h6 className="text-muted mb-2 small">Total Students</h6>
            <h3 className="mb-0 fw-bold text-info">
              {loading ? "..." : stats.students}
            </h3>
          </div>
        </div>
        <div className="card h-100 border-0 shadow-sm">
          <div className="card-body p-3">
            <h6 className="text-muted mb-2 small">Active Classes</h6>
            <h3 className="mb-0 fw-bold text-success">
              {loading ? "..." : stats.classes}
            </h3>
          </div>
        </div>
        <div className="card h-100 border-0 shadow-sm">
          <div className="card-body p-3">
            <h6 className="text-muted mb-2 small">Pending Tasks</h6>
            <h3 className="mb-0 fw-bold text-warning">
              {loading ? "..." : stats.pending}
            </h3>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-light">
          <h5 className="mb-0 small">⚡ Department Management</h5>
        </div>
        <div className="card-body p-2 p-md-3">
          <div className="list-group list-group-flush">
            <Link
              to="/hod/teachers"
              className="list-group-item list-group-item-action border-0 px-0 py-2"
            >
              <i className="bi bi-people-fill text-primary me-2"></i> 
              <span className="d-none d-sm-inline">Manage Teachers</span>
              <span className="d-sm-none">Teachers</span>
            </Link>
            <Link
              to="/hod/students"
              className="list-group-item list-group-item-action border-0 px-0 py-2"
            >
              <i className="bi bi-person-check-fill text-info me-2"></i> 
              <span className="d-none d-sm-inline">View Department Students</span>
              <span className="d-sm-none">Students</span>
            </Link>
            <Link
              to="/hod/manage-classes"
              className="list-group-item list-group-item-action border-0 px-0 py-2"
            >
              <i className="bi bi-collection-fill text-success me-2"></i> 
              <span className="d-none d-sm-inline">Class Coordination</span>
              <span className="d-sm-none">Classes</span>
            </Link>
            <Link
              to="/hod/attendance"
              className="list-group-item list-group-item-action border-0 px-0 py-2"
            >
              <i className="bi bi-clipboard-check-fill text-warning me-2"></i> 
              <span className="d-none d-sm-inline">Attendance & Teaching</span>
              <span className="d-sm-none">Attendance</span>
            </Link>
            <Link
              to="/hod/subject-approvals"
              className="list-group-item list-group-item-action border-0 px-0 py-2"
            >
              <i className="bi bi-journal-check text-secondary me-2"></i>
              <span className="d-none d-sm-inline">Subject Approvals</span>
              <span className="d-sm-none">Approvals</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
