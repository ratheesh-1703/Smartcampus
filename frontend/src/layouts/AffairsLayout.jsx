import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./DashboardLayout.css";

export default function AffairsLayout() {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [submenu, setSubmenu] = useState({});
  const user = JSON.parse(localStorage.getItem("user"));
  const location = useLocation();
  const navigate = useNavigate();

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
          <small className="sidebar-subtitle">Student Affairs</small>
        </div>

        <nav className="sidebar-nav">
          
          {/* Dashboard */}
          <Link to="/affairs" className={`nav-item ${isActive("/affairs") ? "active" : ""}`}>
            <i className="bi bi-speedometer2"></i> Dashboard
          </Link>

          {/* Emergency Management */}
          <div className="nav-section">
            <div className="nav-item clickable" onClick={() => toggleSubmenu("emergency")}>
              <i className="bi bi-exclamation-circle"></i> Emergency
              <i className={`bi bi-chevron-down transition ${submenu.emergency ? "rotate" : ""}`}></i>
            </div>
            {submenu.emergency && (
              <div className="submenu">
                <Link to="/affairs/sos" className={`submenu-item ${isActive("/affairs/sos") ? "active" : ""}`}>
                  🚨 SOS Alerts
                </Link>
                <Link to="/affairs/incident-log" className="submenu-item">
                  📋 Incident Log
                </Link>
              </div>
            )}
          </div>

          {/* Monitoring */}
          <div className="nav-section">
            <div className="nav-item clickable" onClick={() => toggleSubmenu("monitoring")}>
              <i className="bi bi-map"></i> Monitoring
              <i className={`bi bi-chevron-down transition ${submenu.monitoring ? "rotate" : ""}`}></i>
            </div>
            {submenu.monitoring && (
              <div className="submenu">
                <Link to="/affairs/location" className={`submenu-item ${isActive("/affairs/location") ? "active" : ""}`}>
                  📍 Student Location
                </Link>
                <Link to="/affairs/campus-map" className="submenu-item">
                  🗺️ Campus Map
                </Link>
              </div>
            )}
          </div>

          {/* Student Wellness */}
          <div className="nav-section">
            <div className="nav-item clickable" onClick={() => toggleSubmenu("wellness")}>
              <i className="bi bi-heart"></i> Student Wellness
              <i className={`bi bi-chevron-down transition ${submenu.wellness ? "rotate" : ""}`}></i>
            </div>
            {submenu.wellness && (
              <div className="submenu">
                <Link to="/affairs/counseling" className="submenu-item">
                  💬 Counseling
                </Link>
                <Link to="/affairs/health" className="submenu-item">
                  🏥 Health Records
                </Link>
              </div>
            )}
          </div>

          {/* Events & Activities */}
          <Link to="/affairs/events" className={`nav-item ${isActive("/affairs/events") ? "active" : ""}`}>
            <i className="bi bi-calendar-event"></i> Events & Activities
          </Link>

          {/* Reports */}
          <Link to="/affairs/reports" className={`nav-item ${isActive("/affairs/reports") ? "active" : ""}`}>
            <i className="bi bi-file-earmark-pdf"></i> Reports
          </Link>

          {/* Form Reviews */}
          <Link to="/affairs/form-reviews" className={`nav-item ${isActive("/affairs/form-reviews") ? "active" : ""}`}>
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
                <Link to="/affairs/profile" className="submenu-item">
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
