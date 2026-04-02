import { Navigate, useLocation } from "react-router-dom";

const normalizeRole = (rawRole) => {
  const normalized = String(rawRole || "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "_");

  const aliases = {
    examcontroller: "exam_controller",
    exam_control: "exam_controller",
    exam_controller: "exam_controller",
    placement: "placement_officer",
    placementofficer: "placement_officer",
    placement_officer: "placement_officer",
    hostelwarden: "hostel_warden",
    hostel_warden: "hostel_warden",
    subjectcontroller: "subject_controller",
    subject_controller: "subject_controller",
    hod: "hod",
    faculty: "teacher",
  };

  return aliases[normalized] || normalized;
};

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export default function RequireAuth({ roles = [], children }) {
  const location = useLocation();
  const stored = getStoredUser();
  const role = normalizeRole(stored?.role || stored?.user?.role);
  const normalizedRoles = roles.map((item) => normalizeRole(item));

  if (!stored || !role) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (normalizedRoles.length && !normalizedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
