import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function HostelWardenDashboard() {
  const [residents, setResidents] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  const [roomForm, setRoomForm] = useState({ student_id: "", room_number: "", block: "" });
  const [incidentForm, setIncidentForm] = useState({ student_id: "", incident_type: "", description: "" });

  const loadAll = async () => {
    const [residentData, incidentData, statsData] = await Promise.all([
      apiCall(buildUrl("hostel_warden_endpoints.php?action=get_hostel_residents")),
      apiCall(buildUrl("hostel_warden_endpoints.php?action=get_hostel_incidents")),
      apiCall(buildUrl("hostel_warden_endpoints.php?action=get_hostel_stats"))
    ]);

    if (residentData.status) setResidents(residentData.residents || []);
    if (incidentData.status) setIncidents(incidentData.incidents || []);
    if (statsData.status) setStats(statsData);

    if (!residentData.status || !incidentData.status || !statsData.status) {
      setError(residentData.message || incidentData.message || statsData.message || "Failed to load hostel data");
    } else {
      setError("");
    }
  };

  const assignRoom = async (e) => {
    e.preventDefault();
    const data = await apiCall(buildUrl("hostel_warden_endpoints.php?action=assign_room"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(roomForm)
    });

    if (!data.status) {
      setError(data.message || "Failed to assign room");
      return;
    }

    setRoomForm({ student_id: "", room_number: "", block: "" });
    await loadAll();
  };

  const reportIncident = async (e) => {
    e.preventDefault();
    const data = await apiCall(buildUrl("hostel_warden_endpoints.php?action=report_incident"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(incidentForm)
    });

    if (!data.status) {
      setError(data.message || "Failed to report incident");
      return;
    }

    setIncidentForm({ student_id: "", incident_type: "", description: "" });
    await loadAll();
  };

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <div>
      <h2 className="mb-4">🏨 Hostel Warden Dashboard</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row mb-4">
        <div className="col-md-6 col-lg-4 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Total Rooms</h6>
              <h3 className="mb-0 fw-bold text-primary">{stats?.total_rooms || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-4 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Occupied Rooms</h6>
              <h3 className="mb-0 fw-bold text-success">{stats?.occupied_rooms || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-4 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Available Rooms</h6>
              <h3 className="mb-0 fw-bold text-info">{stats?.available_rooms || 0}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-light">
              <h5 className="mb-0">🛏️ Assign Room</h5>
            </div>
            <div className="card-body">
              <form onSubmit={assignRoom}>
                <div className="mb-2">
                  <label className="form-label">Student ID</label>
                  <input
                    className="form-control"
                    value={roomForm.student_id}
                    onChange={(e) => setRoomForm((prev) => ({ ...prev, student_id: e.target.value }))}
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">Room Number</label>
                  <input
                    className="form-control"
                    value={roomForm.room_number}
                    onChange={(e) => setRoomForm((prev) => ({ ...prev, room_number: e.target.value }))}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Block</label>
                  <input
                    className="form-control"
                    value={roomForm.block}
                    onChange={(e) => setRoomForm((prev) => ({ ...prev, block: e.target.value }))}
                    required
                  />
                </div>
                <button className="btn btn-primary" type="submit">
                  Assign
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-light">
              <h5 className="mb-0">🚨 Report Incident</h5>
            </div>
            <div className="card-body">
              <form onSubmit={reportIncident}>
                <div className="mb-2">
                  <label className="form-label">Student ID</label>
                  <input
                    className="form-control"
                    value={incidentForm.student_id}
                    onChange={(e) => setIncidentForm((prev) => ({ ...prev, student_id: e.target.value }))}
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">Incident Type</label>
                  <input
                    className="form-control"
                    value={incidentForm.incident_type}
                    onChange={(e) => setIncidentForm((prev) => ({ ...prev, incident_type: e.target.value }))}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={incidentForm.description}
                    onChange={(e) => setIncidentForm((prev) => ({ ...prev, description: e.target.value }))}
                  ></textarea>
                </div>
                <button className="btn btn-primary" type="submit">
                  Report
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-light">
              <h5 className="mb-0">🏠 Active Residents</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Room</th>
                      <th>Block</th>
                    </tr>
                  </thead>
                  <tbody>
                    {residents.length ? (
                      residents.map((row, idx) => (
                        <tr key={`${row.reg_no}-${idx}`}>
                          <td>{row.name}</td>
                          <td>{row.room_number}</td>
                          <td>{row.block}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-muted">No residents found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-light">
              <h5 className="mb-0">📋 Hostel Incidents</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.length ? (
                      incidents.map((row, idx) => (
                        <tr key={`${row.incident_type}-${idx}`}>
                          <td>{row.name}</td>
                          <td>{row.incident_type}</td>
                          <td>{row.status}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-muted">No incidents reported.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
