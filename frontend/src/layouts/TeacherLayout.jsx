import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";
import "./DashboardLayout.css";

export default function TeacherLayout() {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [submenu, setSubmenu] = useState({});
  const [isController, setIsController] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));
  const location = useLocation();
  const navigate = useNavigate();

  const teacherId =
    user?.teacher_id ||
    user?.linked_id ||
    user?.user?.linked_id ||
    user?.user?.teacher_id ||
    user?.user?.user_id ||
    user?.user?.id ||
    user?.user_id ||
    user?.id;

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initial mount - open sidebar on desktop
  useEffect(() => {
    const mobile = window.innerWidth <= 768;
    if (!mobile) setOpen(true);
  }, []);

  useEffect(() => {
    const loadControllerStatus = async () => {
      if (!teacherId) return;
      const res = await apiCall(
        buildUrl(`get_subject_controller_status.php?teacher_id=${teacherId}`)
      );
      if (res.status) {
        setIsController(Boolean(res.is_subject_controller));
      }
    };

    loadControllerStatus();
  }, [teacherId]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile && open) {
      setOpen(false);
    }
  }, [location]);

  const toggleSubmenu = (key) => {
    setSubmenu(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggle = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setOpen(prev => !prev);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("user");
      localStorage.removeItem("rememberUser");
      navigate("/");
    }
  };

  const isActive = (path) => location.pathname === path;

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
          <small className="sidebar-subtitle">Teacher Portal</small>
        </div>

        <nav className="sidebar-nav">
          
          {/* Dashboard */}
          <Link to="/teacher" className={`nav-item ${isActive("/teacher") ? "active" : ""}`}>
            <i className="bi bi-speedometer2"></i> Dashboard
          </Link>

          {/* My Profile */}
          <Link to="/teacher/profile" className={`nav-item ${isActive("/teacher/profile") ? "active" : ""}`}>
            <i className="bi bi-person-circle"></i> My Profile
          </Link>

          {/* Teaching */}
          <div className="nav-section">
            <div className="nav-item clickable" onClick={() => toggleSubmenu("teaching")}>
              <i className="bi bi-book"></i> Teaching
              <i className={`bi bi-chevron-down transition ${submenu.teaching ? "rotate" : ""}`}></i>
            </div>
            {submenu.teaching && (
              <div className="submenu">
                <Link to="/teacher/courses" className={`submenu-item ${isActive("/teacher/courses") ? "active" : ""}`}>
                  📚 My Courses
                </Link>
                <Link to="/teacher/students" className={`submenu-item ${isActive("/teacher/students") ? "active" : ""}`}>
                  👥 My Students
                </Link>
              </div>
            )}
          </div>

          {/* Attendance */}
          <Link to="/teacher/attendance" className={`nav-item ${isActive("/teacher/attendance") ? "active" : ""}`}>
            <i className="bi bi-clipboard-check"></i> Attendance
          </Link>

          {/* Subject Controller */}
          {isController && (
            <div className="nav-section">
              <div className="nav-item clickable" onClick={() => toggleSubmenu("subject")}>
                <i className="bi bi-diagram-3"></i> Subject Controller
                <i className={`bi bi-chevron-down transition ${submenu.subject ? "rotate" : ""}`}></i>
              </div>
              {submenu.subject && (
                <div className="submenu">
                  <Link to="/teacher/subject-controller" className={`submenu-item ${isActive("/teacher/subject-controller") ? "active" : ""}`}>
                    🧭 Plan & Assign
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Marks & Grades */}
          <div className="nav-section">
            <div className="nav-item clickable" onClick={() => toggleSubmenu("marks")}>
              <i className="bi bi-graph-up"></i> Marks & Grades
              <i className={`bi bi-chevron-down transition ${submenu.marks ? "rotate" : ""}`}></i>
            </div>
            {submenu.marks && (
              <div className="submenu">
                <Link to="/teacher/marks" className={`submenu-item ${isActive("/teacher/marks") ? "active" : ""}`}>
                  📊 Enter Marks
                </Link>
                <Link to="/teacher/grades" className={`submenu-item ${isActive("/teacher/grades") ? "active" : ""}`}>
                  🎯 Grade Report
                </Link>
              </div>
            )}
          </div>

          {/* Schedule */}
          <Link to="/teacher/timetable" className={`nav-item ${isActive("/teacher/timetable") ? "active" : ""}`}>
            <i className="bi bi-calendar-event"></i> Time Table
          </Link>

          {/* Biometric */}
          <Link to="/teacher/biometric" className={`nav-item ${isActive("/teacher/biometric") ? "active" : ""}`}>
            <i className="bi bi-fingerprint"></i> Biometric Check-in
          </Link>

          {/* Settings */}
          <div className="nav-section">
            <div className="nav-item clickable" onClick={() => toggleSubmenu("settings")}>
              <i className="bi bi-gear"></i> Settings
              <i className={`bi bi-chevron-down transition ${submenu.settings ? "rotate" : ""}`}></i>
            </div>
            {submenu.settings && (
              <div className="submenu">
                <Link to="/teacher/profile" className="submenu-item">
                  👤 My Profile
                </Link>
                <Link to="/change-password" className="submenu-item">
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
