import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function AdminSystemSettings() {
  const [form, setForm] = useState({
    system_name: "SmartCampus",
    support_email: "",
    password_format: "YYYYMMDD",
    college_end_time: "17:00:00"
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    setMessage("");
    const data = await apiCall(buildUrl("get_system_settings.php"));
    if (data.status && data.settings) {
      setForm(data.settings);
    } else {
      setMessage(data.message || "Failed to load settings");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const data = await apiCall(buildUrl("update_system_settings.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (!data.status) {
      setMessage(data.message || "Failed to update settings");
      return;
    }

    setMessage("Settings updated successfully");
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mt-3">
        <h2>System Settings</h2>
        <button className="btn btn-outline-primary" onClick={loadSettings} disabled={loading}>
          Refresh
        </button>
      </div>

      {message && (
        <div className="alert alert-info mt-3">
          {message}
        </div>
      )}

      <div className="card p-3 mt-3">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">System Name</label>
            <input
              type="text"
              className="form-control"
              name="system_name"
              value={form.system_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Support Email</label>
            <input
              type="email"
              className="form-control"
              name="support_email"
              value={form.support_email}
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Default Password Format</label>
            <select
              className="form-select"
              name="password_format"
              value={form.password_format}
              onChange={handleChange}
            >
              <option value="YYYYMMDD">YYYYMMDD</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">College End Time (Logout Unlock Time)</label>
            <input
              type="time"
              className="form-control"
              name="college_end_time"
              value={(form.college_end_time || "17:00:00").slice(0, 5)}
              onChange={(e) => setForm((prev) => ({ ...prev, college_end_time: `${e.target.value}:00` }))}
              required
            />
          </div>

          <button className="btn btn-primary" type="submit">
            Save Settings
          </button>
        </form>
      </div>
    </div>
  );
}
