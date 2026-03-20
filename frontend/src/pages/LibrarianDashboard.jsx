import { useEffect, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function LibrarianDashboard() {
  const [books, setBooks] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [issueForm, setIssueForm] = useState({ student_id: "", book_id: "", due_date: "" });
  const [returnForm, setReturnForm] = useState({ circulation_id: "" });
  const [historyStudentId, setHistoryStudentId] = useState("");

  const loadBooks = async () => {
    const data = await apiCall(buildUrl("librarian_endpoints.php?action=get_books"));
    if (data.status) {
      setBooks(data.books || []);
      setError("");
    } else {
      setError(data.message || "Failed to load books");
    }
  };

  const searchBooks = async () => {
    if (!searchQuery.trim()) return;
    const data = await apiCall(
      buildUrl(`librarian_endpoints.php?action=search_books&query=${encodeURIComponent(searchQuery)}`)
    );
    if (data.status) {
      setBooks(data.books || []);
      setError("");
    } else {
      setError(data.message || "Failed to search books");
    }
  };

  const loadStats = async () => {
    const data = await apiCall(buildUrl("librarian_endpoints.php?action=get_library_stats"));
    if (data.status) {
      setStats(data);
      setError("");
    } else {
      setError(data.message || "Failed to load library stats");
    }
  };

  const issueBook = async (e) => {
    e.preventDefault();
    const data = await apiCall(buildUrl("librarian_endpoints.php?action=issue_book"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(issueForm)
    });

    if (!data.status) {
      setError(data.message || "Failed to issue book");
      return;
    }

    setIssueForm({ student_id: "", book_id: "", due_date: "" });
    await loadBooks();
    await loadStats();
  };

  const returnBook = async (e) => {
    e.preventDefault();
    const data = await apiCall(buildUrl("librarian_endpoints.php?action=return_book"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(returnForm)
    });

    if (!data.status) {
      setError(data.message || "Failed to return book");
      return;
    }

    setReturnForm({ circulation_id: "" });
    await loadBooks();
    await loadStats();
  };

  const loadHistory = async () => {
    if (!historyStudentId) return;
    const data = await apiCall(
      buildUrl(`librarian_endpoints.php?action=get_circulation_history&student_id=${historyStudentId}`)
    );
    if (data.status) {
      setHistory(data.history || []);
      setError("");
    } else {
      setError(data.message || "Failed to load circulation history");
    }
  };

  useEffect(() => {
    loadBooks();
    loadStats();
  }, []);

  return (
    <div>
      <h2 className="mb-4">📚 Librarian Dashboard</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row mb-4">
        <div className="col-md-6 col-lg-4 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Total Books</h6>
              <h3 className="mb-0 fw-bold text-primary">{stats?.total_books || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-4 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Issued</h6>
              <h3 className="mb-0 fw-bold text-warning">{stats?.issued_books || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-4 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Overdue</h6>
              <h3 className="mb-0 fw-bold text-danger">{stats?.overdue_books || 0}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-light">
              <h5 className="mb-0">🔎 Search Books</h5>
            </div>
            <div className="card-body">
              <div className="d-flex gap-2 mb-3">
                <input
                  className="form-control"
                  placeholder="Title, Author, ISBN"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="btn btn-outline-primary" onClick={searchBooks}>
                  Search
                </button>
              </div>

              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.length ? (
                      books.map((row) => (
                        <tr key={row.id}>
                          <td>{row.title}</td>
                          <td>{row.author}</td>
                          <td>{row.available_copies}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-muted">No books found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-light">
              <h5 className="mb-0">📤 Issue / Return</h5>
            </div>
            <div className="card-body">
              <form onSubmit={issueBook} className="mb-3">
                <div className="row g-2">
                  <div className="col">
                    <input
                      className="form-control"
                      placeholder="Student ID"
                      value={issueForm.student_id}
                      onChange={(e) => setIssueForm((prev) => ({ ...prev, student_id: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col">
                    <input
                      className="form-control"
                      placeholder="Book ID"
                      value={issueForm.book_id}
                      onChange={(e) => setIssueForm((prev) => ({ ...prev, book_id: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="row g-2 mt-2">
                  <div className="col">
                    <input
                      type="date"
                      className="form-control"
                      value={issueForm.due_date}
                      onChange={(e) => setIssueForm((prev) => ({ ...prev, due_date: e.target.value }))}
                    />
                  </div>
                  <div className="col-auto">
                    <button className="btn btn-primary" type="submit">
                      Issue
                    </button>
                  </div>
                </div>
              </form>

              <form onSubmit={returnBook}>
                <div className="row g-2">
                  <div className="col">
                    <input
                      className="form-control"
                      placeholder="Circulation ID"
                      value={returnForm.circulation_id}
                      onChange={(e) => setReturnForm({ circulation_id: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-auto">
                    <button className="btn btn-outline-primary" type="submit">
                      Return
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-light">
          <h5 className="mb-0">🧾 Circulation History</h5>
        </div>
        <div className="card-body">
          <div className="d-flex gap-2 mb-3">
            <input
              className="form-control"
              placeholder="Student ID"
              value={historyStudentId}
              onChange={(e) => setHistoryStudentId(e.target.value)}
            />
            <button className="btn btn-outline-primary" onClick={loadHistory}>
              Load
            </button>
          </div>
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Fine</th>
                </tr>
              </thead>
              <tbody>
                {history.length ? (
                  history.map((row) => (
                    <tr key={row.id}>
                      <td>{row.title}</td>
                      <td>{row.issue_date}</td>
                      <td>{row.due_date}</td>
                      <td>{row.status}</td>
                      <td>{row.fine}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-muted">No history found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
