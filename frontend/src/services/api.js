import axios from 'axios';
import { LESSONS, MENTOR } from './lessonData.js';
import { BOARD_LESSONS, BOARD_INTRO } from './boardData.js';
import { findAnswer, isConfused } from './qaEngine.js';
import {
  MOCK_TOKEN, MOCK_STUDENTS, MOCK_PROGRESS,
  MOCK_USERS, getMockSessions, addMockSession,
  getMockMessages, addMockMessage, nextMockSessionId, MOCK_REPORT,
  mockStudents, mockUsers, getMockDashboard,
  saveStudents, saveUsers,
} from './mockData';

const DEMO    = process.env.REACT_APP_DEMO_MODE === 'true';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8089/aria';

// Direct AI service URL — when set, real document uploads skip demo mode
// and call Claude AI directly from the browser via the deployed FastAPI service.
// Set REACT_APP_AI_SERVICE_URL=https://your-service.onrender.com in .env.production
const AI_SVC  = process.env.REACT_APP_AI_SERVICE_URL || '';
const aiSvc   = AI_SVC ? axios.create({ baseURL: AI_SVC }) : null;

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
    if (u) return { data: { success: true, data: { ...u, userId: u.id, token: MOCK_TOKEN } } };
    throw { response: { status: 401 } };
  }
  return api.post('/api/auth/login', { username, password });
}

// ─── CURRENT USER (from sessionStorage) ──────────────────────
const currentUser = () => JSON.parse(sessionStorage.getItem('aria_user') || '{}');

// ─── STUDENTS ─────────────────────────────────────────────────
export async function getStudents() {
  if (DEMO) {
    const u = currentUser();
    const all = mockStudents();
    // Parents only see their own children — no cross-parent data leakage
    if (u.role === 'PARENT') return mock(all.filter(s => s.parentId === u.userId));
    return mock(all);
  }
  return api.get('/api/students');
}
export async function getStudentsByTeacher(teacherId) {
  if (DEMO) {
    const u = currentUser();
    const all = mockStudents();
    if (u.role === 'PARENT') return mock(all.filter(s => s.parentId === u.userId));
    return mock(all);
  }
  return api.get(`/api/students/teacher/${teacherId}`);
}
export async function createStudent(data) {
  if (DEMO) {
    const id = nextId();
    const s  = { ...data, id, studentCode: `STU-${String(id).padStart(3,'0')}` };
    MOCK_STUDENTS.push(s); saveStudents();
    return mock(s, 300);
  }
  return api.post('/api/students', data);
}
export async function updateStudent(id, data) {
  if (DEMO) {
    const i = MOCK_STUDENTS.findIndex(s => s.id === id);
    if (i >= 0) { MOCK_STUDENTS[i] = { ...MOCK_STUDENTS[i], ...data }; saveStudents(); }
    return mock(MOCK_STUDENTS[i], 300);
  }
  return api.put(`/api/students/${id}`, data);
}
export async function deleteStudent(id) {
  if (DEMO) {
    const i = MOCK_STUDENTS.findIndex(s => s.id === id);
    if (i >= 0) { MOCK_STUDENTS.splice(i, 1); saveStudents(); }
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
    MOCK_USERS.push(u); saveUsers();
    return mock(u, 300);
  }
  return api.post('/api/users', data);
}
export async function updateUser(id, data) {
  if (DEMO) {
    const i = MOCK_USERS.findIndex(u => u.id === id);
    if (i >= 0) { MOCK_USERS[i] = { ...MOCK_USERS[i], ...data }; saveUsers(); }
    return mock(MOCK_USERS[i], 300);
  }
  return api.put(`/api/users/${id}`, data);
}
export async function deleteUser(id) {
  if (DEMO) {
    const i = MOCK_USERS.findIndex(u => u.id === id);
    if (i >= 0) { MOCK_USERS.splice(i, 1); saveUsers(); }
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
  if (DEMO) {
    const u   = currentUser();
    const all = getMockSessions();
    // Parents only see sessions for their own children
    if (u.role === 'PARENT') {
      const myKids = mockStudents().filter(s => s.parentId === u.userId).map(s => s.id);
      return mock(all.filter(s => myKids.includes(s.studentId)));
    }
    return mock(all.filter(s => !studentId || s.studentId === studentId));
  }
  return api.get('/api/sessions', { params: { studentId } });
}

// ─── CHAT TEACHING ENGINE (Demo mode) ────────────────────────

const _sessionState = new Map();

const _REMOVE_START = {
  Mathematics: [
    {
      topic: 'Addition',
      teach: (n) => `Hi ${n}! Let's start with **Addition** ➕\n\nAddition means combining numbers together.\n\n📖 **Example:**\n• 3 + 4 = 7\n• Think of it as: you have 3 apples 🍎🍎🍎 and someone gives you 4 more 🍎🍎🍎🍎 — now you have **7 apples**!\n\n✏️ **Your turn:** What is **8 + 5** = ?`,
      check: (s) => /13/.test(s),
      correct: (n) => `✅ Excellent, ${n}! **8 + 5 = 13** — perfect!\n\n🧮 How to check: 8 + 2 = 10, then 10 + 3 = 13. Breaking it into steps makes big sums easy!\n\n✏️ **Next:** What is **15 + 7** = ?`,
      wrong: () => `Almost! Let me show you:\n\n8 + 5 → count 5 steps from 8:\n8 → 9 → 10 → 11 → 12 → **13** ✓\n\nSo **8 + 5 = 13** 😊\n\n✏️ **Try this:** What is **6 + 9** = ?`,
      nextCheck: (s) => /15/.test(s),
      nextCorrect: (n) => `🌟 Brilliant, ${n}! **6 + 9 = 15** ✓\n\nYou're doing great at Addition! Ready for the next topic?`,
      nextWrong: () => `Not quite — **6 + 9 = 15**.\nTip: 6 + 4 = 10, then 10 + 5 = 15 ✓\n\nYou've got this! Let's move on.`,
    },
    {
      topic: 'Multiplication',
      teach: (n) => `Great job, ${n}! Now let's learn **Multiplication** ✖️\n\nMultiplication is a shortcut for adding the same number many times.\n\n📖 **Example:**\n• 3 × 4 = 12\n• This means: 3 groups of 4 → 4 + 4 + 4 = **12**\n\nThink of 3 rows of 4 stars: ⭐⭐⭐⭐ / ⭐⭐⭐⭐ / ⭐⭐⭐⭐ = 12 stars!\n\n✏️ **Your turn:** What is **4 × 5** = ?`,
      check: (s) => /20/.test(s),
      correct: (n) => `🎉 Correct, ${n}! **4 × 5 = 20** — well done!\n\n4 groups of 5: 5 + 5 + 5 + 5 = 20 ✓\n\n✏️ **Challenge:** What is **7 × 3** = ?`,
      wrong: () => `Good try! Here's the working:\n4 × 5 = 5 + 5 + 5 + 5 = **20** ✓\n\n✏️ **Try again:** What is **3 × 6** = ?`,
      nextCheck: (s) => /21|18/.test(s),
      nextCorrect: (n) => `⭐ Excellent, ${n}! You've mastered multiplication basics! Great work!`,
      nextWrong: () => `The answer is **7 × 3 = 21** (7 + 7 + 7 = 21). Keep practising — you'll get it! 💪`,
    },
    {
      topic: 'Division',
      teach: (n) => `You're doing amazing, ${n}! Let's learn **Division** ÷\n\nDivision means sharing equally.\n\n📖 **Example:**\n• 12 ÷ 4 = 3\n• Imagine 12 chocolates 🍫 shared equally among 4 friends — each friend gets **3 chocolates**!\n\n✏️ **Your turn:** What is **15 ÷ 3** = ?`,
      check: (s) => /5/.test(s),
      correct: (n) => `✅ Perfect, ${n}! **15 ÷ 3 = 5** ✓\n\n15 items shared among 3 = 5 each. Spot on!\n\n✏️ **Next:** What is **24 ÷ 6** = ?`,
      wrong: () => `Let me help!\n15 ÷ 3 means: how many 3s fit in 15?\n3, 6, 9, 12, **15** → that's 5 threes.\nSo **15 ÷ 3 = 5** 😊\n\n✏️ **Try:** What is **20 ÷ 4** = ?`,
      nextCheck: (s) => /4|5/.test(s),
      nextCorrect: (n) => `🌟 Wonderful, ${n}! You understand division perfectly! You're a maths star! ⭐`,
      nextWrong: () => `**24 ÷ 6 = 4** (6 × 4 = 24). Division and multiplication are opposite operations — great connection! 🧠`,
    },
    {
      topic: 'Fractions',
      teach: (n) => `Hi ${n}! Let's explore **Fractions** 🍕\n\nA fraction shows a part of a whole.\n\n📖 **Example:**\n• ½ means 1 part out of 2 equal parts\n• If you cut a pizza into 4 equal slices and eat 1 slice, you ate **¼** (one quarter) of the pizza! 🍕\n\n✏️ **Question:** If a cake is cut into 8 equal pieces and you eat 3 pieces, what fraction did you eat?\n(Write it as: number/total, like 3/8)`,
      check: (s) => /3\/8|3.8|three.eighth/.test(s.toLowerCase()),
      correct: (n) => `🎉 Brilliant, ${n}! **3/8** is exactly right!\n\nYou ate 3 pieces out of 8 total = **three-eighths** of the cake!\n\n✏️ **Next:** Which is bigger — ½ or ¼?`,
      wrong: () => `Great attempt! The answer is **3/8**.\n• Top number (numerator) = pieces you ate = 3\n• Bottom number (denominator) = total pieces = 8\n• So: **3/8** ✓\n\n✏️ **Now:** Which is bigger — ½ or ¼?`,
      nextCheck: (s) => /half|1\/2|one.half|½/.test(s.toLowerCase()),
      nextCorrect: (n) => `✅ Correct, ${n}! **½ is bigger than ¼**!\nImagine cutting a pizza: half (½) is a big piece, quarter (¼) is a smaller piece. 🍕 Well done!`,
      nextWrong: () => `**½ is bigger!** Think of it this way: ½ = 4/8 and ¼ = 2/8. Since 4 > 2, one-half is bigger. Always compare fractions with the same bottom number!`,
    },
  ],

  Science: [
    {
      topic: 'Photosynthesis',
      teach: (n) => `Hello ${n}! Let's discover **How Plants Make Food** 🌿\n\nPlants are amazing — they make their own food using sunlight! This is called **Photosynthesis**.\n\n📖 **How it works:**\n🌞 Sunlight + 💧 Water + 🌬️ Carbon dioxide → 🍃 Food (glucose) + Oxygen\n\nPlants take in:\n• **Carbon dioxide** from the air (through tiny holes in leaves)\n• **Water** from the soil (through roots)\n• **Sunlight** (captured by the green colour — called chlorophyll)\n\nAnd they produce **oxygen** — the air we breathe! 🌬️\n\n✏️ **Question:** What gas do plants GIVE OUT that humans need to breathe?`,
      check: (s) => /oxygen|o2/.test(s.toLowerCase()),
      correct: (n) => `🌟 Excellent, ${n}! **Oxygen** — exactly right!\n\nPlants produce oxygen as a byproduct of making food. Without plants, we couldn't breathe!\n\n✏️ **Next:** What colour is the substance in leaves that captures sunlight?`,
      wrong: () => `The answer is **Oxygen** 🌬️\n\nDuring photosynthesis, plants take in CO₂ and release oxygen. That's why forests are called the "lungs of the Earth"!\n\n✏️ **Now:** What is the green substance in leaves called?`,
      nextCheck: (s) => /chlorophyll|chloro/.test(s.toLowerCase()),
      nextCorrect: (n) => `✅ Perfect, ${n}! **Chlorophyll** is the green pigment that captures sunlight. That's why leaves are green! 🍃`,
      nextWrong: () => `It's called **Chlorophyll** — the green pigment in leaves. "Chloro" means green in Greek. That's why all photosynthesising plants are green! 🌿`,
    },
    {
      topic: 'States of Matter',
      teach: (n) => `Hi ${n}! Today we learn about **States of Matter** 🧊💧💨\n\nAll things around us exist in one of **3 states**:\n\n🧊 **Solid** — fixed shape, fixed size (ice, wood, rock)\n💧 **Liquid** — no fixed shape, but fixed size (water, juice, oil)\n💨 **Gas** — no fixed shape, no fixed size (air, steam, smoke)\n\n📖 **Example:** Water can be all three!\n• Ice cube → **Solid**\n• Drinking water → **Liquid**\n• Steam from a kettle → **Gas**\n\n✏️ **Question:** When you heat ice, it turns to water. What state does it change FROM and TO?`,
      check: (s) => /(solid.*liquid|liquid.*solid|ice.*water|melt)/.test(s.toLowerCase()),
      correct: (n) => `🎉 Brilliant, ${n}! Ice (solid) melts into water (liquid) ✓\n\nThis is called **melting**. The opposite (liquid → solid) is called **freezing**!\n\n✏️ **Next:** What do we call it when water turns into steam (liquid → gas)?`,
      wrong: () => `Ice is a **Solid**. When heated, it melts into **Liquid** water.\nSolid → (heating) → Liquid → (more heating) → Gas\n\n✏️ **Now:** What is it called when a liquid turns into a gas?`,
      nextCheck: (s) => /evapor|boil|vaporis/.test(s.toLowerCase()),
      nextCorrect: (n) => `✅ Correct, ${n}! **Evaporation** (or boiling)! Liquid → Gas. You know all 3 states of matter now! 🌟`,
      nextWrong: () => `It's called **Evaporation**! When water is heated, it turns into water vapour (gas). This is why puddles disappear on a sunny day! ☀️`,
    },
    {
      topic: 'Solar System',
      teach: (n) => `Amazing ${n}! Let's explore our **Solar System** 🌌\n\nOur solar system has **8 planets** orbiting the Sun ☀️:\n\n🪐 **In order from the Sun:**\n1. Mercury (smallest, hottest)\n2. Venus (brightest)\n3. **Earth** (our home! 🌍)\n4. Mars (the red planet)\n5. Jupiter (largest planet)\n6. Saturn (has rings 💫)\n7. Uranus (rotates sideways)\n8. Neptune (farthest, coldest)\n\n🌍 Memory trick: **M**y **V**ery **E**xcited **M**other **J**ust **S**erved **U**s **N**oodles!\n\n✏️ **Question:** Which is the LARGEST planet in our solar system?`,
      check: (s) => /jupiter/.test(s.toLowerCase()),
      correct: (n) => `🌟 Correct, ${n}! **Jupiter** is the largest — it's so big, 1,300 Earths could fit inside it!\n\n✏️ **Next:** Which planet is known as the Red Planet?`,
      wrong: () => `The largest planet is **Jupiter** 🪐\nIt's a gas giant — no solid surface, just layers of gas. Over 1,300 Earths could fit inside!\n\n✏️ **Now:** Which planet is closest to the Sun?`,
      nextCheck: (s) => /mars/.test(s.toLowerCase()),
      nextCorrect: (n) => `✅ Yes! **Mars** is the Red Planet — its red colour comes from iron oxide (rust!) on its surface. You know your planets, ${n}! 🚀`,
      nextWrong: () => `It's **Mars** 🔴! Mars looks red because its soil contains iron oxide — basically the planet is covered in rust! 🪐`,
    },
  ],

  English: [
    {
      topic: 'Nouns',
      teach: (n) => `Hello ${n}! Let's learn about **Nouns** 📖\n\nA **noun** is a naming word. It names a:\n• **Person** → teacher, doctor, child\n• **Place** → school, park, India\n• **Thing** → book, chair, apple\n• **Animal** → dog, elephant, bird\n\n📖 **Example sentences:**\n• "The **dog** ran to the **park**."\n  → dog = noun (animal), park = noun (place)\n\n✏️ **Your turn:** Find the nouns in this sentence:\n"The **girl** ate an **apple** in the **garden**."\nHow many nouns are there?`,
      check: (s) => /3|three/.test(s.toLowerCase()),
      correct: (n) => `✅ Perfect, ${n}! There are **3 nouns**: girl, apple, garden 🎉\n\n• girl = person\n• apple = thing\n• garden = place\n\n✏️ **Now write your own sentence** using at least 2 nouns.`,
      wrong: () => `There are **3 nouns** in the sentence:\n1. **girl** (person)\n2. **apple** (thing)\n3. **garden** (place)\n\nEvery sentence has at least one noun!\n\n✏️ **Try:** Find nouns in "The boy kicked the ball."`,
      nextCheck: (s) => s.length > 5,
      nextCorrect: (n) => `🌟 Great sentence, ${n}! You're using nouns perfectly. You're a language star! ⭐`,
      nextWrong: () => `Good effort! Remember: nouns are naming words. "Boy" and "ball" are both nouns in that sentence. Keep practising! 📚`,
    },
    {
      topic: 'Verbs',
      teach: (n) => `Well done, ${n}! Now let's learn about **Verbs** — action words! 🏃\n\nA **verb** is a word that shows an **action** or a **state of being**.\n\n📖 **Action verbs:** run, jump, eat, read, write, sing\n📖 **State verbs:** is, are, was, seems, feels\n\n**Examples:**\n• "She **runs** every morning." → runs = verb\n• "He **is** a doctor." → is = verb\n• "They **played** football." → played = verb\n\n✏️ **Find the verb:** "The cat **slept** on the warm mat."\nWhat is the verb in this sentence?`,
      check: (s) => /slept|sleep/.test(s.toLowerCase()),
      correct: (n) => `✅ Correct, ${n}! **"slept"** is the verb — it tells us what the cat DID!\n\n✏️ **Next challenge:** Write a sentence about your favourite sport using a verb.`,
      wrong: () => `The verb is **"slept"** — it's the action word that tells us what the cat did.\n\nVerbs tell us WHAT is happening. Without a verb, a sentence is incomplete!\n\n✏️ **Try:** What is the verb in "The birds sing in the morning"?`,
      nextCheck: (s) => s.length > 8,
      nextCorrect: (n) => `🌟 Wonderful sentence, ${n}! You used a verb correctly — you're becoming a grammar expert! 📖`,
      nextWrong: () => `**"sing"** is the verb! Now try writing your own — "I _____ football every day." (kick, play, love, etc.) 🏈`,
    },
    {
      topic: 'Adjectives',
      teach: (n) => `You're brilliant, ${n}! Let's learn **Adjectives** — describing words! 🎨\n\nAdjectives **describe** nouns — they tell us more about a person, place, or thing.\n\n📖 **Examples:**\n• The **big** elephant 🐘 (big describes the elephant)\n• A **beautiful** sunset 🌅 (beautiful describes the sunset)\n• A **cold** winter day ❄️ (cold describes the day)\n\n**Adjectives answer these questions:**\n• What size? → big, small, tiny, huge\n• What colour? → red, blue, golden\n• What type? → happy, sad, clever, kind\n\n✏️ **Your turn:** Add 2 adjectives to this sentence:\n"The ___ and ___ puppy ran through the garden."`,
      check: (s) => s.length > 10,
      correct: (n) => `✅ Excellent, ${n}! You used adjectives correctly!\n\nSome examples: "The **fluffy** and **playful** puppy ran through the garden." 🐶\n\nAdjectives make writing come alive! ✍️`,
      wrong: () => `Any two describing words work!\nExamples: "The **tiny** and **brown** puppy..." or "The **happy** and **loud** puppy..."\n\nAdjectives paint a picture with words! 🎨`,
      nextCheck: (s) => s.length > 5,
      nextCorrect: (n) => `🌟 Perfect use of adjectives, ${n}! Your writing is becoming very descriptive. Amazing work! 📖`,
      nextWrong: () => `Remember: adjectives describe! Size, colour, feeling — any describing word counts. You're doing great! 💪`,
    },
  ],

  Coding: [
    {
      topic: 'What is Programming?',
      teach: (n) => `Hello ${n}! Welcome to **Coding** 💻\n\nProgramming is giving **instructions** to a computer. Computers are very smart but they can only do exactly what you tell them!\n\n📖 **Think of it like this:**\nIf you wanted to make a sandwich 🥪, you'd need clear steps:\n1. Get bread\n2. Add butter\n3. Add filling\n4. Close the sandwich\n\nComputers work exactly the same way — step-by-step instructions called an **algorithm**!\n\n📖 **A simple program example:**\n\`\`\`\nprint("Hello World!")  ← tells computer to show text\n\`\`\`\n\n✏️ **Question:** If a computer does exactly what you tell it, what do we call a list of step-by-step instructions for a computer?`,
      check: (s) => /algorithm|program|code|instruction/.test(s.toLowerCase()),
      correct: (n) => `✅ Yes, ${n}! It's called an **Algorithm** — a set of step-by-step instructions!\n\nEvery app, game, and website is made of thousands of algorithms working together 🚀\n\n✏️ **Next:** In programming, we use **variables** to store information. What do you think a variable might store?`,
      wrong: () => `The answer is an **Algorithm** 🧮\n\nAn algorithm is a precise, step-by-step set of instructions to solve a problem. Recipes, directions, and computer programs are all algorithms!\n\n✏️ **Now:** Can you think of an algorithm for brushing your teeth? List 3 steps.`,
      nextCheck: (s) => s.length > 5,
      nextCorrect: (n) => `🌟 Excellent thinking, ${n}! Variables store data — like a labelled box that holds information. You're thinking like a programmer already! 💻`,
      nextWrong: () => `A variable is like a labelled box 📦 — it stores a piece of information. Example: \`age = 10\` stores the number 10 with the label "age". Computers use millions of variables! 🖥️`,
    },
    {
      topic: 'Conditionals — If/Else',
      teach: (n) => `Great, ${n}! Now let's learn **If/Else** — decisions in coding! 🤔\n\nComputers make decisions using **IF/ELSE** statements:\n\n\`\`\`\nIF it is raining:\n    Take an umbrella ☂️\nELSE:\n    Wear sunglasses 😎\n\`\`\`\n\nThe computer checks a condition (is it raining?) and follows the right path!\n\n📖 **In Python code:**\n\`\`\`python\nage = 15\nif age >= 18:\n    print("You can vote!")\nelse:\n    print("Too young to vote")\n\`\`\`\nHere, if age is 15, what will it print?`,
      check: (s) => /young|vote|too young|not|15/.test(s.toLowerCase()),
      correct: (n) => `✅ Brilliant, ${n}! It prints **"Too young to vote"** because 15 is NOT >= 18!\n\nThe ELSE branch runs when the IF condition is FALSE 🎯\n\n✏️ **Next:** What would it print if age = 20?`,
      wrong: () => `It prints **"Too young to vote"** because age (15) is NOT greater than or equal to 18.\nThe condition \`15 >= 18\` is FALSE, so it goes to the ELSE branch!\n\n✏️ **Now:** What prints if age = 25?`,
      nextCheck: (s) => /vote|can vote|yes/.test(s.toLowerCase()),
      nextCorrect: (n) => `🎉 Correct! "You can vote!" — because 20 >= 18 is TRUE! You understand conditionals, ${n}! 💻`,
      nextWrong: () => `If age = 20, then 20 >= 18 is TRUE, so it prints **"You can vote!"** The IF branch runs! 🗳️`,
    },
  ],

  'Life Skills': [
    {
      topic: 'Problem Solving',
      teach: (n) => `Hi ${n}! Today we learn **Problem Solving** 🧩\n\nProblem solving is one of the most important life skills. Here's a simple method used by scientists, engineers, and doctors:\n\n**The 4-Step Problem Solving Method:**\n1. 🔍 **Identify** — What exactly is the problem?\n2. 💡 **Brainstorm** — List all possible solutions\n3. ✅ **Choose** — Pick the best solution\n4. 🔄 **Review** — Did it work? If not, try another!\n\n📖 **Example:**\nProblem: Your school bag is too heavy\n1. Identify: Too many books\n2. Brainstorm: Leave some books, use digital copies, get a better bag\n3. Choose: Only bring books needed for that day\n4. Review: Check if your back feels better!\n\n✏️ **Your problem:** You forgot your homework. Walk me through the 4 steps!`,
      check: (s) => s.length > 20,
      correct: (n) => `🌟 Excellent thinking, ${n}! You worked through the problem systematically!\n\nGood problem-solvers don't panic — they follow a process. This skill will help you in every part of life! 💪\n\n✏️ **Reflection:** Why is it important to REVIEW your solution after trying it?`,
      wrong: () => `Great attempt! Here's one way:\n1. **Identify:** I forgot homework\n2. **Brainstorm:** Email teacher, do it now, call a friend for the answers\n3. **Choose:** Email teacher explaining and submit tomorrow\n4. **Review:** Teacher responded — apologise and improve\n\nHonesty and a plan is always better than panic! 😊`,
      nextCheck: (s) => s.length > 10,
      nextCorrect: (n) => `✅ Brilliant answer, ${n}! Reviewing helps us LEARN from mistakes and improve. That's how great thinkers grow! 🧠`,
      nextWrong: () => `Reviewing is important because solutions don't always work perfectly the first time. By checking, we learn what to improve — that's how scientists, doctors, and engineers think! 🔬`,
    },
    {
      topic: 'Empathy',
      teach: (n) => `Hello ${n}! Let's talk about **Empathy** ❤️\n\nEmpathy means understanding and sharing how another person feels.\n\nIt's different from sympathy:\n• **Sympathy** = feeling SORRY for someone\n• **Empathy** = feeling WITH someone, seeing from their point of view\n\n📖 **Example:**\nYour friend failed a test and is crying.\n• Sympathy: "Oh no, that's sad." 😐\n• Empathy: "I know how that feels. I've been there too. Do you want to study together?" 🤝\n\nEmpathy helps you:\n✅ Make better friends\n✅ Solve conflicts\n✅ Be a great leader\n\n✏️ **Question:** Your classmate is being left out at lunch. What would an empathetic person DO?`,
      check: (s) => s.length > 15,
      correct: (n) => `❤️ Wonderful, ${n}! An empathetic response — like inviting them to sit with you — makes a huge difference!\n\nSmall acts of empathy change people's days. Sometimes even their lives! 🌟\n\n✏️ **Reflect:** Think of a time someone showed empathy to YOU. How did it make you feel?`,
      wrong: () => `An empathetic person would:\n• Notice the person is alone\n• Approach them with a smile\n• Say "Would you like to join us?" 🤝\n\nEmpathy is a superpower — it costs nothing but means everything to the other person! ❤️`,
      nextCheck: (s) => s.length > 8,
      nextCorrect: (n) => `🌟 That's beautiful, ${n}. Empathy creates a kinder world. You're going to be a great leader and friend! 💪`,
      nextWrong: () => `When someone shows us empathy, we feel understood and not alone. That's one of the most powerful feelings a human can experience! ❤️`,
    },
  ],
};

export async function chat(sessionId, payload) {
  if (DEMO) {
    await delay(900);
    const name    = payload.student_name  || 'friend';
    const subject = payload.subject       || 'Mathematics';
    const lang    = payload.language      || 'en';
    const board   = payload.board         || 'CBSE';
    const input   = (payload.student_input || '').trim().toLowerCase();
    const M       = MENTOR[lang] || MENTOR.en;

    if (!_sessionState.has(sessionId)) {
      _sessionState.set(sessionId, { turn: 0, lessonIdx: 0, subTurn: 0, boardIntroShown: false });
    }
    const state   = _sessionState.get(sessionId);

    // Board-specific lessons take priority; fall back to generic lessons
    const lessons = (BOARD_LESSONS[board] && BOARD_LESSONS[board][subject])
      || LESSONS[subject]
      || LESSONS['Life Skills'];
    const lesson  = lessons[state.lessonIdx % lessons.length];

    // Topic name in student's language
    const topicName = (lesson.topic && typeof lesson.topic === 'object')
      ? (lesson.topic[lang] || lesson.topic.en || subject)
      : (lesson.topic || subject);

    let response;
    let score = 50 + Math.random() * 20;

    if (state.turn === 0) {
      // First message: show board intro once, then the first lesson
      const intro   = BOARD_INTRO[board] ? BOARD_INTRO[board](name, lang) : '';
      const lesson0 = lesson.teach(name, lang);
      response      = intro ? intro + '\n\n---\n\n' + lesson0 : lesson0;
      state.boardIntroShown = true;
      state.subTurn = 1;
    } else if (state.subTurn === 1) {
      // Check genuine questions first — never mark a real question as "wrong"
      const qaAnswer = findAnswer(input, subject, lang, name);
      if (qaAnswer) {
        response = qaAnswer;
        score = 65; // neutral score for a question turn
        // Don't advance subTurn — still waiting for lesson answer
      } else if (isConfused(input)) {
        // Student is confused — encourage and re-explain without penalising
        response = lesson.wrong(name, lang);
        score = 45;
        // Stay on subTurn 1 so they get another chance
      } else if (lesson.check(input)) {
        response = lesson.correct(name, lang);
        score = 75 + Math.random() * 20;
        state.subTurn = 2;
      } else {
        response = lesson.wrong(name, lang);
        score = 40 + Math.random() * 25;
        state.subTurn = 2;
      }
    } else if (state.subTurn === 2) {
      if (lesson.nextCheck(input)) {
        response = lesson.nextCorrect(name, lang) + '\n\n' + M.wellDone(name);
        score = 85 + Math.random() * 15;
      } else {
        response = lesson.nextWrong(name, lang);
        score = 55 + Math.random() * 20;
      }
      state.lessonIdx += 1;
      state.subTurn = 0;

      if (state.lessonIdx < lessons.length) {
        const next    = lessons[state.lessonIdx];
        const nextName = (next.topic && typeof next.topic === 'object')
          ? (next.topic[lang] || next.topic.en) : next.topic;
        response += `\n\n---\n` + M.next(name) + `\n\n**${nextName}**\n\n` + next.teach(name, lang);
        state.subTurn = 1;
      } else {
        response += '\n\n' + M.completed(name);
      }
      score = 90;
    } else {
      response = M.freeChat(name, subject);
      score = 80;
    }

    state.turn += 1;
    addMockMessage(sessionId, { role:'student', content:payload.student_input });
    addMockMessage(sessionId, { role:'aria',    content:response });

    return {
      data: {
        success: true,
        data: {
          response,
          understanding_score: Math.min(100, Math.round(score)),
          should_advance: score > 85,
          difficulty: score > 75 ? 'HARD' : score > 55 ? 'MEDIUM' : 'EASY',
          topic: topicName,
        }
      }
    };
  }
  return api.post(`/api/sessions/${sessionId}/chat`, payload);
}

// ─── PROGRESS ─────────────────────────────────────────────────
export async function getProgress(studentId) {
  if (DEMO) return mock(MOCK_PROGRESS.filter(p => p.studentId === studentId));
  return api.get(`/api/progress/student/${studentId}`);
}

// ─── DASHBOARD ────────────────────────────────────────────────
export async function getDashboard() {
  if (DEMO) {
    const u = currentUser();
    if (u.role === 'PARENT') {
      const myKids     = MOCK_STUDENTS.filter(s => s.parentId === u.userId);
      const myKidIds   = myKids.map(s => s.id);
      const mySessions = getMockSessions().filter(s => myKidIds.includes(s.studentId));
      const myProgress = MOCK_PROGRESS.filter(p => myKidIds.includes(p.studentId));
      return mock({
        totalStudents:         myKids.length,
        totalSessions:         mySessions.length,
        avgUnderstandingScore: Math.round(mySessions.reduce((a,s) => a+(s.understandingScore||0),0) / (mySessions.length||1)),
        totalModulesMastered:  myProgress.filter(p => p.masteryLevel==='MASTERED').length,
        activeStudentsToday:   mySessions.filter(s => s.status==='ACTIVE').length,
      });
    }
    return mock(getMockDashboard());
  }
  return api.get('/api/dashboard');
}

// ─── REPORTS ──────────────────────────────────────────────────
export async function generateReport(payload) {
  if (DEMO) { await delay(1800); return { data: { success:true, report:MOCK_REPORT } }; }
  return api.post('http://localhost:8001/report', payload);
}

// ─── DOCUMENT TEACHER ─────────────────────────────────────────

const DEMO_DOC_HISTORY = [
  {
    id: 1,
    session_code: 'DOC-DEMO001',
    student_id: 1,
    document_name: 'fractions_chapter.jpg',
    document_type: 'image',
    subject_detected: 'Mathematics',
    topic_detected: 'Fractions and Decimals',
    grade_detected: 5,
    explanation_level: 'INTERMEDIATE',
    language: 'en',
    board: 'CBSE',
    difficulty_rating: 3,
    explanation: `## Fractions — Clear Step-by-Step Guide

**What is a fraction?**
A fraction represents a part of a whole. It has two parts separated by a line:
• **Numerator** (top) — how many parts you have
• **Denominator** (bottom) — total equal parts the whole is divided into

**Example:** If a pizza is cut into 8 equal slices and you eat 3 slices, you ate **3/8** of the pizza!

## Types of Fractions

• **Proper fraction:** numerator < denominator (e.g., 3/4 — less than a whole)
• **Improper fraction:** numerator > denominator (e.g., 7/4 — more than a whole)
• **Mixed number:** whole + fraction (e.g., 1¾ = 7/4)

## Adding Fractions

**Same denominator:** Just add the numerators!
1/4 + 2/4 = 3/4 ✓

**Different denominators:** Find the LCM first.
1/3 + 1/4 → LCM = 12 → 4/12 + 3/12 = **7/12**

You're doing great — fractions are used in cooking, money, and even music! 🎵`,
    practice_questions: [
      'If you have 2/5 of a chocolate bar and your friend gives you another 1/5, what fraction do you have in total?',
      'Convert 11/4 into a mixed number.',
      'Arrange in ascending order: 3/4, 1/2, 2/3, 5/6',
    ],
    key_points: [
      'Fraction = part of a whole; numerator on top, denominator below',
      'To add fractions with different denominators, find the LCM first',
      'Improper fractions can be converted to mixed numbers by dividing',
      'Equivalent fractions represent the same amount (1/2 = 2/4 = 4/8)',
    ],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 2,
    session_code: 'DOC-DEMO002',
    student_id: 1,
    document_name: 'photosynthesis_notes.pdf',
    document_type: 'pdf',
    subject_detected: 'Science',
    topic_detected: 'Photosynthesis',
    grade_detected: 6,
    explanation_level: 'BEGINNER',
    language: 'en',
    board: 'CBSE',
    difficulty_rating: 2,
    explanation: `## 🌱 Photosynthesis — How Plants Make Food!

Plants are amazing! They make their OWN food using sunlight — just like a kitchen that runs on sunshine ☀️

**The plant's recipe:**
• 💧 Water (from roots underground)
• 🌬️ Carbon dioxide gas (CO₂ from the air)
• ☀️ Sunlight

**What comes out:**
• 🍬 Glucose (sugar = plant's food!)
• 💨 Oxygen (the air WE breathe!)

**Where does it happen?** In the green leaves! The green colour comes from **chlorophyll** — it's like the plant's solar panel.

Think of it like a magic kitchen: water + air + sunshine goes IN, food + clean air comes OUT!

This is why forests are SO important — they give us the air we breathe! 🌍`,
    practice_questions: [
      'What are the three things a plant needs to make food?',
      'What do we call the green substance in leaves that captures sunlight?',
      'Name TWO things that plants produce during photosynthesis.',
    ],
    key_points: [
      'Plants make food using sunlight, water, and CO₂',
      'Chlorophyll (green pigment in leaves) captures sunlight',
      'Photosynthesis produces glucose (food) and oxygen',
      'This process is why plants are called "producers" in food chains',
    ],
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

export async function explainDocument(payload) {
  // If AI service is deployed — call Claude directly for genuine answers
  if (aiSvc && payload.document_base64) {
    const res = await aiSvc.post('/document/explain', {
      document_base64:   payload.document_base64,
      document_type:     payload.document_type || 'image',
      student_name:      payload.student_name || 'Student',
      grade:             payload.grade || 5,
      level:             payload.level || 'INTERMEDIATE',
      language:          payload.language || 'en',
      specific_question: payload.specific_question || null,
      board:             payload.board || 'CBSE',
    });
    return { data: res.data };
  }

  // Demo fallback (shown only when no AI service is configured)
  if (DEMO) {
    await delay(2200);
    const subject = payload.specific_question?.toLowerCase() || '';
    const isSci   = subject.includes('photo') || subject.includes('science') || subject.includes('bio');
    const demo    = isSci ? DEMO_DOC_HISTORY[1] : DEMO_DOC_HISTORY[0];
    return {
      data: {
        subject_detected:   demo.subject_detected,
        topic_detected:     demo.topic_detected,
        grade_detected:     payload.grade || 5,
        explanation:        demo.explanation,
        practice_questions: demo.practice_questions,
        key_points:         demo.key_points,
        difficulty_rating:  demo.difficulty_rating,
        sessionId:          Date.now(),
        sessionCode:        'DOC-DEMO' + Math.floor(Math.random() * 9000 + 1000),
      }
    };
  }

  // Production path via Spring Boot
  const form = new FormData();
  if (payload._file instanceof File) {
    form.append('file', payload._file);
  } else if (payload.document_base64) {
    const mime = payload.document_type === 'pdf' ? 'application/pdf' : 'image/jpeg';
    const ext  = payload.document_type === 'pdf' ? 'pdf' : 'jpg';
    try {
      const byteStr = atob(payload.document_base64);
      const buf = new Uint8Array(byteStr.length);
      for (let i = 0; i < byteStr.length; i++) buf[i] = byteStr.charCodeAt(i);
      form.append('file', new Blob([buf], { type: mime }), 'document.' + ext);
    } catch { /* skip */ }
  }
  form.append('grade',    String(payload.grade    || 5));
  form.append('level',    payload.level    || 'INTERMEDIATE');
  form.append('language', payload.language || 'en');
  form.append('board',    payload.board    || 'CBSE');
  if (payload.specific_question) form.append('question', payload.specific_question);
  if (payload.studentId)         form.append('studentId', String(payload.studentId));
  return api.post('/api/documents/explain', form, { headers: { 'Content-Type': 'multipart/form-data' } });
}

export async function getDocumentHistory(studentId) {
  if (DEMO) { await delay(400); return { data: { data: DEMO_DOC_HISTORY } }; }
  return api.get(`/api/documents/history/${studentId}`);
}

export async function getDocumentSession(sessionId) {
  if (DEMO) {
    const doc = DEMO_DOC_HISTORY.find(d => d.id === sessionId) || DEMO_DOC_HISTORY[0];
    return { data: { data: doc } };
  }
  return api.get(`/api/documents/${sessionId}`);
}

export async function explainDocumentFollowup(sessionId, question) {
  if (DEMO) {
    await delay(1500);
    return { data: { explanation: `Great follow-up question! Based on what we covered, here's a clearer explanation:\n\n${question.includes('formula') ? '**The formula is:**\nStep 1 → Step 2 → Step 3\n\nRemember: always check your units!' : 'Let me break this down more simply...\n\nThink of it like this: imagine you have 10 apples and you share them equally among friends. That\'s exactly how this concept works!'}\n\nDoes that make more sense now? 😊` } };
  }
  return api.post(`/api/documents/${sessionId}/followup`, { question });
}

// ─── HOMEWORK HELPER ──────────────────────────────────────────

const DEMO_HW_ANSWER = {
  subject_detected:    'Mathematics',
  topic_detected:      'Quadratic Equations',
  difficulty_level:    'Grade 9',
  board_reference:     'NCERT Class 9 — Chapter 4',
  concept_explanation: 'A quadratic equation is an equation where the highest power of x is 2. It has the form ax² + bx + c = 0. Every quadratic equation has exactly two roots (answers).',
  complete_solution:   '📐 Using the factorisation method:\n\nGiven: x² + 5x + 6 = 0\n\n1. Find two numbers that multiply to 6 and add to 5\n   → The numbers are 2 and 3 (because 2 × 3 = 6 and 2 + 3 = 5)\n\n2. Split the middle term:\n   x² + 2x + 3x + 6 = 0\n\n3. Group and factorise:\n   x(x + 2) + 3(x + 2) = 0\n   (x + 3)(x + 2) = 0\n\n4. Find the roots:\n   x + 3 = 0  →  x = -3\n   x + 2 = 0  →  x = -2\n\n✅ Answer: x = -2 or x = -3',
  key_points:          ['Quadratic means power of 2', 'Always two roots (may be equal)', 'Can solve by factorisation, formula, or completing the square'],
  exam_tip:            'In CBSE exams, always verify your roots by substituting back into the original equation.',
  practice_problem:    'Solve: x² - 7x + 12 = 0',
  verification:        'Check x = -2: (-2)² + 5(-2) + 6 = 4 - 10 + 6 = 0 ✅\nCheck x = -3: (-3)² + 5(-3) + 6 = 9 - 15 + 6 = 0 ✅',
  answer_confidence:   0.97,
  language_used:       'en',
};

export async function solveHomework(payload) {
  const hasDoc = payload.document_base64 && payload.document_base64.length > 10;

  // ── If AI service is configured, call Claude for ALL requests ───
  // Genuine answers — works even in demo mode when AI service is deployed.
  if (aiSvc) {
    const res = await aiSvc.post('/homework/solve', {
      document_base64:   payload.document_base64,
      document_type:     payload.document_type || 'image',
      student_question:  payload.student_question || '',
      student_name:      payload.student_name || 'Student',
      grade:             payload.grade || 5,
      board:             payload.board || 'CBSE',
      subject:           payload.subject || 'General',
      language:          payload.language || 'en',
      student_level:     payload.student_level || 'AVERAGE',
      want_full_answer:  payload.want_full_answer !== false,
      want_step_by_step: payload.want_step_by_step !== false,
    });
    return { data: res.data };
  }

  // ── Demo mode (no document uploaded) ─────────────────────────
  if (DEMO) {
    await delay(1800);
    const q = (payload.student_question || '').toLowerCase();
    return {
      data: {
        ...DEMO_HW_ANSWER,
        topic_detected:   q.includes('photo') ? 'Photosynthesis' : q.includes('newton') ? "Newton's Laws" : DEMO_HW_ANSWER.topic_detected,
        subject_detected: payload.subject || DEMO_HW_ANSWER.subject_detected,
        sessionId:        null,
        sessionCode:      'demo-' + Date.now(),
      }
    };
  }

  // ── Production path via Spring Boot ──────────────────────────
  const form = new FormData();
  if (payload._file instanceof File) {
    form.append('file', payload._file);
  } else if (hasDoc) {
    const mime = payload.document_type === 'pdf' ? 'application/pdf' : 'image/jpeg';
    const ext  = payload.document_type === 'pdf' ? 'pdf' : 'jpg';
    try {
      const bytes = atob(payload.document_base64);
      const buf = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
      form.append('file', new Blob([buf], { type: mime }), 'homework.' + ext);
    } catch { /* skip */ }
  }
  if (payload.student_question)  form.append('studentQuestion',  payload.student_question);
  if (payload.grade)             form.append('grade',            String(payload.grade));
  if (payload.board)             form.append('board',            payload.board);
  if (payload.subject)           form.append('subject',          payload.subject);
  if (payload.language)          form.append('language',         payload.language);
  if (payload.student_level)     form.append('studentLevel',     payload.student_level);
  if (payload.want_full_answer !== undefined) form.append('wantFullAnswer',  String(payload.want_full_answer));
  if (payload.want_step_by_step !== undefined) form.append('wantStepByStep', String(payload.want_step_by_step));
  return api.post('/api/homework/solve', form, { headers: { 'Content-Type': 'multipart/form-data' } });
}

export async function getHomeworkHistory(studentId) {
  if (DEMO) {
    await delay(400);
    return { data: { success: true, data: [
      { id:1, subject:'Mathematics', topicDetected:'Quadratic Equations', boardReference:'NCERT Class 9 Ch 4', originalQuestion:'Solve x² + 5x + 6 = 0', examTip:'Always verify roots by substituting back.', hasDocument:false, totalFollowups:1, grade:9, createdAt: new Date(Date.now()-86400000).toISOString() },
      { id:2, subject:'Science',     topicDetected:'Photosynthesis',      boardReference:'NCERT Class 8 Ch 1', originalQuestion:'What is photosynthesis?', examTip:'Remember the equation: CO₂ + H₂O → Glucose + O₂.', hasDocument:false, totalFollowups:0, grade:8, createdAt: new Date(Date.now()-172800000).toISOString() },
    ]}};
  }
  return api.get(`/api/homework/history/${studentId}`);
}

export async function detectSubject(payload) {
  // Real detection via AI service when deployed
  if (aiSvc && payload.document_base64) {
    try {
      const res = await aiSvc.post('/homework/detect', {
        document_base64: payload.document_base64,
        document_type:   payload.document_type || 'image',
        question:        payload.question || '',
      });
      return { data: res.data };
    } catch { /* detection optional — fall through */ }
  }
  if (DEMO) {
    await delay(600);
    return { data: { subject: 'Mathematics', topic: 'Quadratic Equations', estimated_grade: 9, board_detected: 'CBSE', ncert_reference: 'NCERT Class 9 Chapter 4' } };
  }
  const form = new FormData();
  if (payload.document_base64) {
    const mime = payload.document_type === 'pdf' ? 'application/pdf' : 'image/jpeg';
    try {
      const bytes = atob(payload.document_base64);
      const buf = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
      form.append('file', new Blob([buf], { type: mime }), 'doc.' + (payload.document_type === 'pdf' ? 'pdf' : 'jpg'));
    } catch { /* skip */ }
  }
  if (payload.question) form.append('question', payload.question);
  return api.post('/api/homework/detect', form, { headers: { 'Content-Type': 'multipart/form-data' } });
}

export default api;
