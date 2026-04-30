# SmartCampus

SmartCampus is a campus management platform built to support academic operations, student services, attendance verification, emergency response, finance workflows, and role-based administrative dashboards in a single system.

The repository is organized as a full-stack application with a React frontend and a PHP/MySQL backend. The codebase is structured around real campus roles, so each dashboard and API surface is scoped to the responsibilities of that user type.

## What This Repository Contains

- `frontend/` - React + Vite user interface with role-based layouts and dashboards
- `backend/` - PHP API layer for authentication, workflows, alerts, and database access
- `database/` - SQL schema and database assets
- `ieee_submission_package/` - presentation and publication material

## Key Capabilities

- Role-based authentication and access control
- Attendance, timetable, and academic workflow management
- SOS alerts and live location tracking
- Student, teacher, and staff record management
- Finance, reports, and administrative dashboards
- Placement, hostel, librarian, and support-role workflows

## Technology Stack

- Frontend: React 19, Vite, React Router, Bootstrap, Chart.js, Leaflet
- Backend: PHP, MySQL / MariaDB
- Tooling and deployment: XAMPP, Netlify, Render, GitHub

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

1. Start Apache and MySQL through XAMPP or your local PHP stack.
2. Import the database schema from the SQL files in this repository.
3. Update backend configuration values for your local database connection.
4. Serve the PHP backend from the `backend/` directory.

## Documentation

- Frontend details: `frontend/README.md`
- Backend details: `backend/README.md`
- Conference deck generator: `generate_smartcampus_conference_deck.py`

## Notes

- The repository includes recovery and audit files from the restoration process.
- Some modules are standalone PHP endpoints rather than a single monolithic application server.
