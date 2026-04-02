import { useState } from "react";
import { apiCall, buildUrl } from "./utils/apiClient";

const normalizeRole = (rawRole) => {
  const normalized = String(rawRole || "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "_");

  const aliases = {
    examcontroller: "exam_controller",
    exam_control: "exam_controller",
    exam_controller: "exam_controller",
    placement: "placement_officer",
    placementofficer: "placement_officer",
    placement_officer: "placement_officer",
    hostelwarden: "hostel_warden",
    hostel_warden: "hostel_warden",
    subjectcontroller: "subject_controller",
    subject_controller: "subject_controller",
    hod: "hod",
    faculty: "teacher",
  };

  return aliases[normalized] || normalized;
};

export default function Login(){
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(false);

  const validateForm = () => {
    if (!username.trim()) {
      setError("Username is required");
      return false;
    }
    if (!password) {
      setError("Password is required");
      return false;
    }
    return true;
  };

  const login = async () => {
    setError("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const data = await apiCall(buildUrl('login.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!data || !data.status) {
        setError(data?.message || "Invalid username or password");
        setLoading(false);
        return;
      }

      const normalizedRole = normalizeRole(data.role || data?.user?.role);

      // SAVE user info with all fields from response
      const toStore = {
        role: normalizedRole,
        user: { ...(data.user || {}), role: normalizedRole },
        teacher_id: data.teacher_id,
        student_id: data.student_id,
        linked_id: data.linked_id,
      };
      if (data.token) toStore.token = data.token;
      localStorage.setItem("user", JSON.stringify(toStore));
      if (remember) localStorage.setItem("rememberUser", username);

      // Redirect based on role
      const roleRoutes = {
        "admin": "/admin",
        "teacher": "/teacher",
        "student": "/student",
        "affairs": "/affairs",
        "hod": "/hod",
        "subject_controller": "/subject-controller",
        "coordinator": "/coordinator",
        "accountant": "/accountant",
        "registrar": "/registrar",
        "exam_controller": "/exam-controller",
        "placement_officer": "/placement",
        "parent": "/parent",
        "dean": "/dean",
        "hostel_warden": "/hostel",
        "librarian": "/librarian"
      };

      const targetRoute = roleRoutes[normalizedRole];
      if (!targetRoute) {
        setError(`No dashboard configured for role: ${normalizedRole || "unknown"}.`);
        setLoading(false);
        return;
      }

      window.location.href = targetRoute;
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      login();
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    }}>
      {/* Animated Background Elements */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        zIndex: 0
      }}>
        <div style={{
          position: "absolute",
          top: "-50%",
          right: "-10%",
          width: "500px",
          height: "500px",
          background: "rgba(255,255,255,0.1)",
          borderRadius: "50%",
          animation: "float 8s ease-in-out infinite"
        }}></div>
        <div style={{
          position: "absolute",
          bottom: "-20%",
          left: "-10%",
          width: "400px",
          height: "400px",
          background: "rgba(255,255,255,0.05)",
          borderRadius: "50%",
          animation: "float 10s ease-in-out infinite"
        }}></div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(30px); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .login-card {
          animation: slideUp 0.6s ease-out;
        }
        .input-field {
          border: 2px solid transparent;
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 15px;
          transition: all 0.3s ease;
          background: rgba(255,255,255,0.95);
          font-family: inherit;
        }
        .input-field:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          background: white;
        }
        .login-btn {
          padding: 12px 24px;
          border-radius: 10px;
          border: none;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          cursor: pointer;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          font-family: inherit;
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }
        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .error-message {
          animation: slideUp 0.3s ease-out;
          border-left: 4px solid #dc3545;
        }
      `}</style>

      <div className="login-card" style={{
        position: "relative",
        zIndex: 10,
        width: "100%",
        maxWidth: "420px"
      }}>
        {/* Header */}
        <div style={{
          textAlign: "center",
          marginBottom: "40px",
          color: "white"
        }}>
          <div style={{
            fontSize: "48px",
            marginBottom: "16px"
          }}>🎓</div>
          <h1 style={{
            fontSize: "32px",
            fontWeight: "700",
            margin: "0 0 8px 0"
          }}>SmartCampus</h1>
          <p style={{
            fontSize: "14px",
            opacity: "0.9",
            margin: "0",
            letterSpacing: "0.5px"
          }}>Campus Management System</p>
        </div>

        {/* Card */}
        <div style={{
          background: "white",
          borderRadius: "15px",
          padding: "40px",
          boxShadow: "0 15px 40px rgba(0,0,0,0.2)",
          backdropFilter: "blur(10px)"
        }}>
          {/* Error Alert */}
          {error && (
            <div className="error-message" style={{
              background: "#ffe0e0",
              color: "#c00",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "14px"
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Username Field */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "600",
              color: "#333",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>👤 Username</label>
            <input
              className="input-field"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={e => {
                setUsername(e.target.value);
                setError("");
              }}
              onKeyPress={handleKeyPress}
              disabled={loading}
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "600",
              color: "#333",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>🔐 Password</label>
            <div style={{ position: "relative" }}>
              <input
                className="input-field"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setError("");
                }}
                onKeyPress={handleKeyPress}
                disabled={loading}
                style={{ width: "100%", boxSizing: "border-box", paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "18px"
                }}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "24px"
          }}>
            <input
              type="checkbox"
              id="remember"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer",
                marginRight: "8px"
              }}
            />
            <label htmlFor="remember" style={{
              fontSize: "13px",
              color: "#666",
              cursor: "pointer",
              margin: "0"
            }}>Remember me on this device</label>
          </div>

          {/* Login Button */}
          <button
            className="login-btn"
            onClick={login}
            disabled={loading}
            style={{ width: "100%", marginBottom: "24px" }}
          >
            {loading ? "🔄 Logging in..." : "✨ Login"}
          </button>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: "center",
          marginTop: "24px",
          color: "rgba(255,255,255,0.9)",
          fontSize: "12px"
        }}>
          <p style={{ margin: "0", fontWeight: "500" }}>© 2026 SmartCampus</p>
          <p style={{ margin: "4px 0 0 0", opacity: "0.85" }}>Campus Management System</p>
        </div>
      </div>
    </div>
  );
}
