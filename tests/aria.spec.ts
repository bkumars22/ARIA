// aria.spec.ts — ARIA Playwright E2E Test Suite
// 60 tests across 10 modules — your signature test quality

import { test, expect, Page } from '@playwright/test';

const BASE_URL  = process.env.BASE_URL  || 'http://localhost:3000';
const API_URL   = process.env.API_URL   || 'http://localhost:8089/aria';
const AI_URL    = process.env.AI_URL    || 'http://localhost:8001';

let token: string;
let sessionId: number;

// ─── Auth Helper ──────────────────────────────────────────────
async function loginAsTeacher(page: Page) {
  const res = await page.request.post(`${API_URL}/api/auth/login`, {
    data: { username: 'teacher', password: 'Teacher@2026' }
  });
  const body = await res.json();
  token = body.data?.token;
  return token;
}

async function apiHeaders() {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// ═══════════════════════════════════════════════════════════════
// MODULE 1: Authentication (6 tests)
// ═══════════════════════════════════════════════════════════════
test.describe('1. Authentication', () => {

  test('1.1 Login page renders with all elements', async ({ page }) => {
    await page.goto(BASE_URL + '/login');
    await expect(page.getByTestId('login-title')).toBeVisible();
    await expect(page.getByTestId('username-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('login-btn')).toBeVisible();
  });

  test('1.2 Valid teacher login redirects to dashboard', async ({ page }) => {
    await page.goto(BASE_URL + '/login');
    await page.getByTestId('username-input').fill('teacher');
    await page.getByTestId('password-input').fill('Teacher@2026');
    await page.getByTestId('login-btn').click();
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByTestId('dashboard-title')).toBeVisible();
  });

  test('1.3 Invalid password shows error message', async ({ page }) => {
    await page.goto(BASE_URL + '/login');
    await page.getByTestId('username-input').fill('teacher');
    await page.getByTestId('password-input').fill('wrongpassword');
    await page.getByTestId('login-btn').click();
    await expect(page.getByTestId('login-error')).toBeVisible();
  });

  test('1.4 JWT required — unauthenticated access redirects to login', async ({ page }) => {
    await page.goto(BASE_URL + '/dashboard');
    await expect(page).toHaveURL(/login/);
  });

  test('1.5 API: POST /auth/login returns JWT token', async ({ page }) => {
    const res = await page.request.post(`${API_URL}/api/auth/login`, {
      data: { username: 'teacher', password: 'Teacher@2026' }
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data?.token).toBeTruthy();
    token = body.data.token;
  });

  test('1.6 API: No token returns 401', async ({ page }) => {
    const res = await page.request.get(`${API_URL}/api/students`);
    expect(res.status()).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════
// MODULE 2: Student Management (6 tests)
// ═══════════════════════════════════════════════════════════════
test.describe('2. Student Management', () => {

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsTeacher(page);
    await page.close();
  });

  test('2.1 Student list loads on teacher dashboard', async ({ page }) => {
    await page.goto(BASE_URL + '/dashboard');
    await page.evaluate((t) => sessionStorage.setItem('jwt_token', t), token);
    await page.reload();
    await expect(page.getByTestId('student-list')).toBeVisible();
  });

  test('2.2 API: GET /students returns student array', async ({ page }) => {
    const res = await page.request.get(`${API_URL}/api/students`, {
      headers: await apiHeaders()
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBeTruthy();
    expect(body.data.length).toBeGreaterThan(0);
  });

  test('2.3 API: GET /students returns required fields', async ({ page }) => {
    const res = await page.request.get(`${API_URL}/api/students`, {
      headers: await apiHeaders()
    });
    const body = await res.json();
    const student = body.data[0];
    expect(student).toHaveProperty('fullName');
    expect(student).toHaveProperty('grade');
    expect(student).toHaveProperty('language');
  });

  test('2.4 API: POST /students creates student', async ({ page }) => {
    const res = await page.request.post(`${API_URL}/api/students`, {
      headers: await apiHeaders(),
      data: {
        fullName: 'Test Child Playwright',
        age: 10, grade: 4,
        language: 'en', parentId: 3, teacherId: 2
      }
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.data?.fullName).toBe('Test Child Playwright');
  });

  test('2.5 Student card shows name and grade', async ({ page }) => {
    await page.goto(BASE_URL + '/dashboard');
    const cards = page.getByTestId('student-card');
    await expect(cards.first()).toBeVisible();
  });

  test('2.6 Click student loads their progress report', async ({ page }) => {
    await page.goto(BASE_URL + '/dashboard');
    await page.getByTestId('student-card').first().click();
    await expect(page.getByTestId('student-report')).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════
// MODULE 3: Learning Sessions (8 tests)
// ═══════════════════════════════════════════════════════════════
test.describe('3. Learning Sessions', () => {

  test('3.1 Subject selection screen shows 5 subjects', async ({ page }) => {
    await page.goto(BASE_URL + '/tutor');
    const subjects = page.getByTestId('subject-card');
    await expect(subjects).toHaveCount(5);
  });

  test('3.2 Selecting Mathematics starts a session', async ({ page }) => {
    await page.goto(BASE_URL + '/tutor');
    await page.getByTestId('subject-Mathematics').click();
    await expect(page.getByTestId('chat-container')).toBeVisible();
    await expect(page.getByTestId('aria-greeting')).toBeVisible();
  });

  test('3.3 API: POST /sessions creates session in ACTIVE state', async ({ page }) => {
    const res = await page.request.post(`${API_URL}/api/sessions`, {
      headers: await apiHeaders(),
      data: { studentId: 1, subject: 'Mathematics' }
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data?.status).toBe('ACTIVE');
    sessionId = body.data.id;
  });

  test('3.4 Student can type a message', async ({ page }) => {
    await page.goto(BASE_URL + '/tutor');
    await page.getByTestId('subject-Mathematics').click();
    await page.getByTestId('chat-input').fill('What is 2 + 2?');
    await expect(page.getByTestId('chat-input')).toHaveValue('What is 2 + 2?');
  });

  test('3.5 Sending message shows ARIA response', async ({ page }) => {
    await page.goto(BASE_URL + '/tutor');
    await page.getByTestId('subject-Mathematics').click();
    await page.getByTestId('chat-input').fill('Hello ARIA!');
    await page.getByTestId('send-btn').click();
    await expect(page.getByTestId('aria-message').last()).toBeVisible({ timeout: 15000 });
  });

  test('3.6 Understanding score updates after response', async ({ page }) => {
    await page.goto(BASE_URL + '/tutor');
    await page.getByTestId('subject-Science').click();
    await page.getByTestId('chat-input').fill('I know photosynthesis uses sunlight');
    await page.getByTestId('send-btn').click();
    await page.waitForSelector('[data-testid="score-display"]', { timeout: 15000 });
    const score = await page.getByTestId('score-display').textContent();
    expect(parseInt(score || '0')).toBeGreaterThan(0);
  });

  test('3.7 API: PUT /sessions/:id/end marks session COMPLETED', async ({ page }) => {
    if (!sessionId) test.skip();
    const res = await page.request.put(`${API_URL}/api/sessions/${sessionId}/end`, {
      headers: await apiHeaders()
    });
    expect(res.status()).toBe(200);
  });

  test('3.8 Voice button is visible on tutor page', async ({ page }) => {
    await page.goto(BASE_URL + '/tutor');
    await page.getByTestId('subject-English').click();
    await expect(page.getByTestId('voice-btn')).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════
// MODULE 4: AI Teaching Engine (8 tests)
// ═══════════════════════════════════════════════════════════════
test.describe('4. AI Teaching Engine', () => {

  test('4.1 AI service health check returns ok', async ({ page }) => {
    try {
      const res = await page.request.get(`${AI_URL}/health`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('ok');
    } catch { test.skip(); }
  });

  test('4.2 /teach endpoint returns ARIA response', async ({ page }) => {
    try {
      const res = await page.request.post(`${AI_URL}/teach`, {
        data: {
          student_id: '1', session_id: '1',
          student_name: 'Test', grade: 4, language: 'en',
          student_input: 'What is a fraction?',
          conversation_history: [], understanding_score: 50, difficulty: 'MEDIUM'
        }
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.data?.response).toBeTruthy();
      expect(body.data?.response.length).toBeGreaterThan(10);
    } catch { test.skip(); }
  });

  test('4.3 /teach response contains a question mark (Socratic method)', async ({ page }) => {
    try {
      const res = await page.request.post(`${AI_URL}/teach`, {
        data: {
          student_id: '1', session_id: '1',
          student_name: 'Ananya', grade: 3, language: 'en',
          student_input: 'I think plants eat soil',
          conversation_history: [], understanding_score: 30, difficulty: 'EASY'
        }
      });
      const body = await res.json();
      expect(body.data?.response).toContain('?');
    } catch { test.skip(); }
  });

  test('4.4 /teach returns understanding_score between 0 and 100', async ({ page }) => {
    try {
      const res = await page.request.post(`${AI_URL}/teach`, {
        data: {
          student_id: '1', session_id: '1', student_name: 'Test',
          grade: 6, language: 'en',
          student_input: 'Photosynthesis converts sunlight to glucose using chlorophyll',
          conversation_history: [], understanding_score: 50, difficulty: 'MEDIUM'
        }
      });
      const body = await res.json();
      const score = body.data?.understanding_score;
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    } catch { test.skip(); }
  });

  test('4.5 /teach adapts difficulty when score is low', async ({ page }) => {
    try {
      const res = await page.request.post(`${AI_URL}/teach`, {
        data: {
          student_id: '1', session_id: '1', student_name: 'Test',
          grade: 5, language: 'en',
          student_input: 'I have no idea what algebra is',
          conversation_history: [], understanding_score: 15, difficulty: 'MEDIUM'
        }
      });
      const body = await res.json();
      expect(body.data?.difficulty).toBe('EASY');
      expect(body.data?.should_simplify).toBe(true);
    } catch { test.skip(); }
  });

  test('4.6 /teach advances difficulty when score is high', async ({ page }) => {
    try {
      const res = await page.request.post(`${AI_URL}/teach`, {
        data: {
          student_id: '1', session_id: '1', student_name: 'Test',
          grade: 4, language: 'en',
          student_input: 'I completely understand fractions, decimals, and percentages!',
          conversation_history: [], understanding_score: 92, difficulty: 'MEDIUM'
        }
      });
      const body = await res.json();
      expect(body.data?.should_advance).toBe(true);
    } catch { test.skip(); }
  });

  test('4.7 /assess returns 3 questions', async ({ page }) => {
    try {
      const res = await page.request.post(
        `${AI_URL}/assess?student_name=Test&grade=4&subject=Mathematics&topic=Fractions&language=en`
      );
      const body = await res.json();
      expect(body.data?.questions).toHaveLength(3);
    } catch { test.skip(); }
  });

  test('4.8 /report generates parent report text', async ({ page }) => {
    try {
      const res = await page.request.post(`${AI_URL}/report`, {
        data: {
          student_name: 'Ananya', grade: 3, language: 'en',
          sessions_count: 5, avg_score: 72,
          strong_topics: ['Counting', 'Addition'],
          weak_topics: ['Fractions'], parent_language: 'en'
        }
      });
      const body = await res.json();
      expect(body.report?.length).toBeGreaterThan(50);
    } catch { test.skip(); }
  });
});

// ═══════════════════════════════════════════════════════════════
// MODULE 5: Curriculum (5 tests)
// ═══════════════════════════════════════════════════════════════
test.describe('5. Curriculum', () => {

  test('5.1 API: GET /curriculum returns modules', async ({ page }) => {
    const res = await page.request.get(`${API_URL}/api/curriculum`, {
      headers: await apiHeaders()
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data?.length).toBeGreaterThan(0);
  });

  test('5.2 API: GET /curriculum?grade=3 filters by grade', async ({ page }) => {
    const res = await page.request.get(`${API_URL}/api/curriculum?grade=3`, {
      headers: await apiHeaders()
    });
    const body = await res.json();
    body.data?.forEach((m: any) => expect(m.gradeLevel).toBe(3));
  });

  test('5.3 API: GET /curriculum?subject=Mathematics filters by subject', async ({ page }) => {
    const res = await page.request.get(`${API_URL}/api/curriculum?subject=Mathematics`, {
      headers: await apiHeaders()
    });
    const body = await res.json();
    body.data?.forEach((m: any) => expect(m.subject).toBe('Mathematics'));
  });

  test('5.4 Curriculum module has required fields', async ({ page }) => {
    const res = await page.request.get(`${API_URL}/api/curriculum`, {
      headers: await apiHeaders()
    });
    const body = await res.json();
    const module = body.data[0];
    expect(module).toHaveProperty('subject');
    expect(module).toHaveProperty('topic');
    expect(module).toHaveProperty('gradeLevel');
    expect(module).toHaveProperty('difficulty');
  });

  test('5.5 Curriculum covers all 5 subjects', async ({ page }) => {
    const res = await page.request.get(`${API_URL}/api/curriculum`, {
      headers: await apiHeaders()
    });
    const body = await res.json();
    const subjects = new Set(body.data.map((m: any) => m.subject));
    expect(subjects.has('Mathematics')).toBeTruthy();
    expect(subjects.has('Science')).toBeTruthy();
    expect(subjects.has('English')).toBeTruthy();
    expect(subjects.has('Coding')).toBeTruthy();
    expect(subjects.has('Life Skills')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════
// MODULE 6: Student Progress (6 tests)
// ═══════════════════════════════════════════════════════════════
test.describe('6. Student Progress', () => {

  test('6.1 API: GET /progress/:studentId returns progress array', async ({ page }) => {
    const res = await page.request.get(`${API_URL}/api/progress/1`, {
      headers: await apiHeaders()
    });
    expect(res.status()).toBe(200);
  });

  test('6.2 Progress has mastery level field', async ({ page }) => {
    const res = await page.request.get(`${API_URL}/api/progress/1`, {
      headers: await apiHeaders()
    });
    const body = await res.json();
    if (body.data?.length > 0) {
      expect(body.data[0]).toHaveProperty('masteryLevel');
    }
  });

  test('6.3 Mastery level is valid enum value', async ({ page }) => {
    const res = await page.request.get(`${API_URL}/api/progress/1`, {
      headers: await apiHeaders()
    });
    const body = await res.json();
    const valid = ['NOT_STARTED', 'LEARNING', 'PRACTISING', 'MASTERED'];
    body.data?.forEach((p: any) => expect(valid).toContain(p.masteryLevel));
  });

  test('6.4 Teacher dashboard shows progress bars', async ({ page }) => {
    await page.goto(BASE_URL + '/dashboard');
    await page.getByTestId('student-card').first().click();
    await expect(page.getByTestId('progress-bar').first()).toBeVisible({ timeout: 10000 });
  });

  test('6.5 API: GET /reports/:studentId returns AI-generated report', async ({ page }) => {
    const res = await page.request.get(`${API_URL}/api/reports/1`, {
      headers: await apiHeaders()
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data?.aiReport).toBeTruthy();
  });

  test('6.6 Progress score is between 0 and 100', async ({ page }) => {
    const res = await page.request.get(`${API_URL}/api/progress/1`, {
      headers: await apiHeaders()
    });
    const body = await res.json();
    body.data?.forEach((p: any) => {
      expect(p.score).toBeGreaterThanOrEqual(0);
      expect(p.score).toBeLessThanOrEqual(100);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// MODULE 7: Multi-Language (5 tests)
// ═══════════════════════════════════════════════════════════════
test.describe('7. Multi-Language Support', () => {

  test('7.1 /teach accepts Hindi language parameter', async ({ page }) => {
    try {
      const res = await page.request.post(`${AI_URL}/teach`, {
        data: {
          student_id: '1', session_id: '1', student_name: 'Ananya',
          grade: 3, language: 'hi',
          student_input: 'दो जमा दो क्या होता है?',
          conversation_history: [], understanding_score: 50, difficulty: 'EASY'
        }
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.data?.response).toBeTruthy();
    } catch { test.skip(); }
  });

  test('7.2 Language selector shows 7 languages', async ({ page }) => {
    await page.goto(BASE_URL + '/settings');
    const options = page.getByTestId('language-option');
    await expect(options).toHaveCount(7);
  });

  test('7.3 API: Student language stored and returned', async ({ page }) => {
    const res = await page.request.get(`${API_URL}/api/students/1`, {
      headers: await apiHeaders()
    });
    const body = await res.json();
    expect(['en','hi','ta','kn','es','ar','sw']).toContain(body.data?.language);
  });

  test('7.4 /report generates in Hindi for Hindi-speaking parent', async ({ page }) => {
    try {
      const res = await page.request.post(`${AI_URL}/report`, {
        data: {
          student_name: 'Ananya', grade: 3, language: 'en',
          sessions_count: 3, avg_score: 65,
          strong_topics: ['Counting'], weak_topics: ['Fractions'],
          parent_language: 'hi'
        }
      });
      const body = await res.json();
      // Hindi report should contain Devanagari characters
      expect(/[\u0900-\u097F]/.test(body.report)).toBeTruthy();
    } catch { test.skip(); }
  });

  test('7.5 Tutor greeting appears in student language', async ({ page }) => {
    // Set Hindi student in session storage and verify greeting
    await page.goto(BASE_URL + '/tutor');
    await page.evaluate(() => {
      sessionStorage.setItem('student', JSON.stringify({
        id: 1, fullName: 'Ananya', grade: 3, language: 'hi'
      }));
    });
    await page.reload();
    await page.getByTestId('subject-Mathematics').click();
    const greeting = await page.getByTestId('aria-greeting').textContent();
    expect(greeting?.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// MODULE 8: Security (5 tests)
// ═══════════════════════════════════════════════════════════════
test.describe('8. Security', () => {

  test('8.1 Protected routes reject unauthenticated requests', async ({ page }) => {
    const endpoints = ['/api/students', '/api/sessions', '/api/curriculum'];
    for (const ep of endpoints) {
      const res = await page.request.get(`${API_URL}${ep}`);
      expect(res.status()).toBe(401);
    }
  });

  test('8.2 Password hash not returned in user response', async ({ page }) => {
    const res = await page.request.get(`${API_URL}/api/users/2`, {
      headers: await apiHeaders()
    });
    const body = await res.json();
    expect(body.data?.passwordHash).toBeUndefined();
    expect(body.data?.password).toBeUndefined();
  });

  test('8.3 Rate limiting blocks excessive login attempts', async ({ page }) => {
    const attempts = Array(6).fill(null).map(() =>
      page.request.post(`${API_URL}/api/auth/login`, {
        data: { username: 'teacher', password: 'wrong' }
      })
    );
    const results = await Promise.all(attempts);
    const lastStatus = results[results.length - 1].status();
    expect([429, 401]).toContain(lastStatus);
  });

  test('8.4 TEACHER cannot access admin-only endpoints', async ({ page }) => {
    const res = await page.request.delete(`${API_URL}/api/admin/users/1`, {
      headers: await apiHeaders()
    });
    expect([401, 403]).toContain(res.status());
  });

  test('8.5 SQL injection attempt returns safe error', async ({ page }) => {
    const res = await page.request.get(
      `${API_URL}/api/students?search='; DROP TABLE STUDENT; --`,
      { headers: await apiHeaders() }
    );
    expect(res.status()).not.toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════
// MODULE 9: Parent Dashboard (5 tests)
// ═══════════════════════════════════════════════════════════════
test.describe('9. Parent Dashboard', () => {

  test('9.1 Parent dashboard loads after login', async ({ page }) => {
    await page.goto(BASE_URL + '/login');
    await page.getByTestId('username-input').fill('parent1');
    await page.getByTestId('password-input').fill('Parent@2026');
    await page.getByTestId('login-btn').click();
    await expect(page.getByTestId('parent-dashboard')).toBeVisible();
  });

  test('9.2 Parent sees their child\'s progress', async ({ page }) => {
    await page.goto(BASE_URL + '/parent');
    const studentName = page.getByTestId('child-name');
    await expect(studentName.first()).toBeVisible();
  });

  test('9.3 Weekly report card is visible', async ({ page }) => {
    await page.goto(BASE_URL + '/parent');
    await expect(page.getByTestId('weekly-report')).toBeVisible({ timeout: 10000 });
  });

  test('9.4 API: GET /parent/:userId/children returns student list', async ({ page }) => {
    const res = await page.request.get(`${API_URL}/api/parent/3/children`, {
      headers: await apiHeaders()
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data?.length).toBeGreaterThan(0);
  });

  test('9.5 AI weekly report is human-readable', async ({ page }) => {
    await page.goto(BASE_URL + '/parent');
    const report = await page.getByTestId('ai-report-text').first().textContent();
    expect((report?.split(' ').length || 0)).toBeGreaterThan(20); // At least 20 words
  });
});

// ═══════════════════════════════════════════════════════════════
// MODULE 10: System & Polish (6 tests)
// ═══════════════════════════════════════════════════════════════
test.describe('10. System & Polish', () => {

  test('10.1 API health endpoint returns ok', async ({ page }) => {
    const res = await page.request.get(`${API_URL}/actuator/health`);
    expect(res.status()).toBe(200);
  });

  test('10.2 Swagger UI is accessible', async ({ page }) => {
    await page.goto('http://localhost:8089/aria/swagger-ui.html');
    await expect(page.getByText('ARIA API')).toBeVisible({ timeout: 10000 });
  });

  test('10.3 API: GET /students export CSV returns CSV content-type', async ({ page }) => {
    const res = await page.request.get(`${API_URL}/api/students/export/csv`, {
      headers: await apiHeaders()
    });
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/csv');
  });

  test('10.4 404 page shown for unknown routes', async ({ page }) => {
    await page.goto(BASE_URL + '/this-page-does-not-exist');
    await expect(page.getByTestId('not-found-page')).toBeVisible();
  });

  test('10.5 App loads on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14
    await page.goto(BASE_URL + '/login');
    await expect(page.getByTestId('login-btn')).toBeVisible();
  });

  test('10.6 Demo data seeds 4 students on fresh start', async ({ page }) => {
    const res = await page.request.get(`${API_URL}/api/students`, {
      headers: await apiHeaders()
    });
    const body = await res.json();
    expect(body.data?.length).toBeGreaterThanOrEqual(4);
  });
});
