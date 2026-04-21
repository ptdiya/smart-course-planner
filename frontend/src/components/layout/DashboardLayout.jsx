import Sidebar from "./Sidebar";
import Header from "./Header";
import "../../styles/dashboard.css";

function DashboardLayout({ role, title, subtitle, children }) {
  return (
    <div className="dashboard-shell">
      <Sidebar role={role} />

      <main className="dashboard-main">
        <Header title={title} subtitle={subtitle} role={role} />
        <div className="dashboard-content">{children}</div>
      </main>
    </div>
  );
}

export default DashboardLayout;