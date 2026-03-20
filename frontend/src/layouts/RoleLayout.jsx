import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./DashboardLayout.css";

export default function RoleLayout({ subtitle, menuSections }) {
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

  const toggleSubmenu = (key) => {
    setSubmenu((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("user");
      localStorage.removeItem("rememberUser");
      navigate("/");
    }
  };

  const isActive = (path) => location.pathname === path;

  const dashboardPath = menuSections.find((item) => item.type === "link")?.to || "";
  const profilePath = dashboardPath ? `${dashboardPath}/profile` : "/";

  const renderItem = (item) => {
    if (item.type === "section") {
      const isOpen = !!submenu[item.key];
      return (
        <div className="nav-section" key={item.key}>
          <div className="nav-item clickable" onClick={() => toggleSubmenu(item.key)}>
            <i className={item.icon}></i> {item.label}
            <i className={`bi bi-chevron-down transition ${isOpen ? "rotate" : ""}`}></i>
          </div>
          {isOpen && (
            <div className="submenu">
              {item.children.map((child) => (
                <Link
                  key={child.to}
                  to={child.to}
                  onClick={handleCloseSidebar}
                  className={`submenu-item ${isActive(child.to) ? "active" : ""}`}
                >
                  {child.icon ? <i className={child.icon}></i> : null} {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.to}
        to={item.to}
        onClick={handleCloseSidebar}
        className={`nav-item ${isActive(item.to) ? "active" : ""}`}
      >
        <i className={item.icon}></i> {item.label}
      </Link>
    );
  };

  return (
    <div className="dashboard-container">
      {open && isMobile && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? "open" : "collapsed"}`}>
        <div className="sidebar-header">
          <h5 className="sidebar-title">🎓 SmartCampus</h5>
          <small className="sidebar-subtitle">{subtitle}</small>
        </div>

        <nav className="sidebar-nav">
          {menuSections.map(renderItem)}
          <Link
            to={profilePath}
            onClick={handleCloseSidebar}
            className={`nav-item ${isActive(profilePath) ? "active" : ""}`}
          >
            <i className="bi bi-person"></i> My Profile
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
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

        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
