import DashboardLayout from "../components/layout/DashboardLayout";

function MyPlan() {
  return (
    <DashboardLayout
      role="student"
      title="My Plan"
      subtitle="Build and validate your next semester course plan."
    >
      <section className="table-panel">
        <div className="panel-header">
          <h3>Plan Builder</h3>
          <p>
            This page will allow students to select planned courses, validate
            prerequisites, check schedule conflicts, verify credit load, and see
            explainable planning results.
          </p>
        </div>

        <div className="placeholder-box">
          <h4>Coming Next</h4>
          <p>
            We will connect this page to the backend plan validation logic so it
            can evaluate selected courses in real time.
          </p>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default MyPlan;