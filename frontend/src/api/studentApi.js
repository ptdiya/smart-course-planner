import client from "./client";

export function getStudentDashboard() {
  return client.get("/student/dashboard");
}

export function getAcademicProgress() {
  return client.get("/student/progress");
}

export function getSchedulingAssistant() {
  return client.get("/student/schedule");
}
