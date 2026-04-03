import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function HODSubjectApprovals() {
  const auth = JSON.parse(localStorage.getItem("user") || "{}");
  const hodTeacherId =
    auth?.user?.linked_id ||
    auth?.linked_id ||
    auth?.user?.teacher_id ||
    auth?.teacher_id ||
    auth?.user?.id ||
    auth?.id ||
    null;

  const [dept, setDept] = useState("");
  const [plans, setPlans] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [pendingSubjects, setPendingSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const loadAll = async () => {
    setLoading(true);
    setNotice("");

    const suffix = hodTeacherId ? `?teacher_id=${encodeURIComponent(hodTeacherId)}` : "";
    const ctrl = await apiCall(buildUrl(`get_subject_controllers.php${suffix}`));
    if (!ctrl.status) {
      setNotice(ctrl.message || "Failed to load department");
      setLoading(false);
      return;
    }

    const deptValue = ctrl.dept || "";
    setDept(deptValue);

    const [plansRes, assignmentsRes, timetableRes, subjectsRes] = await Promise.all([
      apiCall(
        buildUrl(`list_class_subject_plans.php?dept=${encodeURIComponent(deptValue)}&status=pending`)
      ),
      apiCall(
        buildUrl(`list_subject_staff_assignments.php?dept=${encodeURIComponent(deptValue)}&status=pending`)
      ),
      apiCall(
        buildUrl(`list_class_timetable.php?dept=${encodeURIComponent(deptValue)}&status=pending`)
      ),
      apiCall(
        buildUrl(`list_subjects.php?dept=${encodeURIComponent(deptValue)}`)
      )
    ]);

    setPlans(plansRes.status ? plansRes.plans || [] : []);
    setAssignments(assignmentsRes.status ? assignmentsRes.assignments || [] : []);
    setTimetable(timetableRes.status ? timetableRes.timetable || [] : []);
    setPendingSubjects(subjectsRes.status ? (subjectsRes.subjects || []).filter(s => s.status === 'pending') : []);
    setLoading(false);
  };

  // Move decideSubject to top-level scope
  const decideSubject = async (subjectId, decision) => {
    const reason = decision === "rejected" ? prompt("Reason for rejection:") || "" : "";
    const res = await apiCall(buildUrl("approve_subject.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject_id: subjectId, decision, reason })
    });
    setNotice(res.message || "");
    if (res.status) loadAll();
  };

  useEffect(() => {
    loadAll();
  }, [hodTeacherId]);

  const decidePlan = async (planId, decision) => {
    const reason = decision === "rejected" ? prompt("Reason for rejection:") || "" : "";
    const res = await apiCall(buildUrl("approve_class_subject_plan.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_id: planId, decision, reason })
    });
    setNotice(res.message || "");
    if (res.status) loadAll();
  };

  const decideAssignment = async (assignmentId, decision) => {
    const reason = decision === "rejected" ? prompt("Reason for rejection:") || "" : "";
    const res = await apiCall(buildUrl("approve_subject_staff_assignment.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignment_id: assignmentId, decision, reason })
    });
    setNotice(res.message || "");
    if (res.status) loadAll();
  };

  const decideTimetable = async (timetableId, decision) => {
    const reason = decision === "rejected" ? prompt("Reason for rejection:") || "" : "";
    const res = await apiCall(buildUrl("approve_class_timetable.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timetable_id: timetableId, decision, reason })
    });
    setNotice(res.message || "");
    if (res.status) loadAll();
  };

  return (
    <div className="container mt-3">
      <h3>✅ Subject Controller Approvals {dept ? `— ${dept}` : ""}</h3>
      {notice && <div className="alert alert-info">{notice}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="card p-4 shadow mb-4">
            <h5>Pending Subjects</h5>
            <div className="table-responsive">
              <table className="table table-sm table-striped">
                <thead>
                  <tr>
                    <th>Subject Code</th>
                    <th>Subject Name</th>
                    <th>Year</th>
                    <th>Semester</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingSubjects.map((s) => (
                    <tr key={s.id}>
                      <td>{s.subject_code}</td>
                      <td>{s.subject_name}</td>
                      <td>{s.year}</td>
                      <td>{s.semester}</td>
                      <td>
                        <button className="btn btn-sm btn-success me-2" onClick={() => decideSubject(s.id, "approved")}>Approve</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => decideSubject(s.id, "rejected")}>Reject</button>
                      </td>
                    </tr>
                  ))}
                  {pendingSubjects.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted">
                        No pending subjects.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card p-4 shadow mb-4">
            <h5>Class Subject Plans</h5>
            <div className="table-responsive">
              <table className="table table-sm table-striped">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Credits</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((p) => (
                    <tr key={p.id}>
                      <td>{`Year ${p.year} - ${p.section}`}</td>
                      <td>{`${p.subject_code} - ${p.subject_name}`}</td>
                      <td>{p.credits ?? "-"}</td>
                      <td>
                        <button className="btn btn-sm btn-success me-2" onClick={() => decidePlan(p.id, "approved")}>
                          Approve
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => decidePlan(p.id, "rejected")}>
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                  {plans.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-muted">
                        No pending plans.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-4 shadow mb-4">
            <h5>Subject Staff Assignments</h5>
            <div className="table-responsive">
              <table className="table table-sm table-striped">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Credits</th>
                    <th>Teacher</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr key={a.id}>
                      <td>{`Year ${a.year} - ${a.section}`}</td>
                      <td>{`${a.subject_code} - ${a.subject_name}`}</td>
                      <td>{a.credits ?? "-"}</td>
                      <td>{a.teacher_name || "-"}</td>
                      <td>
                        <button className="btn btn-sm btn-success me-2" onClick={() => decideAssignment(a.id, "approved")}>
                          Approve
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => decideAssignment(a.id, "rejected")}>
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                  {assignments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted">
                        No pending staff assignments.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-4 shadow">
            <h5>Timetable Approvals</h5>
            <div className="table-responsive">
              <table className="table table-sm table-striped">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Day</th>
                    <th>Period</th>
                    <th>Subject</th>
                    <th>Credits</th>
                    <th>Teacher</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {timetable.map((t) => (
                    <tr key={t.id}>
                      <td>{`Year ${t.year} - ${t.section}`}</td>
                      <td>{t.day}</td>
                      <td>{t.period}</td>
                      <td>{`${t.subject_code} - ${t.subject_name}`}</td>
                      <td>{t.credits ?? "-"}</td>
                      <td>{t.teacher_name || "-"}</td>
                      <td>
                        <button className="btn btn-sm btn-success me-2" onClick={() => decideTimetable(t.id, "approved")}>
                          Approve
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => decideTimetable(t.id, "rejected")}>
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                  {timetable.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-muted">
                        No pending timetable entries.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
