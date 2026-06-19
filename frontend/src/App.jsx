import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage    from './pages/LoginPage';
import Dashboard    from './pages/Dashboard';
import StudentsPage from './pages/StudentsPage';
import TutorPage    from './pages/TutorPage';
import SessionsPage from './pages/SessionsPage';
import ReportsPage  from './pages/ReportsPage';
import UsersPage    from './pages/UsersPage';

function PrivateRoute({ children, roles }) {
  const token = sessionStorage.getItem('aria_token');
  const user  = JSON.parse(sessionStorage.getItem('aria_user') || '{}');
  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/students"  element={<PrivateRoute><StudentsPage /></PrivateRoute>} />
        <Route path="/tutor"     element={<PrivateRoute><TutorPage /></PrivateRoute>} />
        <Route path="/sessions"  element={<PrivateRoute><SessionsPage /></PrivateRoute>} />
        <Route path="/reports"   element={<PrivateRoute><ReportsPage /></PrivateRoute>} />
        <Route path="/users"     element={<PrivateRoute roles={['ADMIN']}><UsersPage /></PrivateRoute>} />

        <Route path="/"  element={<Navigate to="/dashboard" replace />} />
        <Route path="*"  element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
