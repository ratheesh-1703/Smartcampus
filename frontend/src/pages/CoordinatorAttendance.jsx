import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function CoordinatorAttendance() {

  const stored = JSON.parse(localStorage.getItem("user")) || {};
  const user = stored.user || stored;
  const coordinator_id =
    user?.teacher_id ||
    user?.linked_id ||
    user?.user?.linked_id ||
    user?.user?.teacher_id ||
    user?.user_id ||
    user?.id;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const loadAttendance = async () => {
    try {
      const data = await apiCall(
        buildUrl(
          `get_coordinator_attendance.php?coordinator_id=${coordinator_id}&date=${date}`
        )
      );

      if (data.status) {
        setRecords(data.records);
      }
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (coordinator_id) {
      loadAttendance();
    }
  }, [coordinator_id, date]);

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center justify-content-between">
        <h3>Attendance Records</h3>
        <input
          type="date"
          className="form-control w-auto"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Loading attendance...</p>
      ) : records.length === 0 ? (
        <p className="text-muted">No attendance records found</p>
      ) : (
        <table className="table table-bordered mt-3">
          <thead className="table-dark">
            <tr>
              <th>Register No</th>
              <th>Name</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>{r.reg_no}</td>
                <td>{r.student_name}</td>
                <td>{r.date}</td>
                <td>
                  {r.status === "Present" ? (
                    <span className="badge bg-success">Present</span>
                  ) : (
                    <span className="badge bg-danger">Absent</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
