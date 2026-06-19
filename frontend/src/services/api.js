import axios from 'axios';
import {
  MOCK_TOKEN, MOCK_USER, MOCK_STUDENTS, MOCK_PROGRESS,
  MOCK_DASHBOARD, MOCK_USERS, getMockSessions, addMockSession,
  getMockMessages, addMockMessage, nextMockSessionId, MOCK_REPORT,
  mockStudents, mockUsers,
} from './mockData';

const DEMO    = process.env.REACT_APP_DEMO_MODE === 'true';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8089/aria';

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));
const mock  = async (data, ms = 350) => { await delay(ms); return { data: { success: true, data } }; };

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(cfg => {
  const token = sessionStorage.getItem('aria_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) { sessionStorage.clear(); window.location.href = '/login'; }
  return Promise.reject(err);
});

let _idCounter = 200;
const nextId = () => ++_idCounter;

// ─── AUTH ─────────────────────────────────────────────────────
export async function authLogin(username, password) {
  if (DEMO) {
    await delay(600);
    const u = MOCK_USERS.find(u => u.username === username && u.password === password);
    if (u) return { data: { success: true, data: { ...u, token: MOCK_TOKEN } } };
    throw { response: { status: 401 } };
  }
  return api.post('/api/auth/login', { username, password });
}

// ─── STUDENTS ─────────────────────────────────────────────────
export async function getStudents() {
  if (DEMO) return mock(mockStudents());
  return api.get('/api/students');
}
export async function getStudentsByTeacher(teacherId) {
  if (DEMO) return mock(mockStudents());
  return api.get(`/api/students/teacher/${teacherId}`);
}
export async function createStudent(data) {
  if (DEMO) {
    const s = { ...data, id: nextId(), studentCode: `STU-${String(nextId()).padStart(3,'0')}` };
    MOCK_STUDENTS.push(s);
    return mock(s, 300);
  }
  return api.post('/api/students', data);
}
export async function updateStudent(id, data) {
  if (DEMO) {
    const i = MOCK_STUDENTS.findIndex(s => s.id === id);
    if (i >= 0) MOCK_STUDENTS[i] = { ...MOCK_STUDENTS[i], ...data };
    return mock(MOCK_STUDENTS[i], 300);
  }
  return api.put(`/api/students/${id}`, data);
}
export async function deleteStudent(id) {
  if (DEMO) {
    const i = MOCK_STUDENTS.findIndex(s => s.id === id);
    if (i >= 0) MOCK_STUDENTS.splice(i, 1);
    return mock({}, 200);
  }
  return api.delete(`/api/students/${id}`);
}

// ─── USERS ────────────────────────────────────────────────────
export async function getUsers() {
  if (DEMO) return mock(mockUsers());
  return api.get('/api/users');
}
export async function createUser(data) {
  if (DEMO) {
    const u = { ...data, id: nextId() };
    MOCK_USERS.push(u);
    return mock(u, 300);
  }
  return api.post('/api/users', data);
}
export async function updateUser(id, data) {
  if (DEMO) {
    const i = MOCK_USERS.findIndex(u => u.id === id);
    if (i >= 0) MOCK_USERS[i] = { ...MOCK_USERS[i], ...data };
    return mock(MOCK_USERS[i], 300);
  }
  return api.put(`/api/users/${id}`, data);
}
export async function deleteUser(id) {
  if (DEMO) {
    const i = MOCK_USERS.findIndex(u => u.id === id);
    if (i >= 0) MOCK_USERS.splice(i, 1);
    return mock({}, 200);
  }
  return api.delete(`/api/users/${id}`);
}

// ─── SESSIONS ─────────────────────────────────────────────────
export async function startSession(studentId, subject) {
  if (DEMO) {
    const id = nextMockSessionId();
    const s  = { id, sessionCode:`SES-${id}`, studentId, subject, status:'ACTIVE', totalMessages:0, understandingScore:50 };
    addMockSession(s);
    return mock(s, 300);
  }
  return api.post('/api/sessions', { studentId, subject });
}
export async function endSession(sessionId) {
  if (DEMO) return mock({ message:'Session completed' }, 200);
  return api.put(`/api/sessions/${sessionId}/end`);
}
export async function getMessages(sessionId) {
  if (DEMO) return mock(getMockMessages(sessionId), 200);
  return api.get(`/api/sessions/${sessionId}/messages`);
}
export async function getSessions(studentId) {
  if (DEMO) return mock(getMockSessions().filter(s => !studentId || s.studentId === studentId));
  return api.get('/api/sessions', { params: { studentId } });
}

// ─── CHAT (AI) ────────────────────────────────────────────────
export async function chat(sessionId, payload) {
  if (DEMO) {
    await delay(1200);
    const name    = payload.student_name || 'friend';
    const subject = payload.subject      || 'Mathematics';
    const input   = payload.student_input || '';
    const responses = [
      `Great thinking, ${name}! 🌟 You're exploring this really well. Let me ask you — if you had 3 groups of 4 apples, how many apples would you have in total? What do you think?`,
      `Interesting! 💪 Let's think step by step. What happens when you count 4 + 4 + 4? Can you work that out?`,
      `Excellent effort! 🎉 You're right! Now a bigger challenge — what is 5 × 6? Think of it as 5 groups of 6 things.`,
      `Perfect! ⭐ You're doing brilliantly in ${subject}! Can you tell me why this is useful in real life?`,
      `Wonderful answer! 🧠 You clearly understand this. Ready to try something a bit harder?`,
    ];
    const pick  = responses[Math.floor(Math.random() * responses.length)];
    const score = 50 + Math.random() * 40;
    addMockMessage(sessionId, { role:'student', content:input });
    addMockMessage(sessionId, { role:'aria',    content:pick });
    return { data: { success:true, data: { response:pick, understanding_score:score, should_advance:score>80, difficulty:'MEDIUM', topic:subject } } };
  }
  return api.post(`/api/sessions/${sessionId}/chat`, payload);
}

// ─── PROGRESS ─────────────────────────────────────────────────
export async function getProgress(studentId) {
  if (DEMO) return mock(MOCK_PROGRESS.filter(p => p.studentId === studentId));
  return api.get(`/api/progress/student/${studentId}`);
}

// ─── DASHBOARD ────────────────────────────────────────────────
export async function getDashboard(teacherId) {
  if (DEMO) return mock(MOCK_DASHBOARD);
  return api.get(`/api/dashboard/teacher/${teacherId}`);
}

// ─── REPORTS ──────────────────────────────────────────────────
export async function generateReport(payload) {
  if (DEMO) { await delay(1800); return { data: { success:true, report:MOCK_REPORT } }; }
  return api.post('http://localhost:8001/report', payload);
}

export default api;
