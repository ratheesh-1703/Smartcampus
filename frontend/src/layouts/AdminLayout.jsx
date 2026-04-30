import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./DashboardLayout.css";
import useGlobalSosNotifier from "../hooks/useGlobalSosNotifier";

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [submenu, setSubmenu] = useState({});
  const user = JSON.parse(localStorage.getItem("user"));
  const location = useLocation();
  const navigate = useNavigate();

  useGlobalSosNotifier(location.pathname);

  const toggleSubmenu = (key) => {
    setSubmenu(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("user");
      localStorage.removeItem("rememberUser");
      navigate("/");
    }
  };

  const isActive = (path) => location.pathname === path;

  // Initial mount - open sidebar on desktop
  useEffect(() => {
    const mobile = window.innerWidth <= 768;
    if (!mobile) setOpen(true);
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile && open) {
      setOpen(false);
    }
  }, [location]);

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
          <small className="sidebar-subtitle">Admin Panel</small>
        </div>

        <nav className="sidebar-nav">
          
          {/* Dashboard */}
          <Link to="/admin" onClick={handleCloseSidebar} className={`nav-item ${isActive("/admin") ? "active" : ""}`}>
            <i className="bi bi-speedometer2"></i> Dashboard
          </Link>

          {/* Students Management */}
          <div className="nav-section">
            <div className="nav-item clickable" onClick={() => toggleSubmenu("students")}>
              <i className="bi bi-people"></i> Students
              <i className={`bi bi-chevron-down transition ${submenu.students ? "rotate" : ""}`}></i>
            </div>
            {submenu.students && (
              <div className="submenu">
                <Link to="/admin/students" onClick={handleCloseSidebar} className={`submenu-item ${isActive("/admin/students") ? "active" : ""}`}>
                  📋 View All Students
                </Link>
                <Link to="/admin/addstudent" onClick={handleCloseSidebar} className={`submenu-item ${isActive("/admin/addstudent") ? "active" : ""}`}>
                  ➕ Add New Student
                </Link>
                <Link to="/admin/importstudents" onClick={handleCloseSidebar} className={`submenu-item ${isActive("/admin/importstudents") ? "active" : ""}`}>
                  📥 Import Students (Bulk)
                </Link>
              </div>
            )}
          </div>

          {/* Teachers Management */}
          <div className="nav-section">
            <div className="nav-item clickable" onClick={() => toggleSubmenu("teachers")}>
              <i className="bi bi-mortarboard"></i> Teachers
              <i className={`bi bi-chevron-down transition ${submenu.teachers ? "rotate" : ""}`}></i>
            </div>
            {submenu.teachers && (
              <div className="submenu">
                <Link to="/admin/teachers" onClick={handleCloseSidebar} className={`submenu-item ${isActive("/admin/teachers") ? "active" : ""}`}>
                  📋 View All Teachers
                </Link>
                <Link to="/admin/addteacher" onClick={handleCloseSidebar} className={`submenu-item ${isActive("/admin/addteacher") ? "active" : ""}`}>
                  ➕ Add New Teacher
                </Link>
                <Link to="/admin/importteachers" onClick={handleCloseSidebar} className={`submenu-item ${isActive("/admin/importteachers") ? "active" : ""}`}>
                  📥 Import Teachers (Bulk)
                </Link>
              </div>
            )}
          </div>

          {/* Departments */}
          <div className="nav-section">
            <div className="nav-item clickable" onClick={() => toggleSubmenu("departments")}>
              <i className="bi bi-building"></i> Departments
              <i className={`bi bi-chevron-down transition ${submenu.departments ? "rotate" : ""}`}></i>
            </div>
            {submenu.departments && (
              <div className="submenu">
                <Link to="/admin/departments" onClick={handleCloseSidebar} className="submenu-item">
                  📋 Manage Departments
                </Link>
                <Link to="/admin/assign-hod" onClick={handleCloseSidebar} className={`submenu-item ${isActive("/admin/assign-hod") ? "active" : ""}`}>
                  👔 Assign HODs
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
                <Link to="/admin/livelocation" onClick={handleCloseSidebar} className={`submenu-item ${isActive("/admin/livelocation") ? "active" : ""}`}>
                  📍 Live Location
                </Link>
                <Link to="/admin/sos-alerts" onClick={handleCloseSidebar} className="submenu-item">
                  🚨 SOS Alerts
                </Link>
              </div>
            )}
          </div>

          {/* System Settings */}
          <div className="nav-section">
            <div className="nav-item clickable" onClick={() => toggleSubmenu("settings")}>
              <i className="bi bi-gear"></i> Settings
              <i className={`bi bi-chevron-down transition ${submenu.settings ? "rotate" : ""}`}></i>
            </div>
            {submenu.settings && (
              <div className="submenu">
                <Link to="/admin/profile" onClick={handleCloseSidebar} className="submenu-item">
                  👤 My Profile
                </Link>
                <Link to="/change-password" onClick={handleCloseSidebar} className="submenu-item">
                  🔐 Change Password
                </Link>
                <Link to="/admin/system-settings" onClick={handleCloseSidebar} className="submenu-item">
                  ⚙️ System Settings
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
