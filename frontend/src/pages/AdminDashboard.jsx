import DashboardLayout from "../components/layout/DashboardLayout";

function AdminDashboard() {
  return (
    <DashboardLayout
      role="admin"
      title="Admin Dashboard"
      subtitle="Monitor department course data, seat usage, and prerequisite rule updates."
    >
      <section className="stats-grid">
        <div className="stat-card">
          <h3>Total Courses</h3>
          <p className="stat-value">42</p>
          <span className="stat-note">Courses in the CS department dataset</span>
        </div>

        <div className="stat-card">
          <h3>Full Courses</h3>
          <p className="stat-value">5</p>
          <span className="stat-note">Currently at maximum capacity</span>
        </div>

        <div className="stat-card">
          <h3>Low Seat Courses</h3>
          <p className="stat-value">7</p>
          <span className="stat-note">Courses close to filling up</span>
        </div>

        <div className="stat-card">
          <h3>Rule Updates</h3>
          <p className="stat-value">3</p>
          <span className="stat-note">Recent prerequisite changes</span>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel-card">
          <div className="panel-header">
            <h3>Quick Actions</h3>
            <p>Main administrative actions in PathWise</p>
          </div>

          <div className="action-list">
            <button className="action-btn">Open Course Catalog</button>
            <button className="action-btn secondary-btn">Edit Capacities</button>
            <button className="action-btn secondary-btn">Manage Prerequisites</button>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <h3>Department Summary</h3>
            <p>Current course system overview</p>
          </div>

          <ul className="info-list">
            <li>
              <span>Most requested course</span>
              <strong>CS 390</strong>
            </li>
            <li>
              <span>Recently updated rule</span>
              <strong>CS 473 prerequisite logic</strong>
            </li>
            <li>
              <span>Courses with open seats</span>
              <strong>31</strong>
            </li>
            <li>
              <span>Managed tracks</span>
              <strong>AI, Data, Systems, Networks</strong>
            </li>
          </ul>
        </div>
      </section>

      <section className="table-panel">
        <div className="panel-header">
          <h3>Recent Administrative Activity</h3>
          <p>Sample management activity inside PathWise</p>
        </div>

        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Course</th>
              <th>Updated By</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Capacity Increased</td>
              <td>CS 314</td>
              <td>Admin User</td>
              <td><span className="status-badge eligible">Saved</span></td>
            </tr>
            <tr>
              <td>Prerequisite Updated</td>
              <td>CS 473</td>
              <td>Admin User</td>
              <td><span className="status-badge recommended">Applied</span></td>
            </tr>
            <tr>
              <td>Course Reviewed</td>
              <td>CS 390</td>
              <td>Admin User</td>
              <td><span className="status-badge full">Attention</span></td>
            </tr>
            <tr>
              <td>Seat Check Logged</td>
              <td>CS 348</td>
              <td>System</td>
              <td><span className="status-badge eligible">Open</span></td>
            </tr>
          </tbody>
        </table>
      </section>
    </DashboardLayout>
  );
}

export default AdminDashboard;