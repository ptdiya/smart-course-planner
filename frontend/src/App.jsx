import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/useAuth";
import ProtectedRoute from "./routes/ProtectedRoute";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AcademicProgress from "./pages/AcademicProgress";
import SchedulingAssistant from "./pages/SchedulingAssistant";
import CourseCatalog from "./pages/CourseCatalog";
import UserManagement from "./pages/UserManagement";

function App() {
  const { isAuthenticated, role } = useAuth();
  const defaultRoute = role === "admin" ? "/admin/dashboard" : "/student/dashboard";

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to={defaultRoute} replace /> : <Login />}
        />

        <Route element={<ProtectedRoute allowedRole="student" />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/progress" element={<AcademicProgress />} />
          <Route path="/student/schedule" element={<SchedulingAssistant />} />
        </Route>

        <Route element={<ProtectedRoute allowedRole="admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/courses" element={<CourseCatalog />} />
          <Route path="/admin/users" element={<UserManagement />} />
        </Route>

        <Route path="*" element={<Navigate to={isAuthenticated ? defaultRoute : "/"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
