import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";
import "./DashboardLayout.css";

export default function StudentLayout() {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [submenu, setSubmenu] = useState({});
  const user = JSON.parse(localStorage.getItem("user"));
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Detect if mobile - only track window size changes
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };
    
    // Set initial state
    handleResize();
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []); // No dependencies - only run on mount

  // Auto-open sidebar on desktop, keep closed on mobile (initial mount only)
  useEffect(() => {
    const mobile = window.innerWidth <= 768;
    if (!mobile) {
      setOpen(true);
    }
  }, []);

  // Close sidebar when route changes (mobile only)
  useEffect(() => {
    if (isMobile && open) {
      setOpen(false);
    }
  }, [location]); // Only depend on location, not open or isMobile

  const toggleSubmenu = (key) => {
    setSubmenu(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      const res = await apiCall(buildUrl("logout.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (res?.status) {
        localStorage.removeItem("user");
        localStorage.removeItem("rememberUser");
        navigate("/");
        return;
      }

      if (res?.code === "LOGOUT_RESTRICTED") {
        const endTime = res?.college_end_time || "17:00:00";
        const askRequest = window.confirm(
          `Logout is locked until ${endTime}. Do you want to request coordinator approval now?`
        );

        if (askRequest) {
          const reason = window.prompt("Reason for early logout request:", "Need early leave") || "Need early leave";
          const requestRes = await apiCall(buildUrl("request_logout_permission.php"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason })
          });

          window.alert(requestRes?.message || "Request submitted");
        }
        return;
      }

      window.alert(res?.message || "Logout failed. Please try again.");
    }
  };

  const isActive = (path) => location.pathname === path;

  const handleCloseSidebar = () => {
    if (isMobile) {
      setOpen(false);
    }
  };

  const handleToggle = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setOpen(prev => !prev);
  };

  return (
    <div className="dashboard-container">
      {/* BACKDROP - Click to close sidebar on mobile */}
      {open && isMobile && (
        <div 
          className="sidebar-backdrop"
          onClick={() => setOpen(false)}
        />
      )}
      {/* SIDEBAR */}
      <aside className={`sidebar ${open ? "open" : "collapsed"}`}>
        <div className="sidebar-header">
          <h5 className="sidebar-title">🎓 SmartCampus</h5>
          <small className="sidebar-subtitle">Student Portal</small>
        </div>

        <nav className="sidebar-nav">
          
          {/* Dashboard */}
          <Link to="/student" onClick={handleCloseSidebar} className={`nav-item ${isActive("/student") && location.pathname === "/student" ? "active" : ""}`}>
            <i className="bi bi-speedometer2"></i> Dashboard
          </Link>

          {/* Academics */}
          <div className="nav-section">
            <div className="nav-item clickable" onClick={() => toggleSubmenu("academics")}>
              <i className="bi bi-book"></i> Academics
              <i className={`bi bi-chevron-down transition ${submenu.academics ? "rotate" : ""}`}></i>
            </div>
            {submenu.academics && (
              <div className="submenu">
                <Link to="/student/marks" onClick={handleCloseSidebar} className={`submenu-item ${isActive("/student/marks") ? "active" : ""}`}>
                  📊 Marks
                </Link>
                <Link to="/student/grades" onClick={handleCloseSidebar} className={`submenu-item ${isActive("/student/grades") ? "active" : ""}`}>
                  🎯 Grades
                </Link>
                <Link to="/student/timetable" onClick={handleCloseSidebar} className={`submenu-item ${isActive("/student/timetable") ? "active" : ""}`}>
                  📅 Time Table
                </Link>
              </div>
            )}
          </div>

          {/* Attendance */}
          <Link to="/student/attendance" onClick={handleCloseSidebar} className={`nav-item ${isActive("/student/attendance") ? "active" : ""}`}>
            <i className="bi bi-clipboard-check"></i> Attendance
          </Link>

          {/* Finance */}
          <Link to="/student/fees" onClick={handleCloseSidebar} className={`nav-item ${isActive("/student/fees") ? "active" : ""}`}>
            <i className="bi bi-credit-card"></i> Fees & Finance
          </Link>

          {/* Profile */}
          <Link to="/student/profile" onClick={handleCloseSidebar} className={`nav-item ${isActive("/student/profile") ? "active" : ""}`}>
            <i className="bi bi-person"></i> My Profile
          </Link>

          {/* History */}
          <Link to="/student/history" onClick={handleCloseSidebar} className={`nav-item ${isActive("/student/history") ? "active" : ""}`}>
            <i className="bi bi-clock-history"></i> History
          </Link>

          {/* Emergency (SOS) */}
          <Link to="/student/sos" onClick={handleCloseSidebar} className={`nav-item sos-item ${isActive("/student/sos") ? "active" : ""}`}>
            <i className="bi bi-exclamation-circle"></i> 🚨 SOS Emergency
          </Link>

          {/* Auto-Form Filler */}
          <Link to="/student/auto-form" onClick={handleCloseSidebar} className={`nav-item ${isActive("/student/auto-form") ? "active" : ""}`}>
            <i className="bi bi-magic"></i> Auto-Form Filler
          </Link>

          {/* Settings */}
          <div className="nav-section">
            <div className="nav-item clickable" onClick={() => toggleSubmenu("settings")}>
              <i className="bi bi-gear"></i> Settings
              <i className={`bi bi-chevron-down transition ${submenu.settings ? "rotate" : ""}`}></i>
            </div>
            {submenu.settings && (
              <div className="submenu">
                <Link to="/student/profile" onClick={handleCloseSidebar} className="submenu-item">
                  👤 My Profile
                </Link>
                <Link to="/change-password" onClick={handleCloseSidebar} className="submenu-item">
                  🔐 Change Password
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Logout Section */}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {/* TOP BAR */}
        <header className="topbar">
          <button 
            className="toggle-btn" 
            onClick={handleToggle}
            type="button"
            aria-label="Toggle sidebar"
          >
            <i className={`bi ${open ? "bi-x-lg" : "bi-list"}`} style={{pointerEvents: 'none'}}></i>
          </button>
          <div className="topbar-right">
            <span className="user-info">
              <i className="bi bi-person-circle"></i> {user?.username}
            </span>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
