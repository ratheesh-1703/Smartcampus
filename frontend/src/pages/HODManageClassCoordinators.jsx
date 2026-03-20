import { useEffect, useState, useCallback } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function HODManageClassCoordinators() {

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const hodTeacherId = user?.user?.linked_id;
  let department = user?.user?.dept;

  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [newClass, setNewClass] = useState({ year: "", section: "" });
  const [showAddClass, setShowAddClass] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [fetchedDepartment, setFetchedDepartment] = useState(department);

  const postJson = async (path, body) =>
    apiCall(buildUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

  // Load all classes in HOD's department
  const loadClasses = useCallback(async (dept) => {
    if (!dept) {
      console.log("Department missing:", dept);
      setMsg("Department not found. Please login again.");
      return;
    }
    
    try {
      console.log("Fetching classes for department:", dept);
      const data = await apiCall(
        buildUrl(`get_department_classes.php?department=${encodeURIComponent(dept)}`)
      );
      console.log("Classes response:", data);

      if (data.status) {
        setClasses(data.classes || []);
      } else {
        setMsg("Error loading classes: " + (data.message || "No classes found"));
        setClasses([]);
      }
    } catch (err) {
      console.error("Error loading classes:", err);
      setMsg("Error loading classes: " + err.message);
      setClasses([]);
    }
  }, []);

  // Load available coordinators (teachers not yet assigned as coordinators)
  const loadTeachers = useCallback(async () => {
    if (!hodTeacherId) {
      console.log("HOD teacher ID missing:", hodTeacherId);
      setMsg("HOD teacher ID not found. Please login again.");
      return;
    }

    try {
      console.log("Fetching teachers for HOD:", hodTeacherId);
      const data = await postJson("get_hod_teachers.php", { teacher_id: hodTeacherId });
      console.log("Teachers response:", data);

      if (data.status) {
        // Filter out teachers who are already coordinators
        const availableTeachers = data.teachers.filter(
          (t) => Number(t.is_coordinator) === 0
        );
        setTeachers(availableTeachers);
      } else {
        setMsg("Error loading teachers: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Error loading teachers:", err);
      setMsg("Error loading teachers: " + err.message);
    }
  }, [hodTeacherId]);

  // Start assigning a coordinator
  const startAssign = (classItem) => {
    console.log("✓ startAssign clicked for class:", classItem);
    setSelectedClass(classItem);
    setSelectedTeacher("");
    setMsg("");
  };

  // View students of a class
  const [showStudentsFor, setShowStudentsFor] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const viewStudents = async (classItem) => {
    console.log("✓ viewStudents clicked for class:", classItem);
    setShowStudentsFor(classItem);
    setClassStudents([]);
    setLoadingStudents(true);
    setMsg("");

    console.log("Fetching students with params:", {
      department: fetchedDepartment,
      year: classItem.year,
      section: classItem.section
    });

    try {
      const data = await apiCall(
        buildUrl(
          `get_students.php?department=${encodeURIComponent(
            fetchedDepartment
          )}&year=${encodeURIComponent(classItem.year)}&section=${encodeURIComponent(
            classItem.section
          )}`
        )
      );
      console.log("✓ Students response:", data);

      if (data.status) {
        setClassStudents(data.students || []);
        if (!data.students || data.students.length === 0) {
          setMsg("⚠️ No students found in this class");
        }
      } else {
        const errorMsg = data.message || "Error loading students";
        console.error("Load students failed:", errorMsg);
        setMsg("❌ " + errorMsg);
      }
    } catch (err) {
      console.error("Exception loading students:", err);
      setMsg("❌ Error loading students: " + err.message);
    }
    setLoadingStudents(false);
  };

  // Confirm assignment
  const confirmAssign = async () => {
    console.log("✓ confirmAssign clicked for teacher:", selectedTeacher);
    
    if (!selectedTeacher) {
      const msg = "Please select a teacher";
      alert(msg);
      setMsg("❌ " + msg);
      return;
    }

    if (!selectedClass || !fetchedDepartment || !hodTeacherId) {
      const msg = "Missing class, department, or user data";
      console.error(msg, { selectedClass, fetchedDepartment, hodTeacherId });
      alert(msg);
      setMsg("❌ " + msg);
      return;
    }

    console.log("Sending assignment request with:", {
      teacher_id: selectedTeacher,
      year: selectedClass.year,
      section: selectedClass.section,
      department: fetchedDepartment,
      assigned_by: hodTeacherId
    });

    try {
      const data = await postJson("assign_coordinator_to_class.php", {
        teacher_id: selectedTeacher,
        year: selectedClass.year,
        section: selectedClass.section,
        department: fetchedDepartment,
        assigned_by: hodTeacherId
      });
      console.log("✓ Assignment response:", data);

      if (data.status) {
        alert("✅ Coordinator assigned successfully!");
        setMsg("✅ Coordinator assigned successfully");
        setSelectedClass(null);
        setSelectedTeacher("");
        await loadClasses(fetchedDepartment);
        await loadTeachers();
      } else {
        const errorMsg = data.message || "Error assigning coordinator";
        console.error("Assignment failed:", errorMsg);
        alert("❌ " + errorMsg);
        setMsg("❌ " + errorMsg);
      }
    } catch (err) {
      console.error("Exception during assignment:", err);
      alert("❌ Error: " + err.message);
      setMsg("❌ Error assigning coordinator: " + err.message);
    }
  };

  // Remove coordinator from class
  const removeCoordinator = async (classItem) => {
    console.log("✓ removeCoordinator clicked for class:", classItem);
    if (!confirm("Are you sure you want to remove the coordinator from this class?")) {
      console.log("Remove coordinator cancelled");
      return;
    }

    console.log("Sending remove request with:", {
      year: classItem.year,
      section: classItem.section,
      department: fetchedDepartment
    });

    try {
      const data = await postJson("remove_class_coordinator.php", {
        year: classItem.year,
        section: classItem.section,
        department: fetchedDepartment
      });
      console.log("✓ Remove response:", data);

      if (data.status) {
        alert("✅ Coordinator removed successfully!");
        setMsg("✅ Coordinator removed successfully");
        await loadClasses(fetchedDepartment);
        await loadTeachers();
      } else {
        const errorMsg = data.message || "Error removing coordinator";
        console.error("Remove failed:", errorMsg);
        alert("❌ " + errorMsg);
        setMsg("❌ " + errorMsg);
      }
    } catch (err) {
      console.error("Exception during removal:", err);
      alert("❌ Error: " + err.message);
      setMsg("❌ Error removing coordinator: " + err.message);
    }
  };

  useEffect(() => {
    console.log("Component mounted, starting data load...");
    console.log("User data:", { hodTeacherId, fetchedDepartment });
    
    const loadData = async () => {
      let dept = fetchedDepartment;

      // If department is missing, fetch it from teacher profile
      if (!dept && hodTeacherId) {
        console.log("Department missing, fetching from teacher profile...");
        try {
          const data = await apiCall(
            buildUrl(`get_teacher_profile.php?id=${hodTeacherId}`)
          );
          if (data.status && data.teacher?.dept) {
            console.log("Fetched department:", data.teacher.dept);
            dept = data.teacher.dept;
            setFetchedDepartment(dept);
          } else {
            setMsg("❌ Could not fetch department info");
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error("Error fetching teacher profile:", err);
          setMsg("❌ Error fetching department info");
          setLoading(false);
          return;
        }
      }

      if (!hodTeacherId || !dept) {
        console.warn("Missing user data - not loading classes/teachers", { hodTeacherId, dept });
        setMsg("⚠️ Please log in as an HOD to access this page");
        setLoading(false);
        return;
      }

      console.log("Starting parallel load of classes and teachers...");
      try {
        // Pass dept to loadClasses
        await loadClasses(dept);
        await loadTeachers();
      } catch (err) {
        console.error("Error during data load:", err);
      } finally {
        console.log("Data load complete, setting loading to false");
        setLoading(false);
      }
    };
    
    loadData();
  }, [hodTeacherId, fetchedDepartment, loadClasses, loadTeachers]);

  // Initialize classes if none exist
  const initializeClasses = async () => {
    console.log("✓ initializeClasses button clicked");
    if (!fetchedDepartment) {
      alert("Department not loaded");
      setMsg("❌ Department not loaded");
      return;
    }
    
    setInitializing(true);
    setMsg("⏳ Initializing classes...");
    
    try {
      const data = await postJson("initialize_classes.php", {});
      console.log("✓ Initialize response:", data);

      if (data.status) {
        const successMsg = `✅ Initialized ${data.created} new classes (${data.existing} existing)`;
        alert(successMsg);
        setMsg(successMsg);
        await loadClasses(fetchedDepartment);
      } else {
        const errorMsg = data.message || "Initialization failed";
        console.error("Initialize failed:", errorMsg);
        alert("❌ " + errorMsg);
        setMsg("❌ " + errorMsg);
      }
    } catch (err) {
      console.error("Exception during initialization:", err);
      alert("❌ Error: " + err.message);
      setMsg("❌ Error initializing classes: " + err.message);
    }
    setInitializing(false);
  };

  // Add a new class
  const addNewClass = async () => {
    console.log("✓ addNewClass button clicked with:", newClass);
    if (!newClass.year || !newClass.section) {
      const msg = "Please select year and section";
      alert(msg);
      setMsg("❌ " + msg);
      return;
    }

    if (!fetchedDepartment) {
      const msg = "Department not loaded";
      alert(msg);
      setMsg("❌ " + msg);
      return;
    }

    console.log("Sending add class request with:", {
      department: fetchedDepartment,
      year: parseInt(newClass.year),
      section: newClass.section
    });

    try {
      const data = await postJson("add_class.php", {
        department: fetchedDepartment,
        year: parseInt(newClass.year, 10),
        section: newClass.section
      });
      console.log("✓ Add class response:", data);

      if (data.status) {
        alert("✅ Class created successfully!");
        setMsg("✅ Class created successfully");
        setNewClass({ year: "", section: "" });
        setShowAddClass(false);
        await loadClasses(fetchedDepartment);
      } else {
        const errorMsg = data.message || "Failed to create class";
        console.error("Add class failed:", errorMsg);
        alert("❌ " + errorMsg);
        setMsg("❌ " + errorMsg);
      }
    } catch (err) {
      console.error("Exception during class creation:", err);
      alert("❌ Error: " + err.message);
      setMsg("❌ Error creating class: " + err.message);
    }
  };

  return (
    <div className="container mt-4">
      <h3>📚 Manage Department Classes & Coordinators</h3>

      {classes.length === 0 && !initializing && (
        <div className="alert alert-warning mt-3">
          <p>No classes found. Click to initialize classes for your department:</p>
          <button className="btn btn-warning" onClick={initializeClasses}>
            🚀 Initialize Classes (1-4 years, A-C sections)
          </button>
        </div>
      )}

      {initializing && <div className="alert alert-info">Initializing classes...</div>}

      {msg && (
        <div className={`alert ${msg.includes("✅") ? "alert-success" : "alert-danger"} mt-3`}>
          {msg}
        </div>
      )}

      {classes.length > 0 && (
        <button className="btn btn-sm btn-primary mb-3" onClick={() => setShowAddClass(!showAddClass)}>
          {showAddClass ? "❌ Cancel" : "➕ Add New Class"}
        </button>
      )}

      {showAddClass && (
        <div className="card p-3 mb-3 border-primary">
          <h5>Add New Class</h5>
          <div className="row">
            <div className="col-md-4">
              <select className="form-select" value={newClass.year} onChange={e => setNewClass({...newClass, year: e.target.value})}>
                <option value="">Select Year</option>
                {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <select className="form-select" value={newClass.section} onChange={e => setNewClass({...newClass, section: e.target.value})}>
                <option value="">Select Section</option>
                {['A', 'B', 'C', 'D', 'E'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <button className="btn btn-success w-100" onClick={addNewClass}>Create Class</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {/* Department Classes Table */}
          <div className="card">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">Department Classes ({fetchedDepartment})</h5>
            </div>
            <div className="card-body">
              {classes.length === 0 ? (
                <p className="text-muted">No classes found in your department</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Class</th>
                        <th>Year</th>
                        <th>Section</th>
                        <th>Coordinator Name</th>
                        <th>Staff ID</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classes.map((classItem, index) => (
                        <tr key={index}>
                          <td>
                            <strong>
                              {classItem.year} - {classItem.section}
                            </strong>
                          </td>
                          <td>{classItem.year}</td>
                          <td>{classItem.section}</td>
                          <td>
                            {classItem.coordinator_name ? (
                              <span className="badge bg-success">
                                {classItem.coordinator_name}
                              </span>
                            ) : (
                              <span className="badge bg-warning">Not Assigned</span>
                            )}
                          </td>
                          <td>
                            {classItem.coordinator_name ? (
                              classItem.coordinator_staff_id
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            {classItem.coordinator_name ? (
                              <span className="badge bg-success">Assigned</span>
                            ) : (
                              <span className="badge bg-danger">Unassigned</span>
                            )}
                          </td>
                          <td>
                            {!classItem.coordinator_name && (
                              <button
                                className="btn btn-sm btn-primary me-2"
                                onClick={() => startAssign(classItem)}
                              >
                                Assign Coordinator
                              </button>
                            )}
                            <button className="btn btn-sm btn-info" onClick={() => viewStudents(classItem)}>
                              View Students
                            </button>
                            {classItem.coordinator_name && (
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => removeCoordinator(classItem)}
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Assignment Modal */}
          {selectedClass && (
            <div className="card p-4 mt-4 border-primary">
              <div className="card-body">
                <h5 className="card-title">
                  Assign Coordinator to Class <b>{selectedClass.year}-{selectedClass.section}</b>
                </h5>

                <div className="mb-3">
                  <label className="form-label">Select Teacher as Coordinator</label>
                  <select
                    className="form-select"
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                  >
                    <option value="">-- Choose a Teacher --</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name} ({teacher.staff_id || "Staff"})
                      </option>
                    ))}
                  </select>
                  {teachers.length === 0 && (
                    <small className="text-warning d-block mt-2">
                      ⚠️ No available teachers. All department teachers are already coordinators.
                    </small>
                  )}
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-success"
                    onClick={confirmAssign}
                    disabled={!selectedTeacher}
                  >
                    ✅ Assign Coordinator
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setSelectedClass(null);
                      setSelectedTeacher("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Students Modal */}
          {showStudentsFor && (
            <div className="card p-3 mt-4 border-secondary">
              <div className="card-body">
                <h5>Students — Class {showStudentsFor.year}-{showStudentsFor.section}</h5>
                {loadingStudents ? (
                  <p>Loading students...</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Name</th>
                          <th>Reg No</th>
                          <th>Year</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classStudents.length === 0 && (
                          <tr>
                            <td colSpan="4" className="text-center text-muted">No students found</td>
                          </tr>
                        )}
                        {classStudents.map((s, i) => (
                          <tr key={s.id ?? i}>
                            <td>{i+1}</td>
                            <td>{s.name}</td>
                            <td>{s.reg_no}</td>
                            <td>{s.year}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-2">
                  <button className="btn btn-sm btn-secondary" onClick={() => setShowStudentsFor(null)}>Close</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
