import { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import { apiCall, buildUrl } from "../utils/apiClient";

// QR Code Image Component
function QRCodeImage({ value, size = 160 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, { width: size }, (error) => {
        if (error) console.error("QR Error:", error);
      });
    }
  }, [value, size]);

  return <canvas ref={canvasRef} style={{ margin: "10px 0", border: "2px solid #28a745", borderRadius: "4px" }} />;
}

export default function TeacherAttendance(){

  // Login session check
  const savedUser = localStorage.getItem("user");
  const user = savedUser ? JSON.parse(savedUser) : null;
  const isAuthorized = !!user && (user.role === "teacher" || user.role === "hod" || user.role === "subject_controller");

  const teacher_id =
    user?.teacher_id ||
    user?.linked_id ||
    user?.user?.linked_id ||
    user?.user?.teacher_id ||
    user?.user?.user_id ||
    user?.user?.id ||
    user?.user_id ||
    user?.id;


  // State
  const [session,setSession] = useState(null);
  const [students,setStudents] = useState([]);
  const [absent,setAbsent] = useState([]);
  const [msg,setMsg] = useState("");

  const [summary,setSummary] = useState({
    total:0,
    present:0,
    absent:0,
    percentage:0
  });

  const [courses,setCourses] = useState([]);
  const [sel,setSel] = useState("");
  const [period, setPeriod] = useState("1");

  useEffect(() => {
    if(!savedUser){
      alert("Session expired. Please login again.");
      window.location.href = "/";
      return;
    }

    if(!isAuthorized){
      alert("Unauthorized! Only teachers and HODs allowed.");
      window.location.href = "/";
    }
  }, [savedUser, isAuthorized]);


  // Load courses
  const loadCourses = async ()=>{
    if (!teacher_id) return;

    try {
      const data = await apiCall(
        buildUrl(`get_teacher_courses.php?teacher_id=${teacher_id}`)
      );
      if(data.status) setCourses(data.courses || []);
    } catch(err) {
      console.error("Error loading courses:", err);
      setMsg("Failed to load courses. Check backend connection.");
    }
  };


  // Load active session
  const loadSession = async ()=>{
    if (!teacher_id) return;

    try {
      const data = await apiCall(
        buildUrl(`get_active_teacher_session.php?teacher_id=${teacher_id}`),
        { suppressStatusWarning: true }
      );

      if(data.status){
        setSession(data.session);
        loadStudents(data.session.id);
        loadSummary(data.session.id);
        loadAbsent(data.session.id);
        setMsg("");
      } else {
        setSession(null);
        setStudents([]);
        setAbsent([]);
        setMsg("No Active Attendance Session");
      }
    } catch(err) {
      console.error("Error loading session:", err);
      setMsg("Failed to load session. Check backend connection.");
    }
  };


  // Load students with hotspot data
  const loadStudents = async (sid) => {
    try {
      const data = await apiCall(
        buildUrl(`get_attendance_list.php?session_id=${sid}`)
      );
      if (data.status) {
        setStudents(data.attendance || []);
      }
    } catch (err) {
      console.error("Error loading students:", err);
    }
  };

  // Summary
  const loadSummary = async (sid)=>{
    try {
      // Calculate summary from attendance_list data
      const data = await apiCall(
        buildUrl(`get_attendance_list.php?session_id=${sid}`)
      );
      if(data.status) {
        setSummary({
          total: data.stats?.total_students || 0,
          present: data.stats?.total_present || 0,
          absent: (data.stats?.total_students || 0) - (data.stats?.total_present || 0),
          percentage: Math.round(((data.stats?.total_present || 0) / (data.stats?.total_students || 1)) * 100),
          rejected_attempts: data.rejected_attempts || []
        });
      }
    } catch(err) {
      console.error("Error loading summary:", err);
    }
  };


  // Absent students
  const loadAbsent = async (sid)=>{
    try {
      const data = await apiCall(
        buildUrl(`get_attendance_list.php?session_id=${sid}`)
      );
      if(data.status) {
        const presentIds = new Set((data.attendance || []).map(s => s.student_id));
        const allStudents = data.all_students || [];
        const absentStudents = allStudents.filter(s => !presentIds.has(s.id));
        setAbsent(absentStudents);
      }
    } catch(err) {
      console.error("Error loading absent students:", err);
    }
  };


  // Auto refresh
  useEffect(()=>{
    if (!isAuthorized) return;

    loadSession();
    loadCourses();

    // Real-time polling every 2 seconds for live hotspot attendance updates
    const i = setInterval(()=>{
      if(session){
        loadStudents(session.id);
        loadSummary(session.id);
        loadAbsent(session.id);
      } else {
        loadSession();
      }
    }, 2000); // 2 second interval for real-time updates

    return ()=>clearInterval(i);
  },[session, isAuthorized]);

  if (!isAuthorized) {
    return null;
  }


  // Start session
  const startSession = async ()=>{

    if(!sel){
      alert("Select a class to start attendance");
      return;
    }

    const c = JSON.parse(sel);

    try {
      const data = await apiCall(buildUrl("start_attendance.php"), {
        method:"POST",
        headers:{ "Content-Type":"application/json"},
        body: JSON.stringify({
          teacher_id,
          subject: c.subject,
          dept: c.dept,
          year: c.year,
          section: c.section,
          period: Number(period)
        })
      });
      alert(data.message);
      loadSession();
    } catch(err) {
      console.error("Error starting session:", err);
      alert("Failed to start session");
    }
  };


  // End session
  const endSession = async ()=>{
    if(!window.confirm("End Attendance Session?")) return;

    try {
      const data = await apiCall(
        buildUrl(`end_attendance.php?teacher_id=${teacher_id}`)
      );
      alert(data.message);
      loadSession();
    } catch(err) {
      console.error("Error ending session:", err);
      alert("Failed to end session");
    }
  };


  return(
    <div className="container mt-4">
      <div className="card p-4 shadow">

        <h3>Teacher Attendance Control</h3>


        {/* NO SESSION */}
        {!session && (
          <>
            <p className="text-danger">{msg}</p>

            <div className="d-flex gap-2 flex-wrap">
              <select 
                className="form-control"
                style={{ maxWidth: "420px" }}
                onChange={e=>setSel(e.target.value)}
              >
                <option>Select Class</option>

                {courses.map((c,i)=>(
                  <option key={i} value={JSON.stringify(c)}>
                    {c.dept} | Year {c.year} | Sec {c.section} | {c.subject_code ? `${c.subject_code} - ` : ""}{c.subject} | Credits {c.credits ?? "-"}
                  </option>
                ))}
              </select>

              <select
                className="form-control"
                style={{ maxWidth: "160px" }}
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                {[1,2,3,4,5,6].map((p) => (
                  <option key={p} value={p}>{`Period ${p}`}</option>
                ))}
              </select>
            </div>

            <button className="btn btn-primary mt-3" onClick={startSession}>
              Start Attendance
            </button>
          </>
        )}


        {/* ACTIVE SESSION */}
        {session && (
          <>
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div className="flex-grow-1">
                <p><b>Subject:</b> {session.subject} {session.period ? `(Period ${session.period})` : ""}</p>
                <p><b>Department:</b> {session.dept} | Year {session.year} | {session.section}</p>
                <p><b>Started:</b> {session.started_at}</p>
                
                {/* HOTSPOT INFORMATION */}
                <div className="alert alert-info p-2 mt-2">
                  <small>
                    <b>🌐 Hotspot Status:</b> {session.hotspot_enabled ? "ENABLED ✓" : "DISABLED"}<br/>
                    <b>🔗 Gateway IP:</b> {session.gateway_ip}<br/>
                    <b>🛰️ Network Prefix:</b> {session.gateway_prefix}
                  </small>
                </div>

                {/* QR CODE TOKEN FOR ATTENDANCE */}
                {session.qr_token && (
                  <div className="alert alert-success p-3 mt-2">
                    <b>📱 Attendance Token (QR Code):</b>
                    <div className="mt-2 p-3 bg-white rounded border-2 text-center" style={{ borderColor: "#28a745" }}>
                      <QRCodeImage value={session.qr_token} size={160} />
                      <h4 style={{ fontFamily: "monospace", letterSpacing: "2px", marginBottom: "10px", marginTop: "10px" }}>
                        {session.qr_token}
                      </h4>
                      <small className="text-muted d-block">
                        Students can scan this QR code or manually enter the token above to mark attendance
                      </small>
                    </div>
                  </div>
                )}
              </div>

              <button className="btn btn-danger" onClick={endSession}>
                End Session
              </button>
            </div>

            <hr/>


            {/* SUMMARY */}
            <div className="row text-center mb-3">

              <div className="col-md-3">
                <div className="card p-3 shadow">
                  <h6>Total Students</h6>
                  <h2>{summary.total}</h2>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card p-3 shadow text-success">
                  <h6>Present</h6>
                  <h2>{summary.present}</h2>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card p-3 shadow text-danger">
                  <h6>Absent</h6>
                  <h2>{summary.absent}</h2>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card p-3 shadow text-primary">
                  <h6>Percentage</h6>
                  <h2>{summary.percentage}%</h2>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card p-3 shadow text-warning">
                  <h6>Rejected (Proxy)</h6>
                  <h2>{summary.rejected_attempts?.length || 0}</h2>
                </div>
              </div>

            </div>

            <hr/>


            {/* REJECTION ATTEMPTS (Network Verification Failures) */}
            {summary.rejected_attempts && summary.rejected_attempts.length > 0 && (
              <>
                <h5 className="text-warning">⚠️ Rejected Attendance Attempts ({summary.rejected_attempts.length})</h5>
                <p className="text-muted small">These students attempted to join but were not on the hotspot network (possible proxy attempts)</p>

                <table className="table table-bordered table-sm">
                  <thead className="table-warning">
                    <tr>
                      <th>Attempted Time</th>
                      <th>Student ID</th>
                      <th>Student IP</th>
                      <th>Reason</th>
                    </tr>
                  </thead>

                  <tbody>
                    {summary.rejected_attempts.map((attempt, i) => (
                      <tr key={i}>
                        <td>{attempt.attempted_at}</td>
                        <td>{attempt.student_id}</td>
                        <td>{attempt.student_ip}</td>
                        <td>
                          <small className="text-danger">
                            Network mismatch: {attempt.student_ip_prefix} ≠ {session.gateway_prefix}
                          </small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <hr/>
              </>
            )}


            {/* PRESENT */}
            <h5>✓ Students Marked Present ({students.length})</h5>

            <table className="table table-bordered">
              <thead className="table-success">
                <tr>
                  <th>Reg No</th>
                  <th>Name</th>
                  <th>Dept</th>
                  <th>Marked Time</th>
                  <th>Network Status</th>
                </tr>
              </thead>

              <tbody>
                {students.map((s,i)=>(
                  <tr key={i} className="table-light">
                    <td>{s.reg_no}</td>
                    <td>{s.name}</td>
                    <td>{s.dept}</td>
                    <td>{s.marked_at}</td>
                    <td>
                      <span className="badge bg-success">✓ On Network</span>
                    </td>
                  </tr>
                ))}

                {students.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">
                      Waiting for students to join...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>


            <hr/>


            {/* ABSENT */}
            <h5 className="text-danger">✗ Absent Students ({absent.length})</h5>

            <table className="table table-bordered">
              <thead className="table-danger">
                <tr>
                  <th>Reg No</th>
                  <th>Name</th>
                  <th>Dept</th>
                </tr>
              </thead>

              <tbody>

                {absent.map((s,i)=>(
                  <tr key={i} className="table-light">
                    <td>{s.reg_no}</td>
                    <td>{s.name}</td>
                    <td>{s.dept}</td>
                  </tr>
                ))}

                {absent.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center text-success fw-bold">
                      ✓ All Students Present! 🎉
                    </td>
                  </tr>
                )}

              </tbody>
            </table>
          </>
        )}

      </div>
    </div>
  );
}
