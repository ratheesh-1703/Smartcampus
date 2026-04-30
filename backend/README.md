# SmartCampus Backend

This folder contains the PHP backend for SmartCampus. It exposes API endpoints for authentication, role-based dashboards, academic workflows, attendance, SOS handling, finance, placement support, and other campus operations.

## Responsibilities

- User authentication and session handling
- Role-based access control
- Student, teacher, and staff CRUD endpoints
- Attendance, timetable, marks, and profile APIs
- SOS, live location, and safety workflows
- Fees, reports, and administrative data endpoints

## Requirements

- PHP 8+ recommended
- MySQL / MariaDB
- XAMPP or another PHP server stack

## Local Setup

1. Start Apache and MySQL.
2. Import the database schema from the project SQL files.
3. Update backend configuration files with your local database credentials.
4. Serve the backend from the `backend/` directory.

## Notes

- Many files in this folder are standalone endpoint scripts.
- Several helper and recovery scripts are included for maintenance and debugging.

