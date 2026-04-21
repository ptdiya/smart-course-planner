function Header({ title, subtitle, role }) {
  return (
    <header className="dashboard-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="header-right">
        <div className="role-badge">
          {role === "admin" ? "Administrator" : "Student"}
        </div>
      </div>
    </header>
  );
}

export default Header;