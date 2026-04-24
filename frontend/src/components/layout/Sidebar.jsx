import { NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/pathwise-icon.png";
import { useAuth } from "../../context/useAuth";

function Sidebar({ role }) {
  const navigate = useNavigate();
  const { user, role: authRole, logout } = useAuth();

  const studentLinks = [
    { label: "Dashboard", path: "/student/dashboard" },
    { label: "Academic Progress", path: "/student/progress" },
    { label: "Scheduling Assistant", path: "/student/schedule" }
  ];

  const adminLinks = [
    { label: "Dashboard", path: "/admin/dashboard" },
    { label: "Course Catalog", path: "/admin/courses" },
  ];

  const links = role === "admin" ? adminLinks : studentLinks;
  const userName =
    typeof user === "object" && user !== null ? user.name ?? "User" : user ?? "User";
  const userRole = typeof user === "object" && user !== null ? user.role ?? authRole : authRole;

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
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
      </div>

      <div className="sidebar-account">
        <div className="sidebar-account-meta">
          <p className="sidebar-account-name">{userName}</p>
          <p className="sidebar-account-role">
            {userRole === "admin" ? "Admin" : "Student"}
          </p>
        </div>

        <button type="button" onClick={handleLogout} className="sidebar-logout-btn">
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
