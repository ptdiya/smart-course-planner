import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/pathwise-icon.png";
import { useAuth } from "../../context/useAuth";

const SIDEBAR_STORAGE_KEY = "pathwise-sidebar-collapsed";

function Sidebar({ role }) {
  const navigate = useNavigate();
  const { user, role: authRole, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const storedValue = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return storedValue === "true";
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  const studentLinks = useMemo(
    () => [
      { label: "Dashboard", path: "/student/dashboard", icon: "\u2302" },
      { label: "Academic Progress", path: "/student/progress", icon: "\u25EB" },
      { label: "Scheduling Assistant", path: "/student/schedule", icon: "\u25A6" },
    ],
    [],
  );

  const adminLinks = useMemo(
    () => [
      { label: "Dashboard", path: "/admin/dashboard", icon: "\u2302" },
      { label: "Course Catalog", path: "/admin/courses", icon: "\u2630" },
      { label: "User Management", path: "/admin/users", icon: "\u25CE" },
    ],
    [],
  );

  const links = role === "admin" ? adminLinks : studentLinks;
  const userName =
    typeof user === "object" && user !== null ? user.name ?? "User" : user ?? "User";
  const userRole = typeof user === "object" && user !== null ? user.role ?? authRole : authRole;
  const avatarText = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "PW";

  function handleLogout() {
    logout();
    navigate("/");
  }

  function handleToggle() {
    setIsCollapsed((value) => !value);
  }

  function handleExpandFromBlankSpace() {
    if (isCollapsed) {
      setIsCollapsed(false);
    }
  }

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-top">
        <div className="sidebar-brand-area">
          <div className="sidebar-brand-row">
            <div className="sidebar-brand">
              <img src={logo} alt="PathWise logo" className="sidebar-logo" />
              {!isCollapsed && (
                <div className="sidebar-brand-text">
                  <h2>PathWise</h2>
                  <p>{role === "admin" ? "Admin Portal" : "Student Portal"}</p>
                </div>
              )}
            </div>
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
              title={isCollapsed ? link.label : undefined}
              aria-label={link.label}
            >
              <span className="nav-icon" aria-hidden="true">
                {link.icon}
              </span>
              {!isCollapsed && <span className="nav-label">{link.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <button
        type="button"
        className={`sidebar-blank-space ${isCollapsed ? "expandable" : ""}`}
        onClick={handleExpandFromBlankSpace}
        aria-label={isCollapsed ? "Expand sidebar" : undefined}
        title={isCollapsed ? "Expand sidebar" : undefined}
      />

      <div className="sidebar-bottom">
        <div className="sidebar-toggle-row">
          <button
            type="button"
            className="sidebar-toggle"
            onClick={handleToggle}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? "\u203A" : "\u2039"}
          </button>
        </div>

        <div className="sidebar-account">
          <div className="sidebar-account-profile" title={isCollapsed ? userName : undefined}>
            <div className="sidebar-avatar" aria-hidden="true">
              {avatarText}
            </div>

            {!isCollapsed && (
              <div className="sidebar-account-meta">
                <p className="sidebar-account-name">{userName}</p>
                <p className="sidebar-account-role">
                  {userRole === "admin" ? "Admin" : "Student"}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className={`sidebar-logout-btn ${isCollapsed ? "icon-only" : ""}`}
            aria-label="Logout"
            title="Logout"
          >
            <span className="logout-icon" aria-hidden="true">
              {"\u21AA"}
            </span>
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
