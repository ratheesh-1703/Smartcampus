import RoleLayout from "./RoleLayout";

export default function ExamControllerLayout() {
  return (
    <RoleLayout
      subtitle="Exam Controller"
      menuSections={[
        { type: "link", label: "Dashboard", icon: "bi bi-speedometer2", to: "/exam-controller" },
        {
          type: "section",
          key: "exams",
          label: "Exams",
          icon: "bi bi-journal-check",
          children: [
            { label: "Schedules", to: "/exam-controller/schedules" },
            { label: "Marks", to: "/exam-controller/marks" },
            { label: "Results", to: "/exam-controller/results" }
          ]
        },
        {
          type: "section",
          key: "quality",
          label: "Quality",
          icon: "bi bi-clipboard-check",
          children: [
            { label: "Revaluation", to: "/exam-controller/revaluation" },
            { label: "Moderation", to: "/exam-controller/moderation" }
          ]
        },
        { type: "link", label: "Form Reviews", icon: "bi bi-file-earmark-check", to: "/exam-controller/form-reviews" },
        { type: "link", label: "Change Password", icon: "bi bi-gear", to: "/change-password" }
      ]}
    />
  );
}
