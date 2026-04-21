import DashboardLayout from "../components/layout/DashboardLayout";

function Recommendations() {
  return (
    <DashboardLayout
      role="student"
      title="Recommendations"
      subtitle="Explore suggested courses based on your academic progress and constraints."
    >
      <section className="table-panel">
        <div className="panel-header">
          <h3>Recommended Courses</h3>
          <p>
            This page will show recommended-now and recommended-later courses,
            along with reasoning such as prerequisite satisfaction, seat
            availability, and track fit.
          </p>
        </div>

        <div className="placeholder-box">
          <h4>Coming Next</h4>
          <p>
            We will connect this page to the recommendation engine from the
            backend and display ranked results here.
          </p>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default Recommendations;