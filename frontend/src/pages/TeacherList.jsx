import { useState } from "react";

export default function TeacherDashboard(){

  const [menuOpen, setMenuOpen] = useState(true);

  return (
    <div className="d-flex" style={{height:"100vh"}}>

      {/* Sidebar */}
      <div style={{
        width: menuOpen ? "270px" : "0px",
        transition:"0.3s",
        background:"#0b1023",
        color:"white",
        padding: menuOpen ? "15px" : "0px",
        overflow:"hidden"
      }}>
        
        <h4 className="text-center mb-4">Teacher Panel</h4>

        <ul className="nav flex-column gap-3">

          <li className="nav-item">
            <span className="text-secondary small">ACADEMIC</span>
          </li>

          <li className="nav-item">
            <a className="nav-link text-white">
              📚 Manage Students
            </a>
          </li>

          <li className="nav-item">
            <a className="nav-link text-white">
              📝 Attendance
            </a>
          </li>

          <li className="nav-item">
            <a className="nav-link text-white">
              🧪 Marks
            </a>
          </li>

          <li className="nav-item">
            <a className="nav-link text-white">
              📅 Lab Time Table
            </a>
          </li>

          <li className="nav-item">
            <a className="nav-link text-white">
              🔐 Biometric
            </a>
          </li>

          <hr className="text-secondary"/>

          <span className="text-secondary small">PERMISSIONS</span>

          <li className="nav-item">
            <a className="nav-link text-white">
              ✔️ Assign Courses
            </a>
          </li>

          <li className="nav-item">
            <a className="nav-link text-white">
              🧾 Grade Entry
            </a>
          </li>

          <li className="nav-item mt-3">
            <a className="btn btn-danger w-100" href="/">
              Logout
            </a>
          </li>

        </ul>

      </div>

      {/* Main Page */}
      <div className="flex-grow-1">

        {/* Top Bar */}
        <div className="d-flex justify-content-between align-items-center p-3"
          style={{background:"#0d6efd", color:"white"}}>

          <button 
            className="btn btn-light"
            onClick={()=>setMenuOpen(!menuOpen)}
          >
            ☰
          </button>

          <h5 className="m-0">Teacher Dashboard</h5>

          <span>👨‍🏫 Teacher</span>

        </div>

        {/* Content */}
        <div className="p-4">

          <div className="card p-4 shadow">
            <h4>Welcome Teacher</h4>
            <p>This panel allows you to manage classes, attendance, marks, and students.</p>
          </div>

        </div>

      </div>

    </div>
  );
}
