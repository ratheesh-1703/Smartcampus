import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function TeacherList() {
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTeachers = async () => {
    setLoading(true);
    const data = await apiCall(buildUrl("get_teachers.php"));
    const list = data?.status && Array.isArray(data.teachers) ? data.teachers : [];
    setTeachers(list);
    setFiltered(list);
    setLoading(false);
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  useEffect(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      setFiltered(teachers);
      return;
    }

    setFiltered(
      teachers.filter((item) => {
        const teacherCode = String(item.staff_id || item.teacher_code || "").toLowerCase();
        const teacherName = String(item.name || "").toLowerCase();
        const dept = String(item.dept || item.department || "").toLowerCase();
        const email = String(item.email || "").toLowerCase();
        return (
          teacherCode.includes(q) ||
          teacherName.includes(q) ||
          dept.includes(q) ||
          email.includes(q)
        );
      })
    );
  }, [search, teachers]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this teacher?")) return;
    const res = await apiCall(buildUrl(`delete_teacher.php?id=${id}`));
    if (!res?.status) {
      alert(res?.message || "Delete failed");
      return;
    }
    await loadTeachers();
  };

  return (
    <div className="container mt-4">
      <h3>Teachers List</h3>

      <div className="card p-3 shadow mt-3">
        <div className="row mb-3">
          <div className="col-md-6">
            <input
              className="form-control"
              placeholder="Search by Staff ID / Name / Department / Email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table className="table table-bordered table-striped">
          <thead>
            <tr>
              <th>Staff ID</th>
              <th>Name</th>
              <th>Department</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center">Loading...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">No Records Found</td>
              </tr>
            ) : (
              filtered.map((teacher) => (
                <tr key={teacher.id}>
                  <td>{teacher.staff_id || teacher.teacher_code || "-"}</td>
                  <td>{teacher.name || "-"}</td>
                  <td>{teacher.dept || teacher.department || "-"}</td>
                  <td>{teacher.phone || "-"}</td>
                  <td>{teacher.email || "-"}</td>
                  <td>
                    <a className="btn btn-primary btn-sm me-2" href={`/admin/teacher/${teacher.id}`}>
                      View
                    </a>
                    <a className="btn btn-warning btn-sm me-2" href={`/admin/teacher/edit/${teacher.id}`}>
                      Edit
                    </a>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(teacher.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
