import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function CoordinatorDashboard() {
  const stored = JSON.parse(localStorage.getItem("user")) || {};
  const user = stored.user || stored;
  const coordinatorId =
    user?.teacher_id ||
    user?.linked_id ||
    user?.user?.linked_id ||
    user?.user?.teacher_id ||
    user?.user_id ||
    user?.id;

  const [summary, setSummary] = useState({
    class_strength: 0,
    assigned_teachers: 0,
    avg_attendance: 0,
    issues_today: 0,
    assigned_class: ""
  });
  const [error, setError] = useState("");

  const loadSummary = async () => {
    if (!coordinatorId) {
      setError("Coordinator ID not found. Please log in again.");
      return;
    }

    const data = await apiCall(
      buildUrl(`get_coordinator_summary.php?coordinator_id=${coordinatorId}`)
    );
    if (data.status) {
      setSummary(data.summary || summary);
      setError("");
    } else {
      setError(data.message || "Failed to load dashboard summary");
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h2 className="mb-0">🎯 Class Coordinator Dashboard</h2>
        <span className="text-muted">
          {summary.assigned_class ? `Class: ${summary.assigned_class}` : ""}
        </span>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row mb-4">
        <div className="col-md-6 col-lg-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Class Strength</h6>
              <h3 className="mb-0 fw-bold text-primary">{summary.class_strength}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Assigned Teachers</h6>
              <h3 className="mb-0 fw-bold text-info">{summary.assigned_teachers}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Avg Attendance</h6>
              <h3 className="mb-0 fw-bold text-success">{summary.avg_attendance}%</h3>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Issues Today</h6>
              <h3 className="mb-0 fw-bold text-warning">{summary.issues_today}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-light">
          <h5 className="mb-0">⚡ Class Management</h5>
        </div>
        <div className="card-body">
          <div className="list-group list-group-flush">
            <a href="/coordinator/students" className="list-group-item list-group-item-action border-0 px-0">
              <i className="bi bi-people-fill text-primary"></i> Manage Class Students
            </a>
            <a href="/coordinator/assign-teachers" className="list-group-item list-group-item-action border-0 px-0">
              <i className="bi bi-person-badge-fill text-info"></i> Assign Teachers to Classes
            </a>
            <a href="/coordinator/attendance" className="list-group-item list-group-item-action border-0 px-0">
              <i className="bi bi-clipboard-check-fill text-success"></i> Class Attendance
            </a>
            <a href="/coordinator/history" className="list-group-item list-group-item-action border-0 px-0">
              <i className="bi bi-clock-history text-warning"></i> History & Records
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
