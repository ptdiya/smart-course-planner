import { useEffect, useMemo, useState } from "react";
import {
  getAdminCourseCatalog,
  getAdminTerms,
  updateAdminCoursePrerequisite,
  updateAdminSectionCapacity,
} from "../api/adminApi";
import DashboardLayout from "../components/layout/DashboardLayout";

function formatStatus(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatMeeting(section) {
  if (!section.days && !section.start_time) {
    return "Meeting time TBA";
  }

  return [section.days, [section.start_time, section.end_time].filter(Boolean).join("-")]
    .filter(Boolean)
    .join(" ");
}

function formatSectionSummary(summary = {}) {
  const parts = [];
  if (summary.open) parts.push(`${summary.open} open`);
  if (summary.low_seats) parts.push(`${summary.low_seats} low seats`);
  if (summary.full) parts.push(`${summary.full} full`);
  return parts.length ? parts.join(", ") : "No sections";
}

function getOpenTerm(terms) {
  return terms.find((term) => term.status === "open") || terms[terms.length - 1] || null;
}

function CourseCatalog() {
  const [terms, setTerms] = useState([]);
  const [selectedTermId, setSelectedTermId] = useState("");
  const [courses, setCourses] = useState([]);
  const [expandedCourses, setExpandedCourses] = useState({});
  const [capacityInputs, setCapacityInputs] = useState({});
  const [prerequisiteInputs, setPrerequisiteInputs] = useState({});
  const [sectionMessages, setSectionMessages] = useState({});
  const [courseMessages, setCourseMessages] = useState({});
  const [isLoadingTerms, setIsLoadingTerms] = useState(true);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [loadError, setLoadError] = useState("");

  async function loadTerms() {
    setIsLoadingTerms(true);
    setLoadError("");

    try {
      const data = await getAdminTerms();
      const loadedTerms = data.terms || [];
      const openTerm = getOpenTerm(loadedTerms);
      setTerms(loadedTerms);
      setSelectedTermId(openTerm ? String(openTerm.term_id) : "");
    } catch (error) {
      setLoadError("Could not load terms for the course catalog.");
    } finally {
      setIsLoadingTerms(false);
    }
  }

  async function loadCatalog(termId) {
    if (!termId) {
      setCourses([]);
      return;
    }

    setIsLoadingCourses(true);
    setLoadError("");

    try {
      const data = await getAdminCourseCatalog(termId);
      const loadedCourses = data.courses || [];

      setCourses(loadedCourses);
      setCapacityInputs(
        loadedCourses.reduce((inputs, course) => {
          course.sections.forEach((section) => {
            inputs[section.section_id] = String(section.capacity);
          });
          return inputs;
        }, {}),
      );
      setPrerequisiteInputs(
        loadedCourses.reduce((inputs, course) => {
          inputs[course.course_id] = course.prerequisite_rule || "";
          return inputs;
        }, {}),
      );
    } catch (error) {
      setLoadError("Could not load course offerings for the selected term.");
      setCourses([]);
    } finally {
      setIsLoadingCourses(false);
    }
  }

  useEffect(() => {
    loadTerms();
  }, []);

  useEffect(() => {
    loadCatalog(selectedTermId);
  }, [selectedTermId]);

  const selectedTerm = useMemo(
    () => terms.find((term) => String(term.term_id) === String(selectedTermId)) || null,
    [terms, selectedTermId],
  );

  function toggleCourse(courseId) {
    setExpandedCourses((current) => ({
      ...current,
      [courseId]: !current[courseId],
    }));
  }

  async function handleCapacitySave(course, section) {
    const nextCapacity = Number(capacityInputs[section.section_id]);

    setSectionMessages((current) => ({ ...current, [section.section_id]: "" }));

    if (Number.isNaN(nextCapacity)) {
      setSectionMessages((current) => ({
        ...current,
        [section.section_id]: "Capacity must be a number.",
      }));
      return;
    }

    if (nextCapacity < section.enrolled_count) {
      setSectionMessages((current) => ({
        ...current,
        [section.section_id]: `Capacity cannot be lower than enrolled count (${section.enrolled_count}).`,
      }));
      return;
    }

    try {
      const result = await updateAdminSectionCapacity(section.section_id, nextCapacity);
      if (!result.success) {
        setSectionMessages((current) => ({
          ...current,
          [section.section_id]: result.message || "Could not update capacity.",
        }));
        return;
      }

      setSectionMessages((current) => ({
        ...current,
        [section.section_id]: result.message || "Capacity updated.",
      }));
      await loadCatalog(selectedTermId);
      setExpandedCourses((current) => ({ ...current, [course.course_id]: true }));
    } catch (error) {
      setSectionMessages((current) => ({
        ...current,
        [section.section_id]: "Could not update capacity.",
      }));
    }
  }

  async function handlePrerequisiteSave(course) {
    setCourseMessages((current) => ({ ...current, [course.course_id]: "" }));

    try {
      const result = await updateAdminCoursePrerequisite(
        course.course_id,
        prerequisiteInputs[course.course_id] || "",
      );

      setCourseMessages((current) => ({
        ...current,
        [course.course_id]: result.message || "Prerequisite rule updated.",
      }));
      await loadCatalog(selectedTermId);
      setExpandedCourses((current) => ({ ...current, [course.course_id]: true }));
    } catch (error) {
      setCourseMessages((current) => ({
        ...current,
        [course.course_id]: "Could not update prerequisite rule.",
      }));
    }
  }

  return (
    <DashboardLayout
      role="admin"
      title="Course Catalog"
      subtitle="Manage term-based course offerings, section capacity, and prerequisite rules."
    >
      <section className="panel-card admin-catalog-controls">
        <div className="panel-header">
          <h3>Term Catalog</h3>
          <p>Choose a term to manage only the sections offered in that term.</p>
        </div>

        <label>
          Selected Term
          <select
            value={selectedTermId}
            onChange={(event) => setSelectedTermId(event.target.value)}
            disabled={isLoadingTerms}
          >
            {terms.map((term) => (
              <option value={term.term_id} key={term.term_id}>
                {term.term_name}
              </option>
            ))}
          </select>
        </label>

        {selectedTerm && (
          <div className="admin-catalog-term-note">
            <strong>{selectedTerm.term_name}</strong>
            <span>{formatStatus(selectedTerm.status)} · Submission window {formatStatus(selectedTerm.submission_window)}</span>
          </div>
        )}
      </section>

      {loadError && (
        <section className="dashboard-notice warning">
          <strong>Catalog unavailable</strong>
          <span>{loadError}</span>
        </section>
      )}

      <section className="table-panel">
        <div className="panel-header">
          <h3>Course Offerings</h3>
          <p>
            {isLoadingCourses
              ? "Loading course offerings..."
              : `${courses.length} courses offered for ${selectedTerm?.term_name || "the selected term"}.`}
          </p>
        </div>

        {!isLoadingCourses && !courses.length && (
          <div className="placeholder-box">
            <h4>No offerings available</h4>
            <p>No course sections are configured for this term yet.</p>
          </div>
        )}

        <div className="admin-course-list">
          {courses.map((course) => {
            const isExpanded = Boolean(expandedCourses[course.course_id]);

            return (
              <article className="admin-course-card" key={course.course_id}>
                <button
                  className="admin-course-summary"
                  type="button"
                  onClick={() => toggleCourse(course.course_id)}
                  aria-expanded={isExpanded}
                >
                  <span className="admin-course-caret">{isExpanded ? "▾" : "▸"}</span>
                  <span>
                    <strong>{course.course_code}</strong>
                    <span>{course.course_title}</span>
                  </span>
                  <span>{course.credits} credits</span>
                  <span>{course.section_count} sections</span>
                  <span>{formatSectionSummary(course.section_summary)}</span>
                </button>

                {isExpanded && (
                  <div className="admin-course-detail">
                    <div className="admin-prerequisite-editor">
                      <label>
                        Current Prerequisite Rule
                        <textarea
                          value={prerequisiteInputs[course.course_id] || ""}
                          onChange={(event) => {
                            setCourseMessages((current) => ({ ...current, [course.course_id]: "" }));
                            setPrerequisiteInputs((current) => ({
                              ...current,
                              [course.course_id]: event.target.value,
                            }));
                          }}
                          placeholder="No prerequisite rule"
                        />
                      </label>
                      <button
                        className="action-btn secondary-btn"
                        type="button"
                        onClick={() => handlePrerequisiteSave(course)}
                      >
                        Save Prerequisite
                      </button>
                      {courseMessages[course.course_id] && (
                        <div className="admin-inline-message">
                          {courseMessages[course.course_id]}
                        </div>
                      )}
                    </div>

                    <div className="admin-section-list">
                      {course.sections.map((section) => (
                        <div className="admin-section-row" key={section.section_id}>
                          <div>
                            <strong>Section {section.section_number}</strong>
                            <span>{section.instructor || "Instructor TBA"}</span>
                          </div>
                          <div>
                            <span>{formatMeeting(section)}</span>
                            <span>{section.location || "Location TBA"}</span>
                          </div>
                          <div>
                            <span>Enrolled: {section.enrolled_count}</span>
                            <span>Seats remaining: {section.seats_remaining}</span>
                          </div>
                          <span className={`admin-status-pill ${section.seat_status}`}>
                            {formatStatus(section.seat_status)}
                          </span>
                          <div className="admin-capacity-editor">
                            <label>
                              Capacity
                              <input
                                type="number"
                                min={section.enrolled_count}
                                value={capacityInputs[section.section_id] || ""}
                                onChange={(event) => {
                                  setSectionMessages((current) => ({ ...current, [section.section_id]: "" }));
                                  setCapacityInputs((current) => ({
                                    ...current,
                                    [section.section_id]: event.target.value,
                                  }));
                                }}
                              />
                            </label>
                            <button
                              className="action-btn secondary-btn"
                              type="button"
                              onClick={() => handleCapacitySave(course, section)}
                            >
                              Save
                            </button>
                          </div>
                          {sectionMessages[section.section_id] && (
                            <div className="admin-inline-message warning">
                              {sectionMessages[section.section_id]}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </DashboardLayout>
  );
}

export default CourseCatalog;
