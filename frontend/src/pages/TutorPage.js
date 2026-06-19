// TutorPage.js — The child-facing AI tutor chat interface
// Warm, friendly, voice-enabled, multi-language

import { useState, useEffect, useRef } from "react";
import api from "../services/api";

const LANGUAGES = {
  en: "English", hi: "हिंदी", ta: "தமிழ்",
  kn: "ಕನ್ನಡ", es: "Español", ar: "العربية", sw: "Kiswahili"
};

const SUBJECTS = [
  { id: "Mathematics", emoji: "🔢", label: "Maths" },
  { id: "Science",     emoji: "🔬", label: "Science" },
  { id: "English",     emoji: "📖", label: "English" },
  { id: "Coding",      emoji: "💻", label: "Coding" },
  { id: "Life Skills", emoji: "🌱", label: "Life Skills" },
];

export default function TutorPage() {
  const student = JSON.parse(sessionStorage.getItem("student") || "{}");

  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [sessionId, setSessionId]     = useState(null);
  const [subject, setSubject]         = useState("Mathematics");
  const [score, setScore]             = useState(50);
  const [history, setHistory]         = useState([]);
  const [listening, setListening]     = useState(false);
  const [difficulty, setDifficulty]   = useState("MEDIUM");
  const [showSubjects, setShowSubjects] = useState(true);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Start session when subject selected
  const startSession = async (selectedSubject) => {
    setSubject(selectedSubject);
    setShowSubjects(false);
    const res = await api.post("/api/sessions", {
      studentId: student.id,
      subject: selectedSubject
    });
    const sid = res.data.data.id;
    setSessionId(sid);
    // ARIA greeting
    const greeting = getGreeting(selectedSubject, student.language);
    setMessages([{ role: "aria", content: greeting }]);
  };

  const getGreeting = (subj, lang) => {
    const greetings = {
      en: `Hi ${student.fullName}! 👋 I'm ARIA, your learning buddy! Let's explore ${subj} together. What do you already know about it?`,
      hi: `नमस्ते ${student.fullName}! 👋 मैं ARIA हूँ! आज हम ${subj} सीखेंगे। आप इसके बारे में क्या जानते हैं?`,
      ta: `வணக்கம் ${student.fullName}! 👋 நான் ARIA! ${subj} பற்றி என்ன தெரியும்?`,
      kn: `ನಮಸ್ಕಾರ ${student.fullName}! 👋 ನಾನು ARIA! ${subj} ಬಗ್ಗೆ ಏನು ಗೊತ್ತು?`,
    };
    return greetings[lang] || greetings.en;
  };

  // Send message to AI
  const sendMessage = async (text = input) => {
    if (!text.trim() || !sessionId) return;
    const userMsg = { role: "student", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post(`/api/sessions/${sessionId}/chat`, {
        student_id:           String(student.id),
        student_name:         student.fullName,
        grade:                student.grade,
        language:             student.language || "en",
        student_input:        text,
        subject:              subject,
        conversation_history: history,
        understanding_score:  score,
        difficulty:           difficulty
      });

      const data = res.data?.data;
      if (data) {
        setScore(data.understanding_score || score);
        setHistory(data.conversation_history || history);
        setDifficulty(data.difficulty || difficulty);
        setMessages(prev => [...prev, { role: "aria", content: data.response }]);
        // Speak the response
        speakText(data.response, student.language || "en");
        // Show advance notification
        if (data.should_advance) {
          setTimeout(() => {
            setMessages(prev => [...prev, {
              role: "system",
              content: "🌟 Amazing! You've mastered this topic! Moving to the next level..."
            }]);
          }, 1500);
        }
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        role: "aria",
        content: "Hmm, I had trouble thinking just now. Can you say that again? 😊"
      }]);
    }
    setLoading(false);
  };

  // Text-to-speech
  const speakText = (text, lang) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const langMap = { en: "en-IN", hi: "hi-IN", ta: "ta-IN", kn: "kn-IN", es: "es-ES" };
    utter.lang = langMap[lang] || "en-IN";
    utter.rate = 0.85; // Slightly slower for children
    window.speechSynthesis.speak(utter);
  };

  // Voice input
  const startListening = () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    const langMap = { en: "en-IN", hi: "hi-IN", ta: "ta-IN", kn: "kn-IN" };
    recognition.lang = langMap[student.language] || "en-IN";
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  };

  const scoreColor = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
  const scoreLabel = score >= 70 ? "Great! 🌟" : score >= 40 ? "Getting there! 💪" : "Let's try again! 🤔";

  if (showSubjects) {
    return (
      <div style={styles.subjectScreen}>
        <div style={styles.subjectHeader}>
          <div style={styles.avatarBig}>🤖</div>
          <h1 style={styles.subjectTitle}>
            Hi {student.fullName || "there"}! 👋
          </h1>
          <p style={styles.subjectSub}>What would you like to learn today?</p>
        </div>
        <div style={styles.subjectGrid}>
          {SUBJECTS.map(s => (
            <button key={s.id} style={styles.subjectCard}
              onClick={() => startSession(s.id)}>
              <span style={styles.subjectEmoji}>{s.emoji}</span>
              <span style={styles.subjectLabel}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.avatar}>🤖</div>
          <div>
            <div style={styles.headerName}>ARIA</div>
            <div style={styles.headerSub}>{subject} • Grade {student.grade}</div>
          </div>
        </div>
        <div style={styles.scoreWrap}>
          <div style={{ ...styles.scoreDot, background: scoreColor }} />
          <div>
            <div style={{ ...styles.scoreNum, color: scoreColor }}>{Math.round(score)}%</div>
            <div style={styles.scoreLabel}>{scoreLabel}</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={styles.messages}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            ...styles.msgRow,
            justifyContent: msg.role === "student" ? "flex-end" : "flex-start"
          }}>
            {msg.role === "aria" && <div style={styles.ariaAvatar}>🤖</div>}
            <div style={{
              ...styles.bubble,
              ...(msg.role === "student" ? styles.studentBubble :
                  msg.role === "system"  ? styles.systemBubble  : styles.ariaBubble)
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ ...styles.msgRow, justifyContent: "flex-start" }}>
            <div style={styles.ariaAvatar}>🤖</div>
            <div style={styles.ariaBubble}>
              <span style={styles.typing}>● ● ●</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={styles.inputRow}>
        <button style={{
          ...styles.voiceBtn,
          background: listening ? "#ef4444" : "#6366f1"
        }} onClick={startListening}>
          {listening ? "🔴" : "🎤"}
        </button>
        <input
          style={styles.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder={listening ? "Listening..." : "Type your answer here..."}
          disabled={loading || listening}
        />
        <button style={styles.sendBtn}
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}>
          ➤
        </button>
      </div>
    </div>
  );
}

const styles = {
  subjectScreen: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: 24, fontFamily: "system-ui, sans-serif"
  },
  subjectHeader: { textAlign: "center", marginBottom: 40 },
  avatarBig: { fontSize: 72, marginBottom: 16 },
  subjectTitle: { fontSize: 32, fontWeight: 800, color: "#fff", margin: "0 0 8px" },
  subjectSub: { fontSize: 18, color: "rgba(255,255,255,.8)" },
  subjectGrid: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16, maxWidth: 400
  },
  subjectCard: {
    background: "rgba(255,255,255,.15)",
    border: "2px solid rgba(255,255,255,.3)",
    borderRadius: 20, padding: "24px 16px",
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 10,
    cursor: "pointer", transition: "all .2s",
    color: "#fff", fontWeight: 700, fontSize: 14
  },
  subjectEmoji: { fontSize: 36 },
  subjectLabel: {},
  container: {
    display: "flex", flexDirection: "column",
    height: "100vh", background: "#f8fafc",
    fontFamily: "system-ui, sans-serif", maxWidth: 700, margin: "0 auto"
  },
  header: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    padding: "16px 20px",
    display: "flex", alignItems: "center",
    justifyContent: "space-between"
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  avatar: {
    fontSize: 32, background: "rgba(255,255,255,.2)",
    borderRadius: "50%", width: 48, height: 48,
    display: "flex", alignItems: "center", justifyContent: "center"
  },
  headerName: { fontSize: 18, fontWeight: 800, color: "#fff" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,.8)" },
  scoreWrap: { display: "flex", alignItems: "center", gap: 8 },
  scoreDot: { width: 10, height: 10, borderRadius: "50%" },
  scoreNum: { fontSize: 20, fontWeight: 800 },
  scoreLabel: { fontSize: 11, color: "rgba(255,255,255,.8)" },
  messages: { flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 },
  msgRow: { display: "flex", alignItems: "flex-end", gap: 8 },
  ariaAvatar: { fontSize: 24, flexShrink: 0 },
  bubble: { maxWidth: "75%", padding: "12px 16px", borderRadius: 18, fontSize: 15, lineHeight: 1.5 },
  ariaBubble: { background: "#fff", color: "#1e293b", borderRadius: "18px 18px 18px 4px", boxShadow: "0 2px 8px rgba(0,0,0,.08)" },
  studentBubble: { background: "linear-gradient(135deg, #667eea, #764ba2)", color: "#fff", borderRadius: "18px 18px 4px 18px" },
  systemBubble: { background: "#fef9c3", color: "#92400e", borderRadius: 12, fontSize: 13, textAlign: "center", width: "100%", maxWidth: "100%" },
  typing: { letterSpacing: 4, color: "#94a3b8", animation: "pulse 1s infinite" },
  inputRow: { display: "flex", gap: 8, padding: "12px 16px", background: "#fff", borderTop: "1px solid #e2e8f0" },
  voiceBtn: { width: 44, height: 44, borderRadius: "50%", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", flexShrink: 0 },
  input: { flex: 1, border: "2px solid #e2e8f0", borderRadius: 24, padding: "10px 16px", fontSize: 15, outline: "none" },
  sendBtn: { width: 44, height: 44, borderRadius: "50%", background: "#667eea", color: "#fff", border: "none", fontSize: 18, cursor: "pointer" }
};
