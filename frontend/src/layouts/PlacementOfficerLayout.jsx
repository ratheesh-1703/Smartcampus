import RoleLayout from "./RoleLayout";

export default function PlacementOfficerLayout() {
  return (
    <RoleLayout
      subtitle="Placement Officer"
      menuSections={[
        { type: "link", label: "Dashboard", icon: "bi bi-speedometer2", to: "/placement" },
        {
          type: "section",
          key: "placement",
          label: "Placement",
          icon: "bi bi-briefcase",
          children: [
            { label: "Job Postings", to: "/placement/jobs" },
            { label: "Placements", to: "/placement/placements" },
            { label: "Companies", to: "/placement/companies" }
          ]
        },
        {
          type: "section",
          key: "internships",
          label: "Internships",
          icon: "bi bi-people",
          children: [
            { label: "Postings", to: "/placement/internships" },
            { label: "Applications", to: "/placement/internship-applications" }
          ]
        },
        { type: "link", label: "Change Password", icon: "bi bi-gear", to: "/change-password" }
      ]}
    />
  );
}
