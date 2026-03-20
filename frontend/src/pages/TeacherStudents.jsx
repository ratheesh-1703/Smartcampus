import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function TeacherStudents() {
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

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!saved) {
      window.location.href = "/";
    }
  }, [saved]);

  useEffect(() => {
    if (!teacher_id) return;

    const loadCourses = async () => {
      try {
        const data = await apiCall(buildUrl(`get_teacher_courses.php?teacher_id=${teacher_id}`));
        if (data.status) setCourses(data.courses || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadCourses();
  }, [teacher_id]);

  const loadStudents = async (dept, year, section, qsearch = "") => {
    try {
      if (qsearch) {
        const url = new URL(buildUrl("get_students_advanced.php"));
        if (qsearch) url.searchParams.set("search", qsearch);
        if (dept) url.searchParams.set("dept", dept);
        if (year) url.searchParams.set("year", year);
        const data = await apiCall(url.toString());
        if (data.status) setStudents(data.students || []);
      } else {
        const url = new URL(buildUrl("get_students.php"));
        if (dept) url.searchParams.set("department", dept);
        if (year) url.searchParams.set("year", year);
        if (section) url.searchParams.set("section", section);
        const data = await apiCall(url.toString());
        if (data.status) setStudents(data.students || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="card p-4 shadow">
      <h3>📚 Manage Students</h3>

      <div className="mb-3">
        <label className="form-label">Select Class (from your courses)</label>
        <select className="form-select" onChange={(e) => {
          const idx = e.target.value;
          if (idx === "") { setSelectedCourse(null); setStudents([]); return; }
          const c = courses[parseInt(idx, 10)];
          setSelectedCourse(c);
          loadStudents(c.dept, c.year, c.section);
        }}>
          <option value="">-- Select Class --</option>
          {courses.map((c, i) => (
            <option key={i} value={i}>{`${c.dept} | Year ${c.year} | Sec ${c.section || '-'} | ${c.subject}`}</option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <input className="form-control" placeholder="Search students by reg no or name" value={search} onChange={e=>setSearch(e.target.value)} />
        <div className="mt-2">
          <button className="btn btn-primary me-2" onClick={()=> loadStudents(selectedCourse?.dept, selectedCourse?.year, selectedCourse?.section, search)}>Search</button>
          <button className="btn btn-secondary" onClick={()=>{ setSearch(""); setStudents([]); }}>Clear</button>
        </div>
      </div>

      <div>
        <h5>Students ({students.length})</h5>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Reg No</th>
              <th>Name</th>
              <th>Dept</th>
              <th>Year</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s=> (
              <tr key={s.id}>
                <td>{s.reg_no}</td>
                <td>{s.name}</td>
                <td>{s.dept}</td>
                <td>{s.year}</td>
                <td>
                  <a href={`/admin/student/${s.id}`} className="btn btn-sm btn-outline-primary">View</a>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr><td colSpan={5} className="text-center">No students found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
