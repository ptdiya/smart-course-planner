import DashboardLayout from "../components/layout/DashboardLayout";

function CourseCatalog() {
  return (
    <DashboardLayout
      role="admin"
      title="Course Catalog"
      subtitle="View and manage department course information, capacities, and prerequisite rules."
    >
      <section className="table-panel">
        <div className="panel-header">
          <h3>Catalog Management</h3>
          <p>
            This page will allow administrators to search courses, inspect
            course details, update seat capacities, and edit prerequisite rules
            for individual courses.
          </p>
        </div>

        <div className="placeholder-box">
          <h4>Coming Next</h4>
          <p>
            We will connect this page to the backend admin APIs so course data,
            capacity updates, and prerequisite edits can all be managed here.
          </p>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default CourseCatalog;