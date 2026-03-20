import { useState, useEffect, useRef, useCallback } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function StudentAttendance(){

  const user = JSON.parse(localStorage.getItem("user"));
  const student_id =
    user?.student_id ||
    user?.linked_id ||
    user?.user?.student_id ||
    user?.user?.linked_id ||
    user?.user?.user_id ||
    user?.user?.id ||
    user?.user_id ||
    user?.id;
  const [msg, setMsg] = useState("");
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [markingStatus, setMarkingStatus] = useState("");
  const [verificationDetails, setVerificationDetails] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [scannedQRCode, setScannedQRCode] = useState(null);
  const [manualTokens, setManualTokens] = useState({}); // Track manual token input for each session
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const loadSessions = useCallback(async () => {
    if (!student_id) {
      setMsg("Student ID not found. Please log in again.");
      return;
    }

    setLoading(true);
    const data = await apiCall(
      buildUrl(`get_available_sessions.php?student_id=${student_id}`)
    );

    if (data.status) {
      setSessions(data.sessions || []);
      if ((data.sessions || []).length === 0) {
        setMsg("No active attendance sessions available");
      } else {
        setMsg("");
      }
    } else {
      setMsg(data.message || "Error loading sessions");
    }
    setLoading(false);
  }, [student_id]);

  // Load available sessions
  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [loadSessions]);

  // Mark attendance with QR code verification
  const startQRScanning = async (sessionId) => {
    setSelectedSession(sessionId);
    setQrModalOpen(true);
    setScannedQRCode(null);
    
    // Start camera
    setTimeout(() => {
      if (videoRef.current) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
          .then(stream => {
            videoRef.current.srcObject = stream;
            scanQRCode(stream);
          })
          .catch(() => {
            setMarkingStatus("❌ Camera Access Denied");
            setVerificationDetails({
              verified: false,
              message: "Please allow camera access to scan QR code",
              timestamp: new Date().toLocaleTimeString()
            });
            setQrModalOpen(false);
          });
      }
    }, 100);
  };

  // Scan QR code from video stream
  const scanQRCode = (stream) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    const scanInterval = setInterval(() => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Try to decode QR code using simple pattern detection
        // For production, use jsQR library: npm install jsqr
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = decodeQRFromImageData(imageData);

        if (qrCode) {
          setScannedQRCode(qrCode);
          clearInterval(scanInterval);
          
          // Stop video stream
          stream.getTracks().forEach(track => track.stop());
          
          // Close modal and mark attendance
          setQrModalOpen(false);
          markAttendanceWithQRCode(selectedSession, qrCode);
        }
      }
    }, 100);

    // Timeout after 30 seconds
    setTimeout(() => {
      clearInterval(scanInterval);
      if (!scannedQRCode) {
        setMarkingStatus("⏱️ QR Scan Timeout");
        setVerificationDetails({
          verified: false,
          message: "Could not scan QR code. Please try again.",
          timestamp: new Date().toLocaleTimeString()
        });
        setQrModalOpen(false);
        stream.getTracks().forEach(track => track.stop());
      }
    }, 30000);
  };

  // Simple QR code decoder (reads text from QR - expects "SESSION_ID|TOKEN" format)
  const decodeQRFromImageData = () => {
    // This is a placeholder - for production use jsQR library
    // For now, we'll prompt user to manually enter QR code
    return null; // Will prompt for manual entry
  };

  // Mark attendance with scanned QR code
  const markAttendanceWithQRCode = async (sessionId, qrCode) => {
    // If QR scanning didn't work, prompt for manual entry
    if (!qrCode) {
      const qrToken = prompt("Could not scan QR code automatically. Please enter the QR code token from the board:");
      if (!qrToken) {
        setMarkingStatus("❌ QR Code Required");
        setVerificationDetails({
          verified: false,
          message: "QR code is required to mark attendance",
          timestamp: new Date().toLocaleTimeString()
        });
        return;
      }
      submitAttendance(sessionId, qrToken);
    } else {
      submitAttendance(sessionId, qrCode);
    }
  };

  // Submit attendance with QR token
  const submitAttendance = async (sessionId, qrToken) => {
    setMarkingStatus("🔍 Verifying QR Code & Network...");
    setVerificationDetails(null);

    const data = await apiCall(buildUrl("mark_attendance.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        qr_token: qrToken
      })
    });

    if (data.status) {
      setMarkingStatus("✓ Attendance Marked Successfully!");
      setVerificationDetails({
        verified: true,
        message: data.message,
        timestamp: new Date().toLocaleTimeString()
      });

      setTimeout(() => loadSessions(), 1000);
    } else {
      setMarkingStatus("✗ Attendance Failed");
      setVerificationDetails({
        verified: false,
        message: data.message || "Could not verify your attendance",
        reason: data.code || data.reason || "Verification failed",
        instruction: data.instruction || "Make sure you are in the classroom and scanned the correct QR code",
        timestamp: new Date().toLocaleTimeString()
      });
    }
  };

  return(
    <div className="container mt-4">
      
      <div className="card p-4 shadow">

        <h3>🎓 Student Attendance System</h3>
        <p className="text-muted">Scan the QR code displayed on classroom board to mark attendance</p>

        <hr/>

        {/* LOADING STATE */}
        {loading && (
          <div className="alert alert-info">
            <small>Loading available attendance sessions...</small>
          </div>
        )}

        {/* ERROR MESSAGE */}
        {msg && !sessions.length > 0 && (
          <div className="alert alert-warning">{msg}</div>
        )}

        {/* AVAILABLE SESSIONS */}
        {sessions.length > 0 && (
          <>
            <h5 className="mb-3">Available Attendance Sessions</h5>
            
            <div className="row">
              {sessions.map((session) => (
                <div key={session.id} className="col-md-6 mb-3">
                  <div className={`card p-3 ${session.already_marked ? 'border-success' : ''}`}>
                    
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <h6><b>{session.subject}</b></h6>
                        <small className="text-muted">
                          {session.dept} | Year {session.year} | Section {session.section}
                        </small><br/>
                        <small className="text-muted">
                          Period: {session.period || "-"}
                        </small><br/>
                        <small className="text-muted">
                          Started: {session.started_at}
                        </small>
                      </div>

                      {session.already_marked && (
                        <span className="badge bg-success">✓ Marked</span>
                      )}
                    </div>

                    <div className="mt-3">
                      {!session.already_marked ? (
                        <>
                          <button 
                            className="btn btn-primary btn-sm w-100 mb-2"
                            onClick={() => {
                              startQRScanning(session.id);
                            }}
                          >
                            📱 Scan QR Code
                          </button>
                          
                          <div className="input-group input-group-sm">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Or enter token manually..."
                              value={manualTokens[session.id] || ""}
                              onChange={(e) => setManualTokens({...manualTokens, [session.id]: e.target.value.toUpperCase()})}
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  const token = manualTokens[session.id];
                                  if (token) submitAttendance(session.id, token);
                                }
                              }}
                            />
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => {
                                const token = manualTokens[session.id];
                                if (token) submitAttendance(session.id, token);
                              }}
                              disabled={!manualTokens[session.id]}
                            >
                              Mark Attendance
                            </button>
                          </div>
                        </>
                      ) : (
                        <button 
                          className="btn btn-secondary btn-sm w-100" 
                          disabled
                        >
                          Already Marked
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* NO SESSIONS */}
        {!loading && sessions.length === 0 && (
          <div className="alert alert-info text-center">
            <h6>No Active Sessions</h6>
            <p className="mb-0 small">Your teachers haven't started attendance yet. Check back soon!</p>
          </div>
        )}

        <hr/>

        {/* VERIFICATION RESULT */}
        {verificationDetails && (
          <div className={`alert ${verificationDetails.verified ? 'alert-success' : 'alert-danger'} p-3`}>
            
            <h6>{markingStatus}</h6>
            
            <small>
              <b>Status:</b> {verificationDetails.message}<br/>
              {verificationDetails.reason && (
                <>
                  <b>Reason:</b> {verificationDetails.reason}<br/>
                </>
              )}
              <b>Time:</b> {verificationDetails.timestamp}
            </small>

            {verificationDetails.verified ? (
              <div className="mt-2">
                <p className="mb-0 text-success fw-bold">
                  ✓ Your attendance has been recorded
                </p>
              </div>
            ) : (
              <div className="mt-2">
                <p className="mb-2 small text-danger">
                  <b>Why was this rejected?</b>
                </p>
                <ul className="small mb-0 text-danger">
                  <li>Invalid or expired QR code scanned</li>
                  <li>You are not connected to the attendance hotspot</li>
                  <li>You are outside the classroom</li>
                </ul>
                <p className="mt-2 small text-muted">
                  <b>Solution:</b> {verificationDetails.instruction || "Make sure you scanned the current QR code from the classroom board"}
                </p>
              </div>
            )}

          </div>
        )}

      </div>

      {/* QR CODE SCANNING MODAL */}
      {qrModalOpen && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">📱 Scan Attendance QR Code</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setQrModalOpen(false);
                    if (videoRef.current?.srcObject) {
                      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
                    }
                  }}
                ></button>
              </div>
              <div className="modal-body text-center">
                <p className="text-muted small">
                  Point your camera at the QR code displayed on the classroom board
                </p>
                <div style={{ 
                  backgroundColor: "#000", 
                  borderRadius: "8px", 
                  overflow: "hidden",
                  marginBottom: "1rem"
                }}>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline
                    style={{ width: "100%", maxHeight: "300px" }}
                  />
                </div>
                <canvas 
                  ref={canvasRef} 
                  style={{ display: "none" }}
                />
                
                <div className="alert alert-info">
                  <small>
                    <b>Note:</b> If automatic scanning doesn't work, you will be asked to manually enter the QR code token
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setQrModalOpen(false);
                    if (videoRef.current?.srcObject) {
                      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
                    }
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
