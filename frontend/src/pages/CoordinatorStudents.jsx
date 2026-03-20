import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function CoordinatorStudents() {

  const stored = JSON.parse(localStorage.getItem("user")) || {};
  const user = stored.user || stored;
  const coordinator_id =
    user?.teacher_id ||
    user?.linked_id ||
    user?.user?.linked_id ||
    user?.user?.teacher_id ||
    user?.user_id ||
    user?.id;

  const [students, setStudents] = useState([]);
  const [logoutRequests, setLogoutRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(0);
  const [search, setSearch] = useState("");

  const loadStudents = async () => {
    try {
      const data = await apiCall(
        buildUrl(`get_coordinator_students.php?coordinator_id=${coordinator_id}`)
      );

      if (data.status) {
        setStudents(data.students);
      }
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  const loadLogoutRequests = async () => {
    setLoadingRequests(true);
    try {
      const data = await apiCall(
        buildUrl(`get_logout_requests.php?coordinator_id=${coordinator_id}`)
      );

      if (data?.status) {
        setLogoutRequests(data.requests || []);
      }
    } catch (error) {
      console.error(error);
    }
    setLoadingRequests(false);
  };

  const decideRequest = async (requestId, decision) => {
    setActionLoadingId(requestId);
    const data = await apiCall(buildUrl("decide_logout_request.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        request_id: requestId,
        decision,
        decision_note: decision === "approved" ? "Approved by coordinator" : "Rejected by coordinator"
      })
    });

    if (!data?.status) {
      window.alert(data?.message || "Could not update request");
      setActionLoadingId(0);
      return;
    }

    await loadLogoutRequests();
    setActionLoadingId(0);
  };

  useEffect(() => {
    if (coordinator_id) {
      loadStudents();
      loadLogoutRequests();
    }
  }, [coordinator_id]);

  const filtered = students.filter((s) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      String(s.name || "").toLowerCase().includes(term) ||
      String(s.reg_no || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="container mt-4">
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="mb-3">Early Logout Requests (Approval Panel)</h5>
          {loadingRequests ? (
            <p className="mb-0">Loading requests...</p>
          ) : logoutRequests.length === 0 ? (
            <p className="text-muted mb-0">No pending requests for today</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm table-bordered mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Reg No</th>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Reason</th>
                    <th>Requested At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {logoutRequests.map((request) => (
                    <tr key={request.id}>
                      <td>{request.reg_no || "-"}</td>
                      <td>{request.student_name || "-"}</td>
                      <td>{`${request.dept || "-"} / ${request.year || "-"} / ${request.section || "-"}`}</td>
                      <td>{request.reason || "-"}</td>
                      <td>{request.requested_at || "-"}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-success btn-sm"
                            disabled={actionLoadingId === request.id}
                            onClick={() => decideRequest(request.id, "approved")}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            disabled={actionLoadingId === request.id}
                            onClick={() => decideRequest(request.id, "rejected")}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between">
        <h3>Assigned Students</h3>
        <input
          className="form-control w-auto"
          placeholder="Search by name or reg no"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Loading students...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted">No students assigned</p>
      ) : (
        <table className="table table-bordered mt-3">
          <thead className="table-dark">
            <tr>
              <th>Register No</th>
              <th>Name</th>
              <th>Department</th>
              <th>Year</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td>{s.reg_no}</td>
                <td>{s.name}</td>
                <td>{s.dept}</td>
                <td>{s.year}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
