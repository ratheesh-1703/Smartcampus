import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function AffairsDashboard() {
  const [summary, setSummary] = useState({
    incidents: { total: 0 },
    counseling: { scheduled: 0, follow_up: 0 },
    health: { open: 0 },
    sos: { today: 0 }
  });
  const [error, setError] = useState("");

  const loadSummary = async () => {
    const data = await apiCall(buildUrl("get_affairs_reports.php"));
    if (data.status && data.summary) {
      setSummary(data.summary);
      setError("");
    } else {
      setError(data.message || "Failed to load dashboard summary");
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const pendingWelfare =
    (summary.counseling?.scheduled || 0) + (summary.counseling?.follow_up || 0);

  return (
    <div>
      <h2 className="mb-4">📋 Student Affairs Dashboard</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row mb-4">
        <div className="col-md-6 col-lg-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Active SOS Alerts</h6>
              <h3 className="mb-0 fw-bold text-danger">{summary.sos?.today || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Total Incidents</h6>
              <h3 className="mb-0 fw-bold text-warning">{summary.incidents?.total || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Welfare Cases</h6>
              <h3 className="mb-0 fw-bold text-info">{pendingWelfare}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Open Health Records</h6>
              <h3 className="mb-0 fw-bold text-success">{summary.health?.open || 0}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-light">
          <h5 className="mb-0">⚡ Student Care & Monitoring</h5>
        </div>
        <div className="card-body">
          <div className="list-group list-group-flush">
            <a href="/affairs/sos" className="list-group-item list-group-item-action border-0 px-0">
              <i className="bi bi-exclamation-circle-fill text-danger"></i> 🚨 Emergency SOS Alerts
            </a>
            <a href="/affairs/location" className="list-group-item list-group-item-action border-0 px-0">
              <i className="bi bi-geo-alt-fill text-primary"></i> Student Location Tracking
            </a>
            <a href="/affairs/counseling" className="list-group-item list-group-item-action border-0 px-0">
              <i className="bi bi-chat-dots-fill text-info"></i> Student Counseling
            </a>
            <a href="/affairs/health" className="list-group-item list-group-item-action border-0 px-0">
              <i className="bi bi-heart-fill text-success"></i> Health & Wellness Records
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
