import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import MyPlan from "./pages/MyPlan";
import Recommendations from "./pages/Recommendations";
import Roadmap from "./pages/Roadmap";
import CourseCatalog from "./pages/CourseCatalog";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/plan" element={<MyPlan />} />
        <Route path="/student/recommendations" element={<Recommendations />} />
        <Route path="/student/roadmap" element={<Roadmap />} />

        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/courses" element={<CourseCatalog />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;