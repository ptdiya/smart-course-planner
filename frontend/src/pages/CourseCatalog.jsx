import { useEffect, useMemo, useState } from "react";
import {
  addAdminCourseOffering,
  addAdminSection,
  deleteAdminCourseOffering,
  deleteAdminSection,
  getAdminCourseCatalog,
  getAdminMasterCourses,
  getAdminTerms,
  updateAdminCourse,
  updateAdminSection,
} from "../api/adminApi";
import DashboardLayout from "../components/layout/DashboardLayout";

const emptySectionForm = {
  section_number: "",
  instructor: "",
  days: "",
  start_time: "",
  end_time: "",
  location: "",
  capacity: "",
};

function formatStatus(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatFieldLabel(value) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatMeeting(section) {
  if (!section.days && !section.start_time) return "Meeting time TBA";
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

function toSectionForm(section) {
  return {
    section_number: section.section_number || "",
    instructor: section.instructor || "",
    days: section.days || "",
    start_time: section.start_time || "",
    end_time: section.end_time || "",
    location: section.location || "",
    capacity: String(section.capacity ?? ""),
  };
}

function toCourseForm(course) {
  return {
    course_title: course.course_title || "",
    description: course.description || "",
    credits: String(course.credits ?? ""),
    prerequisite_rule: course.prerequisite_rule || "",
  };
}

function validateSectionForm(form, enrolledCount = 0) {
  if (!form.section_number.trim()) return "Section number is required.";
  if (!form.instructor.trim()) return "Instructor is required.";
  if (!form.days.trim()) return "Meeting days are required.";
  if (!form.start_time || !form.end_time) return "Start time and end time are required.";
  if (form.start_time >= form.end_time) return "Start time must be before end time.";
  if (!form.location.trim()) return "Location is required.";

  const capacity = Number(form.capacity);
  if (Number.isNaN(capacity)) return "Capacity must be a number.";
  if (capacity < enrolledCount) return `Capacity cannot be lower than enrolled count (${enrolledCount}).`;

  return "";
}

function isWarningMessage(message = "") {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("cannot") ||
    normalized.includes("required") ||
    normalized.includes("before") ||
    normalized.includes("already") ||
    normalized.includes("could not") ||
    normalized.includes("must")
  );
}

function CourseCatalog() {
  const [terms, setTerms] = useState([]);
  const [masterCourses, setMasterCourses] = useState([]);
  const [selectedTermId, setSelectedTermId] = useState("");
  const [courses, setCourses] = useState([]);
  const [expandedCourses, setExpandedCourses] = useState({});
  const [editModes, setEditModes] = useState({});
  const [courseInputs, setCourseInputs] = useState({});
  const [sectionInputs, setSectionInputs] = useState({});
  const [addSectionForms, setAddSectionForms] = useState({});
  const [offeringForm, setOfferingForm] = useState({ course_id: "", ...emptySectionForm });
  const [isOfferingOpen, setIsOfferingOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sectionMessages, setSectionMessages] = useState({});
  const [courseMessages, setCourseMessages] = useState({});
  const [offeringMessage, setOfferingMessage] = useState("");
  const [isLoadingTerms, setIsLoadingTerms] = useState(true);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [loadError, setLoadError] = useState("");

  async function loadTermsAndMasterCourses() {
    setIsLoadingTerms(true);
    setLoadError("");

    try {
      const [termsData, masterData] = await Promise.all([getAdminTerms(), getAdminMasterCourses()]);
      const loadedTerms = termsData.terms || [];
      const loadedMasterCourses = masterData.courses || [];
      const openTerm = getOpenTerm(loadedTerms);

      setTerms(loadedTerms);
      setMasterCourses(loadedMasterCourses);
      setSelectedTermId(openTerm ? String(openTerm.term_id) : "");
      setOfferingForm((current) => ({
        ...current,
        course_id: loadedMasterCourses[0] ? String(loadedMasterCourses[0].course_id) : "",
      }));
    } catch (error) {
      setLoadError("Could not load terms or master courses for the catalog.");
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
      setCourseInputs(
        loadedCourses.reduce((inputs, course) => {
          inputs[course.course_id] = toCourseForm(course);
          return inputs;
        }, {}),
      );
      setSectionInputs(
        loadedCourses.reduce((inputs, course) => {
          course.sections.forEach((section) => {
            inputs[section.section_id] = toSectionForm(section);
          });
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
    loadTermsAndMasterCourses();
  }, []);

  useEffect(() => {
    setExpandedCourses({});
    setEditModes({});
    setSearchTerm("");
    loadCatalog(selectedTermId);
  }, [selectedTermId]);

  const selectedTerm = useMemo(
    () => terms.find((term) => String(term.term_id) === String(selectedTermId)) || null,
    [terms, selectedTermId],
  );

  const offeredCourseIds = useMemo(
    () => new Set(courses.map((course) => String(course.course_id))),
    [courses],
  );

  const filteredCourses = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return courses;

    return courses.filter((course) => {
      const searchable = [
        course.course_code,
        course.course_title,
        course.description,
        course.prerequisite_rule,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [courses, searchTerm]);

  function toggleCourse(courseId) {
    setExpandedCourses((current) => ({ ...current, [courseId]: !current[courseId] }));
  }

  function handleSummaryEdit(event, course) {
    event.stopPropagation();
    setExpandedCourses((current) => ({ ...current, [course.course_id]: true }));
    enterEditMode(course);
  }

  function enterEditMode(course) {
    setCourseInputs((current) => ({ ...current, [course.course_id]: toCourseForm(course) }));
    setSectionInputs((current) => {
      const next = { ...current };
      course.sections.forEach((section) => {
        next[section.section_id] = toSectionForm(section);
      });
      return next;
    });
    setAddSectionForms((current) => ({ ...current, [course.course_id]: emptySectionForm }));
    setCourseMessages((current) => ({ ...current, [course.course_id]: "" }));
    setEditModes((current) => ({ ...current, [course.course_id]: true }));
  }

  function cancelEditMode(course) {
    setCourseInputs((current) => ({ ...current, [course.course_id]: toCourseForm(course) }));
    setSectionInputs((current) => {
      const next = { ...current };
      course.sections.forEach((section) => {
        next[section.section_id] = toSectionForm(section);
      });
      return next;
    });
    setAddSectionForms((current) => ({ ...current, [course.course_id]: emptySectionForm }));
    setCourseMessages((current) => ({ ...current, [course.course_id]: "" }));
    setEditModes((current) => ({ ...current, [course.course_id]: false }));
  }

  function updateCourseInput(courseId, field, value) {
    setCourseMessages((current) => ({ ...current, [courseId]: "" }));
    setCourseInputs((current) => ({
      ...current,
      [courseId]: { ...current[courseId], [field]: value },
    }));
  }

  function updateSectionInput(sectionId, field, value) {
    setSectionMessages((current) => ({ ...current, [sectionId]: "" }));
    setSectionInputs((current) => ({
      ...current,
      [sectionId]: { ...current[sectionId], [field]: value },
    }));
  }

  async function refreshCourse(courseId, keepEditing = false) {
    await loadCatalog(selectedTermId);
    setExpandedCourses((current) => ({ ...current, [courseId]: true }));
    setEditModes((current) => ({ ...current, [courseId]: keepEditing }));
  }

  async function handleCourseSave(course) {
    const form = courseInputs[course.course_id] || {};
    const credits = Number(form.credits);

    if (!form.course_title?.trim()) {
      setCourseMessages((current) => ({ ...current, [course.course_id]: "Course title is required." }));
      return;
    }

    if (Number.isNaN(credits) || credits <= 0) {
      setCourseMessages((current) => ({ ...current, [course.course_id]: "Credits must be greater than zero." }));
      return;
    }

    for (const section of course.sections) {
      const sectionWarning = validateSectionForm(sectionInputs[section.section_id] || emptySectionForm, section.enrolled_count);
      if (sectionWarning) {
        setCourseMessages((current) => ({
          ...current,
          [course.course_id]: `Section ${section.section_number}: ${sectionWarning}`,
        }));
        return;
      }
    }

    try {
      const courseResult = await updateAdminCourse(course.course_id, {
        course_title: form.course_title,
        description: form.description,
        credits,
        prerequisite_rule: form.prerequisite_rule,
      });

      if (!courseResult.success) {
        setCourseMessages((current) => ({ ...current, [course.course_id]: courseResult.message || "Could not update course." }));
        return;
      }

      for (const section of course.sections) {
        const sectionResult = await updateAdminSection(section.section_id, {
          ...sectionInputs[section.section_id],
          capacity: Number(sectionInputs[section.section_id].capacity),
        });

        if (!sectionResult.success) {
          setCourseMessages((current) => ({
            ...current,
            [course.course_id]: sectionResult.message || `Could not update section ${section.section_number}.`,
          }));
          return;
        }
      }

      setCourseMessages((current) => ({ ...current, [course.course_id]: "Course saved." }));
      await refreshCourse(course.course_id, false);
    } catch (error) {
      setCourseMessages((current) => ({ ...current, [course.course_id]: "Could not save course changes." }));
    }
  }

  async function handleAddSection(course) {
    const form = addSectionForms[course.course_id] || emptySectionForm;
    const warning = validateSectionForm(form);

    if (warning) {
      setCourseMessages((current) => ({ ...current, [course.course_id]: warning }));
      return;
    }

    try {
      const result = await addAdminSection(course.course_id, selectedTermId, {
        ...form,
        capacity: Number(form.capacity),
      });

      if (!result.success) {
        setCourseMessages((current) => ({ ...current, [course.course_id]: result.message || "Could not add section." }));
        return;
      }

      setCourseMessages((current) => ({ ...current, [course.course_id]: result.message || "Section added." }));
      setAddSectionForms((current) => ({ ...current, [course.course_id]: emptySectionForm }));
      await refreshCourse(course.course_id, true);
    } catch (error) {
      setCourseMessages((current) => ({ ...current, [course.course_id]: "Could not add section." }));
    }
  }

  async function handleRemoveSection(course, section) {
    const confirmed = window.confirm("Removing this section may affect student schedules. Are you sure?");
    if (!confirmed) return;

    try {
      const result = await deleteAdminSection(section.section_id);
      if (!result.success) {
        setSectionMessages((current) => ({ ...current, [section.section_id]: result.message || "Could not remove section." }));
        return;
      }

      setCourseMessages((current) => ({ ...current, [course.course_id]: result.message || "Section removed." }));
      await refreshCourse(course.course_id, true);
    } catch (error) {
      setSectionMessages((current) => ({ ...current, [section.section_id]: "Could not remove section." }));
    }
  }

  async function handleAddOffering(event) {
    event.preventDefault();
    setOfferingMessage("");

    if (offeredCourseIds.has(String(offeringForm.course_id))) {
      setOfferingMessage("This course is already offered in the selected term.");
      return;
    }

    const warning = validateSectionForm(offeringForm);
    if (warning) {
      setOfferingMessage(warning);
      return;
    }

    try {
      const result = await addAdminCourseOffering({
        ...offeringForm,
        course_id: Number(offeringForm.course_id),
        term_id: Number(selectedTermId),
        capacity: Number(offeringForm.capacity),
      });

      if (!result.success) {
        setOfferingMessage(result.message || "Could not add course offering.");
        return;
      }

      setOfferingMessage("");
      setIsOfferingOpen(false);
      setOfferingForm((current) => ({ course_id: current.course_id, ...emptySectionForm }));
      await loadCatalog(selectedTermId);
    } catch (error) {
      setOfferingMessage("Could not add course offering.");
    }
  }

  async function handleRemoveOffering(course) {
    const confirmed = window.confirm("Removing this course offering may affect student schedules. Are you sure?");
    if (!confirmed) return;

    try {
      const result = await deleteAdminCourseOffering(course.course_id, selectedTermId);
      if (!result.success) {
        setCourseMessages((current) => ({ ...current, [course.course_id]: result.message || "Could not remove course offering." }));
        return;
      }

      await loadCatalog(selectedTermId);
    } catch (error) {
      setCourseMessages((current) => ({ ...current, [course.course_id]: "Could not remove course offering." }));
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

      {isOfferingOpen && (
        <section className="panel-card admin-add-offering-panel">
            <div className="panel-header">
              <h3>Add Course Offering</h3>
              <p>Add an existing master course to the selected term with its first section.</p>
            </div>

            <form className="admin-offering-form" onSubmit={handleAddOffering}>
              <label>
                Course
                <select
                  value={offeringForm.course_id}
                  onChange={(event) => {
                    setOfferingMessage("");
                    setOfferingForm({ ...offeringForm, course_id: event.target.value });
                  }}
                >
                  {masterCourses.map((course) => (
                    <option value={course.course_id} key={course.course_id}>
                      {course.course_code} {course.course_title}
                    </option>
                  ))}
                </select>
              </label>

              {Object.keys(emptySectionForm).map((field) => (
                <label key={field}>
                  {formatFieldLabel(field)}
                  <input
                    type={field.includes("time") ? "time" : field === "capacity" ? "number" : "text"}
                    value={offeringForm[field]}
                    onChange={(event) => {
                      setOfferingMessage("");
                      setOfferingForm({ ...offeringForm, [field]: event.target.value });
                    }}
                  />
                </label>
              ))}

              {offeringMessage && (
                <div className={`admin-inline-message ${isWarningMessage(offeringMessage) ? "warning" : ""}`}>
                  {offeringMessage}
                </div>
              )}

              <div className="admin-action-row">
                <button className="action-btn" type="submit" disabled={!selectedTermId}>
                  Add Course Offering
                </button>
                <button
                  className="action-btn secondary-btn"
                  type="button"
                  onClick={() => {
                    setOfferingMessage("");
                    setIsOfferingOpen(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
        </section>
      )}

      <section className="table-panel">
        <div className="panel-header admin-catalog-list-header">
          <div className="admin-catalog-list-title-row">
            <div>
              <h3>Course Offerings</h3>
              <p>
                {isLoadingCourses
                  ? "Loading course offerings..."
                  : `${filteredCourses.length} of ${courses.length} courses shown for ${selectedTerm?.term_name || "the selected term"}.`}
              </p>
            </div>
            {!isOfferingOpen && (
              <button className="action-btn admin-add-offering-toggle" type="button" onClick={() => setIsOfferingOpen(true)}>
                <span className="admin-add-offering-plus">+</span>
                Add Course Offering
              </button>
            )}
          </div>
          <label>
            <span>Search</span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by code, title, description, or prerequisite"
            />
          </label>
          <div className="admin-catalog-search-divider" aria-hidden="true" />
        </div>

        {!isLoadingCourses && !filteredCourses.length && (
          <div className="placeholder-box">
            <h4>No offerings found</h4>
            <p>No course offerings match the current term and search.</p>
          </div>
        )}

        <div className="admin-course-list">
          {filteredCourses.map((course) => {
            const isExpanded = Boolean(expandedCourses[course.course_id]);
            const isEditing = Boolean(editModes[course.course_id]);
            const courseForm = courseInputs[course.course_id] || toCourseForm(course);

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
                  <span className="admin-course-summary-actions">
                    <button
                      className="action-btn secondary-btn admin-course-edit-btn"
                      type="button"
                      onClick={(event) => handleSummaryEdit(event, course)}
                    >
                      Edit Course
                    </button>
                  </span>
                </button>

                {isExpanded && (
                  <div className="admin-course-detail">
                    {!isEditing ? (
                      <>
                        <div className="admin-course-readonly">
                          <div>
                            <span>Course Title</span>
                            <strong>{course.course_title}</strong>
                          </div>
                          <div>
                            <span>Credits</span>
                            <strong>{course.credits}</strong>
                          </div>
                          <div className="wide-field">
                            <span>Description</span>
                            <p>{course.description || "No description provided."}</p>
                          </div>
                          <div className="wide-field">
                            <span>Prerequisite Rule</span>
                            <p>{course.prerequisite_rule || "No prerequisite rule."}</p>
                          </div>
                        </div>

                        <div className="admin-section-list">
                          {course.sections.map((section) => (
                            <div className="admin-section-readonly" key={section.section_id}>
                              <div>
                                <span>Section</span>
                                <strong>{section.section_number}</strong>
                              </div>
                              <div>
                                <span>Instructor</span>
                                <strong>{section.instructor || "Instructor TBA"}</strong>
                              </div>
                              <div>
                                <span>Meeting</span>
                                <strong>{formatMeeting(section)}</strong>
                              </div>
                              <div>
                                <span>Location</span>
                                <strong>{section.location || "Location TBA"}</strong>
                              </div>
                              <div>
                                <span>Capacity</span>
                                <strong>{section.capacity}</strong>
                              </div>
                              <div>
                                <span>Enrolled</span>
                                <strong>{section.enrolled_count}</strong>
                              </div>
                              <div>
                                <span>Seats Remaining</span>
                                <strong>{section.seats_remaining}</strong>
                              </div>
                              <span className={`admin-status-pill ${section.seat_status}`}>
                                {formatStatus(section.seat_status)}
                              </span>
                            </div>
                          ))}
                        </div>

                      </>
                    ) : (
                      <>
                        <div className="admin-course-editor">
                          <label>
                            Course Title
                            <input
                              value={courseForm.course_title || ""}
                              onChange={(event) => updateCourseInput(course.course_id, "course_title", event.target.value)}
                            />
                          </label>
                          <label>
                            Credits
                            <input
                              type="number"
                              min="1"
                              value={courseForm.credits || ""}
                              onChange={(event) => updateCourseInput(course.course_id, "credits", event.target.value)}
                            />
                          </label>
                          <label className="wide-field">
                            Description
                            <textarea
                              value={courseForm.description || ""}
                              onChange={(event) => updateCourseInput(course.course_id, "description", event.target.value)}
                            />
                          </label>
                          <label className="wide-field">
                            Prerequisite Rule
                            <textarea
                              value={courseForm.prerequisite_rule || ""}
                              onChange={(event) => updateCourseInput(course.course_id, "prerequisite_rule", event.target.value)}
                              placeholder="No prerequisite rule"
                            />
                          </label>
                        </div>

                        <div className="admin-section-list">
                          {course.sections.map((section) => {
                            const form = sectionInputs[section.section_id] || toSectionForm(section);

                            return (
                              <div className="admin-section-row editable" key={section.section_id}>
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

                                <div className="admin-section-edit-grid">
                                  {Object.keys(emptySectionForm).map((field) => (
                                    <label key={field}>
                                      {formatFieldLabel(field)}
                                      <input
                                        type={field.includes("time") ? "time" : field === "capacity" ? "number" : "text"}
                                        min={field === "capacity" ? section.enrolled_count : undefined}
                                        value={form[field]}
                                        onChange={(event) => updateSectionInput(section.section_id, field, event.target.value)}
                                      />
                                    </label>
                                  ))}
                                </div>

                                <button
                                  className="action-btn secondary-btn admin-danger-btn"
                                  type="button"
                                  onClick={() => handleRemoveSection(course, section)}
                                >
                                  Remove Section
                                </button>

                                {sectionMessages[section.section_id] && (
                                  <div className="admin-inline-message warning">
                                    {sectionMessages[section.section_id]}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="admin-add-section-card">
                          <h4>Add Section</h4>
                          <div className="admin-section-edit-grid">
                            {Object.keys(emptySectionForm).map((field) => {
                              const form = addSectionForms[course.course_id] || emptySectionForm;

                              return (
                                <label key={field}>
                                  {formatFieldLabel(field)}
                                  <input
                                    type={field.includes("time") ? "time" : field === "capacity" ? "number" : "text"}
                                    value={form[field]}
                                    onChange={(event) => {
                                      setCourseMessages((current) => ({ ...current, [course.course_id]: "" }));
                                      setAddSectionForms((current) => ({
                                        ...current,
                                        [course.course_id]: {
                                          ...(current[course.course_id] || emptySectionForm),
                                          [field]: event.target.value,
                                        },
                                      }));
                                    }}
                                  />
                                </label>
                              );
                            })}
                          </div>
                          <button className="action-btn secondary-btn" type="button" onClick={() => handleAddSection(course)}>
                            Add Section
                          </button>
                        </div>

                        <div className="admin-action-row">
                          <button className="action-btn" type="button" onClick={() => handleCourseSave(course)}>
                            Save Course
                          </button>
                          <button className="action-btn secondary-btn" type="button" onClick={() => cancelEditMode(course)}>
                            Cancel
                          </button>
                          <button
                            className="action-btn secondary-btn admin-danger-btn"
                            type="button"
                            onClick={() => handleRemoveOffering(course)}
                          >
                            Remove Offering
                          </button>
                        </div>

                        {courseMessages[course.course_id] && (
                          <div className={`admin-inline-message ${isWarningMessage(courseMessages[course.course_id]) ? "warning" : ""}`}>
                            {courseMessages[course.course_id]}
                          </div>
                        )}
                      </>
                    )}
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
