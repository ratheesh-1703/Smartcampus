# Figures and Tables Package (IEEE)

## Figure Plan

### Figure 1: System Architecture
- Client layer: React + role-based UI + protected routes
- API layer: PHP endpoints grouped by domains
- Data layer: MySQL schema for users, attendance, SOS, office modules
- Security overlays: token validation, role checks, audit logs

### Figure 2: Attendance Integrity Sequence Diagram
- Teacher starts active session
- Student submits attendance request
- Token validation
- Session and duplicate checks
- Network prefix verification
- Attendance success or rejection log

### Figure 3: Campus Safety Workflow
- Student geolocation update
- Campus in/out evaluation
- SOS trigger path
- Role-scoped alert retrieval and escalation

### Figure 4 (Optional): Multi-Role Navigation Map
- Role-to-layout mapping
- Role-to-module route clusters

---

## Table Plan

### Table I: Role-to-Module Access Matrix
- Roles vs modules with access type (Read/Write/Approve)

### Table II: Codebase Evidence Summary
- Source-only frontend files: 140
- Source-only backend files: 262
- Frontend build: success
- Main JS chunk warning: present (~959.61 kB)
- Lint issues: React hooks and unused variables in selected pages

### Table III: Security Controls Status
- Implemented: token checks, role gates (many endpoints), duplicate prevention, rejection logs
- Pending: endpoint hardening consistency, full prepared statements, stricter CORS profile

### Table IV: Production Hardening Backlog
- Item, Priority, Owner, ETA, Success Criteria

---

## Ready-to-Paste Example Table (LaTeX)

```latex
\begin{table}[htbp]
\caption{Codebase Evidence Summary}
\centering
\begin{tabular}{lll}
\toprule
Metric & Observation & Source \\
\midrule
Frontend source files & 140 & project inventory \\
Backend source files & 262 & project inventory \\
Build status & Success & build-output.txt \\
Main JS bundle & \~959.61 kB & build-output.txt \\
Lint compliance & Not clean & lint-errors-only.txt \\
\bottomrule
\end{tabular}
\label{tab:evidence}
\end{table}
```

---

## Figure Asset Checklist
- Export all diagrams in vector format (PDF/SVG) if allowed by venue.
- Ensure figure text is readable at 2-column width.
- Use consistent terms: "role-aware", "attendance integrity", "SOS workflow".
- Match captions exactly with manuscript section references.
