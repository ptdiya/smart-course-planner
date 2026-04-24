import DashboardLayout from "../components/layout/DashboardLayout";

function SchedulingAssistant() {
  return (
    <DashboardLayout
      role="student"
      title="Scheduling Assistant"
      subtitle="Organize possible schedules, compare options, and prepare upcoming terms."
    >
      <section className="panel-card">
        <div className="panel-header">
          <h3>Schedule Builder</h3>
          <p>Scheduling suggestions and draft term plans will appear here.</p>
        </div>
      </section>

      <section className="table-panel">
        <div className="panel-header">
          <h3>Planning Notes</h3>
          <p>Conflicts, recommendations, and next scheduling actions will be listed here.</p>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default SchedulingAssistant;
