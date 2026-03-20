import RoleLayout from "./RoleLayout";

export default function DeanLayout() {
  return (
    <RoleLayout
      subtitle="Dean"
      menuSections={[
        { type: "link", label: "Dashboard", icon: "bi bi-speedometer2", to: "/dean" },
        {
          type: "section",
          key: "discipline",
          label: "Discipline",
          icon: "bi bi-shield-check",
          children: [
            { label: "Incidents", to: "/dean/incidents" },
            { label: "Actions", to: "/dean/discipline" },
            { label: "Notices", to: "/dean/notices" }
          ]
        },
        {
          type: "section",
          key: "governance",
          label: "Governance",
          icon: "bi bi-diagram-3",
          children: [
            { label: "Policy Requests", to: "/dean/policies" }
          ]
        },
        { type: "link", label: "Change Password", icon: "bi bi-gear", to: "/change-password" }
      ]}
    />
  );
}
