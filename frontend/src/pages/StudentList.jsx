import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function StudentList(){

  const [students,setStudents] = useState([]);
  const [search,setSearch] = useState("");
  const [dept,setDept] = useState("");
  const [departments,setDepartments] = useState([]);
  const [year,setYear] = useState("");
  const [page,setPage] = useState(1);
  const [total,setTotal] = useState(0);

  const load = async ()=>{
    const qs = new URLSearchParams({ search: search || '', dept: dept || '', year: year || '', page: page || 1 }).toString();
    const data = await apiCall(buildUrl(`get_students_advanced.php?${qs}`));
    if(data.status){
      setStudents(data.students || []);
      setTotal(data.total || 0);
    } else {
      setStudents([]);
      setTotal(0);
    }
  };

  useEffect(()=>{ load(); },[page,dept,year]);

  useEffect(()=>{
    const loadDepts = async ()=>{
      try{
        const data = await apiCall(buildUrl('get_departments.php'));
        if(data.status && Array.isArray(data.departments)) setDepartments(data.departments);
      }catch{
        // ignore - we'll fall back to hardcoded list
      }
    };
    loadDepts();
  },[]);

  const totalPages = Math.ceil(total / 10);

  const handleExport = async () => {
    try {
      const res = await fetch(buildUrl("export_students_csv.php"));
      if (!res.ok) {
        throw new Error("Export failed");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "students.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export students. Please try again.");
    }
  };

  return(
    <div className="container mt-4">

      {/* Title + Export Button */}
      <div className="d-flex justify-content-between align-items-center">
        <h3>Students List</h3>

        <button type="button" onClick={handleExport} className="btn btn-success">
          Export to CSV
        </button>

      </div>

      <div className="card p-3 shadow mt-3">

        {/* Filters Row */}
        <div className="row mb-3">

          <div className="col-md-4">
            <input 
              className="form-control"
              placeholder="Search Reg No / Name"
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
              onKeyDown={(e)=> e.key === "Enter" && load()}
            />
          </div>

          <div className="col-md-3">
            <select className="form-select" value={dept} onChange={(e)=>setDept(e.target.value)}>
              <option value="">All Departments</option>
              {(departments.length ? departments : ["CSE","BSC(IT&CS)","IT","ECE","EEE","MECH"]).map(d=>{
                // support backend returning objects like {id,dept_name} or simple strings
                const name = (typeof d === 'string') ? d : (d.dept_name || d.name || '');
                const key = (typeof d === 'string') ? name : (d.id || name);
                return <option key={key} value={name}>{name}</option>
              })}
            </select>
          </div>

          <div className="col-md-2">
            <select className="form-select" onChange={(e)=>setYear(e.target.value)}>
              <option value="">Year</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

          <div className="col-md-2">
            <button className="btn btn-primary w-100" onClick={()=>{setPage(1); load();}}>
              Search
            </button>
          </div>

        </div>

        {/* Table */}
        <table className="table table-bordered table-striped">
          <thead>
            <tr>
              <th>Reg No</th>
              <th>Name</th>
              <th>Dept</th>
              <th>Year</th>
              <th>Admission Year</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {students.map(s=>(
              <tr key={s.id}>
                <td>{s.reg_no}</td>
                <td>{s.name}</td>
                <td>{s.dept}</td>
                <td>{s.year}</td>
                <td>{s.admission_year}</td>

                <td>

                  <a className="btn btn-primary btn-sm me-2" href={`/admin/student/${s.id}`}>
                    View
                  </a>

                  <a className="btn btn-warning btn-sm me-2" href={`/admin/student/edit/${s.id}`}>
                    Edit
                  </a>

                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={async ()=>{
                      if(window.confirm("Delete this student?")){
                        let res = await fetch(buildUrl(`delete_student.php?id=${s.id}`));
                        let data = await res.json();
                        alert(data.message);
                        window.location.reload();
                      }
                    }}
                  >
                    Delete
                  </button>

                </td>
              </tr>
            ))}

            {students.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center">
                  No Records Found
                </td>
              </tr>
            )}

          </tbody>
        </table>

        {/* Pagination */}
        <div className="d-flex justify-content-between">

          <button 
            className="btn btn-secondary"
            disabled={page===1}
            onClick={()=>setPage(page-1)}
          >
            Prev
          </button>

          <span className="mt-2">
            Page {page} / {totalPages || 1}
          </span>

          <button 
            className="btn btn-secondary"
            disabled={page===totalPages}
            onClick={()=>setPage(page+1)}
          >
            Next
          </button>

        </div>

      </div>
    </div>
  );
}
