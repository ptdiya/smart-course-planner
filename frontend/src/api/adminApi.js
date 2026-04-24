import client from "./client";

export function getAdminDashboard() {
  return client.get("/admin/dashboard");
}

export function getCourseCatalog() {
  return client.get("/admin/courses");
}
