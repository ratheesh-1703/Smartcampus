import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function AdminSOSAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadAlerts = async () => {
    setLoading(true);
    setMessage("");
    const data = await apiCall(buildUrl("get_sos.php"));
    if (data.status) {
      setAlerts(data.alerts || []);
    } else {
      setMessage(data.message || "Failed to load SOS alerts");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mt-3">
        <h2>SOS Alerts</h2>
        <button className="btn btn-outline-primary" onClick={loadAlerts} disabled={loading}>
          Refresh
        </button>
      </div>

      {message && (
        <div className="alert alert-warning mt-3">
          {message}
        </div>
      )}

      <div className="card p-3 mt-3">
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Student</th>
                <th>Reg No</th>
                <th>Message</th>
                <th>Photo</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id}>
                  <td>{alert.name}</td>
                  <td>{alert.reg_no}</td>
                  <td>{alert.message}</td>
                  <td>
                    {alert.photo ? (
                      <a href={buildUrl(alert.photo)} target="_blank" rel="noreferrer">
                        View
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{alert.created_at ? new Date(alert.created_at).toLocaleString() : "-"}</td>
                </tr>
              ))}
              {alerts.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center">No SOS alerts found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
