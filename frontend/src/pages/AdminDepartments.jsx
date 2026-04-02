import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [deptName, setDeptName] = useState("");
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadDepartments = async () => {
    setLoading(true);
    setMessage("");
    const data = await apiCall(buildUrl("get_departments.php"));
    if (data.status) {
      setDepartments(data.departments || []);
    } else {
      setMessage(data.message || "Failed to load departments");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!deptName.trim()) {
      setMessage("Department name is required");
      return;
    }

    const payload = { dept_name: deptName.trim() };
    const endpoint = editId ? "update_department.php" : "create_department.php";
    if (editId) payload.id = editId;

    const data = await apiCall(buildUrl(endpoint), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!data.status) {
      setMessage(data.message || "Save failed");
      return;
    }

    setDeptName("");
    setEditId(null);
    loadDepartments();
  };

  const handleEdit = (dept) => {
    if (!dept.id) {
      setMessage("Create a department first to enable edit/delete.");
      return;
    }
    setDeptName(dept.dept_name || "");
    setEditId(dept.id);
  };

  const handleDelete = async (dept) => {
    if (!dept.id) {
      setMessage("Create a department first to enable edit/delete.");
      return;
    }
    if (!window.confirm(`Delete department "${dept.dept_name}"?`)) return;

    const data = await apiCall(buildUrl("delete_department.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: dept.id })
    });

    if (!data.status) {
      setMessage(data.message || "Delete failed");
      return;
    }

    loadDepartments();
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mt-3">
        <h2>Departments</h2>
        <button className="btn btn-outline-primary" onClick={loadDepartments} disabled={loading}>
          Refresh
        </button>
      </div>

      {message && (
        <div className="alert alert-warning mt-3">
          {message}
        </div>
      )}

      <div className="card p-3 mt-3">
        <h5 className="mb-3">{editId ? "Edit Department" : "Add Department"}</h5>
        <form className="d-flex gap-2" onSubmit={handleSubmit}>
          <input
            type="text"
            className="form-control"
            placeholder="Department name"
            value={deptName}
            onChange={(e) => setDeptName(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">
            {editId ? "Update" : "Create"}
          </button>
          {editId && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setEditId(null);
                setDeptName("");
              }}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="card p-3 mt-3">
        <h5 className="mb-3">All Departments</h5>
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Name</th>
                <th>HOD</th>
                <th style={{ width: "180px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept, index) => (
                <tr key={dept.id || dept.dept_name || index}>
                  <td>{dept.dept_name}</td>
                  <td>{dept.hod_name || "-"}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(dept)}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(dept)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {departments.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center">No departments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
