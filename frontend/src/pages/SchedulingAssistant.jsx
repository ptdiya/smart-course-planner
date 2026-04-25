import { useMemo, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import "../styles/schedulingAssistant.css";

const schedulingAssistantMockData = {
  studentPlanningContext: {
    studentName: "Maya Patel",
    major: "Computer Science",
    track: "Artificial Intelligence",
    completedCredits: 84,
    completedCsRequirementsCount: 7,
  },
  termOptions: {
    semesters: ["Fall", "Spring", "Summer", "Winter"],
    years: [2026, 2027],
    selectedTerm: "Fall 2026",
  },
  submissionWindow: {
    selectedTerm: "Fall 2026",
    status: "Open",
    message:
      "Final submission is available for Fall 2026 after the draft schedule passes validation.",
  },
  offeredCourses: [
    {
      code: "CS 348",
      title: "Information Systems",
      credits: 3,
      category: "Core CS",
      description: "Introduces database concepts, data modeling, and information system design.",
      numberOfSections: 3,
      sectionSummary: "2 open, 1 full",
      sections: [
        {
          sectionNumber: "001",
          instructor: "Dr. Chen",
          days: "MWF",
          time: "9:30 AM - 10:20 AM",
          location: "LWSN B151",
          capacity: 36,
          enrolledCount: 31,
          seatsRemaining: 5,
          seatStatus: "Open",
        },
        {
          sectionNumber: "002",
          instructor: "Dr. Alvarez",
          days: "TR",
          time: "1:30 PM - 2:45 PM",
          location: "WALC 2087",
          capacity: 32,
          enrolledCount: 30,
          seatsRemaining: 2,
          seatStatus: "Low Seats",
        },
        {
          sectionNumber: "003",
          instructor: "Dr. Chen",
          days: "TR",
          time: "3:00 PM - 4:15 PM",
          location: "LWSN B134",
          capacity: 32,
          enrolledCount: 32,
          seatsRemaining: 0,
          seatStatus: "Full",
        },
      ],
    },
    {
      code: "CS 471",
      title: "Introduction to Artificial Intelligence",
      credits: 3,
      category: "AI Track",
      description: "Covers search, knowledge representation, reasoning, and introductory AI methods.",
      numberOfSections: 2,
      sectionSummary: "1 open, 1 low seats",
      sections: [
        {
          sectionNumber: "001",
          instructor: "Dr. Nguyen",
          days: "MWF",
          time: "11:30 AM - 12:20 PM",
          location: "LWSN 1142",
          capacity: 40,
          enrolledCount: 34,
          seatsRemaining: 6,
          seatStatus: "Open",
        },
        {
          sectionNumber: "002",
          instructor: "Dr. Nguyen",
          days: "TR",
          time: "10:30 AM - 11:45 AM",
          location: "WALC 3121",
          capacity: 36,
          enrolledCount: 34,
          seatsRemaining: 2,
          seatStatus: "Low Seats",
        },
      ],
    },
    {
      code: "CS 390",
      title: "Web Application Development",
      credits: 3,
      category: "Supporting Elective",
      description: "Builds practical client and server web application development skills.",
      numberOfSections: 2,
      sectionSummary: "1 open, 1 full",
      sections: [
        {
          sectionNumber: "001",
          instructor: "Prof. Williams",
          days: "MW",
          time: "2:30 PM - 3:45 PM",
          location: "HAAS G066",
          capacity: 28,
          enrolledCount: 25,
          seatsRemaining: 3,
          seatStatus: "Open",
        },
        {
          sectionNumber: "002",
          instructor: "Prof. Williams",
          days: "TR",
          time: "4:30 PM - 5:45 PM",
          location: "HAAS G040",
          capacity: 28,
          enrolledCount: 28,
          seatsRemaining: 0,
          seatStatus: "Full",
        },
      ],
    },
  ],
  selectedSchedule: [],
  validationPlaceholder: {
    title: "Validation Results",
    message:
      "Future validation will check schedule conflicts, credit load, prerequisite readiness, and submission rules.",
  },
  suggestionsPlaceholder: {
    title: "Suggestions and Path Guidance",
    message:
      "Future suggestions will recommend sections, alternatives, and next academic steps based on the draft schedule.",
  },
  finalSubmissionPlaceholder: {
    title: "Final Submission",
    message:
      "Final submission will only be enabled after validation passes and the selected term submission window is open.",
  },
};

function getSeatStatusClass(status) {
  return status.toLowerCase().replace(" ", "-");
}

function SchedulingAssistant() {
  const {
    studentPlanningContext,
    termOptions,
    submissionWindow,
    offeredCourses,
  } = schedulingAssistantMockData;
  const courseCategories = useMemo(
    () => [...new Set(offeredCourses.map((course) => course.category))],
    [offeredCourses],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState(() =>
    courseCategories.reduce((categories, category) => {
      categories[category] = true;
      return categories;
    }, {}),
  );
  const [expandedCourses, setExpandedCourses] = useState({});
  const [selectedSchedule, setSelectedSchedule] = useState([]);
  const selectedCourseCodes = useMemo(
    () => new Set(selectedSchedule.map((item) => item.courseCode)),
    [selectedSchedule],
  );
  const selectedSectionKeys = useMemo(
    () => new Set(selectedSchedule.map((item) => `${item.courseCode}-${item.sectionNumber}`)),
    [selectedSchedule],
  );
  const totalDraftCredits = selectedSchedule.reduce((total, item) => total + item.credits, 0);
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredCourses = useMemo(
    () =>
      offeredCourses.filter((course) => {
        if (!normalizedSearchTerm) {
          return true;
        }

        return [course.code, course.title, course.category, course.description]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearchTerm);
      }),
    [normalizedSearchTerm, offeredCourses],
  );
  const groupedCourses = courseCategories
    .map((category) => ({
      category,
      courses: filteredCourses.filter((course) => course.category === category),
    }))
    .filter((group) => group.courses.length > 0);

  function toggleCategory(category) {
    setExpandedCategories((current) => ({
      ...current,
      [category]: !current[category],
    }));
  }

  function toggleCourse(courseCode) {
    setExpandedCourses((current) => ({
      ...current,
      [courseCode]: !current[courseCode],
    }));
  }

  function addSection(course, section) {
    if (section.seatStatus === "Full" || selectedCourseCodes.has(course.code)) {
      return;
    }

    setSelectedSchedule((current) => [
      ...current,
      {
        courseCode: course.code,
        title: course.title,
        credits: course.credits,
        category: course.category,
        sectionNumber: section.sectionNumber,
        instructor: section.instructor,
        days: section.days,
        time: section.time,
        location: section.location,
        seatStatus: section.seatStatus,
      },
    ]);
  }

  function removeSection(courseCode) {
    setSelectedSchedule((current) => current.filter((item) => item.courseCode !== courseCode));
  }

  return (
    <DashboardLayout
      role="student"
      title="Scheduling Assistant"
      subtitle="Build, validate, and submit your semester schedule."
    >
      <section className="panel-card scheduling-controls-card">
        <div className="panel-header">
          <h3>Term Selection and Planning Controls</h3>
          <p>Mock term controls are loaded for the Phase 1 scheduling workflow.</p>
        </div>

        <div className="scheduling-control-grid">
          <div>
            <span>Selected Term</span>
            <strong>{termOptions.selectedTerm}</strong>
          </div>
          <div>
            <span>Available Semesters</span>
            <strong>{termOptions.semesters.join(", ")}</strong>
          </div>
          <div>
            <span>Available Years</span>
            <strong>{termOptions.years.join(", ")}</strong>
          </div>
          <div>
            <span>Submission Window</span>
            <strong>{submissionWindow.status}</strong>
          </div>
        </div>

        <div className="scheduling-window-note">
          <strong>{submissionWindow.selectedTerm}</strong>
          <span>{submissionWindow.message}</span>
        </div>
      </section>

      <section className="panel-card scheduling-context-card">
        <div className="panel-header">
          <h3>Student Planning Context</h3>
          <p>Summary context that future scheduling logic will use.</p>
        </div>

        <div className="scheduling-context-grid">
          <div>
            <span>Student</span>
            <strong>{studentPlanningContext.studentName}</strong>
          </div>
          <div>
            <span>Major</span>
            <strong>{studentPlanningContext.major}</strong>
          </div>
          <div>
            <span>Track</span>
            <strong>{studentPlanningContext.track}</strong>
          </div>
          <div>
            <span>Completed Credits</span>
            <strong>{studentPlanningContext.completedCredits}</strong>
          </div>
          <div>
            <span>Completed CS Requirements</span>
            <strong>{studentPlanningContext.completedCsRequirementsCount}</strong>
          </div>
        </div>
      </section>

      <section className="scheduling-workspace">
        <div className="table-panel scheduling-offered-panel">
          <div className="panel-header">
            <h3>Main Scheduling Workspace</h3>
            <p>
              Browse mock offered courses and add sections to a local draft schedule.
            </p>
          </div>

          <label className="scheduling-search">
            <span>Search offered courses</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by code, title, track, or description"
            />
          </label>

          <div className="scheduling-course-list">
            {groupedCourses.map((group) => (
              <section className="scheduling-category-group" key={group.category}>
                <button
                  className="scheduling-category-toggle"
                  type="button"
                  onClick={() => toggleCategory(group.category)}
                  aria-expanded={expandedCategories[group.category]}
                >
                  <span>{expandedCategories[group.category] ? "-" : "+"}</span>
                  <strong>{group.category}</strong>
                  <em>{group.courses.length} courses</em>
                </button>

                {expandedCategories[group.category] && (
                  <div className="scheduling-category-courses">
                    {group.courses.map((course) => {
                      const isCourseExpanded = Boolean(expandedCourses[course.code]);
                      const isCourseSelected = selectedCourseCodes.has(course.code);

                      return (
                        <article className="scheduling-course-card" key={course.code}>
                          <div className="scheduling-course-header">
                            <div>
                              <span>{course.category}</span>
                              <h4>
                                {course.code} {course.title}
                              </h4>
                            </div>
                            <div className="scheduling-course-actions">
                              <strong>{course.credits} credits</strong>
                              <button
                                className="scheduling-toggle-btn"
                                type="button"
                                onClick={() => toggleCourse(course.code)}
                                aria-expanded={isCourseExpanded}
                                aria-label={isCourseExpanded ? "Collapse course" : "Expand course"}
                                title={isCourseExpanded ? "Collapse course" : "Expand course"}
                              >
                                <span aria-hidden="true">{isCourseExpanded ? "▾" : "▸"}</span>
                              </button>
                            </div>
                          </div>

                          <p>{course.description}</p>

                          <div className="scheduling-course-meta">
                            <span>{course.numberOfSections} sections</span>
                            <span>{course.sectionSummary}</span>
                            {isCourseSelected && <span>Course selected in draft</span>}
                          </div>

                          {isCourseExpanded && (
                            <div className="scheduling-section-list">
                              {course.sections.map((section) => {
                                const sectionKey = `${course.code}-${section.sectionNumber}`;
                                const isSelected = selectedSectionKeys.has(sectionKey);
                                const isUnavailable =
                                  section.seatStatus === "Full" || (isCourseSelected && !isSelected);

                                return (
                                  <div className="scheduling-section-row" key={sectionKey}>
                                    <div>
                                      <strong>Section {section.sectionNumber}</strong>
                                      <span>{section.instructor}</span>
                                    </div>
                                    <span>
                                      {section.days} {section.time}
                                    </span>
                                    <span>{section.location}</span>
                                    <span>
                                      {section.seatsRemaining} of {section.capacity} seats open
                                    </span>
                                    <span
                                      className={`scheduling-seat-status ${getSeatStatusClass(section.seatStatus)}`}
                                    >
                                      {section.seatStatus}
                                    </span>
                                    <button
                                      className="scheduling-add-btn"
                                      type="button"
                                      disabled={isUnavailable || isSelected}
                                      onClick={() => addSection(course, section)}
                                    >
                                      {isSelected ? "Selected ✓" : "Add Section"}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            ))}

            {groupedCourses.length === 0 && (
              <div className="scheduling-placeholder-card">
                <h4>No courses found</h4>
                <p>Try searching by a course code, title, track, or description.</p>
              </div>
            )}
          </div>
        </div>

        <aside className="panel-card scheduling-selected-panel">
          <div className="panel-header">
            <h3>Selected Schedule</h3>
            <p>{selectedSchedule.length} selected sections in this draft.</p>
          </div>

          {selectedSchedule.length === 0 ? (
            <div className="scheduling-placeholder-card">
              <h4>No sections selected yet</h4>
              <p>
                Start by expanding a course and selecting an open section. This schedule remains a
                draft until submitted.
              </p>
            </div>
          ) : (
            <div className="scheduling-selected-list">
              {selectedSchedule.map((item) => (
                <article className="scheduling-selected-card" key={`${item.courseCode}-${item.sectionNumber}`}>
                  <div>
                    <h4>
                      {item.courseCode} {item.title}
                    </h4>
                    <span>
                      Section {item.sectionNumber} - {item.days} {item.time}
                    </span>
                    <span>{item.credits} credits</span>
                    <span className={`scheduling-seat-status ${getSeatStatusClass(item.seatStatus)}`}>
                      {item.seatStatus}
                    </span>
                  </div>
                  <button
                    className="scheduling-remove-btn"
                    type="button"
                    onClick={() => removeSection(item.courseCode)}
                  >
                    Remove
                  </button>
                </article>
              ))}
            </div>
          )}

          <div className="scheduling-draft-note">
            Draft plans do not update Academic Progress, do not appear as In Progress, and do not
            reduce official seat availability.
          </div>
        </aside>
      </section>

      <section className="panel-card scheduling-summary-strip">
        <div>
          <span>Draft Courses</span>
          <strong>{selectedSchedule.length}</strong>
        </div>
        <div>
          <span>Draft Credits</span>
          <strong>{totalDraftCredits}</strong>
        </div>
        <div>
          <span>Selected Term</span>
          <strong>{termOptions.selectedTerm}</strong>
        </div>
        <div>
          <span>Draft Status</span>
          <strong>Not Submitted</strong>
        </div>
      </section>

      <section className="panel-card scheduling-inactive-placeholders">
        <div>
          <h3>Validation, Suggestions, and Final Submission</h3>
          <p>
            These tools are inactive for Phase 2. A draft plan becomes In Progress only after a
            future valid submission during an open submission window.
          </p>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default SchedulingAssistant;
