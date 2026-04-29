import { useEffect, useMemo, useState } from "react";
import {
  createAdminTerm,
  deleteAdminTerm,
  finalizeAdminTerm,
  getAdminTerms,
  undoFinalizeAdminTerm,
  updateAdminTerm,
  updateAdminSubmissionWindow,
} from "../api/adminApi";
import DashboardLayout from "../components/layout/DashboardLayout";

const initialTermForm = {
  semester: "Fall",
  year: "2027",
  start_date: "2027-08-23",
  end_date: "2027-12-11",
};

const initialEditForm = {
  semester: "",
  year: "",
  start_date: "",
  end_date: "",
};

function formatStatus(value) {
  return String(value || "draft")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getTermOptionValue(term) {
  return String(term?.term_id || "");
}

function getTermName(semester, year) {
  return `${semester} ${year}`;
}

function dateRangesOverlap(startA, endA, startB, endB) {
  return startA <= endB && endA >= startB;
}

function AdminDashboard() {
  const [terms, setTerms] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedTermId, setSelectedTermId] = useState("");
  const [termForm, setTermForm] = useState(initialTermForm);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [createWarning, setCreateWarning] = useState("");
  const [editWarning, setEditWarning] = useState("");

  async function loadAdminDashboard(preferredTermId = selectedTermId) {
    setLoadError("");

    try {
      const data = await getAdminTerms();
      const loadedTerms = data.terms || [];
      const preferredTerm = loadedTerms.find((term) => getTermOptionValue(term) === String(preferredTermId));
      const openTerm = loadedTerms.find((term) => term.status === "open");
      const fallbackTerm = loadedTerms[loadedTerms.length - 1];
      const nextSelectedTerm = preferredTerm || openTerm || fallbackTerm || null;

      setTerms(loadedTerms);
      setStats(data.stats || null);
      setSelectedTermId(nextSelectedTerm ? getTermOptionValue(nextSelectedTerm) : "");
    } catch (error) {
      setLoadError("Could not load admin dashboard data. Please make sure the backend is running.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAdminDashboard("");
  }, []);

  const selectedTerm = useMemo(
    () => terms.find((term) => getTermOptionValue(term) === String(selectedTermId)) || null,
    [terms, selectedTermId],
  );

  useEffect(() => {
    if (!selectedTerm) {
      setEditForm(initialEditForm);
      return;
    }

    setEditForm({
      semester: selectedTerm.semester || "",
      year: String(selectedTerm.year || ""),
      start_date: selectedTerm.start_date || "",
      end_date: selectedTerm.end_date || "",
    });
  }, [selectedTerm]);

  const selectedStats = {
    totalStudents: stats?.total_students ?? 0,
    totalCourses: stats?.total_courses ?? 0,
    totalSections: stats?.total_sections ?? 0,
    submittedPlans: selectedTerm?.submitted_plans ?? stats?.submitted_plans ?? 0,
  };

  const isSubmissionOpen = selectedTerm?.submission_window === "open";
  const isFinalized = selectedTerm?.status === "finalized";
  const submissionActionLabel = isSubmissionOpen
    ? "Close Submissions"
    : selectedTerm?.status === "closed"
      ? "Reopen Submissions"
      : "Open Submissions";

  function validateTermForm(form, excludedTermId = null) {
    const termName = getTermName(form.semester, form.year);
    const duplicate = terms.some(
      (term) => term.term_name === termName && String(term.term_id) !== String(excludedTermId),
    );

    if (duplicate) {
      return `A term for ${termName} already exists.`;
    }

    const overlaps = terms.some(
      (term) =>
        String(term.term_id) !== String(excludedTermId) &&
        dateRangesOverlap(form.start_date, form.end_date, term.start_date, term.end_date),
    );

    if (overlaps) {
      return "This date range overlaps with an existing term.";
    }

    if (form.end_date < form.start_date) {
      return "Term end date must be after the start date.";
    }

    return "";
  }

  async function handleSubmissionToggle() {
    if (!selectedTerm) return;

    setIsSaving(true);
    setActionMessage("");
    setCreateWarning("");
    setEditWarning("");

    try {
      const nextWindow = isSubmissionOpen ? "closed" : "open";
      const result = await updateAdminSubmissionWindow(selectedTerm.term_id, nextWindow);
      setActionMessage(result.message || "Submission window updated.");
      await loadAdminDashboard(selectedTerm.term_id);
    } catch (error) {
      setActionMessage("Could not update the submission window.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleFinalizeTerm() {
    if (!selectedTerm) return;

    const confirmed = window.confirm("Finalizing this term will move submitted courses to Completed.");
    if (!confirmed) return;

    setIsSaving(true);
    setActionMessage("");
    setCreateWarning("");
    setEditWarning("");

    try {
      const result = await finalizeAdminTerm(selectedTerm.term_id);
      setActionMessage(result.message || "Term finalized.");
      await loadAdminDashboard(selectedTerm.term_id);
    } catch (error) {
      setActionMessage("Could not finalize the selected term.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUndoFinalizeTerm() {
    if (!selectedTerm) return;

    const confirmed = window.confirm("Undoing finalization will move completed courses for this term back to In Progress.");
    if (!confirmed) return;

    setIsSaving(true);
    setActionMessage("");
    setCreateWarning("");
    setEditWarning("");

    try {
      const result = await undoFinalizeAdminTerm(selectedTerm.term_id);
      setActionMessage(result.message || "Finalization undone.");
      await loadAdminDashboard(selectedTerm.term_id);
    } catch (error) {
      setActionMessage("Could not undo finalization for the selected term.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdateTerm(event) {
    event.preventDefault();
    if (!selectedTerm) return;

    const warning = validateTermForm(editForm, selectedTerm.term_id);
    if (warning) {
      setEditWarning(warning);
      return;
    }

    setIsSaving(true);
    setActionMessage("");
    setEditWarning("");

    try {
      const result = await updateAdminTerm(selectedTerm.term_id, {
        semester: editForm.semester,
        year: Number(editForm.year),
        start_date: editForm.start_date,
        end_date: editForm.end_date,
      });

      if (!result.success) {
        setEditWarning(result.message || "Could not update term.");
      } else {
        setActionMessage(result.message || "Term updated.");
        await loadAdminDashboard(result.term?.term_id || selectedTerm.term_id);
      }
    } catch (error) {
      setEditWarning("Could not update the term.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteTerm() {
    if (!selectedTerm) return;

    const confirmed = window.confirm(
      "Deleting this term may remove associated term data. Are you sure?",
    );
    if (!confirmed) return;

    setIsSaving(true);
    setActionMessage("");
    setEditWarning("");

    try {
      const result = await deleteAdminTerm(selectedTerm.term_id);
      if (result.success) {
        setActionMessage(result.message || "Term deleted.");
        await loadAdminDashboard("");
      } else {
        setEditWarning(result.message || "Could not delete the selected term.");
      }
    } catch (error) {
      setEditWarning("Could not delete the selected term.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateTerm(event) {
    event.preventDefault();

    const warning = validateTermForm(termForm);
    if (warning) {
      setCreateWarning(warning);
      return;
    }

    setIsSaving(true);
    setActionMessage("");
    setCreateWarning("");

    try {
      const result = await createAdminTerm({
        semester: termForm.semester,
        year: Number(termForm.year),
        start_date: termForm.start_date,
        end_date: termForm.end_date,
      });

      if (!result.success) {
        setCreateWarning(result.message || "Could not create term.");
      } else {
        setActionMessage(result.message || "Term created.");
        await loadAdminDashboard(result.term?.term_id || "");
      }
    } catch (error) {
      setCreateWarning("Could not create the term.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <DashboardLayout
      role="admin"
      title="Admin Dashboard"
      subtitle="Manage term availability, submission windows, and final schedule completion."
    >
      {isLoading && (
        <section className="panel-card dashboard-state-card">
          <h3>Loading admin dashboard</h3>
          <p>Getting term settings, system totals, and submitted schedule counts.</p>
        </section>
      )}

      {!isLoading && loadError && (
        <section className="dashboard-notice warning">
          <strong>Admin data unavailable</strong>
          <span>{loadError}</span>
        </section>
      )}

      {!isLoading && !loadError && (
        <>
          <section className="stats-grid">
            <div className="stat-card">
              <h3>Total Students</h3>
              <p className="stat-value">{selectedStats.totalStudents}</p>
              <span className="stat-note">Students in PathWise</span>
            </div>

            <div className="stat-card">
              <h3>Total Courses</h3>
              <p className="stat-value">{selectedStats.totalCourses}</p>
              <span className="stat-note">Active catalog courses</span>
            </div>

            <div className="stat-card">
              <h3>Total Sections</h3>
              <p className="stat-value">{selectedStats.totalSections}</p>
              <span className="stat-note">Scheduled course sections</span>
            </div>

            <div className="stat-card">
              <h3>Submitted Plans</h3>
              <p className="stat-value">{selectedStats.submittedPlans}</p>
              <span className="stat-note">For {selectedTerm?.term_name || "selected term"}</span>
            </div>
          </section>

          <section className="content-grid admin-term-grid">
            <div className="panel-card">
              <div className="panel-header">
                <h3>Term Management</h3>
                <p>Select the active term and control student submission availability.</p>
              </div>

              <div className="admin-term-controls">
                <label>
                  Selected Term
                  <select
                    value={selectedTermId}
                    onChange={(event) => setSelectedTermId(event.target.value)}
                  >
                    {terms.map((term) => (
                      <option value={term.term_id} key={term.term_id}>
                        {term.term_name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="admin-active-term-card">
                  <div>
                    <span>Active Term</span>
                    <strong>{selectedTerm?.term_name || "No term selected"}</strong>
                  </div>
                  <span className={`admin-status-pill ${selectedTerm?.status || "draft"}`}>
                    {formatStatus(selectedTerm?.status)}
                  </span>
                </div>

                <ul className="info-list">
                  <li>
                    <span>Planning Mode</span>
                    <strong>{formatStatus(selectedTerm?.planning_mode)}</strong>
                  </li>
                  <li>
                    <span>Submission Window</span>
                    <strong>{formatStatus(selectedTerm?.submission_window)}</strong>
                  </li>
                  <li>
                    <span>Term Dates</span>
                    <strong>
                      {selectedTerm?.start_date || "N/A"} to {selectedTerm?.end_date || "N/A"}
                    </strong>
                  </li>
                </ul>

                <div className="admin-action-row">
                  {!isFinalized && (
                    <>
                      <button
                        className="action-btn"
                        type="button"
                        disabled={!selectedTerm || isSaving}
                        onClick={handleSubmissionToggle}
                      >
                        {submissionActionLabel}
                      </button>
                      <button
                        className="action-btn secondary-btn admin-finalize-btn"
                        type="button"
                        disabled={!selectedTerm || isSaving}
                        onClick={handleFinalizeTerm}
                      >
                        Finalize Term
                      </button>
                    </>
                  )}

                  {isFinalized && (
                    <button
                      className="action-btn secondary-btn admin-finalize-btn"
                      type="button"
                      disabled={!selectedTerm || isSaving}
                      onClick={handleUndoFinalizeTerm}
                    >
                      Undo Finalization
                    </button>
                  )}
                </div>

                {actionMessage && (
                  <div className="admin-inline-message">
                    {actionMessage}
                  </div>
                )}
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <h3>Create New Term</h3>
                <p>Add a future term, then open submissions when planning is ready.</p>
              </div>

              <form className="admin-create-term-form" onSubmit={handleCreateTerm}>
                <label>
                  Semester
                  <select
                    value={termForm.semester}
                    onChange={(event) => {
                      setCreateWarning("");
                      setTermForm({ ...termForm, semester: event.target.value });
                    }}
                  >
                    <option>Spring</option>
                    <option>Summer</option>
                    <option>Fall</option>
                    <option>Winter</option>
                  </select>
                </label>

                <label>
                  Year
                  <input
                    type="number"
                    value={termForm.year}
                    onChange={(event) => {
                      setCreateWarning("");
                      setTermForm({ ...termForm, year: event.target.value });
                    }}
                  />
                </label>

                <label>
                  Start Date
                  <input
                    type="date"
                    value={termForm.start_date}
                    onChange={(event) => {
                      setCreateWarning("");
                      setTermForm({ ...termForm, start_date: event.target.value });
                    }}
                  />
                </label>

                <label>
                  End Date
                  <input
                    type="date"
                    value={termForm.end_date}
                    onChange={(event) => {
                      setCreateWarning("");
                      setTermForm({ ...termForm, end_date: event.target.value });
                    }}
                  />
                </label>

                {createWarning && (
                  <div className="admin-inline-message warning">
                    {createWarning}
                  </div>
                )}

                <button className="action-btn" type="submit" disabled={isSaving}>
                  Create Term
                </button>
              </form>
            </div>
          </section>

          <section className="content-grid admin-term-grid">
            <div className="panel-card">
              <div className="panel-header">
                <h3>Edit Selected Term</h3>
                <p>Correct the semester, year, or dates before students rely on the term.</p>
              </div>

              <form className="admin-create-term-form" onSubmit={handleUpdateTerm}>
                <label>
                  Semester
                  <select
                    value={editForm.semester}
                    onChange={(event) => {
                      setEditWarning("");
                      setEditForm({ ...editForm, semester: event.target.value });
                    }}
                    disabled={!selectedTerm || isSaving}
                  >
                    <option>Spring</option>
                    <option>Summer</option>
                    <option>Fall</option>
                    <option>Winter</option>
                  </select>
                </label>

                <label>
                  Year
                  <input
                    type="number"
                    value={editForm.year}
                    onChange={(event) => {
                      setEditWarning("");
                      setEditForm({ ...editForm, year: event.target.value });
                    }}
                    disabled={!selectedTerm || isSaving}
                  />
                </label>

                <label>
                  Start Date
                  <input
                    type="date"
                    value={editForm.start_date}
                    onChange={(event) => {
                      setEditWarning("");
                      setEditForm({ ...editForm, start_date: event.target.value });
                    }}
                    disabled={!selectedTerm || isSaving}
                  />
                </label>

                <label>
                  End Date
                  <input
                    type="date"
                    value={editForm.end_date}
                    onChange={(event) => {
                      setEditWarning("");
                      setEditForm({ ...editForm, end_date: event.target.value });
                    }}
                    disabled={!selectedTerm || isSaving}
                  />
                </label>

                <div className="admin-action-row">
                  <button className="action-btn" type="submit" disabled={!selectedTerm || isSaving}>
                    Save Term Changes
                  </button>
                  <button
                    className="action-btn secondary-btn admin-danger-btn"
                    type="button"
                    disabled={!selectedTerm || isSaving}
                    onClick={handleDeleteTerm}
                  >
                    Delete Term
                  </button>
                </div>

                {editWarning && (
                  <div className="admin-inline-message warning">
                    {editWarning}
                  </div>
                )}
              </form>
            </div>
          </section>

          <section className="table-panel">
            <div className="panel-header">
              <h3>Term Lifecycle</h3>
              <p>Student schedules move from submitted to completed when a term is finalized.</p>
            </div>

            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Term</th>
                  <th>Status</th>
                  <th>Submission Window</th>
                  <th>Submitted Plans</th>
                </tr>
              </thead>
              <tbody>
                {terms.map((term) => (
                  <tr key={term.term_id}>
                    <td>{term.term_name}</td>
                    <td>
                      <span className={`admin-status-pill ${term.status}`}>
                        {formatStatus(term.status)}
                      </span>
                    </td>
                    <td>{formatStatus(term.submission_window)}</td>
                    <td>{term.submitted_plans}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}

export default AdminDashboard;
