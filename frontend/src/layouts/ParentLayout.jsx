import RoleLayout from "./RoleLayout";

export default function ParentLayout() {
  return (
    <RoleLayout
      subtitle="Parent Portal"
      menuSections={[
        { type: "link", label: "Dashboard", icon: "bi bi-speedometer2", to: "/parent" },
        {
          type: "section",
          key: "child",
          label: "Child Support",
          icon: "bi bi-people",
          children: [
            { label: "Meetings", to: "/parent/meetings" },
            { label: "Feedback", to: "/parent/feedback" },
            { label: "Fees", to: "/parent/fees" },
            { label: "Permissions", to: "/parent/permissions" }
          ]
        },
        { type: "link", label: "Change Password", icon: "bi bi-gear", to: "/change-password" }
      ]}
    />
  );
}
