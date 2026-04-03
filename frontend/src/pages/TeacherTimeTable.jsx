import { useEffect, useMemo, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function TeacherTimeTable(){
  const saved = localStorage.getItem("user");
  const user = saved ? JSON.parse(saved) : null;

  const teacher_id =
    user?.teacher_id ||
    user?.linked_id ||
    user?.user?.linked_id ||
    user?.user?.teacher_id ||
    user?.user?.user_id ||
    user?.user?.id ||
    user?.user_id ||
    user?.id;

  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if(!saved){
      window.location.href = "/";
    }
  }, [saved]);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const grid = useMemo(() => {
    const slots = {};
    days.forEach((day) => {
      slots[day] = { day, p1: null, p2: null, p3: null, p4: null, p5: null, p6: null };
    });

    timetable.forEach((row) => {
      const period = Number(row.period || 0);
      if (!slots[row.day] || period < 1 || period > 6) return;

      const classLabel = `${row.dept} ${row.year}-${row.section}`;
      const subjectLabel = `${row.subject_code} - ${row.subject_name}`;
      slots[row.day][`p${period}`] = `${subjectLabel} (${classLabel})`;
    });

    return Object.values(slots);
  }, [timetable]);

  const hasEntries = timetable.length > 0;

  const loadTimetable = async () => {
    if (!teacher_id) {
      setError("Teacher ID not found. Please log in again.");
      setLoading(false);
      return;
    }

    const data = await apiCall(buildUrl(`get_teacher_timetable.php?teacher_id=${teacher_id}`));
    if (data.status) {
      setTimetable(data.timetable || []);
      setError("");
    } else {
      setError(data.message || "Failed to load timetable");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!teacher_id) {
      setLoading(false);
      return;
    }
    loadTimetable();
  }, [teacher_id]);

  return (
    <div className="card p-4 shadow">
      <h3>📅 My Teaching Timetable</h3>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-sm table-bordered">
              <thead>
                <tr><th>Day</th><th>P1</th><th>P2</th><th>P3</th><th>P4</th><th>P5</th><th>P6</th></tr>
              </thead>
              <tbody>
                {grid.map((row, i) => (
                  <tr key={i}>
                    <td>{row.day}</td>
                    <td>{row.p1 || "-"}</td>
                    <td>{row.p2 || "-"}</td>
                    <td>{row.p3 || "-"}</td>
                    <td>{row.p4 || "-"}</td>
                    <td>{row.p5 || "-"}</td>
                    <td>{row.p6 || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!hasEntries && (
            <p className="text-muted">No timetable entries yet.</p>
          )}
        </>
      )}
    </div>
  );
}
