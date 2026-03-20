import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function TeacherCourses(){
  const saved = localStorage.getItem("user");
  const user = saved ? JSON.parse(saved) : null;
  const isAuthorized = !!user;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if(!isAuthorized){
      window.location.href = "/";
    }
  }, [isAuthorized]);

  useEffect(() => {
    if (!teacher_id) {
      setLoading(false);
      return;
    }

    const loadCourses = async () => {
      try {
        const data = await apiCall(buildUrl(`get_teacher_courses.php?teacher_id=${teacher_id}`));
        if (data.status) setCourses(data.courses || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadCourses();
  }, [teacher_id]);

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="card p-4 shadow">
      <h3>✔️ My Assigned Courses</h3>

      {loading ? (
        <p>Loading...</p>
      ) : courses.length > 0 ? (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Department</th>
              <th>Year</th>
              <th>Section</th>
              <th>Subject</th>
              <th>Code</th>
              <th>Credits</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c, i) => (
              <tr key={i}>
                <td>{c.dept}</td>
                <td>{c.year}</td>
                <td>{c.section || '-'}</td>
                <td>{c.subject}</td>
                <td>{c.subject_code || '-'}</td>
                <td>{c.credits || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-muted">No courses assigned yet.</p>
      )}
    </div>
  );
}
