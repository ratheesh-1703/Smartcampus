import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function ParentDashboard() {
  const [children, setChildren] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [profile, setProfile] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");

  const loadChildren = async () => {
    const data = await apiCall(buildUrl("parent_endpoints.php?action=get_my_children"));
    if (data.status) {
      setChildren(data.children || []);
      if (data.children?.length) {
        setSelectedId(String(data.children[0].id));
      }
      setError("");
    } else {
      setError(data.message || "Failed to load children");
    }
  };

  const loadChildData = async (studentId) => {
    if (!studentId) return;
    const data = await apiCall(
      buildUrl(`parent_endpoints.php?action=get_child_live_activity&student_id=${studentId}`)
    );

    if (data.status) {
      setProfile(data.student || null);
      setLiveLocation(data.live_location || null);
      setNotifications(data.notifications || []);
      setError("");
    } else {
      setError(data.message || "Failed to load child activity");
    }
  };

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadChildData(selectedId);
      const interval = setInterval(() => loadChildData(selectedId), 10000);
      return () => clearInterval(interval);
    }
  }, [selectedId]);

  return (
    <div>
      <h2 className="mb-4">👨‍👩‍👧 Parent Dashboard</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">👶 My Children</h5>
        </div>
        <div className="card-body">
          {children.length ? (
            <div className="d-flex flex-wrap gap-2">
              {children.map((child) => (
                <button
                  key={child.id}
                  className={`btn btn-sm ${String(child.id) === selectedId ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setSelectedId(String(child.id))}
                >
                  {child.name} ({child.reg_no})
                </button>
              ))}
            </div>
          ) : (
            <p className="text-muted">No linked students found.</p>
          )}
        </div>
      </div>

      {profile && (
        <div className="row mb-4">
          <div className="col-lg-4 mb-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-light">
                <h5 className="mb-0">📌 Student Profile</h5>
              </div>
              <div className="card-body">
                <p><strong>Name:</strong> {profile.name}</p>
                <p><strong>Reg No:</strong> {profile.reg_no}</p>
                <p><strong>Dept:</strong> {profile.dept}</p>
                <p><strong>Year:</strong> {profile.year}</p>
                <p><strong>Section:</strong> {profile.section || "-"}</p>
              </div>
            </div>
          </div>

          <div className="col-lg-4 mb-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-light">
                <h5 className="mb-0">📍 Live Location</h5>
              </div>
              <div className="card-body">
                {liveLocation ? (
                  <>
                    <p>
                      <strong>Status:</strong>{" "}
                      <span className={`badge ${String(liveLocation.campus_status || "").toUpperCase() === "IN" ? "bg-success" : "bg-danger"}`}>
                        {String(liveLocation.campus_status || "Unknown").toUpperCase()}
                      </span>
                    </p>
                    <p><strong>Latitude:</strong> {liveLocation.latitude}</p>
                    <p><strong>Longitude:</strong> {liveLocation.longitude}</p>
                    <p><strong>Last Seen:</strong> {liveLocation.updated_at || "-"}</p>
                    <a
                      className="btn btn-sm btn-outline-primary"
                      href={`https://www.google.com/maps?q=${liveLocation.latitude},${liveLocation.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open in Maps
                    </a>
                  </>
                ) : (
                  <p className="text-muted">Live location is not available yet.</p>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-4 mb-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-light">
                <h5 className="mb-0">🔔 IN/OUT Notifications</h5>
              </div>
              <div className="card-body">
                <ul className="list-group list-group-flush">
                  {notifications.length ? (
                    notifications.map((item, idx) => (
                      <li key={`${item.type}-${item.time || idx}-${idx}`} className="list-group-item px-0">
                        <div className="d-flex justify-content-between align-items-center">
                          <span>
                            <strong>{item.type}</strong> - {item.message}
                          </span>
                          <small className="text-muted">{item.time || "-"}</small>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="list-group-item px-0 text-muted">No IN/OUT activity yet.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
