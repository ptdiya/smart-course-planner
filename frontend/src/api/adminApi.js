import { API_BASE_URL } from "./client";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    throw new Error(`Admin request failed: ${response.status}`);
  }

  return response.json();
}

export function getAdminTerms() {
  return request("/admin/terms");
}

export function getAdminUsers() {
  return request("/admin/users");
}

export function createAdminUser(user) {
  return request("/admin/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });
}

export function updateAdminUser(userId, user) {
  return request(`/admin/users/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });
}

export function updateAdminUserStatus(userId, isActive, actorUserId = null) {
  return request(`/admin/users/${userId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ is_active: isActive, actor_user_id: actorUserId }),
  });
}

export function getAdminCourseCatalog(termId) {
  return request(`/admin/courses?term_id=${encodeURIComponent(termId)}`);
}

export function getAdminMasterCourses() {
  return request("/admin/master-courses");
}

export function createAdminTerm(term) {
  return request("/admin/terms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(term),
  });
}

export function updateAdminTerm(termId, term) {
  return request(`/admin/terms/${termId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(term),
  });
}

export function deleteAdminTerm(termId) {
  return request(`/admin/terms/${termId}`, {
    method: "DELETE",
  });
}

export function updateAdminSubmissionWindow(termId, submissionWindow) {
  return request(`/admin/terms/${termId}/submission-window`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ submission_window: submissionWindow }),
  });
}

export function finalizeAdminTerm(termId) {
  return request(`/admin/terms/${termId}/finalize`, {
    method: "POST",
  });
}

export function undoFinalizeAdminTerm(termId) {
  return request(`/admin/terms/${termId}/undo-finalize`, {
    method: "POST",
  });
}

export function updateAdminSectionCapacity(sectionId, capacity) {
  return request(`/admin/sections/${sectionId}/capacity`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ capacity }),
  });
}

export function updateAdminCoursePrerequisite(courseId, prerequisiteRule) {
  return request(`/admin/courses/${courseId}/prerequisites`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prerequisite_rule: prerequisiteRule }),
  });
}

export function updateAdminCourse(courseId, course) {
  return request(`/admin/courses/${courseId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(course),
  });
}

export function updateAdminSection(sectionId, section) {
  return request(`/admin/sections/${sectionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(section),
  });
}

export function addAdminSection(courseId, termId, section) {
  return request(`/admin/courses/${courseId}/terms/${termId}/sections`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(section),
  });
}

export function deleteAdminSection(sectionId) {
  return request(`/admin/sections/${sectionId}`, {
    method: "DELETE",
  });
}

export function addAdminCourseOffering(offering) {
  return request("/admin/course-offerings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(offering),
  });
}

export function deleteAdminCourseOffering(courseId, termId) {
  return request(`/admin/course-offerings?course_id=${encodeURIComponent(courseId)}&term_id=${encodeURIComponent(termId)}`, {
    method: "DELETE",
  });
}
