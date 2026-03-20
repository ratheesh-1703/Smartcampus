# SmartCampus End-to-End Project Explanation (Detailed)

## 1) What this project is

SmartCampus is a full-stack campus operations platform that combines academic management, attendance control, safety monitoring, and office administration in one role-aware web application.

Instead of separate tools for login, attendance, student records, SOS, and location tracking, this project centralizes all of them with:
- A React frontend (role-based dashboards and workflows)
- A PHP backend (domain endpoints)
- A MySQL database (users, students, sessions, attendance, SOS, location, and office records)

This document explains the implementation from login to role routing, then deep-dives into the three critical workflows requested:
1. Hotspot + QR attendance
2. SOS emergency flow
3. Live location and campus in/out monitoring

---

## 2) High-level architecture

### 2.1 Frontend
- Framework: React + React Router + Vite
- Main route file: `frontend/src/main.jsx`
- Role guard: `frontend/src/components/RequireAuth.jsx`
- API wrapper: `frontend/src/utils/apiClient.js`

### 2.2 Backend
- Language: PHP (modular endpoint files)
- Shared config and auth guard:
  - `backend/config.php`
  - `backend/auth.php`
  - `backend/cors.php`

### 2.3 Data layer
- DB: MySQL (`smartcampus`)
- Core data entities include users, students, teachers, attendance sessions/records, SOS alerts, live locations, and role-specific module tables.

### 2.4 Role model
Roles supported in routing and backend checks include:
- `admin`
- `teacher`
- `student`
- `affairs`
- `hod`
- `coordinator`
- `accountant`
- `registrar`
- `exam_controller`
- `placement_officer`
- `parent`
- `dean`
- `hostel_warden`
- `librarian`

---

## 3) Project structure (practical view)

## 3.1 Frontend folders
- `src/main.jsx`: all route declarations and auth-header injection for fetch
- `src/Login.jsx`: login UI and role-based redirect
- `src/layouts/*`: role-specific shells (sidebar/top nav and nested outlet)
- `src/pages/*`: feature pages per role
- `src/utils/apiClient.js`: URL resolution + JSON-safe request helpers
- `src/data/campusBuilding.js`: map polygons/geometry used in campus map rendering

### 3.2 Backend folders/files
- `config.php`: DB connection, CORS bootstrap, production blocklist for maintenance/debug scripts, auth include
- `auth.php`: bearer token extraction and validation (`user_tokens` table)
- Domain endpoints (examples):
  - Attendance: `start_attendance.php`, `mark_attendance.php`, `get_available_sessions.php`, `get_active_teacher_session.php`, `get_attendance_list.php`, `end_attendance.php`
  - Safety/SOS: `send_sos.php`, `raise_sos.php`, `get_sos.php`, `sos_safety_intelligence.php`
  - Location: `update_location.php`, `get_live_locations.php`
  - Risk/policy: `predict_risk.php`, `policy_compliance.php`
  - Office modules: registrar/accountant/exam/parent/etc endpoint groups

---

## 4) Startup and request lifecycle

### 4.1 App startup
1. Browser loads React app.
2. `main.jsx` calls `ensureAuthHeader()` and monkey-patches `window.fetch`.
3. If token exists in localStorage (`user.token`), every fetch gets `Authorization: Bearer <token>` unless already set.
4. Routes are mounted with nested layouts by role.

### 4.2 Login flow
1. User submits username/password from `Login.jsx` to `login.php`.
2. `login.php` validates credentials from `users` table:
   - Supports secure hash (`password_verify`) and legacy password migration.
3. Backend creates/updates `user_tokens` (24-hour expiry).
4. Frontend stores minimal user payload + token in localStorage.
5. Frontend redirects to role base path (e.g., `/teacher`, `/student`, `/affairs`).

### 4.3 Protected route behavior
- `RequireAuth.jsx` checks `localStorage.user` for role and token.
- If missing/invalid -> navigate to `/`.
- If role mismatch -> navigate to `/`.

### 4.4 Protected API behavior
- Most APIs include `config.php`, which in turn includes `auth.php` (unless `SKIP_AUTH=true` like in login).
- `auth.php` validates bearer token and resolves current authenticated user (`$auth_user`).
- Endpoints then apply additional role checks and scope checks.

---

## 5) End-to-end workflow #1: Hotspot + QR Attendance (deep explanation)

This is the most security-sensitive workflow in the project.

## 5.1 Teacher side (session creation)
Frontend page: `frontend/src/pages/TeacherAttendance.jsx`

Sequence:
1. Teacher/HOD enters attendance page.
2. App loads teacher courses (`get_teacher_courses.php`).
3. Teacher selects class + period and starts session.
4. Frontend POSTs to `start_attendance.php` with:
   - `teacher_id`, `subject`, `dept`, `year`, `section`, `period`
5. Backend creates an active row in `attendance_sessions` with:
   - session context (subject/class/period)
   - gateway IP and network prefix
   - hotspot flags
   - generated QR token (8-char hex)
6. Teacher view shows:
   - Subject/class metadata
   - Gateway network identity
   - QR code canvas and token text

Important backend controls in `start_attendance.php`:
- Role gate: only `teacher` and `hod`
- One active session per teacher check
- Adds schema columns if missing (`period`, `qr_token`)
- Captures teacher network gateway details for anti-proxy checks

## 5.2 Student side (available sessions)
Frontend page: `frontend/src/pages/StudentAttendance.jsx`

Sequence:
1. Student page loads active sessions every 5 seconds.
2. It calls `get_available_sessions.php?student_id=...`.
3. Backend returns sessions filtered by student class attributes:
   - department
   - year
   - section
4. Response includes `already_marked` status.

## 5.3 Attendance marking and verification
Endpoint: `mark_attendance.php`

When student marks attendance:
1. Frontend sends `session_id` and `qr_token`.
2. Backend validates bearer token.
3. Backend confirms user is a student account (`users.role='student'`) and resolves linked student ID.
4. Backend checks session exists and is active.
5. Backend compares student network prefix with teacher gateway prefix when hotspot enforcement is enabled.
6. Backend validates QR token against active session token.
7. Backend checks duplicate attendance (`attendance_records` same student + session).
8. Backend inserts attendance record.

If any check fails, backend returns structured failure with code and instructions.

Common rejection codes:
- `UNAUTHORIZED` (missing token)
- `INVALID_TOKEN`
- `NOT_A_STUDENT`
- `SESSION_INACTIVE`
- `NETWORK_MISMATCH`
- `MISSING_QR_TOKEN`
- `INVALID_QR_TOKEN`
- `DUPLICATE_ATTENDANCE`

## 5.4 Rejection/audit logging
`mark_attendance.php` ensures `hotspot_rejection_log` table exists and writes rejections for:
- network mismatch attempts
- invalid QR attempts

This gives audit trail for suspected proxy attendance behavior.

## 5.5 Real-time teacher monitoring
Teacher dashboard polls every ~2 seconds:
- `get_active_teacher_session.php`
- `get_attendance_list.php`

Returned data includes:
- present student list
- class total and present totals
- rejected attempts list
- absent calculation support (`all_students`)

## 5.6 Session close and absentee alert
Endpoint: `end_attendance.php`

When teacher ends session:
1. Active session is marked inactive with `ended_at`.
2. Backend computes absentees by class filter minus marked students.
3. Parent email alerts are sent for absentees.
4. API returns end status + absent count.

## 5.7 Why this workflow is strong
- Multi-layer validation (token + role + class session + network + QR + duplicate)
- Active session model prevents stale marks
- Explicit rejection log supports governance and investigations
- Parent alert hook adds operational closure

## 5.8 Notable implementation gaps
- Student QR camera decode path currently has a placeholder fallback to manual token entry.
- Some SQL uses escaped string interpolation instead of prepared statements.
- Token lifetime is fixed; refresh token/session management can be improved.

---

## 6) End-to-end workflow #2: SOS emergency system (deep explanation)

## 6.1 Student trigger path
Frontend page: `frontend/src/pages/StudentSOS.jsx`

User actions:
1. Student enters emergency message.
2. Optionally attaches a photo.
3. Frontend submits multipart form to `send_sos.php`.

Payload:
- `student_id`
- `message`
- optional `photo`

## 6.2 Backend SOS create logic
Primary endpoint: `send_sos.php`

Server flow:
1. Requires authenticated request and POST method.
2. Resolves student identity from authenticated user’s linked profile.
3. Rejects non-student-linked accounts.
4. Prevents mismatched student IDs.
5. Validates non-empty message.
6. Stores uploaded photo under `uploads/sos/` (if present).
7. Inserts alert in `sos_alerts` with timestamp.

Response:
- success: `SOS Sent Successfully`
- failure: validation or DB error message

Additional simpler endpoint exists: `raise_sos.php` (message + coordinates based insert).

## 6.3 SOS retrieval and role scoping
Endpoint: `get_sos.php`

Role scoping behavior:
- Global visibility: `admin`, `affairs`
- Department scope: HOD (based on linked teacher dept)
- Class scope: coordinator (dept/year/section from coordinator mapping)
- Teacher can inherit scope if linked as HOD/coordinator

Returned data is joined with student profile info (`name`, `reg_no`, `dept`, `year`, `section`).

## 6.4 SOS intelligence and escalation module
Endpoint: `sos_safety_intelligence.php`

Extended analysis features include:
- Context scoring by time/location/history/keywords
- Severity derivation
- Escalation target selection (coordinator/student affairs/security)
- Incident logging and critical alert retrieval

This module shifts SOS from pure event recording to response intelligence.

## 6.5 Why this workflow matters
- Supports immediate emergency reporting with optional evidence media
- Enforces identity linkage so one user cannot raise SOS for arbitrary students
- Uses role scopes to avoid overexposure of sensitive incidents
- Provides escalation-ready intelligence path for institutional response

## 6.6 Notable gaps/risk notes
- File upload hardening can be improved (MIME validation, strict size/type policy).
- Centralized incident SLA tracking is not fully unified across endpoints.
- Notification channels beyond storage/email can be expanded.

---

## 7) End-to-end workflow #3: Live location + campus boundary monitoring (deep explanation)

There are two connected parts:
1. Location update (student device -> backend)
2. Location monitoring (authorized roles -> live map/table)

## 7.1 Student location update endpoint
Endpoint: `update_location.php`

Input:
- `student_id`
- `latitude`
- `longitude`

Server flow:
1. Validates required values.
2. Evaluates whether coordinates are inside hard-coded campus bounds.
3. Sets `campus_status` as `IN` or `OUT`.
4. Writes/upserts into `live_locations`.
5. Checks prior status and triggers parent email only on status change.

This avoids repeated noisy notifications when status remains unchanged.

## 7.2 Live monitoring endpoint
Endpoint: `get_live_locations.php`

Access control:
- Allowed base roles: admin, affairs, hod, coordinator, teacher
- Scope rules:
  - admin/affairs: global
  - HOD: department-only
  - coordinator: mapped class only
  - some teacher contexts can be treated global or inherited by linkage

Response includes:
- student identity fields
- current lat/lng
- timestamp (`updated_at`)

## 7.3 Frontend monitoring views
Examples:
- `CampusLiveMap.jsx` uses Leaflet + GeoJSON buildings and student markers
- `LiveLocation.jsx` lists students with map links

Refresh model:
- polling every 5 seconds for near-live updates

## 7.4 Privacy and governance considerations
Observed controls:
- role-restricted endpoint access and scope filters
- departmental/class segmentation for non-global roles

Recommended improvements:
- explicit retention policy for location history
- consent and policy text in UI
- audit logs for who viewed location feeds

---

## 8) Other major modules implemented

Beyond the three critical flows, the platform includes broad institutional modules:

- Admin:
  - student/teacher onboarding and imports
  - department and system settings
  - SOS admin views

- Academics:
  - marks, grades, timetable, subject controller tools
  - class coordinator and HOD assignment/approvals

- Registrar:
  - admissions, student records, certificates, ID cards, form reviews

- Accountant:
  - fees, payments, reports, cost centers, budgets

- Exam Controller:
  - schedules, marks, results, moderation, revaluation

- Placement:
  - jobs, placements, companies, internships, internship applications

- Parent:
  - attendance/grades/fees visibility, meetings, feedback, permissions

- Dean / Affairs / Hostel / Librarian:
  - discipline/incidents/policy and role-specific dashboards

- Analytics:
  - `predict_risk.php`: weighted risk score from attendance, marks, GPA, assignment completion
  - `policy_compliance.php`: rule checks and violation generation
  - additional intelligence modules (sentiment, SOS context, digital twin)

---

## 9) Data and security model (what is actually enforced)

### 9.1 Authentication/token model
- Login issues random bearer token and stores in `user_tokens` with expiry.
- Token is attached automatically by frontend fetch wrapper.
- Backend resolves token to authenticated user in `auth.php`.

### 9.2 Authorization model
- Dual-layer:
  - frontend route-level checks via `RequireAuth`
  - backend role/scope checks in endpoints (authoritative)

### 9.3 Integrity controls
- attendance duplicate prevention
- active-session checks
- network prefix verification
- QR token check
- rejection logs for suspicious attempts

### 9.4 Observed hardening status
Already present:
- token checks in many protected endpoints
- role gates and scoped data retrieval
- maintenance script blocklist in production mode (`config.php`)

Needs consistency improvements:
- full prepared statement adoption
- stricter CORS profile and origin policy
- standardized error schema and audit logging across all APIs

---

## 10) Known quality indicators from repository artifacts

From the provided project artifacts:
- Frontend build succeeds (`vite build`).
- Main JS bundle is large (~959.61 kB), suggesting route/code splitting opportunity.
- Lint report indicates hook-order issues and unused vars in selected pages.

Interpretation:
- Functional breadth is high and implementation is substantial.
- Engineering quality gates (lint cleanliness/performance optimization) need hardening before strict production rollout.

---

## 11) How data moves in one full user scenario (example)

Scenario: "Teacher marks attendance for class, student responds, parent receives absentee alert"

1. Teacher logs in -> token issued.
2. Teacher opens attendance page and starts session (subject/class/period).
3. Backend creates active session with gateway prefix + QR token.
4. Student opens attendance page; app fetches available sessions by class matching.
5. Student submits session + QR token.
6. Backend validates token, student role, active session, network match, QR, duplicate.
7. Attendance record inserted.
8. Teacher dashboard updates in near real-time (polling).
9. Teacher ends session.
10. Backend calculates absentees and emails parents of absent students.

This shows end-to-end closure from control start to stakeholder notification.

---

## 12) Deployment context and runtime assumptions

Current dev assumptions seen in code:
- Frontend can call backend using hostname-based URL (`apiClient.js`) or localhost direct URLs in some pages.
- Backend expected under `/SmartCampus/backend` in XAMPP-like environment.
- MySQL DB name defaults to `smartcampus`.
- Email uses PHP `mail()` (depends on server mail config).

Production expectations:
- configure secure hostnames/HTTPS
- enforce production CORS
- secure upload directories
- centralize secrets via environment variables

---

## 13) Strength summary and improvement roadmap

### 13.1 Strengths
- Very broad multi-role campus platform in one codebase
- Strong attendance integrity design with multiple independent checks
- Practical safety stack integrating SOS and geolocation
- Clear route/module organization for institutional workflows

### 13.2 Priority improvements
1. Convert remaining SQL operations to prepared statements.
2. Resolve hook/lint violations and add CI quality gates.
3. Add route-level lazy loading and chunk strategy for bundle size.
4. Complete robust QR decoding integration on student side.
5. Standardize logging, error contracts, and security test coverage.

---

## 14) File references for critical workflows

### Attendance
- Frontend: `frontend/src/pages/TeacherAttendance.jsx`
- Frontend: `frontend/src/pages/StudentAttendance.jsx`
- Backend: `backend/start_attendance.php`
- Backend: `backend/get_available_sessions.php`
- Backend: `backend/mark_attendance.php`
- Backend: `backend/get_active_teacher_session.php`
- Backend: `backend/get_attendance_list.php`
- Backend: `backend/end_attendance.php`

### SOS
- Frontend: `frontend/src/pages/StudentSOS.jsx`
- Backend: `backend/send_sos.php`
- Backend: `backend/get_sos.php`
- Backend: `backend/raise_sos.php`
- Backend: `backend/sos_safety_intelligence.php`

### Live Location
- Frontend: `frontend/src/pages/CampusLiveMap.jsx`
- Frontend: `frontend/src/pages/LiveLocation.jsx`
- Backend: `backend/update_location.php`
- Backend: `backend/get_live_locations.php`

### Auth and routing foundation
- Frontend: `frontend/src/main.jsx`
- Frontend: `frontend/src/Login.jsx`
- Frontend: `frontend/src/components/RequireAuth.jsx`
- Frontend: `frontend/src/utils/apiClient.js`
- Backend: `backend/config.php`
- Backend: `backend/auth.php`
- Backend: `backend/login.php`

---

## 15) Final conclusion

SmartCampus is not a single-feature prototype; it is a broad operational platform with real multi-role coverage and integrated safety controls. The most important technical depth is in attendance integrity (network + QR + duplicate + session checks), while SOS and live location workflows extend the platform into campus safety operations. The codebase demonstrates strong functional implementation, and with targeted hardening (security consistency, lint quality, performance optimization), it can transition from rich institutional prototype to robust production deployment.
