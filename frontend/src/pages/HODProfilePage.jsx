import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function HODProfilePage(){
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const teacher_id = user?.user?.linked_id || user?.user?.teacher_id || user?.linked_id || user?.teacher_id;
  const [teacher, setTeacher] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!teacher_id) {
        setError("HOD ID not found");
        return;
      }

      try {
        setError(null);
        const data = await apiCall(buildUrl(`get_teacher_profile.php?id=${teacher_id}`));
        if (data?.status && data?.teacher) {
          setTeacher(data.teacher);
        } else {
          setError(data?.message || "Failed to load profile");
        }
      } catch (err) {
        console.error("Error loading HOD profile:", err);
        setError("Failed to fetch profile");
      }
    };

    loadProfile();
  }, [teacher_id]);

  if (error) return <h3 className="m-4 text-danger">Error: {error}</h3>;
  if (!teacher) return <h3 className="m-4">Loading Profile...</h3>;

  return (
    <div className="container mt-4">
      <div className="card p-4 shadow">
        <h3>Head of Department Profile</h3>
        <p className="text-secondary">Academic Information</p>
        <hr />

        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label text-muted">Name</label>
            <div className="form-control bg-light">{teacher.name || "-"}</div>
          </div>
          <div className="col-md-6">
            <label className="form-label text-muted">Employee ID</label>
            <div className="form-control bg-light">{teacher.id || "-"}</div>
          </div>
          <div className="col-md-6">
            <label className="form-label text-muted">Department</label>
            <div className="form-control bg-light">{teacher.dept || "-"}</div>
          </div>
          <div className="col-md-6">
            <label className="form-label text-muted">Designation</label>
            <div className="form-control bg-light">{teacher.designation || "-"}</div>
          </div>
          <div className="col-md-6">
            <label className="form-label text-muted">Qualification</label>
            <div className="form-control bg-light">{teacher.qualification || "-"}</div>
          </div>
          <div className="col-md-6">
            <label className="form-label text-muted">Contact</label>
            <div className="form-control bg-light">{teacher.contact || "-"}</div>
          </div>
          <div className="col-md-6">
            <label className="form-label text-muted">Email</label>
            <div className="form-control bg-light">{teacher.email || "-"}</div>
          </div>
          <div className="col-md-6">
            <label className="form-label text-muted">Status</label>
            <div className="form-control bg-light text-capitalize">{teacher.status || "-"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
