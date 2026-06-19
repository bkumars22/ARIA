# ARIA — Complete Usage Guide

## Table of Contents
1. [Getting Started](#1-getting-started)
2. [Teacher Guide](#2-teacher-guide)
3. [Student Tutoring Session](#3-student-tutoring-session)
4. [Parent Guide](#4-parent-guide)
5. [Admin Guide](#5-admin-guide)
6. [Voice Features](#6-voice-features)
7. [Report Generation](#7-report-generation)
8. [Security & Sessions](#8-security--sessions)
9. [FAQ](#9-faq)

---

## 1. Getting Started

### Open the App
Visit: **https://bkumars22.github.io/ARIA/**

Works on any modern browser — Chrome, Firefox, Edge, Safari.  
No installation. No app download. Just open and use.

### Login Screen
You will see the ARIA login page with:
- Username field
- Password field
- **Sign In Securely** button
- Demo credentials shown at the bottom

**Security notice:** After 5 wrong password attempts, the account is locked for 5 minutes.

---

## 2. Teacher Guide

### Login
Username: `teacher` | Password: `Teacher@2026`

### Dashboard
After login you see the **Teacher Dashboard** with:
- Total Students enrolled
- Total Sessions completed
- Average Understanding Score
- Modules Mastered count
- Active Students Today

**Quick action cards:**
- ➕ Add Student
- 🤖 Start Tutoring
- 📝 Generate Report

### Managing Students
Click **Students** in the sidebar.

**Add a new student:**
1. Click **+ Add Student**
2. Fill in: Full Name, Age, Grade (1–12), Language, Student Code, Parent Email
3. Click **Add Student**
4. The student appears in the grid immediately

**Edit a student:**
1. Click ✏️ Edit on any student card
2. Modify any field
3. Click **Update**

**Delete a student:**
1. Click 🗑️ on the student card
2. Confirm the deletion

**Start a tutoring session:**
1. Click **🤖 Tutor** on any student card
2. You go to the subject selector for that student
3. Pick a subject and ARIA starts the session

**Search students:**
Type in the search bar to filter by name or student code.

### Viewing Sessions
Click **Sessions** in the sidebar to see:
- All sessions (Active and Completed)
- Session code, student name, subject, messages, score, status
- Filter by: All / Active / Completed
- Click **Resume** to re-enter an active session

---

## 3. Student Tutoring Session

### Starting a Session
1. Teacher clicks **Tutor** on a student card (or student logs in directly)
2. Subject selector appears — choose from:
   - 🔢 Mathematics
   - 🔬 Science
   - 📖 English
   - 💻 Coding
   - 🌱 Life Skills
3. Click the subject → ARIA greets the student in their language

### Chatting with ARIA
- ARIA asks a question first
- Student types an answer in the text box
- Press **Enter** or click the ➤ button to send
- ARIA responds with another guiding question (Socratic method)
- The **Understanding Score** at the top updates in real time

### Voice Input (Speak your answer)
1. Click the 🎤 microphone button
2. Speak your answer clearly
3. The text appears automatically in the input box
4. ARIA sends it (or you can edit first)

**Tip:** Works best in Google Chrome. Allow microphone access when prompted.

### Voice Output (ARIA speaks back)
ARIA automatically speaks every response using Text-to-Speech.  
The language matches the student's profile (Hindi, English, Tamil, etc.)

### Ending a Session
Click **End Session** button in the top-right.  
The final score is shown and a congratulations message plays.

---

## 4. Parent Guide

### Login
Username: `parent1` or `parent2` | Password: `Parent@2026`

### Home Dashboard
After login you see:
- Your child's total sessions
- Average score
- Modules mastered

### Viewing Progress
Click **Progress** in the sidebar.  
See each module your child has studied with:
- Score percentage
- Mastery level: ✅ Mastered / 🔄 Practising / 📚 Learning

### Reading Reports
Click **Reports** in the sidebar.  
Select your child → Click **Generate AI Report**.  

The report includes:
- Summary of the week's learning
- Strong areas where the child excels
- Areas needing more practice
- A home tip to reinforce learning

**Read Aloud:** Click 🔊 **Read Aloud** to have the report spoken out loud.  
**Copy:** Click 📋 to copy the report text.  
**Print:** Click 🖨️ to print or save as PDF.

---

## 5. Admin Guide

### Login
Username: `admin` | Password: `Admin@2026`

### Admin sees everything a Teacher sees, plus:

### User Management
Click **Users** in the sidebar (only visible to ADMIN).

**Add a new user:**
1. Click **+ Add User**
2. Fill in: Full Name, Username, Email, Password, Role, Language
3. Roles available: ADMIN, TEACHER, PARENT
4. Click **Create**

**Edit a user:**
1. Click **Edit** on any row
2. Change name, email, role, or language
3. Leave password blank to keep it unchanged
4. Click **Update**

**Remove a user:**
1. Click **Remove** on any row
2. Confirm deletion

**Role summary pills** at the top show count per role.

---

## 6. Voice Features

### Browser Support
| Browser | Voice Input | Voice Output |
|---------|-------------|--------------|
| Chrome  | ✅ Yes | ✅ Yes |
| Edge    | ✅ Yes | ✅ Yes |
| Firefox | ❌ No (mic) | ✅ Yes |
| Safari  | ✅ Yes (iOS 14.5+) | ✅ Yes |

### Enabling Microphone
First time using voice input:
1. Browser shows a permission popup
2. Click **Allow**
3. If you accidentally blocked it: Browser Settings → Site Settings → Microphone → Allow for this site

### Supported Languages (Voice)
- English (en-US, en-GB, en-IN)
- Hindi (hi-IN)
- Tamil (ta-IN)
- Spanish (es-ES, es-MX)
- Arabic (ar-SA)

---

## 7. Report Generation

Reports are written by **Claude AI (Anthropic)** — the same AI that powers ARIA's tutor.

**In demo mode:** A sample report is shown immediately.  
**In production mode:** The AI reads the student's actual session history and generates a personalised 3–4 paragraph report.

### Report contents:
1. **Greeting** — addresses the parent warmly
2. **Weekly Summary** — sessions count, average score
3. **Strong Areas** — topics the child handled well
4. **Needs Practice** — areas to focus on
5. **Home Tip** — one practical activity for the parent to do with the child
6. **Sign-off** — from ARIA

---

## 8. Security & Sessions

### JWT Tokens
Every login creates a JSON Web Token (JWT) that:
- Expires in 24 hours
- Is stored in sessionStorage (cleared when browser tab closes)
- Is sent in every API request as a Bearer token

### Session Timeout
- Sessions auto-expire after **30 minutes of inactivity**
- You will be redirected to the login page automatically

### Rate Limiting
- After **5 failed login attempts**, the account is locked for **5 minutes**
- A countdown timer shows the remaining lockout time

### Logout
Click **🚪 Logout** at the bottom of the sidebar.  
This clears all session data immediately.

---

## 9. FAQ

**Q: Can multiple students use ARIA at the same time?**  
A: Yes — in production mode with the full backend, unlimited concurrent users are supported.

**Q: Is student data private?**  
A: Yes. Each teacher only sees their own students. Parents only see their own child. Data is never shared.

**Q: Does ARIA give answers to homework?**  
A: No. ARIA is designed to never give direct answers. It only asks guiding questions.

**Q: What grade levels does ARIA support?**  
A: Grades 1–12 (Ages 5–18). ARIA adapts its language and difficulty to the student's grade.

**Q: Can I use ARIA in Hindi or Tamil?**  
A: Yes. Set the student's language when adding them. ARIA greets and responds in that language.

**Q: Is ARIA free?**  
A: Yes. The demo at GitHub Pages is completely free. The full-stack version requires a server and an Anthropic API key (pay-per-use, very affordable).

**Q: How do I add more students?**  
A: Teachers can add unlimited students via the Students page → + Add Student.

**Q: Can I share the demo URL with parents?**  
A: Yes! Share https://bkumars22.github.io/ARIA/ with anyone. They log in with credentials you give them.
