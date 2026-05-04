import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../api/client";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../context/useAuth";
import "../styles/academicProgress.css";

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

function toTitleCase(value) {
  if (!value) {
    return "";
  }

  return value
    .toString()
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeStatus(status) {
  const normalized = (status || "not_completed").toString().toLowerCase().replaceAll(" ", "_");

  if (normalized === "completed") {
    return "Completed";
  }

  if (normalized === "in_progress" || normalized === "inprogress") {
    return "In Progress";
  }

  return "Not Completed";
}

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

function splitCourseLabel(label = "") {
  const [code, ...titleParts] = label.split(" - ");

  return {
    code,
    title: titleParts.join(" - "),
  };
}

function normalizeRequirementItem(item) {
  return {
    code:
      item.code ||
      item.course_code ||
      item.requirement_name ||
      item.requirementName ||
      item.requirement_label ||
      "Requirement",
    title:
      item.title ||
      item.course_title ||
      item.description ||
      item.requirement_title ||
      item.notes ||
      "Requirement details pending",
    credits: item.credits,
    status: normalizeStatus(item.status),
    term: item.term || item.term_name || item.status_detail || item.submitted_term,
    prerequisiteNote: item.prerequisiteNote || item.prerequisite_note || item.prerequisite || item.notes,
  };
}

function normalizeRequirementGroups(groups = []) {
  return groups.map((group, index) => ({
    name: group.name || group.group_name || group.title || `Requirement Group ${index + 1}`,
    items: (group.items || group.requirements || group.options || []).map(normalizeRequirementItem),
  }));
}

function normalizeFlexibleRequirement(requirement) {
  return {
    requirementName:
      requirement.requirementName ||
      requirement.requirement_name ||
      requirement.name ||
      "Flexible Requirement",
    numberRequired: requirement.numberRequired ?? requirement.number_required ?? requirement.required ?? 0,
    numberCompleted: requirement.numberCompleted ?? requirement.number_completed ?? requirement.completed ?? 0,
    status: normalizeStatus(requirement.status),
    completedVia: requirement.completedVia || requirement.completed_via || [],
    inProgressVia:
      requirement.inProgressVia ||
      requirement.in_progress_via ||
      requirement.inProgressCourses ||
      requirement.in_progress_courses ||
      [],
    eligibleOptions: requirement.eligibleOptions || requirement.eligible_options || [],
    note: requirement.note || requirement.notes,
  };
}

function normalizeRecommendations(recommendations = {}, pathGuidance = {}) {
  const currentlyEligibleCourses =
    recommendations.currentlyEligibleCourses ||
    recommendations.currently_eligible_courses ||
    (recommendations.recommended_now || []).map((course) => ({
      code: course.course_code,
      title: course.course_title,
      detail: `${course.term_name || ""}${course.section_number ? ` · Section ${course.section_number}` : ""}`,
    }));

  const flexibleRequirementSuggestions =
    recommendations.flexibleRequirementSuggestions ||
    recommendations.flexible_requirement_suggestions ||
    [];

  const trackNextStepSuggestions =
    recommendations.trackNextStepSuggestions ||
    recommendations.track_next_step_suggestions ||
    (pathGuidance.next_step_suggestions || []).map((suggestion) => ({
      title: suggestion.course_code,
      detail: suggestion.available_now
        ? `Available now and helps unlock ${suggestion.helps_unlock_count} course(s).`
        : `Helps unlock ${suggestion.helps_unlock_count} future course(s).`,
    }));

  return {
    currentlyEligibleCourses,
    flexibleRequirementSuggestions,
    trackNextStepSuggestions,
  };
}

function normalizePathGuidance(pathGuidance) {
  if (Array.isArray(pathGuidance)) {
    return pathGuidance;
  }

  return (pathGuidance?.blocked || []).map((item) => ({
    lockedFutureCourse: `${item.course_code} - ${item.course_title}`,
    reasonUnavailable: item.explanation,
    missingPrerequisite: (item.missing_requirements || []).join(", "),
    nextStep: `Complete ${(item.missing_requirements || []).join(", ")} before planning ${item.course_code}.`,
  }));
}

function getClassStanding(completedCredits) {
  if (completedCredits >= 90) {
    return "Senior (Year 4)";
  }

  if (completedCredits >= 60) {
    return "Junior (Year 3)";
  }

  if (completedCredits >= 30) {
    return "Sophomore (Year 2)";
  }

  return "Freshman (Year 1)";
}

function StatusBadge({ status }) {
  const display = statusDisplay[status] || {
    icon: "○",
    label: status || "Not Completed",
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

function EmptyState({ message }) {
  return (
    <div className="academic-progress-empty-state">
      <p>{message}</p>
    </div>
  );
}

function RecommendationCard({ item, fallbackTitle }) {
  if (typeof item === "string") {
    const courseInfo = splitCourseLabel(item);

    return (
      <div className="academic-progress-recommendation-card">
        <strong>{courseInfo.code || fallbackTitle}</strong>
        {courseInfo.title && <span>{courseInfo.title}</span>}
      </div>
    );
  }

  return (
    <div className="academic-progress-recommendation-card">
      <strong>{item.code || item.title || fallbackTitle}</strong>
      <span>{item.detail || item.message || item.course_title || item.explanation}</span>
    </div>
  );
}

function AcademicProgress() {
  const { user } = useAuth();
  const studentId =
    typeof user === "object" && user !== null ? user.student_id : null;
  const [progressData, setProgressData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProgress() {
      setIsLoading(true);
      setLoadError("");

      try {
        if (!studentId) {
          throw new Error("No student profile is linked to this account.");
        }

        const response = await fetch(`${API_BASE_URL}/student/progress/${studentId}`);

        if (!response.ok) {
          throw new Error("Unable to load academic progress.");
        }

        const data = await response.json();

        if (isMounted) {
          setProgressData(data);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error.message || "Could not load academic progress.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProgress();

    return () => {
      isMounted = false;
    };
  }, [studentId]);

  const studentInfo = useMemo(() => {
    const student = progressData?.student || {};

    return {
      name: student.name || "Student",
      major: student.major || "Computer Science",
      track: student.track || "Track not selected",
      academicStanding: student.academic_standing || "Not available",
      classStanding: getClassStanding(student.completed_credits ?? 0),
      gpa: student.gpa ?? "N/A",
      completedCredits: student.completed_credits ?? 0,
      totalCredits: student.total_credits ?? 120,
      degreeProgressPercent: student.degree_progress_percent ?? 0,
    };
  }, [progressData]);

  const degreeRequirementGroups = useMemo(
    () => normalizeRequirementGroups(progressData?.requirement_groups || []),
    [progressData],
  );
  const flexibleRequirements = useMemo(
    () => (progressData?.flexible_requirements || []).map(normalizeFlexibleRequirement),
    [progressData],
  );
  const pathGuidance = useMemo(
    () => normalizePathGuidance(progressData?.path_guidance || {}),
    [progressData],
  );
  const recommendations = useMemo(
    () => normalizeRecommendations(progressData?.recommendations || {}, progressData?.path_guidance || {}),
    [progressData],
  );
  const requirementItems = degreeRequirementGroups.flatMap((group) => group.items);
  const requirementSummary = {
    completed: requirementItems.filter((item) => item.status === "Completed").length,
    inProgress: requirementItems.filter((item) => item.status === "In Progress").length,
    remaining: requirementItems.filter((item) => item.status === "Not Completed").length,
  };

  if (isLoading) {
    return (
      <DashboardLayout
        role="student"
        title="Academic Progress"
        subtitle="Track your degree progress and understand your next academic steps."
      >
        <section className="panel-card academic-progress-state-card">
          <h3>Loading academic progress...</h3>
          <p>Gathering your latest degree progress.</p>
        </section>
      </DashboardLayout>
    );
  }

  if (loadError) {
    return (
      <DashboardLayout
        role="student"
        title="Academic Progress"
        subtitle="Track your degree progress and understand your next academic steps."
      >
        <section className="panel-card academic-progress-state-card error">
          <h3>Academic progress unavailable</h3>
          <p>{loadError}</p>
        </section>
      </DashboardLayout>
    );
  }

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
            <span>Class Standing</span>
            <strong>{studentInfo.classStanding}</strong>
          </div>
          <div>
            <span>Academic Standing</span>
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
          <p>
            {degreeRequirementGroups.length > 0
              ? `${degreeRequirementGroups.length} requirement groups are included in your degree plan.`
              : "Degree requirements are not available yet."}
          </p>
        </div>

        <div className="academic-progress-status-key" aria-label="Requirement status key">
          <div className="academic-progress-status-key-row">
            <strong>Status Key:</strong>
            <StatusBadge status="Completed" />
            <StatusBadge status="In Progress" />
            <StatusBadge status="Not Completed" />
          </div>
          <p>
            Completed courses count toward progress and prerequisites. In-progress courses come only
            from submitted schedules and do not count as completed until the term is finalized.
          </p>
        </div>

        {degreeRequirementGroups.length === 0 ? (
          <EmptyState message="Degree requirements are not available yet." />
        ) : (
          <div className="academic-progress-group-list">
            {degreeRequirementGroups.map((group) => (
              <article className="academic-progress-group" key={group.name}>
                <h4>{group.name}</h4>
                {group.items.length === 0 ? (
                  <EmptyState message="No requirements are listed in this group yet." />
                ) : (
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
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="academic-progress-lower-layout">
        <div className="panel-card academic-progress-section">
          <div className="panel-header">
            <h3>Flexible Requirements</h3>
            <p>
              {flexibleRequirements.length > 0
                ? `${flexibleRequirements.length} flexible requirements are part of your plan.`
                : "Flexible requirements are not available yet."}
            </p>
          </div>

          {flexibleRequirements.length === 0 ? (
            <EmptyState message="Flexible requirements are not available yet." />
          ) : (
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

                    {(requirement.completedVia.length > 0 ||
                      requirement.inProgressVia.length > 0 ||
                      requirement.eligibleOptions.length > 0) && (
                      <div className="academic-progress-flex-details">
                        {requirement.completedVia.length > 0 && (
                          <span>Completed via: {requirement.completedVia.join(", ")}</span>
                        )}
                        {requirement.inProgressVia.length > 0 && (
                          <span>In progress via: {requirement.inProgressVia.join(", ")}</span>
                        )}
                        {requirement.eligibleOptions.length > 0 && (
                          <span>Eligible options: {requirement.eligibleOptions.join(", ")}</span>
                        )}
                      </div>
                    )}

                    {(requirement.note || requirement.status !== "Completed") && (
                      <div className="academic-progress-flex-notes">
                        {requirement.note && (
                          <span>
                            {requirement.note ===
                            "In-progress submitted courses are listed in the degree map but do not count as completed until finalized."
                              ? "In-progress courses count after the term is finalized."
                              : requirement.note}
                          </span>
                        )}
                        {requirement.status !== "Completed" && (
                          <span>Draft selections count only after you submit the schedule.</span>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel-card academic-progress-section">
          <div className="panel-header">
            <h3>Recommendations</h3>
            <p>Suggested next moves based on your completed coursework and current path.</p>
          </div>

          <div className="academic-progress-recommendations">
            <article className="academic-progress-recommendation-group">
              <h4>Currently Eligible Courses</h4>
              {recommendations.currentlyEligibleCourses.length === 0 ? (
                <EmptyState message="No currently eligible course recommendations are available." />
              ) : (
                <div className="academic-progress-recommendation-list">
                  {recommendations.currentlyEligibleCourses.map((course, index) => (
                    <RecommendationCard
                      item={course}
                      fallbackTitle="Course"
                      key={`${course.course_code || course.code || course}-${index}`}
                    />
                  ))}
                </div>
              )}
            </article>

            <article className="academic-progress-recommendation-group">
              <h4>Flexible Requirement Suggestions</h4>
              {recommendations.flexibleRequirementSuggestions.length === 0 ? (
                <EmptyState message="No flexible requirement suggestions are available yet." />
              ) : (
                <div className="academic-progress-recommendation-list">
                  {recommendations.flexibleRequirementSuggestions.map((suggestion, index) => (
                    <RecommendationCard
                      item={suggestion}
                      fallbackTitle="Suggestion"
                      key={`${suggestion.title || suggestion}-${index}`}
                    />
                  ))}
                </div>
              )}
            </article>

            <article className="academic-progress-recommendation-group">
              <h4>Track Next-Step Suggestions</h4>
              {recommendations.trackNextStepSuggestions.length === 0 ? (
                <EmptyState message="No track next-step suggestions are available yet." />
              ) : (
                <div className="academic-progress-recommendation-list">
                  {recommendations.trackNextStepSuggestions.map((suggestion, index) => (
                    <RecommendationCard
                      item={suggestion}
                      fallbackTitle="Next step"
                      key={`${suggestion.title || suggestion}-${index}`}
                    />
                  ))}
                </div>
              )}
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

          {pathGuidance.length === 0 ? (
            <EmptyState message="Path guidance will appear here when the backend identifies blocked future courses." />
          ) : (
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
                        <dd>{guidance.missingPrerequisite || "None listed"}</dd>
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
          )}
        </div>
      </section>
    </DashboardLayout>
  );
}

export default AcademicProgress;
