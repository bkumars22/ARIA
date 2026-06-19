// ─── localStorage persistence helpers ───────────────────────
const LS = {
  get: (key, fallback) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set: (key, val)      => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
};

export const MOCK_TOKEN = "demo-aria-jwt-2026";

// ─── Default seed data ────────────────────────────────────────
const DEFAULT_USERS = [
  { id:1, username:'admin',   password:'Admin@2026',   role:'ADMIN',   fullName:'ARIA Admin',    language:'en', email:'admin@aria.edu' },
  { id:2, username:'teacher', password:'Teacher@2026', role:'TEACHER', fullName:'Priya Sharma',  language:'en', email:'priya@aria.edu' },
  { id:3, username:'parent1', password:'Parent@2026',  role:'PARENT',  fullName:'Raj Kumar',     language:'hi', email:'raj@aria.edu' },
  { id:4, username:'parent2', password:'Parent@2026',  role:'PARENT',  fullName:'Sunita Johnson',language:'en', email:'sunita@aria.edu' },
];

const DEFAULT_STUDENTS = [
  { id:1, studentCode:'STU-001', fullName:'Ananya Kumar',  age:9,  grade:3, language:'hi', parentId:3, teacherId:2 },
  { id:2, studentCode:'STU-002', fullName:'Rahul Sharma',  age:12, grade:6, language:'en', parentId:3, teacherId:2 },
  { id:3, studentCode:'STU-003', fullName:'Emma Johnson',  age:15, grade:9, language:'en', parentId:4, teacherId:2 },
  { id:4, studentCode:'STU-004', fullName:'Fatima Hassan', age:7,  grade:2, language:'en', parentId:4, teacherId:2 },
];

const DEFAULT_SESSIONS = [
  { id:1, sessionCode:'SES-001', studentId:1, subject:'Mathematics', status:'COMPLETED', totalMessages:12, understandingScore:78 },
  { id:2, sessionCode:'SES-002', studentId:2, subject:'Science',     status:'COMPLETED', totalMessages:8,  understandingScore:65 },
  { id:3, sessionCode:'SES-003', studentId:3, subject:'English',     status:'ACTIVE',    totalMessages:5,  understandingScore:82 },
  { id:4, sessionCode:'SES-004', studentId:4, subject:'Mathematics', status:'COMPLETED', totalMessages:10, understandingScore:54 },
  { id:5, sessionCode:'SES-005', studentId:1, subject:'Science',     status:'COMPLETED', totalMessages:14, understandingScore:71 },
];

const DEFAULT_PROGRESS = [
  { id:1, studentId:1, moduleId:1, masteryLevel:'MASTERED',   score:88, attempts:5 },
  { id:2, studentId:1, moduleId:2, masteryLevel:'PRACTISING', score:62, attempts:3 },
  { id:3, studentId:2, moduleId:7, masteryLevel:'MASTERED',   score:91, attempts:4 },
  { id:4, studentId:2, moduleId:8, masteryLevel:'LEARNING',   score:45, attempts:2 },
  { id:5, studentId:3, moduleId:9, masteryLevel:'PRACTISING', score:73, attempts:6 },
  { id:6, studentId:4, moduleId:1, masteryLevel:'LEARNING',   score:38, attempts:1 },
];

// ─── Load from localStorage (persists across refresh/reopen) ──
export let MOCK_USERS     = LS.get('aria_users',    DEFAULT_USERS);
export let MOCK_STUDENTS  = LS.get('aria_students', DEFAULT_STUDENTS);
export let MOCK_PROGRESS  = LS.get('aria_progress', DEFAULT_PROGRESS);

let _sessions         = LS.get('aria_sessions', DEFAULT_SESSIONS);
let _sessionIdCounter = LS.get('aria_sid_ctr',  100);
let _messages         = LS.get('aria_messages', {});

// ─── Save helpers (called after every mutation) ───────────────
export const saveUsers     = () => LS.set('aria_users',    MOCK_USERS);
export const saveStudents  = () => LS.set('aria_students', MOCK_STUDENTS);
export const saveProgress  = () => LS.set('aria_progress', MOCK_PROGRESS);
const saveSessions         = () => LS.set('aria_sessions', _sessions);
const saveMessages         = () => LS.set('aria_messages', _messages);
const saveSidCtr           = () => LS.set('aria_sid_ctr',  _sessionIdCounter);

// ─── Accessors ────────────────────────────────────────────────
export const mockStudents = () => [...MOCK_STUDENTS];
export const mockUsers    = () => MOCK_USERS.map(u => ({ ...u, password: undefined }));

export function getMockSessions()      { return _sessions; }
export function addMockSession(s)      { _sessions = [s, ..._sessions]; saveSessions(); }
export function getMockMessages(sid)   { return _messages[String(sid)] || []; }
export function addMockMessage(sid, m) {
  const k = String(sid);
  _messages[k] = [...(_messages[k] || []), m];
  saveMessages();
}
export function nextMockSessionId()    { _sessionIdCounter++; saveSidCtr(); return _sessionIdCounter; }

// ─── Reset all data to defaults (admin tool) ──────────────────
export function resetToDefaults() {
  MOCK_USERS    = [...DEFAULT_USERS];
  MOCK_STUDENTS = [...DEFAULT_STUDENTS];
  MOCK_PROGRESS = [...DEFAULT_PROGRESS];
  _sessions     = [...DEFAULT_SESSIONS];
  _messages     = {};
  _sessionIdCounter = 100;
  saveUsers(); saveStudents(); saveProgress(); saveSessions(); saveMessages(); saveSidCtr();
}

// ─── Dashboard stats (computed from live data) ────────────────
export function getMockDashboard() {
  return {
    totalStudents:         MOCK_STUDENTS.length,
    totalSessions:         _sessions.length,
    avgUnderstandingScore: Math.round(_sessions.reduce((s,x) => s + (x.understandingScore||0), 0) / (_sessions.length||1)),
    totalModulesMastered:  MOCK_PROGRESS.filter(p => p.masteryLevel === 'MASTERED').length,
    activeStudentsToday:   _sessions.filter(s => s.status === 'ACTIVE').length,
  };
}

// ─── Report template ──────────────────────────────────────────
export const MOCK_REPORT =
`Dear Parent / Guardian,

🌟 Wonderful progress to share about your child!

Your child has been working hard with ARIA this week. Here are the highlights:

📊 LEARNING SUMMARY
• Sessions completed: 5
• Average understanding score: 78/100
• Modules mastered: 2 ✅

🟢 STRONG AREAS
Your child shows excellent understanding of Multiplication and Basic Geometry. They explain concepts clearly and think logically — great signs of deep learning!

🟡 AREAS TO PRACTISE
Fractions need a little more practice. Try this at home: when cutting food (pizza, fruit), ask your child to name the fraction of each piece. It makes learning real and fun!

💡 ARIA'S TIP FOR THIS WEEK
Encourage your child to explain what they've learned to you — teaching someone else is the most powerful way to master a topic.

Keep up the fantastic support at home. Together we are building a lifelong learner! 💪

With warm regards,
ARIA — Adaptive Real-time Intelligence for Anyone
Your child's personalised AI learning companion`;
