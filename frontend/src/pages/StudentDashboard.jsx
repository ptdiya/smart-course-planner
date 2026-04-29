import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";

const API_BASE_URL = "http://127.0.0.1:8000";
const STUDENT_ID = 1;

function normalizeStatus(status) {
  return String(status || "").toLowerCase().replace(/\s+/g, "_");
}

function formatCourseName(item) {
  return [item?.course_code, item?.course_title || item?.title].filter(Boolean).join(" ");
}

function computeClassStanding(completedCredits = 0) {
  if (completedCredits >= 90) return "Senior (Year 4)";
  if (completedCredits >= 60) return "Junior (Year 3)";
  if (completedCredits >= 30) return "Sophomore (Year 2)";
  return "Freshman (Year 1)";
}

async function fetchJson(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

async function postJson(path, body) {
  return fetchJson(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

function getRequirementCounts(requirementGroups = []) {
  const items = requirementGroups.flatMap((group) => group.requirements || group.items || []);

  return items.reduce(
    (counts, item) => {
      const status = normalizeStatus(item.status);

      if (status === "completed") {
        counts.completed += 1;
      } else if (status === "in_progress") {
        counts.inProgress += 1;
      } else {
        counts.remaining += 1;
      }

      return counts;
    },
    { completed: 0, inProgress: 0, remaining: 0 }
  );
}

function getOpenTerm(terms = []) {
  return (
    terms.find((term) => normalizeStatus(term.status) === "open") ||
    terms.find((term) => normalizeStatus(term.submission_window) === "open") ||
    terms[0] ||
    null
  );
}

function StudentDashboard() {
  const [progressData, setProgressData] = useState(null);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [submittedPlan, setSubmittedPlan] = useState(null);
  const [recommendationsData, setRecommendationsData] = useState(null);
  const [roadmapData, setRoadmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      setLoading(true);
      setError("");

      const warnings = [];
      const [progressResult, termsResult] = await Promise.allSettled([
        fetchJson(`/student/progress/${STUDENT_ID}`),
        fetchJson("/student/terms")
      ]);

      const progress = progressResult.status === "fulfilled" ? progressResult.value : null;
      const loadedTerms = termsResult.status === "fulfilled" ? termsResult.value : [];
      const selectedOpenTerm = getOpenTerm(loadedTerms);

      if (!progress) {
        warnings.push("Could not load student progress.");
      }

      if (!loadedTerms.length) {
        warnings.push("Could not load available planning terms.");
      }

      let submitted = null;
      let recommendations = progress?.recommendations || null;
      let roadmap = progress?.path_guidance || null;

      if (progress?.student && selectedOpenTerm?.term_name) {
        const [submittedResult, recommendationsResult, roadmapResult] = await Promise.allSettled([
          fetchJson(
            `/student/submitted-plan?student_id=${STUDENT_ID}&term_name=${encodeURIComponent(
              selectedOpenTerm.term_name
            )}`
          ),
          postJson("/recommendations/", {
            student_id: STUDENT_ID,
            term_name: selectedOpenTerm.term_name,
            mode: "planning"
          }),
          postJson("/roadmap/", {
            student_id: STUDENT_ID,
            track_name: progress.student.track,
            mode: "planning"
          })
        ]);

        if (submittedResult.status === "fulfilled") {
          submitted = submittedResult.value;
        } else {
          warnings.push("Could not load submitted schedule for the current term.");
        }

        if (recommendationsResult.status === "fulfilled") {
          recommendations = recommendationsResult.value;
        }

        if (roadmapResult.status === "fulfilled") {
          roadmap = roadmapResult.value;
        }
      }

      if (!isMounted) return;

      setProgressData(progress);
      setCurrentTerm(selectedOpenTerm);
      setSubmittedPlan(submitted);
      setRecommendationsData(recommendations);
      setRoadmapData(roadmap);
      setError(warnings.join(" "));
      setLoading(false);
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const student = progressData?.student;
  const requirementCounts = useMemo(
    () => getRequirementCounts(progressData?.requirement_groups || []),
    [progressData]
  );
  const recommendedCourses = recommendationsData?.recommended_now || [];
  const blockedCourses = roadmapData?.blocked || [];
  const nextSteps = roadmapData?.next_step_suggestions || [];
  const submittedSections = submittedPlan?.sections || [];
  const submittedCredits = submittedPlan?.total_credits || 0;
  const hasSubmittedPlan = submittedPlan?.status === "submitted";
  const progressPercent = student?.degree_progress_percent || 0;
  const completedCredits = student?.completed_credits || 0;
  const totalCredits = student?.total_credits || 120;

  return (
    <DashboardLayout
      role="student"
      title="Student Dashboard"
      subtitle="Review your academic progress, current planning window, and next course decisions."
    >
      {loading && (
        <section className="panel-card dashboard-state-card">
          <h3>Loading dashboard</h3>
          <p>Getting your progress, term status, and planning recommendations.</p>
        </section>
      )}

      {!loading && error && (
        <section className="dashboard-notice warning">
          <strong>Dashboard data notice</strong>
          <span>{error}</span>
        </section>
      )}

      {!loading && !student && (
        <section className="panel-card dashboard-state-card">
          <h3>Student data unavailable</h3>
          <p>We could not load your dashboard details right now. Please make sure the backend is running.</p>
        </section>
      )}

      {!loading && student && (
        <>
          <section className="panel-card dashboard-hero-card">
            <div>
              <p className="dashboard-eyebrow">Student Snapshot</p>
              <h2>{student.name}</h2>
              <p>
                {student.major} · {student.track || "Track not selected"}
              </p>
            </div>
            <div className="dashboard-hero-meta">
              <span>{student.academic_standing}</span>
              <strong>{computeClassStanding(completedCredits)}</strong>
            </div>
          </section>

          <section className="stats-grid">
            <div className="stat-card">
              <h3>Degree Progress</h3>
              <p className="stat-value">{progressPercent}%</p>
              <span className="stat-note">
                {completedCredits} / {totalCredits} credits completed
              </span>
            </div>

            <div className="stat-card">
              <h3>GPA</h3>
              <p className="stat-value">{student.gpa?.toFixed ? student.gpa.toFixed(2) : student.gpa}</p>
              <span className="stat-note">{student.academic_standing}</span>
            </div>

            <div className="stat-card">
              <h3>Recommended Courses</h3>
              <p className="stat-value">{recommendedCourses.length}</p>
              <span className="stat-note">Eligible next options for {currentTerm?.term_name || "the next term"}</span>
            </div>

            <div className="stat-card">
              <h3>Needs Attention</h3>
              <p className="stat-value">{blockedCourses.length}</p>
              <span className="stat-note">Track courses with missing prerequisites</span>
            </div>
          </section>

          <section className="content-grid dashboard-summary-grid">
            <div className="panel-card">
              <div className="panel-header">
                <h3>Academic Progress Summary</h3>
                <p>Your degree completion and requirement status.</p>
              </div>

              <div className="dashboard-progress-block">
                <div className="dashboard-progress-label">
                  <span>Degree completion</span>
                  <strong>{progressPercent}%</strong>
                </div>
                <div className="dashboard-progress-track">
                  <span style={{ width: `${Math.min(progressPercent, 100)}%` }} />
                </div>
              </div>

              <ul className="info-list">
                <li>
                  <span>Completed requirements</span>
                  <strong>{requirementCounts.completed}</strong>
                </li>
                <li>
                  <span>In progress requirements</span>
                  <strong>{requirementCounts.inProgress}</strong>
                </li>
                <li>
                  <span>Remaining requirements</span>
                  <strong>{requirementCounts.remaining}</strong>
                </li>
              </ul>
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <h3>Current Term Planning</h3>
                <p>Planning status for the open student scheduling term.</p>
              </div>

              <ul className="info-list">
                <li>
                  <span>Current term</span>
                  <strong>{currentTerm?.term_name || "No open term"}</strong>
                </li>
                <li>
                  <span>Planning mode</span>
                  <strong>{currentTerm?.planning_mode?.replaceAll("_", " ") || "Unavailable"}</strong>
                </li>
                <li>
                  <span>Submission window</span>
                  <strong>{currentTerm?.submission_window?.replaceAll("_", " ") || "Unavailable"}</strong>
                </li>
                <li>
                  <span>Submitted schedule</span>
                  <strong>
                    {hasSubmittedPlan
                      ? `${submittedSections.length} sections · ${submittedCredits} credits`
                      : "No submitted schedule"}
                  </strong>
                </li>
              </ul>
            </div>
          </section>

          <section className="content-grid dashboard-planning-grid">
            <div className="panel-card">
              <div className="panel-header">
                <h3>Recommended Next Courses</h3>
                <p>Courses that currently fit your progress and planning term.</p>
              </div>

              {recommendedCourses.length ? (
                <div className="dashboard-course-list">
                  {recommendedCourses.slice(0, 6).map((course) => (
                    <article className="dashboard-course-card" key={`${course.course_code}-${course.section_number}`}>
                      <div>
                        <h4>{formatCourseName(course)}</h4>
                        <p>{course.reasons?.[0] || course.prerequisite_explanation || "Eligible based on your record."}</p>
                      </div>
                      <span className="status-badge recommended">
                        {course.available_seats != null ? `${course.available_seats} seats` : "Recommended"}
                      </span>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="dashboard-empty-text">No recommended courses are available for the current term.</p>
              )}
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <h3>Blocked / Needs Prerequisite Attention</h3>
                <p>Courses to revisit after prerequisite work is complete.</p>
              </div>

              {blockedCourses.length ? (
                <div className="dashboard-course-list">
                  {blockedCourses.slice(0, 5).map((course) => (
                    <article className="dashboard-course-card attention" key={course.course_code}>
                      <div>
                        <h4>{formatCourseName(course)}</h4>
                        <p>{course.explanation || "A prerequisite is still needed before this course unlocks."}</p>
                      </div>
                      <span className="status-badge blocked">Blocked</span>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="dashboard-empty-text">No track courses currently need prerequisite attention.</p>
              )}
            </div>
          </section>

          <section className="content-grid dashboard-bottom-grid">
            <div className="panel-card">
              <div className="panel-header">
                <h3>Recent Planning Status</h3>
                <p>Submitted schedule and next-step guidance for your current path.</p>
              </div>

              <ul className="dashboard-status-list">
                {hasSubmittedPlan ? (
                  submittedSections.map((section) => (
                    <li key={`${section.course_code}-${section.section_number}`}>
                      <span>{formatCourseName(section)}</span>
                      <strong>
                        Section {section.section_number} · {section.credits} credits
                      </strong>
                    </li>
                  ))
                ) : (
                  <li>
                    <span>No final schedule has been submitted for {currentTerm?.term_name || "the current term"}.</span>
                    <strong>Draft first, then validate</strong>
                  </li>
                )}

                {nextSteps.slice(0, 2).map((step, index) => (
                  <li key={`${step.course_code || "step"}-${index}`}>
                    <span>{step.course_code ? formatCourseName(step) : "Next step"}</span>
                    <strong>{step.suggestion || step.explanation || "Review your roadmap guidance"}</strong>
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <h3>Quick Actions</h3>
                <p>Jump to the next student planning workflow.</p>
              </div>

              <div className="action-list">
                <Link className="action-btn" to="/student/schedule">
                  Open Scheduling Assistant
                </Link>
                <Link className="action-btn secondary-btn" to="/student/progress">
                  View Academic Progress
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}

export default StudentDashboard;
