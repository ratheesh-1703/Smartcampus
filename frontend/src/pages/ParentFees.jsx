import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function ParentFees() {
  const [children, setChildren] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [fee, setFee] = useState(null);
  const [error, setError] = useState("");

  const loadChildren = async () => {
    const data = await apiCall(buildUrl("parent_endpoints.php?action=get_my_children"));
    if (data.status) {
      setChildren(data.children || []);
      if (data.children?.length) {
        setSelectedId(String(data.children[0].id));
      }
      setError("");
    } else {
      setError(data.message || "Failed to load children");
    }
  };

  const loadFee = async (studentId) => {
    if (!studentId) return;
    const data = await apiCall(buildUrl(`parent_endpoints.php?action=get_child_fees&student_id=${studentId}`));
    if (data.status) {
      setFee(data.fee || null);
      setError("");
    } else {
      setFee(null);
      setError(data.message || "Failed to load fee details");
    }
  };

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (selectedId) loadFee(selectedId);
  }, [selectedId]);

  return (
    <div>
      <h2 className="mb-4">Fees Overview</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Select Child</h5>
        </div>
        <div className="card-body">
          {children.length ? (
            <div className="d-flex flex-wrap gap-2">
              {children.map((child) => (
                <button
                  key={child.id}
                  className={`btn btn-sm ${String(child.id) === selectedId ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setSelectedId(String(child.id))}
                >
                  {child.name} ({child.reg_no})
                </button>
              ))}
            </div>
          ) : (
            <p className="text-muted">No linked students found.</p>
          )}
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-light">
          <h5 className="mb-0">Fee Details</h5>
        </div>
        <div className="card-body">
          {fee ? (
            <div>
              <p><strong>Student:</strong> {fee.name} ({fee.reg_no})</p>
              <p><strong>Total Fees:</strong> {fee.total_fees}</p>
              <p><strong>Paid:</strong> {fee.paid_amount}</p>
              <p><strong>Outstanding:</strong> {fee.total_fees - fee.paid_amount}</p>
            </div>
          ) : (
            <p className="text-muted">Select a student to view fees.</p>
          )}
        </div>
      </div>
    </div>
  );
}
