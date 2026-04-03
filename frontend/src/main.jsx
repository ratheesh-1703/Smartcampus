import { StrictMode, Component } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RequireAuth from "./components/RequireAuth";

// Styles
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "leaflet/dist/leaflet.css";
import "./styles/responsive.css";

// Auth
import Login from "./Login";

// Dashboards
import AdminDashboard from "./pages/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import AffairsDashboard from "./pages/AffairsDashboard";
import HODDashboard from "./pages/HODDashboard";
import CoordinatorDashboard from "./pages/CoordinatorDashboard";

// Admin
import AddStudent from "./pages/AddStudent";
import StudentList from "./pages/StudentList";
import StudentProfile from "./pages/StudentProfile";
import EditStudent from "./pages/EditStudent";
import ImportStudents from "./pages/ImportStudents";

import AddTeacher from "./pages/AddTeacher";
import TeacherList from "./pages/TeacherList";
import TeacherProfile from "./pages/TeacherProfile";
import EditTeacher from "./pages/EditTeacher";
import ImportTeachers from "./pages/ImportTeachers";
import AssignHOD from "./pages/AssignHOD";
import AdminDepartments from "./pages/AdminDepartments";
import AdminSOSAlerts from "./pages/AdminSOSAlerts";
import AdminSystemSettings from "./pages/AdminSystemSettings";

import AdminLiveMap from "./pages/AdminLiveMap";

// Teacher
import TeacherAttendance from "./pages/TeacherAttendance";
import TeacherStudents from "./pages/TeacherStudents";
import TeacherMarks from "./pages/TeacherMarks";
import TeacherTimeTable from "./pages/TeacherTimeTable";
import TeacherBiometric from "./pages/TeacherBiometric";
import TeacherCourses from "./pages/TeacherCourses";
import TeacherGrades from "./pages/TeacherGrades";
import SubjectControllerDashboard from "./pages/SubjectControllerDashboard";
import SubjectControllerTools from "./pages/SubjectControllerTools";

// Coordinator
import CoordinatorStudents from "./pages/CoordinatorStudents";
import CoordinatorAttendance from "./pages/CoordinatorAttendance";
import CoordinatorHistory from "./pages/CoordinatorHistory";
import CoordinatorAssignTeachers from "./pages/CoordinatorAssignTeachers";
import CoordinatorLiveMap from "./pages/CoordinatorLiveMap";
import CoordinatorSOS from "./pages/CoordinatorSOS";

// HOD
import HODTeachers from "./pages/HODTeachers";
import HODStudents from "./pages/HODStudents";
import HODAssignCoordinator from "./pages/HODAssignCoordinator";
import HODManageClassCoordinators from "./pages/HODManageClassCoordinators";
import HODRisk from "./pages/HODRisk";
import HODSubjectControllers from "./pages/HODSubjectControllers";
import HODSubjectApprovals from "./pages/HODSubjectApprovals";
import HODLiveMap from "./pages/HODLiveMap";
import HODSOS from "./pages/HODSOS";

// Affairs
import AffairsSOS from "./pages/AffairsSOS";
import AffairsLiveMap from "./pages/AffairsLiveMap";
import AffairsIncidentLog from "./pages/AffairsIncidentLog";
import AffairsCounseling from "./pages/AffairsCounseling";
import AffairsHealth from "./pages/AffairsHealth";
import AffairsEvents from "./pages/AffairsEvents";
import AffairsReports from "./pages/AffairsReports";

// Layouts
import AdminLayout from "./layouts/AdminLayout";
import TeacherLayout from "./layouts/TeacherLayout";
import HODLayout from "./layouts/HODLayout";
import SubjectControllerLayout from "./layouts/SubjectControllerLayout";
import CoordinatorLayout from "./layouts/CoordinatorLayout";
import AffairsLayout from "./layouts/AffairsLayout";
import StudentLayout from "./layouts/StudentLayout";
import StudentDashboard from "./pages/StudentDashboard";
import StudentAttendance from "./pages/StudentAttendance";
import StudentHistory from "./pages/StudentHistory";
import StudentProfilePage from "./pages/StudentProfilePage";
import TeacherProfilePage from "./pages/TeacherProfilePage";
import HODProfilePage from "./pages/HODProfilePage";
import StudentMarks from "./pages/StudentMarks";
import StudentGrades from "./pages/StudentGrades";
import StudentFees from "./pages/StudentFees";
import StudentTimeTable from "./pages/StudentTimeTable";
import StudentSOS from "./pages/StudentSOS";
import StudentAutoFormFiller from "./pages/StudentAutoFormFiller";

// New roles
import AccountantLayout from "./layouts/AccountantLayout";
import RegistrarLayout from "./layouts/RegistrarLayout";
import ExamControllerLayout from "./layouts/ExamControllerLayout";
import PlacementOfficerLayout from "./layouts/PlacementOfficerLayout";
import ParentLayout from "./layouts/ParentLayout";
import DeanLayout from "./layouts/DeanLayout";
import HostelWardenLayout from "./layouts/HostelWardenLayout";
import LibrarianLayout from "./layouts/LibrarianLayout";

import AccountantDashboard from "./pages/AccountantDashboard";
import RegistrarDashboard from "./pages/RegistrarDashboard";
import ExamControllerDashboard from "./pages/ExamControllerDashboard";
import PlacementOfficerDashboard from "./pages/PlacementOfficerDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import DeanDashboard from "./pages/DeanDashboard";
import HostelWardenDashboard from "./pages/HostelWardenDashboard";
import LibrarianDashboard from "./pages/LibrarianDashboard";
import AccountantFees from "./pages/AccountantFees";
import AccountantPayments from "./pages/AccountantPayments";
import AccountantReports from "./pages/AccountantReports";
import AccountantCostCenters from "./pages/AccountantCostCenters";
import AccountantBudgets from "./pages/AccountantBudgets";
import RegistrarAdmissions from "./pages/RegistrarAdmissions";
import RegistrarStudents from "./pages/RegistrarStudents";
import RegistrarCertificates from "./pages/RegistrarCertificates";
import RegistrarIdCards from "./pages/RegistrarIdCards";
import RegistrarFormReviews from "./pages/RegistrarFormReviews";
import ExamSchedules from "./pages/ExamSchedules";
import ExamMarks from "./pages/ExamMarks";
import ExamResults from "./pages/ExamResults";
import ExamRevaluation from "./pages/ExamRevaluation";
import ExamModeration from "./pages/ExamModeration";
import PlacementJobs from "./pages/PlacementJobs";
import PlacementPlacements from "./pages/PlacementPlacements";
import PlacementCompanies from "./pages/PlacementCompanies";
import PlacementInternships from "./pages/PlacementInternships";
import PlacementInternshipApplications from "./pages/PlacementInternshipApplications";
import ParentMeetings from "./pages/ParentMeetings";
import ParentFeedback from "./pages/ParentFeedback";
import ParentFees from "./pages/ParentFees";
import ParentPermissions from "./pages/ParentPermissions";
import DeanIncidents from "./pages/DeanIncidents";
import DeanDiscipline from "./pages/DeanDiscipline";
import DeanNotices from "./pages/DeanNotices";
import DeanPolicies from "./pages/DeanPolicies";

// Map
import CampusLiveMap from "./pages/CampusLiveMap";
import CampusMap from "./pages/CampusMap";
import ChangePassword from "./pages/ChangePassword";
import UserProfilePage from "./pages/UserProfilePage";

const sanitizeStoredAuth = () => {
  if (typeof window === "undefined") return;

  const raw = localStorage.getItem("user");
  if (!raw) return;

  try {
    JSON.parse(raw);
  } catch {
    localStorage.removeItem("user");
  }
};

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "Unexpected application error"
    };
  }

  componentDidCatch(error, info) {
    console.error("App crash caught by boundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
          <h3>Something went wrong</h3>
          <p>{this.state.message}</p>
          <button
            className="btn btn-primary"
            onClick={() => {
              localStorage.removeItem("user");
              window.location.href = "/";
            }}
          >
            Reset session and reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const ensureAuthHeader = () => {
  if (typeof window === "undefined" || !window.fetch) return;
  const originalFetch = window.fetch.bind(window);

  window.fetch = (input, init = {}) => {
    let token = null;
    try {
      const stored = localStorage.getItem("user");
      const parsed = stored ? JSON.parse(stored) : null;
      token = parsed?.token || parsed?.user?.token || null;
    } catch {
      token = null;
    }

    if (!token) {
      return originalFetch(input, init);
    }

    const headers = new Headers(init.headers || undefined);
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return originalFetch(input, { ...init, headers });
  };
};

ensureAuthHeader();
sanitizeStoredAuth();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <Routes>

        {/* LOGIN */}
        <Route path="/" element={<Login />} />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <RequireAuth roles={["admin"]}>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="profile" element={<UserProfilePage />} />
          <Route path="addstudent" element={<AddStudent />} />
          <Route path="students" element={<StudentList />} />
          <Route path="student/:id" element={<StudentProfile />} />
          <Route path="student/edit/:id" element={<EditStudent />} />
          <Route path="importstudents" element={<ImportStudents />} />
          <Route path="addteacher" element={<AddTeacher />} />
          <Route path="teachers" element={<TeacherList />} />
          <Route path="teacher/:id" element={<TeacherProfile />} />
          <Route path="teacher/edit/:id" element={<EditTeacher />} />
          <Route path="importteachers" element={<ImportTeachers />} />
          <Route path="assign-hod" element={<AssignHOD />} />
          <Route path="livelocation" element={<AdminLiveMap />} />
          <Route path="departments" element={<AdminDepartments />} />
          <Route path="sos-alerts" element={<AdminSOSAlerts />} />
          <Route path="system-settings" element={<AdminSystemSettings />} />
        </Route>

        {/* TEACHER */}
        <Route
          path="/teacher"
          element={
            <RequireAuth roles={["teacher", "subject_controller"]}>
              <TeacherLayout />
            </RequireAuth>
          }
        >
          <Route index element={<TeacherDashboard />} />
          <Route path="profile" element={<TeacherProfilePage />} />
          <Route path="students" element={<TeacherStudents />} />
          <Route path="attendance" element={<TeacherAttendance />} />
          <Route path="marks" element={<TeacherMarks />} />
          <Route path="timetable" element={<TeacherTimeTable />} />
          <Route path="biometric" element={<TeacherBiometric />} />
          <Route path="courses" element={<TeacherCourses />} />
          <Route path="grades" element={<TeacherGrades />} />
          <Route path="subject-controller" element={<SubjectControllerTools />} />
        </Route>

        {/* COORDINATOR */}
        <Route
          path="/coordinator"
          element={
            <RequireAuth roles={["coordinator"]}>
              <CoordinatorLayout />
            </RequireAuth>
          }
        >
          <Route index element={<CoordinatorDashboard />} />
          <Route path="profile" element={<UserProfilePage />} />
          <Route path="students" element={<CoordinatorStudents />} />
          <Route path="logout-approvals" element={<CoordinatorStudents />} />
          <Route path="assign-teachers" element={<CoordinatorAssignTeachers />} />
          <Route path="attendance" element={<CoordinatorAttendance />} />
          <Route path="history" element={<CoordinatorHistory />} />
          <Route path="live-location" element={<CoordinatorLiveMap />} />
          <Route path="sos" element={<CoordinatorSOS />} />
          <Route path="form-reviews" element={<RegistrarFormReviews />} />
        </Route>

        {/* HOD */}
        <Route
          path="/hod"
          element={
            <RequireAuth roles={["hod"]}>
              <HODLayout />
            </RequireAuth>
          }
        >
          <Route index element={<HODDashboard />} />
          <Route path="profile" element={<HODProfilePage />} />
          <Route path="students" element={<HODStudents />} />
          <Route path="teachers" element={<HODTeachers />} />
          <Route path="manage-classes" element={<HODManageClassCoordinators />} />
          <Route path="assign-coordinator" element={<HODAssignCoordinator />} />
          <Route path="subject-controllers" element={<HODSubjectControllers />} />
          <Route path="subject-approvals" element={<HODSubjectApprovals />} />
          <Route path="risk" element={<HODRisk />} />
          <Route path="live-location" element={<HODLiveMap />} />
          <Route path="sos" element={<HODSOS />} />
          <Route path="form-reviews" element={<RegistrarFormReviews />} />
          <Route path="attendance" element={<TeacherAttendance />} />
          <Route path="marks" element={<TeacherMarks />} />
          <Route path="timetable" element={<TeacherTimeTable />} />
          <Route path="biometric" element={<TeacherBiometric />} />
        </Route>

        {/* SUBJECT CONTROLLER */}
        <Route
          path="/subject-controller"
          element={
            <RequireAuth roles={["subject_controller"]}>
              <SubjectControllerLayout />
            </RequireAuth>
          }
        >
          <Route index element={<SubjectControllerDashboard />} />
          <Route path="planning" element={<SubjectControllerTools />} />
          <Route path="profile" element={<TeacherProfilePage />} />
          <Route path="students" element={<TeacherStudents />} />
          <Route path="attendance" element={<TeacherAttendance />} />
          <Route path="marks" element={<TeacherMarks />} />
          <Route path="timetable" element={<TeacherTimeTable />} />
        </Route>

        {/* AFFAIRS */}
        <Route
          path="/affairs"
          element={
            <RequireAuth roles={["affairs"]}>
              <AffairsLayout />
            </RequireAuth>
          }
        >
          <Route index element={<AffairsDashboard />} />
          <Route path="profile" element={<UserProfilePage />} />
          <Route path="sos" element={<AffairsSOS />} />
          <Route path="location" element={<AffairsLiveMap />} />
          <Route path="incident-log" element={<AffairsIncidentLog />} />
          <Route path="campus-map" element={<CampusMap />} />
          <Route path="counseling" element={<AffairsCounseling />} />
          <Route path="health" element={<AffairsHealth />} />
          <Route path="events" element={<AffairsEvents />} />
          <Route path="reports" element={<AffairsReports />} />
          <Route path="form-reviews" element={<RegistrarFormReviews />} />
        </Route>

        {/* STUDENT */}
        <Route
          path="/student"
          element={
            <RequireAuth roles={["student"]}>
              <StudentLayout />
            </RequireAuth>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="history" element={<StudentHistory />} />
          <Route path="marks" element={<StudentMarks />} />
          <Route path="grades" element={<StudentGrades />} />
          <Route path="fees" element={<StudentFees />} />
          <Route path="timetable" element={<StudentTimeTable />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="sos" element={<StudentSOS />} />
          <Route path="auto-form" element={<StudentAutoFormFiller />} />
        </Route>

        {/* ACCOUNTANT */}
        <Route
          path="/accountant"
          element={
            <RequireAuth roles={["accountant"]}>
              <AccountantLayout />
            </RequireAuth>
          }
        >
          <Route index element={<AccountantDashboard />} />
          <Route path="profile" element={<UserProfilePage />} />
          <Route path="fees" element={<AccountantFees />} />
          <Route path="payments" element={<AccountantPayments />} />
          <Route path="reports" element={<AccountantReports />} />
          <Route path="cost-centers" element={<AccountantCostCenters />} />
          <Route path="budgets" element={<AccountantBudgets />} />
          <Route path="form-reviews" element={<RegistrarFormReviews />} />
        </Route>

        {/* REGISTRAR */}
        <Route
          path="/registrar"
          element={
            <RequireAuth roles={["registrar"]}>
              <RegistrarLayout />
            </RequireAuth>
          }
        >
          <Route index element={<RegistrarDashboard />} />
          <Route path="profile" element={<UserProfilePage />} />
          <Route path="admissions" element={<RegistrarAdmissions />} />
          <Route path="students" element={<RegistrarStudents />} />
          <Route path="certificates" element={<RegistrarCertificates />} />
          <Route path="id-cards" element={<RegistrarIdCards />} />
          <Route path="form-reviews" element={<RegistrarFormReviews />} />
        </Route>

        {/* EXAM CONTROLLER */}
        <Route
          path="/exam-controller"
          element={
            <RequireAuth roles={["exam_controller"]}>
              <ExamControllerLayout />
            </RequireAuth>
          }
        >
          <Route index element={<ExamControllerDashboard />} />
          <Route path="profile" element={<UserProfilePage />} />
          <Route path="schedules" element={<ExamSchedules />} />
          <Route path="marks" element={<ExamMarks />} />
          <Route path="results" element={<ExamResults />} />
          <Route path="revaluation" element={<ExamRevaluation />} />
          <Route path="moderation" element={<ExamModeration />} />
          <Route path="form-reviews" element={<RegistrarFormReviews />} />
        </Route>

        {/* PLACEMENT OFFICER */}
        <Route
          path="/placement"
          element={
            <RequireAuth roles={["placement_officer"]}>
              <PlacementOfficerLayout />
            </RequireAuth>
          }
        >
          <Route index element={<PlacementOfficerDashboard />} />
          <Route path="profile" element={<UserProfilePage />} />
          <Route path="jobs" element={<PlacementJobs />} />
          <Route path="placements" element={<PlacementPlacements />} />
          <Route path="companies" element={<PlacementCompanies />} />
          <Route path="internships" element={<PlacementInternships />} />
          <Route path="internship-applications" element={<PlacementInternshipApplications />} />
        </Route>

        {/* PARENT */}
        <Route
          path="/parent"
          element={
            <RequireAuth roles={["parent"]}>
              <ParentLayout />
            </RequireAuth>
          }
        >
          <Route index element={<ParentDashboard />} />
          <Route path="profile" element={<UserProfilePage />} />
          <Route path="meetings" element={<ParentMeetings />} />
          <Route path="feedback" element={<ParentFeedback />} />
          <Route path="fees" element={<ParentFees />} />
          <Route path="permissions" element={<ParentPermissions />} />
        </Route>

        {/* DEAN */}
        <Route
          path="/dean"
          element={
            <RequireAuth roles={["dean"]}>
              <DeanLayout />
            </RequireAuth>
          }
        >
          <Route index element={<DeanDashboard />} />
          <Route path="profile" element={<UserProfilePage />} />
          <Route path="incidents" element={<DeanIncidents />} />
          <Route path="discipline" element={<DeanDiscipline />} />
          <Route path="notices" element={<DeanNotices />} />
          <Route path="policies" element={<DeanPolicies />} />
        </Route>

        {/* HOSTEL WARDEN */}
        <Route
          path="/hostel"
          element={
            <RequireAuth roles={["hostel_warden"]}>
              <HostelWardenLayout />
            </RequireAuth>
          }
        >
          <Route index element={<HostelWardenDashboard />} />
          <Route path="profile" element={<UserProfilePage />} />
          <Route path="form-reviews" element={<RegistrarFormReviews />} />
        </Route>

        {/* LIBRARIAN */}
        <Route
          path="/librarian"
          element={
            <RequireAuth roles={["librarian"]}>
              <LibrarianLayout />
            </RequireAuth>
          }
        >
          <Route index element={<LibrarianDashboard />} />
          <Route path="profile" element={<UserProfilePage />} />
        </Route>

        {/* COMMON */}
        <Route
          path="/change-password"
          element={
            <RequireAuth
              roles={[
                "admin",
                "teacher",
                "student",
                "affairs",
                "hod",
                "coordinator",
                "accountant",
                "registrar",
                "exam_controller",
                "placement_officer",
                "parent",
                "dean",
                "hostel_warden",
                "librarian"
              ]}
            >
              <ChangePassword />
            </RequireAuth>
          }
        />
        <Route
          path="/campus-map"
          element={
            <RequireAuth
              roles={[
                "admin",
                "teacher",
                "student",
                "affairs",
                "hod",
                "coordinator",
                "accountant",
                "registrar",
                "exam_controller",
                "placement_officer",
                "parent",
                "dean",
                "hostel_warden",
                "librarian"
              ]}
            >
              <CampusLiveMap />
            </RequireAuth>
          }
        />

        </Routes>
      </BrowserRouter>
    </AppErrorBoundary>
  </StrictMode>
);
