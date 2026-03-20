import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function AffairsReports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = async () => {
    setLoading(true);
    const data = await apiCall(buildUrl("get_affairs_reports.php"));
    if (data.status) {
      setSummary(data.summary || null);
      setError("");
    } else {
      setSummary(null);
      setError(data.message || "Failed to load reports");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div className="container mt-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2>Reports</h2>
        <button className="btn btn-outline-primary" onClick={loadReports}>
          Refresh
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <p className="text-muted">Loading...</p>
      ) : summary ? (
        <>
          <div className="row g-3">
            <div className="col-md-3">
              <div className="card p-3 h-100">
                <h6 className="text-muted">Incidents</h6>
                <h3 className="mb-2">{summary.incidents.total}</h3>
                <div className="small text-muted">Open: {summary.incidents.open}</div>
                <div className="small text-muted">Investigating: {summary.incidents.investigating}</div>
                <div className="small text-muted">Closed: {summary.incidents.closed}</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card p-3 h-100">
                <h6 className="text-muted">Counseling</h6>
                <h3 className="mb-2">{summary.counseling.total}</h3>
                <div className="small text-muted">Scheduled: {summary.counseling.scheduled}</div>
                <div className="small text-muted">Completed: {summary.counseling.completed}</div>
                <div className="small text-muted">Follow-up: {summary.counseling.follow_up}</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card p-3 h-100">
                <h6 className="text-muted">Health</h6>
                <h3 className="mb-2">{summary.health.total}</h3>
                <div className="small text-muted">Open: {summary.health.open}</div>
                <div className="small text-muted">Resolved: {summary.health.resolved}</div>
                <div className="small text-muted">Monitor: {summary.health.monitor}</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card p-3 h-100">
                <h6 className="text-muted">Events</h6>
                <h3 className="mb-2">{summary.events.total}</h3>
                <div className="small text-muted">Planned: {summary.events.planned}</div>
                <div className="small text-muted">Completed: {summary.events.completed}</div>
                <div className="small text-muted">Cancelled: {summary.events.cancelled}</div>
              </div>
            </div>
          </div>

          <div className="row g-3 mt-1">
            <div className="col-md-6">
              <div className="card p-3 h-100">
                <h6 className="text-muted">Incident Severity</h6>
                <div className="d-flex justify-content-between">
                  <span>High</span>
                  <span>{summary.incidents.high}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Medium</span>
                  <span>{summary.incidents.medium}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Low</span>
                  <span>{summary.incidents.low}</span>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card p-3 h-100">
                <h6 className="text-muted">SOS Alerts</h6>
                <h3 className="mb-2">{summary.sos.total}</h3>
                <div className="small text-muted">Today: {summary.sos.today}</div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="text-muted">No report data available.</p>
      )}
    </div>
  );
}
