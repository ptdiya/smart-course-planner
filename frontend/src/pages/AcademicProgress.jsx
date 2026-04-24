import DashboardLayout from "../components/layout/DashboardLayout";
import "../styles/academicProgress.css";

const academicProgressMockData = {
  studentInfo: {
    name: "Maya Patel",
    major: "Computer Science",
    track: "Artificial Intelligence",
    academicStanding: "Good Standing",
    gpa: "3.62",
    completedCredits: 84,
    totalCredits: 120,
    degreeProgressPercent: 70,
  },
  degreeRequirementGroups: [
    {
      name: "Core CS Courses",
      items: [
        {
          code: "CS 180",
          title: "Problem Solving and Object-Oriented Programming",
          credits: 4,
          status: "Completed",
          term: "Fall 2023",
        },
        {
          code: "CS 251",
          title: "Data Structures and Algorithms",
          credits: 3,
          status: "Completed",
          term: "Spring 2024",
          prerequisiteNote: "Satisfied by completed CS 180.",
        },
        {
          code: "CS 307",
          title: "Software Engineering I",
          credits: 3,
          status: "In Progress",
          term: "Spring 2026 submitted schedule",
          prerequisiteNote: "Eligible because CS 251 is completed.",
        },
        {
          code: "CS 348",
          title: "Information Systems",
          credits: 3,
          status: "Not Completed",
          prerequisiteNote: "Available after completed CS 251.",
        },
      ],
    },
    {
      name: "Track Courses",
      items: [
        {
          code: "CS 373",
          title: "Data Mining and Machine Learning",
          credits: 3,
          status: "Completed",
          term: "Fall 2025",
          prerequisiteNote: "Counts as completed AI track foundation.",
        },
        {
          code: "CS 471",
          title: "Introduction to Artificial Intelligence",
          credits: 3,
          status: "In Progress",
          term: "Spring 2026 submitted schedule",
          prerequisiteNote: "Eligible because CS 251 is completed.",
        },
        {
          code: "CS 473",
          title: "Machine Learning",
          credits: 3,
          status: "Not Completed",
          prerequisiteNote: "Locked until CS 373 is completed; in-progress CS 471 does not satisfy prerequisites yet.",
        },
      ],
    },
    {
      name: "Supporting Electives",
      items: [
        {
          code: "STAT 350",
          title: "Introduction to Statistics",
          credits: 3,
          status: "Completed",
          term: "Spring 2025",
        },
        {
          code: "MA 351",
          title: "Elementary Linear Algebra",
          credits: 3,
          status: "Completed",
          term: "Fall 2025",
        },
        {
          code: "Supporting Elective",
          title: "One additional approved quantitative elective",
          credits: 3,
          status: "Not Completed",
          prerequisiteNote: "Draft schedule options are not counted until submitted.",
        },
      ],
    },
    {
      name: "General Education",
      items: [
        {
          code: "ENGL 106",
          title: "First-Year Composition",
          credits: 4,
          status: "Completed",
          term: "Fall 2023",
        },
        {
          code: "COM 217",
          title: "Science Writing and Presentation",
          credits: 3,
          status: "In Progress",
          term: "Spring 2026 submitted schedule",
        },
        {
          code: "Humanities Selective",
          title: "Approved humanities course",
          credits: 3,
          status: "Not Completed",
        },
      ],
    },
    {
      name: "Other Degree Requirements",
      items: [
        {
          code: "GPA Requirement",
          title: "Minimum 2.0 cumulative GPA",
          status: "Completed",
          term: "Current finalized record",
        },
        {
          code: "Residency Requirement",
          title: "Minimum required credits completed at institution",
          status: "Completed",
          term: "Current finalized record",
        },
        {
          code: "Upper-Level Credits",
          title: "Complete remaining upper-level CS credits",
          credits: 6,
          status: "Not Completed",
        },
      ],
    },
  ],
  flexibleRequirements: [
    {
      requirementName: "AI Track Advanced Electives",
      numberRequired: 2,
      numberCompleted: 1,
      status: "Not Completed",
      completedVia: ["CS 373"],
      eligibleOptions: ["CS 471", "CS 475"],
    },
    {
      requirementName: "Lab Science Sequence",
      numberRequired: 2,
      numberCompleted: 2,
      status: "Completed",
      completedVia: ["BIOL 110", "BIOL 111"],
      eligibleOptions: [],
    },
    {
      requirementName: "General Education Humanities",
      numberRequired: 1,
      numberCompleted: 0,
      status: "Not Completed",
      completedVia: [],
      eligibleOptions: ["PHIL 110", "HIST 104", "ENGL 238"],
    },
  ],
  recommendations: {
    currentlyEligibleCourses: [
      "CS 348 - Information Systems",
      "CS 390 - Web Application Development",
      "PHIL 110 - Introduction to Philosophy",
    ],
    flexibleRequirementSuggestions: [
      "Use PHIL 110 or HIST 104 for the open Humanities Selective.",
      "Consider CS 475 after CS 471 is completed for the second AI advanced elective.",
    ],
    trackNextStepSuggestions: [
      "Finish CS 471 from the submitted Spring 2026 schedule.",
      "Plan CS 473 after CS 373 appears in finalized completed coursework.",
      "Keep one supporting elective available as a fallback if a track course is full.",
    ],
  },
  pathGuidance: [
    {
      lockedFutureCourse: "CS 473 - Machine Learning",
      reasonUnavailable: "Requires a completed prerequisite, not an in-progress or draft course.",
      missingPrerequisite: "CS 373 finalized as Completed",
      nextStep: "Wait for Fall 2025 finalized completion before adding CS 473 to an official schedule.",
    },
    {
      lockedFutureCourse: "CS 490 - AI Capstone",
      reasonUnavailable: "Requires advanced AI track preparation.",
      missingPrerequisite: "CS 471 completed and one advanced AI elective completed",
      nextStep: "Complete CS 471 from the submitted schedule, then choose an eligible advanced elective.",
    },
  ],
};

const statusDisplay = {
  Completed: {
    icon: "✓",
    label: "Completed",
    className: "completed",
  },
  "In Progress": {
    icon: "⏳",
    label: "In Progress",
    className: "in-progress",
  },
  "Not Completed": {
    icon: "○",
    label: "Not Completed",
    className: "not-completed",
  },
};

function formatTermLabel(term) {
  const termLabels = {
    "Spring 2026 submitted schedule": "Spring 2026",
    "Current finalized record": "Finalized",
  };

  return termLabels[term] || term || "";
}

function formatRequirementMetadata(item) {
  const metadata = [];
  const term = formatTermLabel(item.term);

  if (term) {
    metadata.push(term);
  }

  if (item.credits) {
    metadata.push(`${item.credits} credits`);
  }

  return metadata.join(" · ");
}

function splitCourseLabel(label) {
  const [code, ...titleParts] = label.split(" - ");

  return {
    code,
    title: titleParts.join(" - "),
  };
}

function StatusBadge({ status }) {
  const display = statusDisplay[status] || {
    icon: "○",
    label: status,
    className: "not-completed",
  };

  return (
    <span className={`academic-progress-status-badge ${display.className}`}>
      <span aria-hidden="true">{display.icon}</span>
      <span>{display.label}</span>
    </span>
  );
}

function StatusIcon({ status }) {
  const display = statusDisplay[status] || statusDisplay["Not Completed"];

  return (
    <span
      className={`academic-progress-status-icon ${display.className}`}
      aria-label={display.label}
    >
      {display.icon}
    </span>
  );
}

function AcademicProgress() {
  const {
    studentInfo,
    degreeRequirementGroups,
    flexibleRequirements,
    recommendations,
    pathGuidance,
  } = academicProgressMockData;
  const requirementItems = degreeRequirementGroups.flatMap((group) => group.items);
  const requirementSummary = {
    completed: requirementItems.filter((item) => item.status === "Completed").length,
    inProgress: requirementItems.filter((item) => item.status === "In Progress").length,
    remaining: requirementItems.filter((item) => item.status === "Not Completed").length,
  };

  return (
    <DashboardLayout
      role="student"
      title="Academic Progress"
      subtitle="Track your degree progress and understand your next academic steps."
    >
      <section className="panel-card academic-progress-page-header">
        <div className="academic-progress-overview-heading">
          <div>
            <span className="academic-progress-eyebrow">Student Overview</span>
            <h3>{studentInfo.name}</h3>
            <p>
              {studentInfo.major} major on the {studentInfo.track} track.
            </p>
          </div>

          <div className="academic-progress-standing">
            <span>Academic Standing</span>
            <strong>{studentInfo.academicStanding}</strong>
          </div>
        </div>

        <div className="academic-progress-summary">
          <div>
            <span>Major</span>
            <strong>{studentInfo.major}</strong>
          </div>
          <div>
            <span>Track</span>
            <strong>{studentInfo.track}</strong>
          </div>
          <div>
            <span>Standing</span>
            <strong>{studentInfo.academicStanding}</strong>
          </div>
          <div>
            <span>GPA</span>
            <strong>{studentInfo.gpa}</strong>
          </div>
          <div>
            <span>Credits</span>
            <strong>
              {studentInfo.completedCredits} / {studentInfo.totalCredits}
            </strong>
          </div>
          <div>
            <span>Degree Progress</span>
            <strong>{studentInfo.degreeProgressPercent}%</strong>
          </div>
        </div>

        <div className="academic-progress-completion">
          <div className="academic-progress-completion-copy">
            <strong>Degree Completion: {studentInfo.degreeProgressPercent}%</strong>
            <span>
              {studentInfo.completedCredits} / {studentInfo.totalCredits} credits completed
            </span>
          </div>
          <div
            className="academic-progress-bar"
            aria-label={`Degree Completion: ${studentInfo.degreeProgressPercent}%`}
          >
            <div
              className="academic-progress-bar-fill"
              style={{ width: `${studentInfo.degreeProgressPercent}%` }}
            />
          </div>
        </div>

        <div className="academic-progress-requirement-summary">
          <div>
            <span>Completed Requirements</span>
            <strong>{requirementSummary.completed}</strong>
          </div>
          <div>
            <span>In Progress Requirements</span>
            <strong>{requirementSummary.inProgress}</strong>
          </div>
          <div>
            <span>Remaining Requirements</span>
            <strong>{requirementSummary.remaining}</strong>
          </div>
          <div>
            <span>Completed Credits</span>
            <strong>{studentInfo.completedCredits}</strong>
          </div>
        </div>
      </section>

      <section className="table-panel academic-progress-section">
        <div className="panel-header">
          <h3>Degree Requirement Groups</h3>
          <p>{degreeRequirementGroups.length} requirement groups are available in mock data.</p>
        </div>

        <div className="academic-progress-status-key" aria-label="Requirement status key">
          <div className="academic-progress-status-key-row">
            <strong>Status Key:</strong>
            <StatusBadge status="Completed" />
            <StatusBadge status="In Progress" />
            <StatusBadge status="Not Completed" />
          </div>
          <p>
            Completed courses count toward progress and prerequisites. In-progress courses do not
            count as completed until the term is finalized.
          </p>
        </div>

        <div className="academic-progress-group-list">
          {degreeRequirementGroups.map((group) => (
            <article className="academic-progress-group" key={group.name}>
              <h4>{group.name}</h4>
              <ul className="academic-progress-requirement-list">
                {group.items.map((item) => (
                  <li className="academic-progress-requirement-row" key={`${group.name}-${item.code}`}>
                    <StatusIcon status={item.status} />
                    <div className="academic-progress-requirement-main">
                      <div className="academic-progress-requirement-title">
                        <span className="academic-progress-requirement-code">{item.code}</span>
                        <strong>{item.title}</strong>
                      </div>
                      {item.prerequisiteNote && <p>{item.prerequisiteNote}</p>}
                    </div>
                    <span className="academic-progress-requirement-meta">
                      {formatRequirementMetadata(item)}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="academic-progress-lower-layout">
        <div className="panel-card academic-progress-section">
          <div className="panel-header">
            <h3>Flexible Requirements</h3>
            <p>{flexibleRequirements.length} flexible requirement records are available.</p>
          </div>

          <ul className="academic-progress-simple-list">
            {flexibleRequirements.map((requirement) => (
              <li className="academic-progress-flex-row" key={requirement.requirementName}>
                <StatusIcon status={requirement.status} />
                <div className="academic-progress-flex-content">
                  <div className="academic-progress-flex-heading">
                    <div className="academic-progress-flex-title">
                      <strong>{requirement.requirementName}</strong>
                      <span className="academic-progress-flex-completion">
                        Completion: {requirement.numberCompleted} of {requirement.numberRequired} complete
                      </span>
                    </div>
                  </div>

                  {requirement.completedVia.length > 0 && (
                    <span>Completed via: {requirement.completedVia.join(", ")}</span>
                  )}
                  {requirement.eligibleOptions.length > 0 && (
                    <span>Eligible options: {requirement.eligibleOptions.join(", ")}</span>
                  )}
                  {requirement.status !== "Completed" && (
                    <span>
                      Draft selections are not counted here until they become an official submitted schedule.
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel-card academic-progress-section">
          <div className="panel-header">
            <h3>Recommendations</h3>
            <p>Suggested next moves based on completed coursework and mock eligibility data.</p>
          </div>

          <div className="academic-progress-recommendations">
            <article className="academic-progress-recommendation-group">
              <h4>Currently Eligible Courses</h4>
              <div className="academic-progress-recommendation-list">
                {recommendations.currentlyEligibleCourses.map((course) => {
                  const courseInfo = splitCourseLabel(course);

                  return (
                    <div className="academic-progress-recommendation-card" key={course}>
                      <strong>{courseInfo.code}</strong>
                      <span>{courseInfo.title}</span>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="academic-progress-recommendation-group">
              <h4>Flexible Requirement Suggestions</h4>
              <div className="academic-progress-recommendation-list">
                {recommendations.flexibleRequirementSuggestions.map((suggestion) => (
                  <div className="academic-progress-recommendation-card" key={suggestion}>
                    <strong>Suggestion</strong>
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="academic-progress-recommendation-group">
              <h4>Track Next-Step Suggestions</h4>
              <div className="academic-progress-recommendation-list">
                {recommendations.trackNextStepSuggestions.map((suggestion) => (
                  <div className="academic-progress-recommendation-card" key={suggestion}>
                    <strong>Next step</strong>
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>

        <div className="table-panel academic-progress-section">
          <div className="panel-header">
            <h3>Path Guidance</h3>
            <p>
              Courses that are not ready to schedule yet, with the prerequisite step needed next.
            </p>
          </div>

          <div className="academic-progress-path-grid">
            {pathGuidance.map((guidance) => {
              const courseInfo = splitCourseLabel(guidance.lockedFutureCourse);

              return (
                <article className="academic-progress-path-card" key={guidance.lockedFutureCourse}>
                  <div className="academic-progress-path-card-header">
                    <div>
                      <h4>
                        <span>{courseInfo.code}</span>
                        <span aria-hidden="true"> </span>
                        {courseInfo.title}
                      </h4>
                    </div>
                    <span className="academic-progress-availability">Currently unavailable</span>
                  </div>

                  <dl className="academic-progress-path-details">
                    <div>
                      <dt>Reason unavailable</dt>
                      <dd>{guidance.reasonUnavailable}</dd>
                    </div>
                    <div>
                      <dt>Missing prerequisite</dt>
                      <dd>{guidance.missingPrerequisite}</dd>
                    </div>
                    <div>
                      <dt>Next step</dt>
                      <dd>{guidance.nextStep}</dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default AcademicProgress;
