import { useEffect, useMemo, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function SubjectControllerTools() {
  const stored = JSON.parse(localStorage.getItem("user") || "{}");
  const teacherId =
    stored?.teacher_id ||
    stored?.linked_id ||
    stored?.user?.linked_id ||
    stored?.user?.teacher_id ||
    stored?.user?.user_id ||
    stored?.user?.id ||
    stored?.user_id ||
    stored?.id;

  const [dept, setDept] = useState("");
  const [loading, setLoading] = useState(true);
  const [isController, setIsController] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [notice, setNotice] = useState("");

  const [newSubject, setNewSubject] = useState({
    year: "",
    semester: "",
    subject_code: "",
    subject_name: "",
    credits: ""
  });

  const [planForm, setPlanForm] = useState({
    classKey: "",
    subjectId: ""
  });

  const [assignForm, setAssignForm] = useState({
    planId: "",
    teacherId: ""
  });

  const [timetableForm, setTimetableForm] = useState({
    classKey: "",
    day: "Monday",
    period: "1",
    planId: "",
    teacherId: ""
  });

  const dayOptions = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const classOptions = useMemo(() => {
    return classes.map((c) => ({
      key: `${c.year}|${c.section}`,
      label: `Year ${c.year} - ${c.section}`,
      year: c.year,
      section: c.section
    }));
  }, [classes]);

  const approvedPlans = useMemo(
    () => plans.filter((plan) => plan.status === "approved"),
    [plans]
  );

  const approvedAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status === "approved"),
    [assignments]
  );

  const timetableAssignments = useMemo(() => {
    if (!timetableForm.planId) return [];
    return approvedAssignments.filter(
      (assignment) => String(assignment.plan_id) === String(timetableForm.planId)
    );
  }, [approvedAssignments, timetableForm.planId]);

  const selectedClass = classOptions.find((c) => c.key === timetableForm.classKey);

  const loadDept = async () => {
    if (!teacherId) return "";
    const profile = await apiCall(buildUrl(`get_teacher_profile.php?id=${teacherId}`));
    if (profile.status && profile.teacher) {
      return profile.teacher.dept || "";
    }
    return "";
  };

  const loadData = async () => {
    setLoading(true);
    const deptValue = await loadDept();
    setDept(deptValue);

    const controllerRes = await apiCall(
      buildUrl(`get_subject_controller_status.php?teacher_id=${teacherId}`)
    );
    setIsController(Boolean(controllerRes.is_subject_controller));

    if (!deptValue) {
      setNotice("Department not found. Please re-login.");
      setLoading(false);
      return;
    }

    const [subjectsRes, classesRes, teachersRes, plansRes, assignmentsRes] = await Promise.all([
      apiCall(buildUrl(`list_subjects.php?dept=${encodeURIComponent(deptValue)}`)),
      apiCall(buildUrl(`get_department_classes.php?department=${encodeURIComponent(deptValue)}`)),
      apiCall(buildUrl(`get_department_teachers.php?department=${encodeURIComponent(deptValue)}`)),
      apiCall(buildUrl(`list_class_subject_plans.php?dept=${encodeURIComponent(deptValue)}`)),
      apiCall(buildUrl(`list_subject_staff_assignments.php?dept=${encodeURIComponent(deptValue)}`))
    ]);

    setSubjects(subjectsRes.status ? subjectsRes.subjects || [] : []);
    setClasses(classesRes.status ? classesRes.classes || [] : []);
    setTeachers(teachersRes.status ? teachersRes.teachers || [] : []);
    setPlans(plansRes.status ? plansRes.plans || [] : []);
    setAssignments(assignmentsRes.status ? assignmentsRes.assignments || [] : []);

    setLoading(false);
  };

  const loadTimetable = async (year, section) => {
    if (!year || !section) {
      setTimetable([]);
      return;
    }
    const data = await apiCall(
      buildUrl(
        `list_class_timetable.php?dept=${encodeURIComponent(dept)}&year=${year}&section=${encodeURIComponent(section)}`
      )
    );
    setTimetable(data.status ? data.timetable || [] : []);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadTimetable(selectedClass.year, selectedClass.section);
    }
  }, [selectedClass]);

  const handleSubjectCreate = async () => {
    setNotice("");
    const payload = {
      dept,
      year: newSubject.year,
      semester: newSubject.semester || null,
      subject_code: newSubject.subject_code,
      subject_name: newSubject.subject_name,
      credits: newSubject.credits
    };

    const res = await apiCall(buildUrl("create_subject.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setNotice(res.message || "");
    if (res.status) {
      setNewSubject({ year: "", semester: "", subject_code: "", subject_name: "", credits: "" });
      const subjectsRes = await apiCall(buildUrl(`list_subjects.php?dept=${encodeURIComponent(dept)}`));
      setSubjects(subjectsRes.status ? subjectsRes.subjects || [] : []);
    }
  };

  const handlePlan = async () => {
    setNotice("");
    const chosen = classOptions.find((c) => c.key === planForm.classKey);
    if (!chosen) {
      setNotice("Choose a class.");
      return;
    }

    const res = await apiCall(buildUrl("plan_class_subject.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dept,
        year: chosen.year,
        section: chosen.section,
        subject_id: planForm.subjectId
      })
    });

    setNotice(res.message || "");
    if (res.status) {
      setPlanForm({ classKey: "", subjectId: "" });
      const plansRes = await apiCall(buildUrl(`list_class_subject_plans.php?dept=${encodeURIComponent(dept)}`));
      setPlans(plansRes.status ? plansRes.plans || [] : []);
    }
  };

  const handleAssignStaff = async () => {
    setNotice("");
    const selectedPlan = plans.find((plan) => String(plan.id) === String(assignForm.planId));
    if (!selectedPlan) {
      setNotice("Select a plan first.");
      return;
    }
    if (selectedPlan.status !== "approved") {
      setNotice("Plan must be approved by HOD before assigning staff.");
      return;
    }

    const res = await apiCall(buildUrl("assign_subject_staff.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan_id: assignForm.planId,
        teacher_id: assignForm.teacherId
      })
    });

    setNotice(res.message || "");
    if (res.status) {
      setAssignForm({ planId: "", teacherId: "" });
      const assignmentsRes = await apiCall(buildUrl(`list_subject_staff_assignments.php?dept=${encodeURIComponent(dept)}`));
      setAssignments(assignmentsRes.status ? assignmentsRes.assignments || [] : []);
    }
  };

  const handleTimetable = async () => {
    setNotice("");
    const chosen = classOptions.find((c) => c.key === timetableForm.classKey);
    if (!chosen) {
      setNotice("Choose a class.");
      return;
    }

    if (!timetableForm.planId || !timetableForm.teacherId) {
      setNotice("Select an approved plan and staff assignment.");
      return;
    }

    const eligible = timetableAssignments.some(
      (assignment) => String(assignment.teacher_id) === String(timetableForm.teacherId)
    );
    if (!eligible) {
      setNotice("Selected staff must be approved for this plan.");
      return;
    }

    const res = await apiCall(buildUrl("set_class_timetable.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dept,
        year: chosen.year,
        section: chosen.section,
        day: timetableForm.day,
        period: timetableForm.period,
        plan_id: timetableForm.planId,
        teacher_id: timetableForm.teacherId
      })
    });

    setNotice(res.message || "");
    if (res.status) {
      const updated = await apiCall(
        buildUrl(
          `list_class_timetable.php?dept=${encodeURIComponent(dept)}&year=${chosen.year}&section=${encodeURIComponent(chosen.section)}`
        )
      );
      setTimetable(updated.status ? updated.timetable || [] : []);
    }
  };

  if (loading) {
    return <div className="card p-4 shadow">Loading...</div>;
  }

  if (!isController) {
    return (
      <div className="card p-4 shadow">
        <h3>Subject Controller</h3>
        <p className="text-muted">You are not assigned as a subject controller.</p>
        {notice && <div className="alert alert-warning">{notice}</div>}
      </div>
    );
  }

  return (
    <div className="container mt-3">
      <h3 className="mb-3">🧭 Subject Controller Workspace</h3>
      <p className="text-muted">All subject plans, staff assignments, and timetables need HOD approval.</p>
      {notice && <div className="alert alert-info">{notice}</div>}

      <div className="card p-4 shadow mb-4">
        <h5>📘 Subjects</h5>
        <div className="row g-2 align-items-end">
          <div className="col-md-2">
            <label className="form-label">Year</label>
            <input
              className="form-control"
              value={newSubject.year}
              onChange={(e) => setNewSubject({ ...newSubject, year: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Semester</label>
            <input
              className="form-control"
              value={newSubject.semester}
              onChange={(e) => setNewSubject({ ...newSubject, semester: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Code</label>
            <input
              className="form-control"
              value={newSubject.subject_code}
              onChange={(e) => setNewSubject({ ...newSubject, subject_code: e.target.value })}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Subject Name</label>
            <input
              className="form-control"
              value={newSubject.subject_name}
              onChange={(e) => setNewSubject({ ...newSubject, subject_name: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Credits</label>
            <input
              className="form-control"
              value={newSubject.credits}
              onChange={(e) => setNewSubject({ ...newSubject, credits: e.target.value })}
            />
          </div>
        </div>
        <button className="btn btn-primary mt-3" onClick={handleSubjectCreate}>
          Save Subject
        </button>

        <div className="table-responsive mt-3">
          <table className="table table-sm table-striped">
            <thead>
              <tr>
                <th>Year</th>
                <th>Code</th>
                <th>Name</th>
                <th>Credits</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s.id}>
                  <td>{s.year}</td>
                  <td>{s.subject_code}</td>
                  <td>{s.subject_name}</td>
                  <td>{s.credits}</td>
                </tr>
              ))}
              {subjects.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-muted">
                    No subjects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-4 shadow mb-4">
        <h5>🗂️ Plan Subjects for Classes</h5>
        <div className="row g-2 align-items-end">
          <div className="col-md-4">
            <label className="form-label">Class</label>
            <select
              className="form-select"
              value={planForm.classKey}
              onChange={(e) => setPlanForm({ ...planForm, classKey: e.target.value })}
            >
              <option value="">Select class</option>
              {classOptions.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Subject</label>
            <select
              className="form-select"
              value={planForm.subjectId}
              onChange={(e) => setPlanForm({ ...planForm, subjectId: e.target.value })}
            >
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subject_code} - {s.subject_name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn btn-primary mt-3" onClick={handlePlan}>
          Plan Subject
        </button>

        <div className="table-responsive mt-3">
          <table className="table table-sm table-striped">
            <thead>
              <tr>
                <th>Class</th>
                <th>Subject</th>
                <th>Credits</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id}>
                  <td>{`Year ${p.year} - ${p.section}`}</td>
                  <td>{`${p.subject_code} - ${p.subject_name}`}</td>
                  <td>{p.credits ?? "-"}</td>
                  <td>
                    <span
                      className={`badge ${
                        p.status === "approved"
                          ? "bg-success"
                          : p.status === "rejected"
                          ? "bg-danger"
                          : "bg-warning text-dark"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
              {plans.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-muted">
                    No plans created.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-4 shadow mb-4">
        <h5>👩‍🏫 Assign Subject Staff</h5>
        <div className="row g-2 align-items-end">
          <div className="col-md-6">
            <label className="form-label">Plan</label>
            <select
              className="form-select"
              value={assignForm.planId}
              onChange={(e) => setAssignForm({ ...assignForm, planId: e.target.value })}
              disabled={approvedPlans.length === 0}
            >
              <option value="">Select approved plan</option>
              {approvedPlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {`Year ${p.year} - ${p.section} | ${p.subject_code}`}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Teacher</label>
            <select
              className="form-select"
              value={assignForm.teacherId}
              onChange={(e) => setAssignForm({ ...assignForm, teacherId: e.target.value })}
            >
              <option value="">Select teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn btn-primary mt-3" onClick={handleAssignStaff}>
          Assign Staff
        </button>
        {approvedPlans.length === 0 && (
          <div className="text-muted small mt-2">No approved plans yet. Ask HOD to approve plans.</div>
        )}

        <div className="table-responsive mt-3">
          <table className="table table-sm table-striped">
            <thead>
              <tr>
                <th>Class</th>
                <th>Subject</th>
                <th>Credits</th>
                <th>Teacher</th>
                <th>Status</th>
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
                    <span
                      className={`badge ${
                        a.status === "approved"
                          ? "bg-success"
                          : a.status === "rejected"
                          ? "bg-danger"
                          : "bg-warning text-dark"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
              {assignments.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted">
                    No assignments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-4 shadow mb-4">
        <h5>📅 Class Timetable</h5>
        <div className="row g-2 align-items-end">
          <div className="col-md-3">
            <label className="form-label">Class</label>
            <select
              className="form-select"
              value={timetableForm.classKey}
              onChange={(e) => setTimetableForm({ ...timetableForm, classKey: e.target.value })}
            >
              <option value="">Select class</option>
              {classOptions.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Day</label>
            <select
              className="form-select"
              value={timetableForm.day}
              onChange={(e) => setTimetableForm({ ...timetableForm, day: e.target.value })}
            >
              {dayOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Period</label>
            <select
              className="form-select"
              value={timetableForm.period}
              onChange={(e) => setTimetableForm({ ...timetableForm, period: e.target.value })}
            >
              {[1, 2, 3, 4, 5, 6].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">Plan</label>
            <select
              className="form-select"
              value={timetableForm.planId}
              onChange={(e) =>
                setTimetableForm({ ...timetableForm, planId: e.target.value, teacherId: "" })
              }
              disabled={approvedPlans.length === 0}
            >
              <option value="">Select approved plan</option>
              {approvedPlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {`Year ${p.year} - ${p.section} | ${p.subject_code}`}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Teacher</label>
            <select
              className="form-select"
              value={timetableForm.teacherId}
              onChange={(e) => setTimetableForm({ ...timetableForm, teacherId: e.target.value })}
              disabled={timetableAssignments.length === 0}
            >
              <option value="">Select approved staff</option>
              {timetableAssignments.map((a) => (
                <option key={a.id} value={a.teacher_id}>
                  {a.teacher_name || `Teacher ${a.teacher_id}`}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn btn-primary mt-3" onClick={handleTimetable}>
          Save Timetable Entry
        </button>

        <div className="table-responsive mt-3">
          <table className="table table-sm table-striped">
            <thead>
              <tr>
                <th>Day</th>
                <th>Period</th>
                <th>Subject</th>
                <th>Credits</th>
                <th>Teacher</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {timetable.map((t) => (
                <tr key={t.id}>
                  <td>{t.day}</td>
                  <td>{t.period}</td>
                  <td>{`${t.subject_code} - ${t.subject_name}`}</td>
                  <td>{t.credits ?? "-"}</td>
                  <td>{t.teacher_name || "-"}</td>
                  <td>
                    <span
                      className={`badge ${
                        t.status === "approved"
                          ? "bg-success"
                          : t.status === "rejected"
                          ? "bg-danger"
                          : "bg-warning text-dark"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
              {timetable.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted">
                    No timetable entries.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
