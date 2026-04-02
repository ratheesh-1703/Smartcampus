import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    activeSessions: 0,
    sosAlerts: 0
  });
  
  const [systemStatus, setSystemStatus] = useState({
    database: "Connected",
    serverLoad: 0,
    attendanceActive: 0
  });

  const [activities, setActivities] = useState([]);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchSystemStatus();
    fetchActivities();
    
    // Refresh all data every 30 seconds for real-time updates
    const interval = setInterval(() => {
      fetchStats();
      fetchSystemStatus();
      fetchActivities();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const data = await apiCall(buildUrl("admin_counts.php"));
      if(data && (data.status || (data.students || data.teachers !== undefined))){
        setStats({
          totalStudents: parseInt(data.students) || 0,
          totalTeachers: parseInt(data.teachers) || 0,
          activeSessions: parseInt(data.activeSessions) || 0,
          sosAlerts: parseInt(data.sos) || 0
        });
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const data = await apiCall(buildUrl("get_system_status.php"));
      if(data?.status || data?.database){
        setSystemStatus({
          database: data.database || "Connected",
          serverLoad: parseInt(data.serverLoad) || 0,
          attendanceActive: parseInt(data.attendanceActive) || 0
        });
      }
    } catch (err) {
      console.error("Error fetching system status:", err);
    }
  };

  const fetchActivities = async () => {
    try {
      const data = await apiCall(buildUrl("get_recent_activities.php"));
      if(data?.status && data?.activities){
        setActivities(data.activities);
      }
    } catch (err) {
      console.error("Error fetching activities:", err);
    }
  };

  const formatTimeAgo = (timestamp) => {
    if(!timestamp) return "unknown";
    
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if(seconds < 60) return "just now";
    if(seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if(seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if(seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };

  const StatCard = ({ icon, title, value, color }) => (
    <div className="flex-grow-1" style={{ minWidth: '150px' }}>
      <div className="card h-100 border-0 shadow-sm">
        <div className="card-body p-3">
          <div className="d-flex justify-content-between align-items-start gap-2">
            <div className="flex-grow-1">
              <h6 className="text-muted mb-2 small">{title}</h6>
              <h3 className={`mb-0 fw-bold text-${color} h4`}>{value}</h3>
            </div>
            <div style={{
              fontSize: "28px",
              opacity: 0.2,
              flex: '0 0 auto'
            }}>
              {icon}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container-fluid px-2 px-md-4 py-3">
      <h2 className="mb-4 h4 h-md-2">👨‍💼 Admin Dashboard</h2>

      {/* Statistics */}
      <div className="flex-responsive mb-4">
        <StatCard icon="👥" title="Total Students" value={stats.totalStudents} color="primary" />
        <StatCard icon="👨‍🏫" title="Total Teachers" value={stats.totalTeachers} color="info" />
        <StatCard icon="📚" title="Active Sessions" value={stats.activeSessions} color="success" />
        <StatCard icon="🚨" title="SOS Alerts" value={stats.sosAlerts} color="danger" />
      </div>

      {/* Quick Actions & System Status */}
      <div className="grid-2 mb-4">
        <div className="card shadow-sm border-0">
          <div className="card-header bg-light">
            <h5 className="mb-0 small">⚡ Quick Actions</h5>
          </div>
          <div className="card-body p-2 p-md-3">
            <div className="list-group list-group-flush">
              <a href="/admin/addstudent" className="list-group-item list-group-item-action border-0 px-0 py-2">
                <i className="bi bi-person-plus text-primary me-2"></i> 
                <span className="d-none d-sm-inline">Add New Student</span>
                <span className="d-sm-none">Add Student</span>
              </a>
              <a href="/admin/addteacher" className="list-group-item list-group-item-action border-0 px-0 py-2">
                <i className="bi bi-person-badge text-info me-2"></i> 
                <span className="d-none d-sm-inline">Add New Teacher</span>
                <span className="d-sm-none">Add Teacher</span>
              </a>
              <a href="/admin/importstudents" className="list-group-item list-group-item-action border-0 px-0 py-2">
                <i className="bi bi-upload text-success me-2"></i> 
                <span className="d-none d-sm-inline">Import Students (Bulk)</span>
                <span className="d-sm-none">Import Students</span>
              </a>
              <a href="/admin/importteachers" className="list-group-item list-group-item-action border-0 px-0 py-2">
                <i className="bi bi-upload text-warning me-2"></i> 
                <span className="d-none d-sm-inline">Import Teachers (Bulk)</span>
                <span className="d-sm-none">Import Teachers</span>
              </a>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-header bg-light">
            <h5 className="mb-0 small">📊 System Status</h5>
          </div>
          <div className="card-body p-2 p-md-3">
            <div className="mb-3">
              <p className="mb-2 small">
                <small className="text-muted">Database Status</small>
              </p>
              <div className="progress" style={{ height: '20px' }}>
                <div className="progress-bar bg-success d-flex align-items-center justify-content-center" style={{ width: "100%", fontSize: '11px' }}>
                  {systemStatus.database}
                </div>
              </div>
            </div>
            <div className="mb-3">
              <p className="mb-2 small">
                <small className="text-muted">Server Load</small>
              </p>
              <div className="progress" style={{ height: '20px' }}>
                <div 
                  className={`progress-bar d-flex align-items-center justify-content-center ${systemStatus.serverLoad > 80 ? 'bg-danger' : systemStatus.serverLoad > 60 ? 'bg-warning' : 'bg-info'}`}
                  style={{ width: `${systemStatus.serverLoad}%`, fontSize: '11px' }}
                >
                  {systemStatus.serverLoad}%
                </div>
              </div>
            </div>
            <div>
              <p className="mb-2 small">
                <small className="text-muted">Attendance Active</small>
              </p>
              <div className="progress" style={{ height: '20px' }}>
                <div 
                  className="progress-bar bg-warning d-flex align-items-center justify-content-center"
                  style={{ width: `${systemStatus.attendanceActive}%`, fontSize: '11px' }}
                >
                  {systemStatus.attendanceActive}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-light">
          <h5 className="mb-0 small">📋 Recent Activities</h5>
        </div>
        <div className="card-body p-2 p-md-3">
          <div className="activity-timeline">
            {activities.length > 0 ? (
              activities.map((activity, idx) => (
                <div key={idx} className="activity-item mb-3">
                  <i className={`bi bi-circle-fill text-${activity.color}`}></i>
                  <div className="activity-content ms-2 ms-md-3">
                    <p className="mb-0 fw-bold small">{activity.icon} {activity.title}</p>
                    <small className="text-muted d-block">{activity.description}</small>
                    <small className="text-muted">{formatTimeAgo(activity.timestamp)}</small>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted text-center py-4">No recent activities</p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .activity-timeline {
          position: relative;
        }
        .activity-item {
          display: flex;
          align-items: flex-start;
          position: relative;
        }
        .activity-item i {
          font-size: 10px;
          margin-top: 4px;
          flex-shrink: 0;
        }
        .activity-content {
          flex: 1;
          min-width: 0;
        }
      `}</style>
    </div>
  );
}
