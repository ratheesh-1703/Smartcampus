import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

const emptyForm = {
  title: "",
  event_date: "",
  location: "",
  organizer: "",
  status: "Planned",
  description: ""
};

export default function AffairsEvents() {
  const [form, setForm] = useState(emptyForm);
  const [filters, setFilters] = useState({ q: "", status: "" });
  const [events, setEvents] = useState([]);
  const [rowEdits, setRowEdits] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEvents = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.q.trim()) params.set("q", filters.q.trim());
    if (filters.status) params.set("status", filters.status);

    const url = buildUrl(
      `get_affairs_events.php${params.toString() ? `?${params.toString()}` : ""}`
    );

    const data = await apiCall(url);
    if (data.status) {
      setEvents(data.events || []);
      setError("");
    } else {
      setEvents([]);
      setError(data.message || "Failed to load events");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.event_date) return;

    const data = await apiCall(buildUrl("add_affairs_event.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (data.status) {
      setForm(emptyForm);
      loadEvents();
    } else {
      setError(data.message || "Failed to add event");
    }
  };

  const updateEvent = async (id) => {
    const edit = rowEdits[id] || {};
    const status = edit.status || events.find((e) => e.id === id)?.status || "Planned";

    const data = await apiCall(buildUrl("update_affairs_event.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });

    if (data.status) {
      loadEvents();
    } else {
      setError(data.message || "Failed to update event");
    }
  };

  const deleteEvent = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    const data = await apiCall(buildUrl(`delete_affairs_event.php?id=${id}`));
    if (data.status) {
      loadEvents();
    } else {
      setError(data.message || "Failed to delete event");
    }
  };

  return (
    <div className="container mt-3">
      <h2>Events and Activities</h2>

      <div className="card p-3 mt-3">
        <h5 className="mb-3">Add Event</h5>
        <form className="row g-3" onSubmit={handleSubmit}>
          <div className="col-md-4">
            <label className="form-label">Title</label>
            <input
              className="form-control"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Event title"
              required
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-control"
              name="event_date"
              value={form.event_date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Location</label>
            <input
              className="form-control"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Location"
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              <option>Planned</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label">Organizer</label>
            <input
              className="form-control"
              name="organizer"
              value={form.organizer}
              onChange={handleChange}
              placeholder="Organizer"
            />
          </div>
          <div className="col-md-8">
            <label className="form-label">Description</label>
            <input
              className="form-control"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Description"
            />
          </div>
          <div className="col-12">
            <button className="btn btn-primary" type="submit">
              Add Event
            </button>
          </div>
        </form>
      </div>

      <div className="card p-3 mt-3">
        <div className="d-flex flex-wrap gap-2 align-items-end">
          <div className="flex-grow-1">
            <label className="form-label">Search</label>
            <input
              className="form-control"
              name="q"
              value={filters.q}
              onChange={handleFilterChange}
              placeholder="Search by title, organizer, location"
            />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select
              className="form-select"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All</option>
              <option>Planned</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
          </div>
          <div>
            <button className="btn btn-outline-primary" onClick={loadEvents}>
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      <div className="card p-3 mt-3">
        <h5 className="mb-3">Events</h5>
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Organizer</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const edit = rowEdits[event.id] || {};
                  return (
                    <tr key={event.id}>
                      <td>
                        <div>{event.title}</div>
                        <div className="text-muted small">{event.description || ""}</div>
                      </td>
                      <td>{event.event_date}</td>
                      <td>{event.location || "-"}</td>
                      <td>{event.organizer || "-"}</td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={edit.status || event.status}
                          onChange={(e) =>
                            setRowEdits((prev) => ({
                              ...prev,
                              [event.id]: { ...prev[event.id], status: e.target.value }
                            }))
                          }
                        >
                          <option>Planned</option>
                          <option>Completed</option>
                          <option>Cancelled</option>
                        </select>
                      </td>
                      <td className="text-nowrap">
                        <button
                          className="btn btn-sm btn-primary me-2"
                          onClick={() => updateEvent(event.id)}
                        >
                          Save
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteEvent(event.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {events.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center">No events found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
