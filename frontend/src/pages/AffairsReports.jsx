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
      const normalized = {
        incidents: {
          total: data?.summary?.incidents?.total ?? 0,
          open: data?.summary?.incidents?.open ?? 0,
          investigating: data?.summary?.incidents?.investigating ?? 0,
          closed: data?.summary?.incidents?.closed ?? 0,
          high: data?.summary?.incidents?.high ?? 0,
          medium: data?.summary?.incidents?.medium ?? 0,
          low: data?.summary?.incidents?.low ?? 0,
        },
        counseling: {
          total: data?.summary?.counseling?.total ?? 0,
          scheduled: data?.summary?.counseling?.scheduled ?? 0,
          completed: data?.summary?.counseling?.completed ?? 0,
          follow_up: data?.summary?.counseling?.follow_up ?? 0,
        },
        health: {
          total: data?.summary?.health?.total ?? 0,
          open: data?.summary?.health?.open ?? 0,
          resolved: data?.summary?.health?.resolved ?? 0,
          monitor: data?.summary?.health?.monitor ?? 0,
        },
        events: {
          total: data?.summary?.events?.total ?? 0,
          planned: data?.summary?.events?.planned ?? 0,
          completed: data?.summary?.events?.completed ?? 0,
          cancelled: data?.summary?.events?.cancelled ?? 0,
        },
        sos: {
          total: data?.summary?.sos?.total ?? 0,
          today: data?.summary?.sos?.today ?? 0,
        },
      };

      setSummary(normalized);
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
