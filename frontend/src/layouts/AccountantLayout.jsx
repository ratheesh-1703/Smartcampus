import RoleLayout from "./RoleLayout";

export default function AccountantLayout() {
  return (
    <RoleLayout
      subtitle="Accountant"
      menuSections={[
        { type: "link", label: "Dashboard", icon: "bi bi-speedometer2", to: "/accountant" },
        {
          type: "section",
          key: "finance",
          label: "Finance",
          icon: "bi bi-cash-coin",
          children: [
            { label: "Fees", to: "/accountant/fees" },
            { label: "Payments", to: "/accountant/payments" },
            { label: "Reports", to: "/accountant/reports" }
          ]
        },
        {
          type: "section",
          key: "planning",
          label: "Planning",
          icon: "bi bi-graph-up",
          children: [
            { label: "Cost Centers", to: "/accountant/cost-centers" },
            { label: "Budgets", to: "/accountant/budgets" }
          ]
        },
        { type: "link", label: "Form Reviews", icon: "bi bi-file-earmark-check", to: "/accountant/form-reviews" },
        { type: "link", label: "Change Password", icon: "bi bi-gear", to: "/change-password" }
      ]}
    />
  );
}
