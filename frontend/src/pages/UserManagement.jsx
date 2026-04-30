import { useEffect, useMemo, useRef, useState } from "react";
import {
  createAdminUser,
  getAdminUsers,
  updateAdminUser,
  updateAdminUserStatus,
} from "../api/adminApi";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../context/useAuth";

const emptyUserForm = {
  full_name: "",
  email: "",
  temporary_password: "",
  role: "student",
  major: "Computer Science",
  track_id: "",
};

function roleLabel(role) {
  return role === "admin" ? "Admin" : "Student";
}

function statusLabel(isActive) {
  return isActive ? "Active" : "Deactivated";
}

function isWarningMessage(message = "") {
  const normalized = message.toLowerCase();
  return normalized.includes("required") || normalized.includes("exists") || normalized.includes("error") || normalized.includes("at least");
}

function validateUserForm(form, isEdit = false) {
  if (!form.full_name.trim()) return "Full name is required.";
  if (!form.email.trim()) return "Email/username is required.";
  if (!isEdit && !form.temporary_password.trim()) return "Temporary password is required.";
  if (!form.role) return "Role is required.";
  if (form.role === "student" && !form.major.trim()) return "Student major is required.";
  if (form.role === "student" && !form.track_id) return "Student track is required.";
  return "";
}

function UserManagement() {
  const { user: currentUser } = useAuth();
  const currentUserId =
    typeof currentUser === "object" && currentUser !== null ? Number(currentUser.user_id) : null;
  const currentUserEmail =
    typeof currentUser === "object" && currentUser !== null
      ? currentUser.email
      : currentUser === "admin"
        ? "admin@example.com"
        : null;
  const [users, setUsers] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [summary, setSummary] = useState({
    total_students: 0,
    active_students: 0,
    admin_accounts: 0,
    deactivated_users: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyUserForm);
  const [editUserId, setEditUserId] = useState(null);
  const [editForm, setEditForm] = useState(emptyUserForm);
  const [addMessage, setAddMessage] = useState("");
  const [rowMessages, setRowMessages] = useState({});
  const addMessageTimerRef = useRef(null);
  const rowMessageTimersRef = useRef({});

  function clearAddMessageTimer() {
    if (addMessageTimerRef.current) {
      clearTimeout(addMessageTimerRef.current);
      addMessageTimerRef.current = null;
    }
  }

  function clearRowMessageTimer(userId) {
    if (rowMessageTimersRef.current[userId]) {
      clearTimeout(rowMessageTimersRef.current[userId]);
      delete rowMessageTimersRef.current[userId];
    }
  }

  function clearAllInlineMessages() {
    clearAddMessageTimer();
    Object.values(rowMessageTimersRef.current).forEach((timerId) => clearTimeout(timerId));
    rowMessageTimersRef.current = {};
    setAddMessage("");
    setRowMessages({});
  }

  function showAddMessage(message) {
    clearAddMessageTimer();
    setAddMessage(message);

    if (message) {
      addMessageTimerRef.current = setTimeout(() => {
        setAddMessage("");
        addMessageTimerRef.current = null;
      }, 4000);
    }
  }

  function clearRowMessage(userId) {
    clearRowMessageTimer(userId);
    setRowMessages((current) => ({ ...current, [userId]: "" }));
  }

  function showRowMessage(userId, message) {
    clearRowMessageTimer(userId);
    setRowMessages((current) => ({ ...current, [userId]: message }));

    if (message) {
      rowMessageTimersRef.current[userId] = setTimeout(() => {
        setRowMessages((current) => ({ ...current, [userId]: "" }));
        delete rowMessageTimersRef.current[userId];
      }, 4000);
    }
  }

  async function loadUsers() {
    setIsLoading(true);
    setLoadError("");

    try {
      const data = await getAdminUsers();
      setUsers(data.users || []);
      setTracks(data.tracks || []);
      setSummary(data.summary || summary);
      const firstTrack = data.tracks?.[0];
      setAddForm((current) => ({
        ...current,
        track_id: current.track_id || (firstTrack ? String(firstTrack.track_id) : ""),
      }));
    } catch (error) {
      setLoadError("Could not load user accounts.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => () => {
    clearAddMessageTimer();
    Object.values(rowMessageTimersRef.current).forEach((timerId) => clearTimeout(timerId));
  }, []);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return users
      .filter((user) => {
        if (filter === "students") return user.role === "student";
        if (filter === "admins") return user.role === "admin";
        if (filter === "active") return user.is_active;
        if (filter === "deactivated") return !user.is_active;
        return true;
      })
      .filter((user) => {
        if (!query) return true;
        return [
          user.full_name,
          user.email,
          user.role,
          user.major,
          user.track,
          user.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      });
  }, [users, searchTerm, filter]);

  function updateAddForm(field, value) {
    showAddMessage("");
    setAddForm((current) => ({ ...current, [field]: value }));
  }

  function startEdit(user) {
    clearAllInlineMessages();
    setEditUserId(user.user_id);
    setEditForm({
      full_name: user.full_name || "",
      email: user.email || "",
      role: user.role,
      major: user.major || "Computer Science",
      track_id: user.track_id ? String(user.track_id) : "",
      temporary_password: "",
      is_active: user.is_active,
    });
  }

  async function handleCreateUser(event) {
    event.preventDefault();
    setRowMessages({});
    const warning = validateUserForm(addForm);
    if (warning) {
      showAddMessage(warning);
      return;
    }

    try {
      const payload = {
        full_name: addForm.full_name,
        email: addForm.email,
        temporary_password: addForm.temporary_password,
        role: addForm.role,
        major: addForm.role === "student" ? addForm.major : null,
        track_id: addForm.role === "student" ? Number(addForm.track_id) : null,
      };
      const result = await createAdminUser(payload);
      if (!result.success) {
        showAddMessage(result.message || "Could not create user.");
        return;
      }

      showAddMessage("");
      setIsAddOpen(false);
      setAddForm({
        ...emptyUserForm,
        track_id: tracks[0] ? String(tracks[0].track_id) : "",
      });
      await loadUsers();
    } catch (error) {
      showAddMessage("Could not create user.");
    }
  }

  async function handleUpdateUser(user) {
    clearRowMessage(user.user_id);
    const warning = validateUserForm(editForm, true);
    if (warning) {
      showRowMessage(user.user_id, warning);
      return;
    }

    try {
      const result = await updateAdminUser(user.user_id, {
        full_name: editForm.full_name,
        email: editForm.email,
        major: user.role === "student" ? editForm.major : null,
        track_id: user.role === "student" ? Number(editForm.track_id) : null,
        is_active: editForm.is_active,
        actor_user_id: currentUserId,
      });
      if (!result.success) {
        showRowMessage(user.user_id, result.message || "Could not update user.");
        return;
      }

      setEditUserId(null);
      await loadUsers();
    } catch (error) {
      showRowMessage(user.user_id, "Could not update user.");
    }
  }

  async function handleStatusChange(user, isActive) {
    clearAllInlineMessages();
    try {
      const result = await updateAdminUserStatus(user.user_id, isActive, currentUserId);
      if (!result.success) {
        showRowMessage(user.user_id, result.message || "Could not update status.");
        return;
      }

      await loadUsers();
    } catch (error) {
      showRowMessage(user.user_id, "Could not update status.");
    }
  }

  return (
    <DashboardLayout
      role="admin"
      title="User Management"
      subtitle="Manage student and admin accounts."
    >
      {isLoading && (
        <section className="panel-card dashboard-state-card">
          <h3>Loading user accounts</h3>
          <p>Getting student and admin records.</p>
        </section>
      )}

      {!isLoading && loadError && (
        <section className="dashboard-notice warning">
          <strong>User data unavailable</strong>
          <span>{loadError}</span>
        </section>
      )}

      {!isLoading && !loadError && (
        <>
          <section className="stats-grid">
            <div className="stat-card">
              <h3>Total Students</h3>
              <p className="stat-value">{summary.total_students}</p>
              <span className="stat-note">Student accounts</span>
            </div>
            <div className="stat-card">
              <h3>Active Students</h3>
              <p className="stat-value">{summary.active_students}</p>
              <span className="stat-note">Students who can use PathWise</span>
            </div>
            <div className="stat-card">
              <h3>Admin Accounts</h3>
              <p className="stat-value">{summary.admin_accounts}</p>
              <span className="stat-note">Administrative users</span>
            </div>
            <div className="stat-card">
              <h3>Deactivated Users</h3>
              <p className="stat-value">{summary.deactivated_users}</p>
              <span className="stat-note">Visible but blocked accounts</span>
            </div>
          </section>

          <section className="panel-card admin-user-controls">
            <div className="admin-user-controls-header">
              <div>
                <h3>Accounts</h3>
                <p>{filteredUsers.length} of {users.length} users shown.</p>
              </div>
              <button className="action-btn admin-add-offering-toggle" type="button" onClick={() => {
                clearAllInlineMessages();
                setIsAddOpen((value) => !value);
              }}>
                <span className="admin-add-offering-plus">+</span>
                Add User
              </button>
            </div>

            <div className="admin-user-filter-row">
              <label>
                Search
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by name, email, role, major, track, or status"
                />
              </label>
              <label>
                Filter
                <select value={filter} onChange={(event) => setFilter(event.target.value)}>
                  <option value="all">All</option>
                  <option value="students">Students</option>
                  <option value="admins">Admins</option>
                  <option value="active">Active</option>
                  <option value="deactivated">Deactivated</option>
                </select>
              </label>
            </div>

            {isAddOpen && (
              <form className="admin-user-form" onSubmit={handleCreateUser}>
                <label>
                  Full Name
                  <input value={addForm.full_name} onChange={(event) => updateAddForm("full_name", event.target.value)} />
                </label>
                <label>
                  Email/Username
                  <input value={addForm.email} onChange={(event) => updateAddForm("email", event.target.value)} />
                </label>
                <label>
                  Temporary Password
                  <input type="password" value={addForm.temporary_password} onChange={(event) => updateAddForm("temporary_password", event.target.value)} />
                </label>
                <label>
                  Role
                  <select value={addForm.role} onChange={(event) => updateAddForm("role", event.target.value)}>
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                {addForm.role === "student" && (
                  <>
                    <label>
                      Major
                      <input value={addForm.major} onChange={(event) => updateAddForm("major", event.target.value)} />
                    </label>
                    <label>
                      Track
                      <select value={addForm.track_id} onChange={(event) => updateAddForm("track_id", event.target.value)}>
                        <option value="">Select track</option>
                        {tracks.map((track) => (
                          <option value={track.track_id} key={track.track_id}>{track.track_name}</option>
                        ))}
                      </select>
                    </label>
                  </>
                )}
                {addMessage && (
                  <div className={`admin-inline-message ${isWarningMessage(addMessage) ? "warning" : ""}`}>
                    {addMessage}
                  </div>
                )}
                <div className="admin-action-row">
                  <button className="action-btn" type="submit">Create User</button>
                  <button className="action-btn secondary-btn" type="button" onClick={() => {
                    showAddMessage("");
                    setIsAddOpen(false);
                  }}>Cancel</button>
                </div>
              </form>
            )}
          </section>

          <section className="table-panel">
            <div className="panel-header">
              <h3>User Accounts</h3>
              <p>Students and admins remain visible when deactivated.</p>
            </div>

            <table className="dashboard-table admin-user-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email/Username</th>
                  <th>Role</th>
                  <th>Major</th>
                  <th>Track</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isEditing = editUserId === user.user_id;
                  const isCurrentAdmin =
                    user.role === "admin" &&
                    user.is_active &&
                    ((currentUserId !== null && Number(user.user_id) === currentUserId) ||
                      (currentUserEmail !== null && user.email === currentUserEmail));
                  return (
                    <tr key={user.user_id}>
                      <td>
                        {isEditing ? (
                          <input value={editForm.full_name} onChange={(event) => setEditForm({ ...editForm, full_name: event.target.value })} />
                        ) : (
                          user.full_name
                        )}
                        {rowMessages[user.user_id] && (
                          <div className={`admin-inline-message ${isWarningMessage(rowMessages[user.user_id]) ? "warning" : ""}`}>
                            {rowMessages[user.user_id]}
                          </div>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input value={editForm.email} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} />
                        ) : (
                          user.email
                        )}
                      </td>
                      <td>{roleLabel(user.role)}</td>
                      <td>
                        {user.role === "student" && isEditing ? (
                          <input value={editForm.major} onChange={(event) => setEditForm({ ...editForm, major: event.target.value })} />
                        ) : (
                          user.major || "N/A"
                        )}
                      </td>
                      <td>
                        {user.role === "student" && isEditing ? (
                          <select value={editForm.track_id} onChange={(event) => setEditForm({ ...editForm, track_id: event.target.value })}>
                            <option value="">Select track</option>
                            {tracks.map((track) => (
                              <option value={track.track_id} key={track.track_id}>{track.track_name}</option>
                            ))}
                          </select>
                        ) : (
                          user.track || "N/A"
                        )}
                      </td>
                      <td>
                        <span className={`admin-status-pill ${user.is_active ? "open" : "closed"}`}>
                          {statusLabel(user.is_active)}
                        </span>
                      </td>
                      <td>
                        <div className="admin-user-actions">
                          {isEditing ? (
                            <>
                              <button className="action-btn secondary-btn" type="button" onClick={() => handleUpdateUser(user)}>Save</button>
                              <button className="action-btn secondary-btn" type="button" onClick={() => {
                                clearRowMessage(user.user_id);
                                setEditUserId(null);
                              }}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <button className="action-btn secondary-btn" type="button" onClick={() => startEdit(user)}>Edit</button>
                              <button
                                className={`action-btn secondary-btn ${user.is_active ? "admin-danger-btn" : ""}`}
                                type="button"
                                onClick={() => handleStatusChange(user, !user.is_active)}
                                disabled={isCurrentAdmin}
                                title={isCurrentAdmin ? "You cannot deactivate your own account." : undefined}
                              >
                                {user.is_active ? "Deactivate" : "Reactivate"}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}

export default UserManagement;
