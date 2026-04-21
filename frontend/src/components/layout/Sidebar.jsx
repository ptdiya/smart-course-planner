import { NavLink } from "react-router-dom";
import logo from "../../assets/pathwise-logo.png";

function Sidebar({ role }) {
  const studentLinks = [
    { label: "Dashboard", path: "/student" },
    { label: "My Plan", path: "/student/plan" },
    { label: "Recommendations", path: "/student/recommendations" },
    { label: "Roadmap", path: "/student/roadmap" }
  ];

  const adminLinks = [
    { label: "Dashboard", path: "/admin" },
    { label: "Course Catalog", path: "/admin/courses" },
  ];

  const links = role === "admin" ? adminLinks : studentLinks;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={logo} alt="PathWise logo" className="sidebar-logo" />
        <div className="sidebar-brand-text">
          <h2>PathWise</h2>
          <p>{role === "admin" ? "Admin Portal" : "Student Portal"}</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              isActive ? "nav-link active-link" : "nav-link"
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;