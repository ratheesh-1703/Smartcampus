import RoleLayout from "./RoleLayout";

export default function HostelWardenLayout() {
  return (
    <RoleLayout
      subtitle="Hostel Warden"
      menuSections={[
        { type: "link", label: "Dashboard", icon: "bi bi-speedometer2", to: "/hostel" },
        { type: "link", label: "Form Reviews", icon: "bi bi-file-earmark-check", to: "/hostel/form-reviews" },
        { type: "link", label: "Change Password", icon: "bi bi-gear", to: "/change-password" }
      ]}
    />
  );
}
