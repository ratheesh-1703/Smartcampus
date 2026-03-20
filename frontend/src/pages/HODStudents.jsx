import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function HODStudents() {
  const [students, setStudents] = useState([]);
  const [dept, setDept] = useState(null);
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("none"); // none | asc | desc
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

    const load = async () => {
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

        if (!detectedDept) {
          setError("Department not found. Please login again.");
          return;
        }

        const data = await apiCall(
          buildUrl(`get_students.php?department=${encodeURIComponent(detectedDept)}`)
        );

        if (!data.status) {
          setError(data.message || "Failed to load students");
          setStudents([]);
          return;
        }

        setDept(detectedDept);
        setStudents(Array.isArray(data.students) ? data.students : []);
        setError("");
      } catch (err) {
        console.error("Failed to load HOD students", err);
        setError("Failed to load students");
      }
    };

    load();
  }, []);

  // apply search and sort client-side
  const filtered = students
    .filter(s => {
      if (!query) return true;
      const q = query.toLowerCase();
      return String(s.name || "").toLowerCase().includes(q)
        || String(s.reg_no || "").toLowerCase().includes(q)
        || String(s.year || "").toLowerCase().includes(q);
    })
    .slice();

  if (sortOrder === 'asc') {
    filtered.sort((a,b) => (Number(a.year) || 0) - (Number(b.year) || 0));
  } else if (sortOrder === 'desc') {
    filtered.sort((a,b) => (Number(b.year) || 0) - (Number(a.year) || 0));
  }

  return (
    <div className="container mt-4">
      <h3>Department Students{dept ? ` — ${dept}` : ''}</h3>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="d-flex gap-2 mb-3">
        <input
          className="form-control"
          placeholder="Search by name, reg no or year"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />

        <select className="form-select" value={sortOrder} onChange={e=>setSortOrder(e.target.value)} style={{width:140}}>
          <option value="none">Sort: none</option>
          <option value="asc">Sort: Year ↑</option>
          <option value="desc">Sort: Year ↓</option>
        </select>
      </div>

      <table className="table table-striped mt-3">
        <thead className="table-dark">
          <tr>
            <th>Name</th>
            <th>Register No</th>
            <th style={{width:120}}>Year</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((s, idx) => (
            <tr key={s.id ?? `s-${idx}`}>
              <td>{s.name}</td>
              <td>{s.reg_no}</td>
              <td>{s.year}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
