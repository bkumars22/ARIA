import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage           from './pages/LoginPage';
import Dashboard           from './pages/Dashboard';
import StudentsPage        from './pages/StudentsPage';
import TutorPage           from './pages/TutorPage';
import SessionsPage        from './pages/SessionsPage';
import ReportsPage         from './pages/ReportsPage';
import UsersPage           from './pages/UsersPage';
import ProgressPage        from './pages/ProgressPage';
import DocumentTeacherPage from './pages/DocumentTeacherPage';
import DocumentHistoryPage from './pages/DocumentHistoryPage';

function PrivateRoute({ children, roles }) {
  const token = sessionStorage.getItem('aria_token');
  const user  = JSON.parse(sessionStorage.getItem('aria_user') || '{}');

  // Check session expiry
  const expiry = parseInt(sessionStorage.getItem('aria_session_expiry') || '0', 10);
  if (expiry && Date.now() > expiry) {
    sessionStorage.clear();
    return <Navigate to="/login" replace />;
  }

  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* All authenticated users */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/reports"   element={<PrivateRoute><ReportsPage /></PrivateRoute>} />

        {/* Teacher + Admin only */}
        <Route path="/students"  element={<PrivateRoute roles={['ADMIN','TEACHER']}><StudentsPage /></PrivateRoute>} />
        <Route path="/tutor"     element={<PrivateRoute roles={['ADMIN','TEACHER']}><TutorPage /></PrivateRoute>} />
        <Route path="/sessions"  element={<PrivateRoute roles={['ADMIN','TEACHER']}><SessionsPage /></PrivateRoute>} />

        {/* Admin only */}
        <Route path="/users"     element={<PrivateRoute roles={['ADMIN']}><UsersPage /></PrivateRoute>} />

        {/* Parent only */}
        <Route path="/progress"  element={<PrivateRoute roles={['PARENT']}><ProgressPage /></PrivateRoute>} />

        {/* Document Teacher — Teacher + Admin */}
        <Route path="/document-teacher"
          element={<PrivateRoute roles={['ADMIN','TEACHER']}><DocumentTeacherPage /></PrivateRoute>} />
        <Route path="/document-history"
          element={<PrivateRoute roles={['ADMIN','TEACHER']}><DocumentHistoryPage /></PrivateRoute>} />

        <Route path="/"  element={<Navigate to="/dashboard" replace />} />
        <Route path="*"  element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
