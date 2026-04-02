import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";
import "./DashboardLayout.css";

export default function SubjectControllerLayout() {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [submenu, setSubmenu] = useState({});
  const user = JSON.parse(localStorage.getItem("user"));
  const location = useLocation();
  const navigate = useNavigate();

  const teacherId =
    user?.teacher_id ||
    user?.linked_id ||
    user?.user?.linked_id ||
    user?.user?.teacher_id ||
    user?.user_id ||
    user?.user?.id ||
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

  useEffect(() => {
    const mobile = window.innerWidth <= 768;
    if (!mobile) setOpen(true);
  }, []);

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
          <small className="sidebar-subtitle">Subject Controller</small>
        </div>

        <nav className="sidebar-nav">
          
          {/* Dashboard */}
          <Link to="/subject-controller" className={`nav-item ${isActive("/subject-controller") ? "active" : ""}`}>
            <i className="bi bi-speedometer2"></i> Dashboard
          </Link>

          {/* My Profile */}
          <Link to="/subject-controller/profile" className={`nav-item ${isActive("/subject-controller/profile") ? "active" : ""}`}>
            <i className="bi bi-person-circle"></i> My Profile
          </Link>

          {/* Subject Planning */}
          <div className="nav-section">
            <div className="nav-item clickable" onClick={() => toggleSubmenu("subject")}>
              <i className="bi bi-diagram-3"></i> Subject Planning
              <i className={`bi bi-chevron-down transition ${submenu.subject ? "rotate" : ""}`}></i>
            </div>
            {submenu.subject && (
              <div className="submenu">
                <Link to="/subject-controller" className={`submenu-item ${isActive("/subject-controller") ? "active" : ""}`}>
                  📋 Plan & Approval
                </Link>
              </div>
            )}
          </div>

          {/* Students */}
          <Link to="/subject-controller/students" className={`nav-item ${isActive("/subject-controller/students") ? "active" : ""}`}>
            <i className="bi bi-people"></i> Students
          </Link>

          {/* Attendance */}
          <Link to="/subject-controller/attendance" className={`nav-item ${isActive("/subject-controller/attendance") ? "active" : ""}`}>
            <i className="bi bi-clipboard-check"></i> Attendance
          </Link>

          {/* Marks & Grades */}
          <div className="nav-section">
            <div className="nav-item clickable" onClick={() => toggleSubmenu("marks")}>
              <i className="bi bi-graph-up"></i> Marks & Grades
              <i className={`bi bi-chevron-down transition ${submenu.marks ? "rotate" : ""}`}></i>
            </div>
            {submenu.marks && (
              <div className="submenu">
                <Link to="/subject-controller/marks" className={`submenu-item ${isActive("/subject-controller/marks") ? "active" : ""}`}>
                  📊 Enter Marks
                </Link>
              </div>
            )}
          </div>

          {/* Timetable */}
          <Link to="/subject-controller/timetable" className={`nav-item ${isActive("/subject-controller/timetable") ? "active" : ""}`}>
            <i className="bi bi-calendar-event"></i> Schedule
          </Link>

          {/* Settings */}
          <div className="nav-section">
            <div className="nav-item clickable" onClick={() => toggleSubmenu("settings")}>
              <i className="bi bi-gear"></i> Settings
              <i className={`bi bi-chevron-down transition ${submenu.settings ? "rotate" : ""}`}></i>
            </div>
            {submenu.settings && (
              <div className="submenu">
                <Link to="/subject-controller/profile" className="submenu-item">
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
