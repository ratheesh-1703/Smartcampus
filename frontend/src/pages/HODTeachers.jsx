import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function HODTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [dept, setDept] = useState(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("name"); // name | staff_id
  const [sortOrder, setSortOrder] = useState("asc"); // asc | desc
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("user")) || {};
    const linkedId =
      stored?.user?.linked_id ||
      stored?.linked_id ||
      stored?.user?.teacher_id ||
      stored?.teacher_id ||
      stored?.user?.id ||
      stored?.id ||
      null;

    const fetchDeptThenTeachers = async () => {
      if (!linkedId) {
        setError("HOD teacher ID not found. Please login again.");
        return;
      }

      try {
        let detectedDept = stored?.user?.dept || stored?.dept || null;

        if (!detectedDept) {
          const profile = await apiCall(
            buildUrl(`get_teacher_profile.php?id=${linkedId}`)
          );
          if (profile.status && profile.teacher) {
            detectedDept = profile.teacher.dept || profile.teacher.department || null;
          }
        }

        const tData = await apiCall(buildUrl("get_hod_teachers.php"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teacher_id: linkedId })
        });

        if (!tData.status) {
          setTeachers([]);
          setError(tData.message || "Failed to load teachers");
          return;
        }

        setTeachers(Array.isArray(tData.teachers) ? tData.teachers : []);
        if (detectedDept) setDept(detectedDept);
        setError("");
      } catch (err) {
        console.error("Failed to load teachers for HOD", err);
        setError("Failed to load teachers");
      }
    };

    fetchDeptThenTeachers();
  }, []);

  // apply search and sort client-side
  const filtered = teachers
    .filter(t => {
      if (!query) return true;
      const q = query.toLowerCase();
      return String(t.name || '').toLowerCase().includes(q)
        || String(t.staff_id || '').toLowerCase().includes(q)
        || (t.is_hod === "1" ? 'hod' : 'teacher').includes(q);
    })
    .slice();

  filtered.sort((a,b) => {
    const aKey = (sortBy === 'staff_id') ? (a.staff_id || '') : (a.name || '');
    const bKey = (sortBy === 'staff_id') ? (b.staff_id || '') : (b.name || '');
    if (aKey < bKey) return sortOrder === 'asc' ? -1 : 1;
    if (aKey > bKey) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="container mt-4">
      <h3>Department Teachers{dept ? ` — ${dept}` : ''}</h3>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="d-flex gap-2 mb-3">
        <input className="form-control" placeholder="Search by name or staff id" value={query} onChange={e=>setQuery(e.target.value)} />
        <select className="form-select" value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{width:160}}>
          <option value="name">Sort by name</option>
          <option value="staff_id">Sort by staff id</option>
        </select>
        <select className="form-select" value={sortOrder} onChange={e=>setSortOrder(e.target.value)} style={{width:120}}>
          <option value="asc">Asc</option>
          <option value="desc">Desc</option>
        </select>
      </div>

      <table className="table table-bordered mt-3">
        <thead className="table-dark">
          <tr>
            <th>Name</th>
            <th>Staff ID</th>
            <th>Role</th>
            <th>Coordinator</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((t, idx) => {
            const key = t?.id ? `${t.id}-${t.staff_id ?? idx}` : `t-${idx}`;
            return (
              <tr key={key}>
                <td>{t.name}</td>
                <td>{t.staff_id || '-'}</td>
                <td>{t.is_hod === "1" ? "HOD" : "Teacher"}</td>
                <td>{Number(t.is_coordinator) === 1 ? t.assigned_class || "Yes" : "No"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
