import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function AccountantReports() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  const loadSummary = async () => {
    const data = await apiCall(buildUrl("accountant_endpoints.php?action=get_financial_summary"));
    if (data.status) {
      setSummary(data.summary || null);
      setError("");
    } else {
      setError(data.message || "Failed to load summary");
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  return (
    <div>
      <h2 className="mb-4">Financial Reports</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row">
        <div className="col-md-6 col-lg-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Total Students</h6>
              <h3 className="mb-0 fw-bold text-primary">{summary?.total_students || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Total Fees Due</h6>
              <h3 className="mb-0 fw-bold text-info">{summary?.total_fees_due || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Fees Collected</h6>
              <h3 className="mb-0 fw-bold text-success">{summary?.total_fees_collected || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Outstanding</h6>
              <h3 className="mb-0 fw-bold text-danger">{summary?.total_outstanding || 0}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
