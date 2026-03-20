import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function StudentDashboard() {

  const user = JSON.parse(localStorage.getItem("user"));
  const student_id =
    user?.student_id ||
    user?.linked_id ||
    user?.user?.student_id ||
    user?.user?.linked_id ||
    user?.user?.user_id ||
    user?.user?.id ||
    user?.user_id ||
    user?.id;

  const [campusStatus, setCampusStatus] = useState("-");
  const [lastUpdate, setLastUpdate] = useState("");
  const [summary, setSummary] = useState({
    attendance: 0,
    feesPending: 0,
    totalClasses: 0
  });
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [logoutRequest, setLogoutRequest] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {

    if (!student_id) {
      setError("Student ID not found. Please log in again.");
      return;
    }

    // ❌ BROWSER CHECK
    if (!navigator.geolocation) {
      console.error("❌ Geolocation not supported");
      return;
    }

    console.log("✅ Live location tracking started");

    // ✅ SEND LOCATION TO BACKEND
    const sendLocation = async (lat, lng) => {
      try {
        const data = await apiCall(buildUrl("update_location.php"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            student_id: student_id,
            latitude: lat,
            longitude: lng
          })
        });

        if (data.status) {
          setCampusStatus(data.campus_status || "-");
          setLastUpdate(new Date().toLocaleTimeString());
        }

      } catch (err) {
        console.error("❌ Location send failed", err);
      }
    };

    // ✅ WATCH GPS POSITION
    const watchId = navigator.geolocation.watchPosition(

      // SUCCESS
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("📡 GPS OK:", latitude, longitude);
        sendLocation(latitude, longitude);
      },

      // ERROR
      (error) => {
        console.error("❌ GPS Error:", error.message);
      },

      // OPTIONS
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      }
    );

    // CLEANUP
    return () => navigator.geolocation.clearWatch(watchId);

  }, [student_id]);

  useEffect(() => {
    const loadSummary = async () => {
      if (!student_id) return;

      try {
        const history = await apiCall(
          buildUrl(`get_student_history.php?student_id=${student_id}`)
        );
        const fees = await apiCall(
          buildUrl(`get_student_fees.php?student_id=${student_id}`)
        );
        const request = await apiCall(buildUrl("get_logout_requests.php"));

        setSummary({
          attendance: history?.percentage || 0,
          totalClasses: history?.total || 0,
          feesPending: fees?.summary?.pending || 0
        });
        setAttendanceRows(history?.history || []);

        if (request?.status) {
          setLogoutRequest(request.request || null);
        }
      } catch (err) {
        console.error("Error loading student summary:", err);
        // Don't block dashboard if summary fails to load
      }
    };

    loadSummary();
  }, [student_id]);

  // ✅ SIMPLE, CLEAN UI (NO CONFUSION)
  if (error) {
    return <div className="container mt-4 text-danger">{error}</div>;
  }

  return (
    <div className="container-fluid px-2 px-md-4 py-3">
      <div className="card p-3 p-md-4 shadow-sm mb-4">
        <h3 className="mb-2">Student Dashboard</h3>
        <p className="text-success mb-2">
          Live Location Tracking Enabled ✔
        </p>
        <p className="text-muted mb-0">
          Campus status: <b>{campusStatus}</b> {lastUpdate && `(Last update ${lastUpdate})`}
        </p>
      </div>

      {logoutRequest && (
        <div className={`alert ${logoutRequest.status === "approved" ? "alert-success" : logoutRequest.status === "rejected" ? "alert-danger" : "alert-warning"} mb-4`}>
          <b>Early Logout Request:</b> {logoutRequest.status?.toUpperCase()}
          {logoutRequest.reason ? ` | Reason: ${logoutRequest.reason}` : ""}
          {logoutRequest.decision_note ? ` | Note: ${logoutRequest.decision_note}` : ""}
        </div>
      )}

      <div className="grid-3 mb-4">
        <div className="card p-3 shadow-sm text-center">
          <h6 className="text-muted mb-2">Attendance %</h6>
          <h2 className="text-primary">{summary.attendance}%</h2>
        </div>
        <div className="card p-3 shadow-sm text-center">
          <h6 className="text-muted mb-2">Total Classes</h6>
          <h2 className="text-success">{summary.totalClasses}</h2>
        </div>
        <div className="card p-3 shadow-sm text-center">
          <h6 className="text-muted mb-2">Fees Pending</h6>
          <h2 className="text-danger">₹{summary.feesPending}</h2>
        </div>
      </div>

      <div className="card p-3 p-md-4 shadow-sm">
        <h5 className="mb-3">Subject-wise Attendance</h5>

        <div className="table-responsive">
          <table className="table table-bordered table-striped mb-0">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Status</th>
                <th>Date</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRows.map((row, index) => {
                const startedAt = row?.started_at || "";
                const [fallbackDate, fallbackTime = ""] = startedAt.split(" ");
                const status = row?.status || "-";

                return (
                  <tr key={`${row?.subject || "subject"}-${startedAt}-${index}`}>
                    <td>{row?.subject || "-"}</td>
                    <td
                      className={
                        status === "Present"
                          ? "text-success fw-semibold"
                          : status === "OD"
                            ? "text-primary fw-semibold"
                            : "text-danger fw-semibold"
                      }
                    >
                      {status}
                    </td>
                    <td>{row?.attendance_date || fallbackDate || "-"}</td>
                    <td>{row?.attendance_time || fallbackTime || "-"}</td>
                  </tr>
                );
              })}

              {attendanceRows.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center text-muted">
                    No attendance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
