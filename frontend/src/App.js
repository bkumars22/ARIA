import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage       from './pages/LoginPage';
import TeacherDashboard from './pages/TeacherDashboard';
import TutorPage        from './pages/TutorPage';
import StudentSelect    from './pages/StudentSelect';

function PrivateRoute({ children }) {
  return sessionStorage.getItem('aria_token') ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"     element={<LoginPage />} />
        <Route path="/dashboard" element={<PrivateRoute><TeacherDashboard /></PrivateRoute>} />
        <Route path="/students"  element={<PrivateRoute><StudentSelect /></PrivateRoute>} />
        <Route path="/tutor"     element={<PrivateRoute><TutorPage /></PrivateRoute>} />
        <Route path="*"          element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
