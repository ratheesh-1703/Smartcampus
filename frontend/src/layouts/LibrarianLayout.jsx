import RoleLayout from "./RoleLayout";

export default function LibrarianLayout() {
  return (
    <RoleLayout
      subtitle="Librarian"
      menuSections={[
        { type: "link", label: "Dashboard", icon: "bi bi-speedometer2", to: "/librarian" },
        {
          type: "section",
          key: "library",
          label: "Library",
          icon: "bi bi-book",
          children: [
            { label: "Books", to: "/librarian/books" },
            { label: "Circulation", to: "/librarian/circulation" }
          ]
        },
        { type: "link", label: "Change Password", icon: "bi bi-gear", to: "/change-password" }
      ]}
    />
  );
}
