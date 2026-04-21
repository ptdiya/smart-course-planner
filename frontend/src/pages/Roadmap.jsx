import DashboardLayout from "../components/layout/DashboardLayout";

function Roadmap() {
  return (
    <DashboardLayout
      role="student"
      title="Roadmap"
      subtitle="Track your academic path and understand what courses unlock next."
    >
      <section className="table-panel">
        <div className="panel-header">
          <h3>Path Guidance</h3>
          <p>
            This page will show unlocked courses, blocked courses, missing
            prerequisites, and next-step guidance for your selected track.
          </p>
        </div>

        <div className="placeholder-box">
          <h4>Coming Next</h4>
          <p>
            We will connect this page to the roadmap and path guidance backend
            logic so it can display real planning progression.
          </p>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default Roadmap;