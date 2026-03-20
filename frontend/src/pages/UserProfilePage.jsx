import { useMemo } from "react";

export default function UserProfilePage() {
  const profile = useMemo(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("user") || "{}");
      const payload = raw?.user || raw || {};
      return {
        username: payload?.username || "-",
        name: payload?.name || "-",
        role: raw?.role || payload?.role || "-",
        userId: payload?.user_id || payload?.id || "-",
        linkedId: payload?.linked_id || payload?.student_id || payload?.teacher_id || "-",
        tokenExpiry: payload?.token_expires_at || raw?.token_expires_at || "-"
      };
    } catch {
      return {
        username: "-",
        name: "-",
        role: "-",
        userId: "-",
        linkedId: "-",
        tokenExpiry: "-"
      };
    }
  }, []);

  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-body">
          <h3 className="mb-3">My Profile</h3>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label text-muted">Username</label>
              <div className="form-control bg-light">{profile.username}</div>
            </div>
            <div className="col-md-6">
              <label className="form-label text-muted">Name</label>
              <div className="form-control bg-light">{profile.name}</div>
            </div>
            <div className="col-md-6">
              <label className="form-label text-muted">Role</label>
              <div className="form-control bg-light text-capitalize">{String(profile.role).replace("_", " ")}</div>
            </div>
            <div className="col-md-6">
              <label className="form-label text-muted">User ID</label>
              <div className="form-control bg-light">{profile.userId}</div>
            </div>
            <div className="col-md-6">
              <label className="form-label text-muted">Linked Profile ID</label>
              <div className="form-control bg-light">{profile.linkedId}</div>
            </div>
            <div className="col-md-6">
              <label className="form-label text-muted">Token Expires At</label>
              <div className="form-control bg-light">{profile.tokenExpiry}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}