import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./DashboardLayout.css";
import useGlobalSosNotifier from "../hooks/useGlobalSosNotifier";

export default function HODLayout() {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [submenu, setSubmenu] = useState({});
  const user = JSON.parse(localStorage.getItem("user"));
  const location = useLocation();
  const navigate = useNavigate();

  useGlobalSosNotifier(location.pathname);

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
      {/* SIDEBAR */}
      <aside className={`sidebar ${open ? "open" : "collapsed"}`}>
        <div className="sidebar-header">
          <h5 className="sidebar-title">🎓 SmartCampus</h5>
          <small className="sidebar-subtitle">HOD Portal</small>
        </div>

        <nav className="sidebar-nav">
          
          {/* Dashboard */}
          <Link to="/hod" className={`nav-item ${isActive("/hod") ? "active" : ""}`}>
            <i className="bi bi-speedometer2"></i> Dashboard
          </Link>

          {/* My Profile */}
          <Link to="/hod/profile" className={`nav-item ${isActive("/hod/profile") ? "active" : ""}`}>
            <i className="bi bi-person-circle"></i> My Profile
          </Link>

          {/* Department Management */}
          <div className="nav-section">
            <div className="nav-item clickable" onClick={() => toggleSubmenu("dept")}>
              <i className="bi bi-building"></i> Department
              <i className={`bi bi-chevron-down transition ${submenu.dept ? "rotate" : ""}`}></i>
            </div>
            {submenu.dept && (
              <div className="submenu">
                <Link to="/hod/teachers" className={`submenu-item ${isActive("/hod/teachers") ? "active" : ""}`}>
                  👨‍🏫 Manage Teachers
                </Link>
                <Link to="/hod/students" className={`submenu-item ${isActive("/hod/students") ? "active" : ""}`}>
                  👥 Department Students
                </Link>
              </div>
            )}
          </div>

          {/* Class Management */}
          <div className="nav-section">
            <div className="nav-item clickable" onClick={() => toggleSubmenu("classes")}>
              <i className="bi bi-collection"></i> Classes
              <i className={`bi bi-chevron-down transition ${submenu.classes ? "rotate" : ""}`}></i>
            </div>
            {submenu.classes && (
              <div className="submenu">
                <Link to="/hod/manage-classes" className={`submenu-item ${isActive("/hod/manage-classes") ? "active" : ""}`}>
                  📋 Manage Classes
                </Link>
                <Link to="/hod/assign-coordinator" className={`submenu-item ${isActive("/hod/assign-coordinator") ? "active" : ""}`}>
                  👔 Assign Coordinators
                </Link>
              </div>
            )}
          </div>

          {/* Subject Controller */}
          <div className="nav-section">
            <div className="nav-item clickable" onClick={() => toggleSubmenu("subject")}>
              <i className="bi bi-diagram-3"></i> Subject Controller
              <i className={`bi bi-chevron-down transition ${submenu.subject ? "rotate" : ""}`}></i>
            </div>
            {submenu.subject && (
              <div className="submenu">
                <Link to="/hod/subject-controllers" className={`submenu-item ${isActive("/hod/subject-controllers") ? "active" : ""}`}>
                  🧑‍🏫 Assign Controllers
                </Link>
                <Link to="/hod/subject-approvals" className={`submenu-item ${isActive("/hod/subject-approvals") ? "active" : ""}`}>
                  ✅ Approvals
                </Link>
              </div>
            )}
          </div>

          {/* Teaching (As HOD is also a teacher) */}
          <div className="nav-section">
            <div className="nav-item clickable" onClick={() => toggleSubmenu("teaching")}>
              <i className="bi bi-book"></i> My Classes
              <i className={`bi bi-chevron-down transition ${submenu.teaching ? "rotate" : ""}`}></i>
            </div>
            {submenu.teaching && (
              <div className="submenu">
                <Link to="/hod/attendance" className={`submenu-item ${isActive("/hod/attendance") ? "active" : ""}`}>
                  📋 Attendance
                </Link>
                <Link to="/hod/marks" className={`submenu-item ${isActive("/hod/marks") ? "active" : ""}`}>
                  📊 Enter Marks
                </Link>
                <Link to="/hod/timetable" className={`submenu-item ${isActive("/hod/timetable") ? "active" : ""}`}>
                  📅 Time Table
                </Link>
              </div>
            )}
          </div>

          {/* Risk Management */}
          <Link to="/hod/risk" className={`nav-item ${isActive("/hod/risk") ? "active" : ""}`}>
            <i className="bi bi-exclamation-triangle"></i> Risk Management
          </Link>

          {/* Live Location */}
          <Link to="/hod/live-location" className={`nav-item ${isActive("/hod/live-location") ? "active" : ""}`}>
            <i className="bi bi-geo-alt"></i> Live Location
          </Link>

          {/* SOS Alerts */}
          <Link to="/hod/sos" className={`nav-item ${isActive("/hod/sos") ? "active" : ""}`}>
            <i className="bi bi-bell"></i> SOS Alerts
          </Link>

          {/* Form Reviews */}
          <Link to="/hod/form-reviews" className={`nav-item ${isActive("/hod/form-reviews") ? "active" : ""}`}>
            <i className="bi bi-file-earmark-check"></i> Form Reviews
          </Link>

          {/* Settings */}
          <div className="nav-section">
            <div className="nav-item clickable" onClick={() => toggleSubmenu("settings")}>
              <i className="bi bi-gear"></i> Settings
              <i className={`bi bi-chevron-down transition ${submenu.settings ? "rotate" : ""}`}></i>
            </div>
            {submenu.settings && (
              <div className="submenu">
                <Link to="/hod/profile" className="submenu-item">
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
