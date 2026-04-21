import DashboardLayout from "../components/layout/DashboardLayout";

function StudentDashboard() {
  return (
    <DashboardLayout
      role="student"
      title="Student Dashboard"
      subtitle="Review your planning status, track progress, and manage your next course decisions."
    >
      <section className="stats-grid">
        <div className="stat-card">
          <h3>Current Track</h3>
          <p className="stat-value">AI</p>
          <span className="stat-note">Selected academic pathway</span>
        </div>

        <div className="stat-card">
          <h3>Eligible Courses</h3>
          <p className="stat-value">6</p>
          <span className="stat-note">Available to add to your next plan</span>
        </div>

        <div className="stat-card">
          <h3>Blocked Courses</h3>
          <p className="stat-value">4</p>
          <span className="stat-note">Currently locked by prerequisites</span>
        </div>

        <div className="stat-card">
          <h3>Seat Alerts</h3>
          <p className="stat-value">2</p>
          <span className="stat-note">Courses with important seat updates</span>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel-card">
          <div className="panel-header">
            <h3>Quick Actions</h3>
            <p>Common student planning actions in PathWise</p>
          </div>

          <div className="action-list">
            <button className="action-btn">Open My Plan</button>
            <button className="action-btn secondary-btn">View Recommendations</button>
            <button className="action-btn secondary-btn">Open Roadmap</button>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <h3>Planning Summary</h3>
            <p>Your current academic planning snapshot</p>
          </div>

          <ul className="info-list">
            <li>
              <span>Recommended now</span>
              <strong>CS 348, CS 307, CS 373</strong>
            </li>
            <li>
              <span>Next target course</span>
              <strong>CS 473</strong>
            </li>
            <li>
              <span>Missing prerequisite</span>
              <strong>CS 373</strong>
            </li>
            <li>
              <span>Preferred credit load</span>
              <strong>15 credits</strong>
            </li>
          </ul>
        </div>
      </section>

      <section className="table-panel">
        <div className="panel-header">
          <h3>Recent Planning Status</h3>
          <p>Sample view of course eligibility and seat availability</p>
        </div>

        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Track</th>
              <th>Status</th>
              <th>Seats</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>CS 348 - Information Systems</td>
              <td>Data</td>
              <td><span className="status-badge eligible">Eligible</span></td>
              <td>Open</td>
            </tr>
            <tr>
              <td>CS 373 - Data Mining</td>
              <td>AI</td>
              <td><span className="status-badge recommended">Recommended</span></td>
              <td>Open</td>
            </tr>
            <tr>
              <td>CS 473 - Machine Learning</td>
              <td>AI</td>
              <td><span className="status-badge blocked">Blocked</span></td>
              <td>Open</td>
            </tr>
            <tr>
              <td>CS 390 - Web Application Development</td>
              <td>Systems</td>
              <td><span className="status-badge full">Full</span></td>
              <td>Full</td>
            </tr>
          </tbody>
        </table>
      </section>
    </DashboardLayout>
  );
}

export default StudentDashboard;