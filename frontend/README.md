# SmartCampus Frontend

SmartCampus Frontend is the presentation layer for the SmartCampus campus management platform. It delivers role-specific dashboards and operational workflows for academic administration, student services, finance, attendance, safety, and institutional reporting.

The application is designed for multi-role use in a real campus environment. Each role sees only the screens and actions relevant to that responsibility, which keeps the interface focused while supporting a wide operational surface area.

## Project Scope

- Role-based dashboards for admin, teacher, student, coordinator, accountant, registrar, dean, librarian, hostel warden, parent, placement officer, and subject controller
- Attendance and timetable views with backend-driven data
- SOS and live-location monitoring interfaces
- Academic, finance, placement, and student management workflows
- Shared layout system for consistent navigation and access control

## Tech Stack

- React 19
- Vite
- React Router
- Bootstrap and Bootstrap Icons
- Chart.js and React Chart.js 2
- Leaflet and React Leaflet

## Architecture Notes

- The frontend is structured around role-specific layouts so each user type gets a tailored navigation experience.
- Pages are organized by business domain rather than by generic component type, which makes the project easier to extend and maintain.
- Utility modules centralize API communication and reduce repeated request logic across screens.
- Hooks are used for shared client-side behaviors such as global notifications and live updates.

## Folder Highlights

- `src/pages/` - Domain screens and dashboards for each role
- `src/layouts/` - Shared layout shells and navigation structures
- `src/components/` - Reusable interface elements
- `src/utils/` - API clients and helper functions
- `src/hooks/` - Shared interaction logic and polling hooks

## Running the Project

```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

## Intended Use

This frontend is intended to operate with the SmartCampus backend APIs and support a production-style campus workflow where multiple departments coordinate through a single web interface.
