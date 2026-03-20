import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function TeacherBiometric(){
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

  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");

  const loadLogs = async () => {
    if (!teacher_id) return;
    const data = await apiCall(buildUrl(`get_teacher_biometric.php?teacher_id=${teacher_id}`));
    if (data.status) setLogs(data.logs || []);
  };

  const logBiometric = async (status) => {
    if (!teacher_id) {
      setMessage("Teacher ID not found. Please log in again.");
      return;
    }
    const data = await apiCall(buildUrl("log_teacher_biometric.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacher_id, status, method: "BIOMETRIC", note })
    });
    setMessage(data.message || "Updated");
    setNote("");
    loadLogs();
  };

  useEffect(() => {
    loadLogs();
  }, [teacher_id]);

  return (
    <div className="card p-4 shadow">
      <h3>📍 Biometric Attendance</h3>

      {message && <div className="alert alert-info">{message}</div>}

      <div className="row g-2 align-items-end mb-3">
        <div className="col-md-8">
          <label className="form-label">Note (optional)</label>
          <input
            className="form-control"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Remarks or device note"
          />
        </div>
        <div className="col-md-4 d-flex gap-2">
          <button className="btn btn-success w-100" onClick={() => logBiometric("CHECK_IN")}>Check In</button>
          <button className="btn btn-danger w-100" onClick={() => logBiometric("CHECK_OUT")}>Check Out</button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Status</th>
              <th>Method</th>
              <th>Note</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.status}</td>
                <td>{log.method}</td>
                <td>{log.note || "-"}</td>
                <td>{log.logged_at ? new Date(log.logged_at).toLocaleString() : "-"}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center">No biometric logs yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
