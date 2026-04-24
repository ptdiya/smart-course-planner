import DashboardLayout from "../components/layout/DashboardLayout";

function AcademicProgress() {
  return (
    <DashboardLayout
      role="student"
      title="Academic Progress"
      subtitle="Track completed milestones, degree momentum, and upcoming requirements."
    >
      <section className="panel-card">
        <div className="panel-header">
          <h3>Progress Overview</h3>
          <p>Summary widgets and completion details will appear here.</p>
        </div>
      </section>

      <section className="table-panel">
        <div className="panel-header">
          <h3>Requirement Status</h3>
          <p>Program requirement progress and completion checkpoints will be listed here.</p>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default AcademicProgress;
