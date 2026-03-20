import RoleLayout from "./RoleLayout";

export default function RegistrarLayout() {
  return (
    <RoleLayout
      subtitle="Registrar"
      menuSections={[
        { type: "link", label: "Dashboard", icon: "bi bi-speedometer2", to: "/registrar" },
        {
          type: "section",
          key: "admissions",
          label: "Admissions",
          icon: "bi bi-person-lines-fill",
          children: [
            { label: "Applications", to: "/registrar/admissions" },
            { label: "Certificates", to: "/registrar/certificates" }
          ]
        },
        {
          type: "section",
          key: "records",
          label: "Records",
          icon: "bi bi-journal-text",
          children: [
            { label: "Students", to: "/registrar/students" },
            { label: "ID Cards", to: "/registrar/id-cards" },
            { label: "Form Reviews", to: "/registrar/form-reviews" }
          ]
        },
        { type: "link", label: "Change Password", icon: "bi bi-gear", to: "/change-password" }
      ]}
    />
  );
}
