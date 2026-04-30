import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./DashboardLayout.css";
import useGlobalSosNotifier from "../hooks/useGlobalSosNotifier";

export default function CoordinatorLayout() {
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
          <small className="sidebar-subtitle">Coordinator Portal</small>
        </div>

        <nav className="sidebar-nav">
          
          {/* Dashboard */}
          <Link to="/coordinator" className={`nav-item ${isActive("/coordinator") ? "active" : ""}`}>
            <i className="bi bi-speedometer2"></i> Dashboard
          </Link>

          {/* Class Management */}
          <div className="nav-section">
            <div className="nav-item clickable" onClick={() => toggleSubmenu("class")}>
              <i className="bi bi-collection"></i> Class Management
              <i className={`bi bi-chevron-down transition ${submenu.class ? "rotate" : ""}`}></i>
            </div>
            {submenu.class && (
              <div className="submenu">
                <Link to="/coordinator/students" className={`submenu-item ${isActive("/coordinator/students") || isActive("/coordinator/logout-approvals") ? "active" : ""}`}>
                  👥 Class Students & Logout Approvals
                </Link>
                <Link to="/coordinator/assign-teachers" className={`submenu-item ${isActive("/coordinator/assign-teachers") ? "active" : ""}`}>
                  👨‍🏫 Assign Teachers
                </Link>
              </div>
            )}
          </div>

          {/* Attendance */}
          <Link to="/coordinator/attendance" className={`nav-item ${isActive("/coordinator/attendance") ? "active" : ""}`}>
            <i className="bi bi-clipboard-check"></i> Attendance
          </Link>

          {/* Logout Approvals */}
          <Link to="/coordinator/logout-approvals" className={`nav-item ${isActive("/coordinator/logout-approvals") ? "active" : ""}`}>
            <i className="bi bi-shield-check"></i> Logout Approvals
          </Link>

          {/* History & Reports */}
          <Link to="/coordinator/history" className={`nav-item ${isActive("/coordinator/history") ? "active" : ""}`}>
            <i className="bi bi-clock-history"></i> History
          </Link>

          {/* Live Location */}
          <Link to="/coordinator/live-location" className={`nav-item ${isActive("/coordinator/live-location") ? "active" : ""}`}>
            <i className="bi bi-geo-alt"></i> Live Location
          </Link>

          {/* SOS Alerts */}
          <Link to="/coordinator/sos" className={`nav-item ${isActive("/coordinator/sos") ? "active" : ""}`}>
            <i className="bi bi-bell"></i> SOS Alerts
          </Link>

          {/* Form Reviews */}
          <Link to="/coordinator/form-reviews" className={`nav-item ${isActive("/coordinator/form-reviews") ? "active" : ""}`}>
            <i className="bi bi-file-earmark-check"></i> Form Reviews
          </Link>

          {/* Risk Management */}
          <Link to="/coordinator/risk" className={`nav-item ${isActive("/coordinator/risk") ? "active" : ""}`}>
            <i className="bi bi-exclamation-triangle"></i> Risk Management
          </Link>

          {/* Settings */}
          <div className="nav-section">
            <div className="nav-item clickable" onClick={() => toggleSubmenu("settings")}>
              <i className="bi bi-gear"></i> Settings
              <i className={`bi bi-chevron-down transition ${submenu.settings ? "rotate" : ""}`}></i>
            </div>
            {submenu.settings && (
              <div className="submenu">
                <Link to="/coordinator/profile" className="submenu-item">
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
