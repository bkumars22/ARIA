import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { solveHomework, detectSubject } from '../services/api';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// ─── Shared Voice Button ──────────────────────────────────────

const VOICE_CSS = `
@keyframes voicePulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.5); }
  50%      { box-shadow: 0 0 0 8px rgba(220,38,38,0); }
}
.aria-voice-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  border: none;
  border-radius: 22px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.aria-voice-btn.idle {
  background: linear-gradient(135deg,#16a34a,#15803d);
  color: #fff;
}
.aria-voice-btn.idle:hover { opacity: 0.88; transform: scale(1.03); }
.aria-voice-btn.speaking {
  background: linear-gradient(135deg,#dc2626,#b91c1c);
  color: #fff;
  animation: voicePulse 1.2s ease-in-out infinite;
}
`;

function VoiceBtn({ speaking, onClick, size = 'md' }) {
  const pad = size === 'sm' ? '6px 13px' : '8px 16px';
  return (
    <>
      <style>{VOICE_CSS}</style>
      <button
        className={`aria-voice-btn ${speaking ? 'speaking' : 'idle'}`}
        style={{ padding: pad }}
        onClick={onClick}
        title={speaking ? 'Stop speaking' : 'Listen to answer'}
      >
        {speaking
          ? <><span style={{ fontSize:15 }}>⏹</span> Stop</>
          : <><span style={{ fontSize:15 }}>🔊</span> Listen</>}
      </button>
    </>
  );
}

// ─── Constants ────────────────────────────────────────────────

const SUBJECTS = [
  'Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology',
  'English', 'History', 'Geography', 'Economics', 'Coding',
];

const LEVELS = [
  { id: 'WEAK',    emoji: '🔴', label: 'I need basic help',        desc: 'Start from scratch — very simple language' },
  { id: 'AVERAGE', emoji: '🟡', label: 'I understand a little',    desc: 'Step-by-step with explanations' },
  { id: 'STRONG',  emoji: '🟢', label: 'I want deep explanation',  desc: 'Full detail — exam level answer' },
];

const LANGUAGES = [
  { code: 'en', label: 'English' }, { code: 'hi', label: 'हिंदी' },
  { code: 'te', label: 'తెలుగు' },  { code: 'ta', label: 'தமிழ்' },
  { code: 'kn', label: 'ಕನ್ನಡ' },   { code: 'ml', label: 'മലയാളം' },
  { code: 'mr', label: 'मराठी' },   { code: 'gu', label: 'ગુજરાતી' },
  { code: 'bn', label: 'বাংলা' },   { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'fr', label: 'Français'}, { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' }, { code: 'ar', label: 'العربية' },
  { code: 'zh', label: '中文' },    { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },  { code: 'ru', label: 'Русский' },
  { code: 'tr', label: 'Türkçe' },  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'id', label: 'Bahasa Indonesia' }, { code: 'ur', label: 'اردو' },
  { code: 'sw', label: 'Swahili' }, { code: 'ne', label: 'नेपाली' },
  { code: 'si', label: 'සිංහල' },  { code: 'my', label: 'ဗမာ' },
  { code: 'th', label: 'ภาษาไทย' }, { code: 'ms', label: 'Melayu' },
  { code: 'ha', label: 'Hausa' },   { code: 'yo', label: 'Yorùbá' },
  { code: 'am', label: 'አማርኛ' },   { code: 'so', label: 'Soomaali' },
  { code: 'or', label: 'ଓଡ଼ିଆ' },   { code: 'as', label: 'অসমীয়া' },
  { code: 'pt', label: 'Português' },
];

const LOADING_MSGS = [
  'Reading your question carefully...',
  'Calculating step by step...',
  'Checking the answer...',
  'Preparing explanation just for you...',
  'Verifying every step is correct...',
  'Making it easy to understand...',
];

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_MB = 10;

// ─── Helpers ──────────────────────────────────────────────────

async function toBase64(file) {
  return new Promise(resolve => {
    const r = new FileReader();
    r.onload = () => { const d = r.result; resolve(d.includes(',') ? d.split(',')[1] : d); };
    r.readAsDataURL(file);
  });
}

// ─── Math helpers ─────────────────────────────────────────────

function renderMath(expr, display = false) {
  try {
    return katex.renderToString(expr.trim(), {
      throwOnError: false,
      displayMode: display,
      output: 'html',
      trust: false,
    });
  } catch {
    return expr;
  }
}

// Split a string into text and LaTeX segments.
// Handles \(...\) inline and \[...\] / $$...$$ block math.
function parseMathSegments(text) {
  const segments = [];
  // Pattern: \(...\) inline, \[...\] or $$...$$ display
  const RE = /(\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\\\([\s\S]*?\\\)|\$[^\n$]+?\$)/g;
  let last = 0;
  let m;
  while ((m = RE.exec(text)) !== null) {
    if (m.index > last) segments.push({ type: 'text', content: text.slice(last, m.index) });
    const raw = m[0];
    const isDisplay = raw.startsWith('\\[') || raw.startsWith('$$');
    const inner = raw.replace(/^\\\[|^\$\$|^\\\(|^\$/,'').replace(/\\\]$|\$\$$|\\\)$|\$$/,'');
    segments.push({ type: 'math', content: inner, display: isDisplay });
    last = m.index + raw.length;
  }
  if (last < text.length) segments.push({ type: 'text', content: text.slice(last) });
  return segments;
}

// Render inline **bold** and math within a single line
function InlineLine({ text }) {
  const segs = parseMathSegments(text);
  return (
    <>
      {segs.map((seg, i) => {
        if (seg.type === 'math') {
          return <span key={i} dangerouslySetInnerHTML={{ __html: renderMath(seg.content, seg.display) }} />;
        }
        // Bold **...**
        const parts = seg.content.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={i}>
            {parts.map((p, j) =>
              p.startsWith('**') && p.endsWith('**')
                ? <strong key={j}>{p.slice(2, -2)}</strong>
                : p
            )}
          </span>
        );
      })}
    </>
  );
}

function RenderSection({ text }) {
  if (!text) return null;
  const lines = String(text).split('\n');
  return (
    <div style={{ fontSize:14, lineHeight:2, color:'#374151' }}>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height:6 }} />;

        // Display math block: \[...\] or $$...$$
        if (/^\s*(\\\[|\$\$)/.test(line)) {
          const inner = line.replace(/^\s*(\\\[|\$\$)/, '').replace(/(\\\]|\$\$)\s*$/, '');
          return (
            <div key={i} style={{ margin:'10px 0', overflowX:'auto', padding:'8px 12px',
                background:'#f0f4ff', borderRadius:8, borderLeft:'3px solid #6366f1' }}
              dangerouslySetInnerHTML={{ __html: renderMath(inner, true) }} />
          );
        }

        // Headings
        if (line.startsWith('### ')) return <h4 key={i} style={{ margin:'12px 0 4px', fontSize:14, fontWeight:800, color:'#374151' }}><InlineLine text={line.slice(4)} /></h4>;
        if (line.startsWith('## '))  return <h3 key={i} style={{ margin:'14px 0 5px', fontSize:15, fontWeight:800, color:'#1a1a2e' }}><InlineLine text={line.slice(3)} /></h3>;
        if (line.startsWith('# '))   return <h2 key={i} style={{ margin:'16px 0 6px', fontSize:17, fontWeight:900, color:'#1a1a2e' }}><InlineLine text={line.slice(2)} /></h2>;

        // Numbered step  "1." or "Step 1:" pattern
        if (/^(Step\s*\d+[:\.]|(\d+)[\.\)])\s/.test(line)) {
          const numMatch = line.match(/^(Step\s*\d+[:\.]|(\d+)[\.\)])\s*/);
          const label = numMatch[0].trim();
          const rest  = line.slice(numMatch[0].length);
          return (
            <div key={i} style={{ display:'flex', gap:10, marginBottom:6, alignItems:'flex-start',
                background:'#f8f9ff', borderRadius:8, padding:'6px 10px', border:'1px solid #e8eaff' }}>
              <span style={{ minWidth:56, fontWeight:800, color:'#6366f1', fontSize:13, flexShrink:0 }}>{label}</span>
              <span style={{ flex:1 }}><InlineLine text={rest} /></span>
            </div>
          );
        }

        // Bullet "• " or "- "
        if (line.startsWith('• ') || line.startsWith('- ')) {
          return (
            <div key={i} style={{ display:'flex', gap:8, marginBottom:4, alignItems:'flex-start' }}>
              <span style={{ color:'#6366f1', fontWeight:700, flexShrink:0 }}>•</span>
              <span><InlineLine text={line.slice(2)} /></span>
            </div>
          );
        }

        // "Answer:" highlight line
        if (/^(∴|Therefore|Answer|Result|Hence)[:\s]/i.test(line)) {
          return (
            <div key={i} style={{ margin:'8px 0', padding:'8px 14px', background:'#dcfce7',
                border:'1.5px solid #86efac', borderRadius:10, fontWeight:700, color:'#15803d', fontSize:14 }}>
              <InlineLine text={line} />
            </div>
          );
        }

        return <p key={i} style={{ margin:'0 0 5px' }}><InlineLine text={line} /></p>;
      })}
    </div>
  );
}

function Card({ emoji, title, bg, border, children }) {
  return (
    <div style={{ background: bg, border: `1.5px solid ${border}`, borderRadius:14, padding:'16px 18px', marginBottom:14 }}>
      <div style={{ fontWeight:800, color:'#1a1a2e', fontSize:14, marginBottom:10 }}>
        {emoji} {title}
      </div>
      {children}
    </div>
  );
}

function ConfidenceBar({ value }) {
  const pct = Math.round((value || 0.9) * 100);
  const color = pct >= 90 ? '#16a34a' : pct >= 75 ? '#d97706' : '#dc2626';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
      <span style={{ fontSize:12, color:'#6b7280', minWidth:140 }}>ARIA confidence:</span>
      <div style={{ flex:1, height:6, background:'#e5e7eb', borderRadius:3, overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', background:color, transition:'width 1s' }} />
      </div>
      <span style={{ fontSize:12, fontWeight:700, color }}>{pct}%</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function HomeworkHelperPage() {
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const user = JSON.parse(sessionStorage.getItem('aria_user') || '{}');

  const [file,         setFile]         = useState(null);
  const [previewUrl,   setPreviewUrl]   = useState('');
  const [fileType,     setFileType]     = useState('');
  const [question,     setQuestion]     = useState('');
  const [subject,      setSubject]      = useState('Mathematics');
  const [level,        setLevel]        = useState('AVERAGE');
  const [language,     setLanguage]     = useState('en');
  const [wantSteps,    setWantSteps]    = useState(true);
  const [wantFull,     setWantFull]     = useState(true);
  const [loading,      setLoading]      = useState(false);
  const [loadingMsg,   setLoadingMsg]   = useState('');
  const [error,        setError]        = useState('');
  const [answer,       setAnswer]       = useState(null);
  const [dragOver,     setDragOver]     = useState(false);
  const [history,      setHistory]      = useState([]);       // conversation history
  const [followup,     setFollowup]     = useState('');
  const [fuLoading,    setFuLoading]    = useState(false);
  const [detecting,    setDetecting]    = useState(false);
  const [detectedInfo, setDetectedInfo] = useState(null);
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceAns,  setPracticeAns]  = useState('');
  const [practiceResult, setPracticeResult] = useState(null);
  const [speaking,     setSpeaking]     = useState(false);
  const answerRef = useRef(null);

  useEffect(() => {
    if (!sessionStorage.getItem('aria_token')) navigate('/login');
  }, [navigate]);

  // Rotate loading messages
  useEffect(() => {
    if (!loading) { setLoadingMsg(''); return; }
    let i = 0;
    setLoadingMsg(LOADING_MSGS[0]);
    const t = setInterval(() => {
      i = (i + 1) % LOADING_MSGS.length;
      setLoadingMsg(LOADING_MSGS[i]);
    }, 2000);
    return () => clearInterval(t);
  }, [loading]);

  // ── File handling ─────────────────────────────────────────

  const handleFile = useCallback(async (f) => {
    if (!ALLOWED_TYPES.includes(f.type)) { setError('Only PDF, JPG, PNG, WEBP supported.'); return; }
    if (f.size > MAX_MB * 1024 * 1024)  { setError('File too large. Max 10 MB.'); return; }
    setError('');
    setFile(f);
    setFileType(f.type === 'application/pdf' ? 'pdf' : 'image');
    setPreviewUrl(f.type !== 'application/pdf' ? URL.createObjectURL(f) : 'pdf');
    setDetectedInfo(null);

    // Auto-detect subject + grade (debounced)
    setDetecting(true);
    try {
      const b64 = await toBase64(f);
      const res = await detectSubject({ document_base64: b64, document_type: f.type === 'application/pdf' ? 'pdf' : 'image', question: '' });
      if (res?.data?.subject) {
        setDetectedInfo(res.data);
        setSubject(res.data.subject);
      }
    } catch { /* detection is optional — no error shown */ }
    finally  { setDetecting(false); }
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  // ── Solve ─────────────────────────────────────────────────

  const handleSolve = async () => {
    if (!file && !question.trim()) {
      setError('Upload your homework or type a question first.');
      return;
    }
    setLoading(true);
    setError('');
    setAnswer(null);
    setPracticeMode(false);
    setPracticeResult(null);

    try {
      let base64 = '';
      if (file instanceof File) base64 = await toBase64(file);

      const res = await solveHomework({
        _file:             file instanceof File ? file : null,
        document_base64:   base64,
        document_type:     fileType || 'none',
        student_question:  question.trim(),
        student_name:      user.fullName || 'Student',
        grade:             parseInt(user.grade) || 5,
        board:             user.board || 'CBSE',
        subject,
        language,
        student_level:     level,
        want_full_answer:  wantFull,
        want_step_by_step: wantSteps,
      });

      const data = res?.data || res;
      setAnswer(data);
      setHistory(prev => [...prev, { question: question || file?.name || 'Document', answer: data }]);
      // Scroll to answer
      setTimeout(() => answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Could not get answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Follow-up ─────────────────────────────────────────────

  const handleFollowup = async () => {
    if (!followup.trim() || !answer) return;
    setFuLoading(true);
    try {
      const sessionId = answer?.sessionId;
      let res;
      if (sessionId) {
        res = await fetch(`/api/homework/${sessionId}/followup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('aria_token')}` },
          body: JSON.stringify({ question: followup }),
        }).then(r => r.json());
      } else {
        // Demo: use solveHomework
        res = await solveHomework({
          document_base64:  '',
          document_type:    'none',
          student_question: followup,
          student_name:     user.fullName || 'Student',
          grade:            parseInt(user.grade) || 5,
          board:            user.board || 'CBSE',
          subject, language,
          student_level:    level,
          want_full_answer: true,
          want_step_by_step: true,
        });
      }
      const fuAnswer = res?.data || res;
      setHistory(prev => [...prev, { question: followup, answer: fuAnswer }]);
      setAnswer(fuAnswer);
      setFollowup('');
      setTimeout(() => answerRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }), 100);
    } catch { /* silent */ }
    finally { setFuLoading(false); }
  };

  // ── Practice problem verification ────────────────────────

  const checkPractice = async () => {
    if (!practiceAns.trim()) return;
    setPracticeResult({ checking: true });
    try {
      const sessionId = answer?.sessionId;
      if (sessionId) {
        const r = await fetch(`/api/homework/${sessionId}/verify-attempt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('aria_token')}` },
          body: JSON.stringify({ studentAnswer: practiceAns }),
        }).then(r => r.json());
        setPracticeResult(r);
      } else {
        setPracticeResult({ correct: null, feedback: 'Submit your answer to ARIA and ask "Is this correct?"', checking: false });
      }
    } catch { setPracticeResult({ correct: null, feedback: 'Could not check answer.', checking: false }); }
  };

  const handleSpeak = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    if (!answer?.complete_solution) return;
    const text = [answer.concept_explanation, answer.complete_solution]
      .filter(Boolean).join('. ').replace(/\*\*/g, '');
    const u      = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const match  = voices.find(v => v.lang.startsWith(language));
    if (match) u.voice = match;
    u.rate  = 0.92;
    u.pitch = 1.05;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  const copyAnswer = () => {
    if (!answer) return;
    const text = [
      `📚 ${answer.topic_detected || 'Answer'} — ${answer.board_reference || ''}`,
      '',
      '💡 CONCEPT:', answer.concept_explanation,
      '',
      '✏️ SOLUTION:', answer.complete_solution,
      '',
      '🎯 EXAM TIP:', answer.exam_tip,
    ].filter(x => x !== undefined).join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
  };

  // ─── RENDER ──────────────────────────────────────────────────

  const renderLeft = () => (
    <div style={s.leftPanel}>
      <h1 style={s.pageTitle}>📚 Homework Helper</h1>
      <p style={s.pageSubtitle}>
        Upload your homework or type any question — ARIA gives you a genuine complete answer
      </p>

      {/* Upload zone */}
      <div
        style={{ ...s.dropzone, ...(dragOver ? s.dropHover : {}), ...(file ? s.dropFilled : {}) }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !file && fileRef.current?.click()}
      >
        {file ? (
          <div style={{ textAlign:'center', width:'100%' }}>
            {fileType === 'image' && previewUrl !== 'pdf'
              ? <img src={previewUrl} alt="preview" style={{ width:'100%', maxHeight:200, objectFit:'contain', borderRadius:10, marginBottom:8 }} />
              : <div style={{ fontSize:48 }}>📄</div>
            }
            <div style={{ fontWeight:700, color:'#1a1a2e', fontSize:13, marginBottom:2 }}>{file.name}</div>
            {detecting && <div style={{ color:'#6366f1', fontSize:12 }}>🔍 ARIA is reading your document...</div>}
            {detectedInfo && !detecting && (
              <div style={{ color:'#16a34a', fontSize:12, marginTop:4 }}>
                ✅ ARIA detected: <strong>{detectedInfo.subject}</strong>
                {detectedInfo.ncert_reference ? ` — ${detectedInfo.ncert_reference}` : ''}
              </div>
            )}
            <button onClick={e => { e.stopPropagation(); setFile(null); setPreviewUrl(''); setDetectedInfo(null); }} style={s.removeBtn}>
              ✕ Remove
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize:44, marginBottom:10 }}>📂</div>
            <div style={{ fontWeight:700, color:'#374151', fontSize:15, marginBottom:4 }}>
              Drop your homework here
            </div>
            <div style={{ color:'#9ca3af', fontSize:12, marginBottom:14 }}>
              Textbook page, worksheet, question paper · PDF / Photo · Max 10 MB
            </div>
            <button onClick={e => { e.stopPropagation(); fileRef.current?.click(); }} style={s.uploadBtn}>
              📁 Choose File
            </button>
          </>
        )}
      </div>
      <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display:'none' }}
        onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); e.target.value=''; }} />

      {/* OR divider */}
      <div style={s.orDiv}><span style={s.orLine} /><span style={s.orText}>OR</span><span style={s.orLine} /></div>

      {/* Question textarea */}
      <textarea
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder={'Type your question here...\n\nExamples:\n• Solve x² + 5x + 6 = 0\n• What is photosynthesis?\n• Write a paragraph about my school\n• Write a Python program to find prime numbers'}
        style={s.textarea}
        rows={5}
      />

      {/* Subject */}
      <label style={s.label}>Subject</label>
      <select value={subject} onChange={e => setSubject(e.target.value)} style={s.select}>
        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      {/* My Level */}
      <label style={s.label}>My Level</label>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:12 }}>
        {LEVELS.map(l => (
          <div key={l.id}
            onClick={() => setLevel(l.id)}
            style={{ ...s.levelOption, ...(level === l.id ? s.levelActive : {}) }}>
            <span style={{ fontSize:16 }}>{l.emoji}</span>
            <div>
              <div style={{ fontWeight:700, fontSize:13, color: level === l.id ? '#1a1a2e' : '#374151' }}>{l.label}</div>
              <div style={{ fontSize:11, color:'#6b7280' }}>{l.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Language */}
      <label style={s.label}>Answer language</label>
      <select value={language} onChange={e => setLanguage(e.target.value)} style={s.select}>
        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
      </select>

      {/* Checkboxes */}
      <div style={{ display:'flex', flexDirection:'column', gap:8, margin:'12px 0' }}>
        {[
          { val: wantSteps, set: setWantSteps, label: 'Show me step-by-step working' },
          { val: wantFull,  set: setWantFull,  label: 'Give me the full complete answer' },
        ].map(({ val, set, label }) => (
          <label key={label} style={s.checkbox}>
            <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} style={{ width:16, height:16, accentColor:'#6366f1' }} />
            <span style={{ fontSize:13, color:'#374151' }}>{label}</span>
          </label>
        ))}
      </div>

      {error && <div style={s.errorBox}>⚠️ {error}</div>}

      {/* Submit */}
      <button onClick={handleSolve} disabled={loading} style={{ ...s.solveBtn, ...(loading ? s.solveBtnOff : {}) }}>
        {loading ? '⏳ Getting your answer...' : '🧠 Get Answer from ARIA'}
      </button>
    </div>
  );

  const renderRight = () => {
    if (loading) return (
      <div style={s.emptyRight}>
        <div style={{ fontSize:64, marginBottom:16, animation:'spin 3s linear infinite' }}>🧠</div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        <div style={{ fontWeight:700, color:'#1a1a2e', fontSize:18, marginBottom:8 }}>ARIA is thinking...</div>
        <div style={{ color:'#6366f1', fontSize:14 }}>{loadingMsg}</div>
      </div>
    );

    if (!answer) return (
      <div style={s.emptyRight}>
        <div style={{ fontSize:72, marginBottom:16 }}>🎓</div>
        <div style={{ fontWeight:800, color:'#1a1a2e', fontSize:20, marginBottom:10, textAlign:'center' }}>
          Ask any question — ARIA answers it completely
        </div>
        <div style={{ color:'#6b7280', fontSize:14, maxWidth:340, textAlign:'center', lineHeight:1.75 }}>
          Upload your homework page or type any question.<br/>
          ARIA gives you <strong>genuine, correct answers</strong> with full working shown — in any language.
        </div>
        <div style={{ marginTop:20, display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center' }}>
          {['📐 Mathematics', '🔬 Science', '📖 English', '🗺️ History', '💻 Coding'].map(t => (
            <span key={t} style={s.tagPill}>{t}</span>
          ))}
        </div>
        <div style={{ marginTop:14, display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center' }}>
          {['CBSE', 'ICSE', 'IGCSE', '35 Languages'].map(t => (
            <span key={t} style={{ ...s.tagPill, background:'#ede9fe', color:'#6366f1' }}>{t}</span>
          ))}
        </div>
      </div>
    );

    // Answer card
    return (
      <div ref={answerRef} style={s.answerPanel}>

        {/* Header */}
        <div style={s.answerHeader}>
          <div>
            <div style={{ fontWeight:800, color:'#1a1a2e', fontSize:18 }}>
              {answer.subject_detected || subject} — {answer.topic_detected || 'Your Answer'}
            </div>
            {answer.board_reference && (
              <div style={{ color:'#6b7280', fontSize:12, marginTop:2 }}>📚 {answer.board_reference}</div>
            )}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <VoiceBtn speaking={speaking} onClick={handleSpeak} />
            <button onClick={copyAnswer} style={s.iconBtn} title="Copy">📋</button>
            <button onClick={() => navigate('/homework-history')} style={s.iconBtn} title="History">📋 History</button>
          </div>
        </div>

        <ConfidenceBar value={answer.answer_confidence} />

        {/* Concept */}
        {answer.concept_explanation && (
          <Card emoji="📚" title="What is this topic?" bg="#eff6ff" border="#bfdbfe">
            <RenderSection text={answer.concept_explanation} />
          </Card>
        )}

        {/* Solution */}
        {answer.complete_solution && (
          <Card emoji="✏️" title="Complete Solution — Step by Step" bg="#fff" border="#e5e7eb">
            <RenderSection text={answer.complete_solution} />
          </Card>
        )}

        {/* Verification */}
        {answer.verification && (
          <Card emoji="✅" title="How to check your answer" bg="#f0fdf4" border="#bbf7d0">
            <RenderSection text={answer.verification} />
          </Card>
        )}

        {/* Key Points */}
        {Array.isArray(answer.key_points) && answer.key_points.length > 0 && (
          <Card emoji="🔑" title="Remember These Points" bg="#faf5ff" border="#e9d5ff">
            {answer.key_points.map((pt, i) => (
              <div key={i} style={{ display:'flex', gap:8, marginBottom:6, fontSize:13 }}>
                <span style={{ color:'#16a34a', fontSize:15 }}>✅</span>
                <span>{pt}</span>
              </div>
            ))}
          </Card>
        )}

        {/* Exam Tip */}
        {answer.exam_tip && (
          <Card emoji="🎯" title="Exam Tip" bg="#fffbeb" border="#fde68a">
            <RenderSection text={answer.exam_tip} />
          </Card>
        )}

        {/* Practice Problem */}
        {answer.practice_problem && (
          <Card emoji="🏋️" title="Practice Problem — Try This!" bg="#f0fdf4" border="#bbf7d0">
            <RenderSection text={answer.practice_problem} />
            {!practiceMode && (
              <button onClick={() => setPracticeMode(true)} style={s.tryBtn}>
                ✏️ Try to solve this
              </button>
            )}
            {practiceMode && (
              <div style={{ marginTop:10 }}>
                <textarea
                  value={practiceAns}
                  onChange={e => setPracticeAns(e.target.value)}
                  placeholder="Write your answer here..."
                  style={{ ...s.textarea, marginBottom:8 }}
                  rows={3}
                />
                <button onClick={checkPractice} style={s.tryBtn}>
                  {practiceResult?.checking ? '⏳ Checking...' : '🔍 Check My Answer'}
                </button>
                {practiceResult && !practiceResult.checking && (
                  <div style={{ marginTop:10, padding:'10px 14px', borderRadius:10,
                               background: practiceResult.correct === true ? '#f0fdf4' : practiceResult.correct === false ? '#fee2e2' : '#fafafa',
                               color: practiceResult.correct === true ? '#16a34a' : practiceResult.correct === false ? '#dc2626' : '#374151',
                               fontSize:13 }}>
                    {practiceResult.correct === true  && '✅ Correct! '}
                    {practiceResult.correct === false && '❌ Not quite. '}
                    {practiceResult.feedback}
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Further Reading */}
        {answer.further_reading && answer.further_reading.length > 0 && (
          <Card emoji="🔗" title="Further Reading & Resources" bg="#fefce8" border="#fde047">
            {answer.further_reading.map((r, i) => (
              <div key={i} style={{ display:'flex', gap:8, marginBottom:6, fontSize:13 }}>
                <span style={{ color:'#ca8a04', flexShrink:0 }}>📖</span>
                <span style={{ color:'#374151' }}><strong>{r.board || r.source}:</strong> {r.description}</span>
              </div>
            ))}
          </Card>
        )}

        {/* Follow-up */}
        <div style={s.followupBox}>
          <div style={{ fontWeight:700, color:'#1a1a2e', fontSize:14, marginBottom:8 }}>
            💬 Ask a follow-up question about this topic
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <input
              value={followup}
              onChange={e => setFollowup(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleFollowup(); } }}
              placeholder="e.g. Can you explain step 3 again? or Give me another example..."
              style={s.fuInput}
            />
            <button onClick={handleFollowup} disabled={fuLoading || !followup.trim()} style={s.fuBtn}>
              {fuLoading ? '⏳' : '→'}
            </button>
          </div>
        </div>

        {/* Conversation history */}
        {history.length > 1 && (
          <div style={{ marginTop:14 }}>
            <div style={{ fontWeight:700, color:'#6b7280', fontSize:12, marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>
              Previous Questions This Session
            </div>
            {history.slice(0, -1).reverse().map((h, i) => (
              <div key={i} style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:10, padding:'10px 14px', marginBottom:8, fontSize:13, cursor:'pointer' }}
                onClick={() => { setAnswer(h.answer); window.scrollTo({ top: 0, behavior:'smooth' }); }}>
                <span style={{ color:'#6b7280', marginRight:6 }}>Q:</span>
                <span style={{ color:'#374151' }}>{h.question}</span>
                <span style={{ float:'right', color:'#6366f1', fontSize:11 }}>View →</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8fafc' }}>
      <Sidebar />
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <div style={s.splitLayout}>
          {renderLeft()}
          {renderRight()}
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const s = {
  splitLayout:  { display:'flex', gap:0, flex:1, minHeight:'100vh', flexWrap:'wrap', alignItems:'flex-start' },
  leftPanel:    { width:380, minWidth:300, maxWidth:420, padding:24, background:'#fff', borderRight:'1px solid #e5e7eb', minHeight:'100vh', flexShrink:0, boxSizing:'border-box' },
  pageTitle:    { margin:'0 0 4px', fontSize:22, fontWeight:900, color:'#1a1a2e' },
  pageSubtitle: { margin:'0 0 16px', color:'#6b7280', fontSize:13, lineHeight:1.5 },

  dropzone:     { border:'2.5px dashed #d1d5db', borderRadius:14, padding:'24px 16px', textAlign:'center', cursor:'pointer', marginBottom:12, transition:'all 0.2s', background:'#fafafa' },
  dropHover:    { borderColor:'#6366f1', background:'#f5f3ff' },
  dropFilled:   { border:'2px solid #e5e7eb', cursor:'default', background:'#fff' },
  removeBtn:    { marginTop:8, padding:'5px 14px', background:'#fee2e2', border:'none', borderRadius:8, color:'#dc2626', fontWeight:600, fontSize:12, cursor:'pointer' },
  uploadBtn:    { padding:'9px 20px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer' },

  orDiv:        { display:'flex', alignItems:'center', gap:10, margin:'10px 0' },
  orLine:       { flex:1, height:1, background:'#e5e7eb' },
  orText:       { fontSize:12, color:'#9ca3af', fontWeight:700 },

  textarea:     { width:'100%', padding:'11px 13px', borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:13, color:'#374151', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box', lineHeight:1.6, outline:'none' },
  label:        { display:'block', fontWeight:700, color:'#374151', fontSize:12, marginBottom:5, marginTop:12 },
  select:       { width:'100%', padding:'9px 12px', borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:13, color:'#374151', background:'#fff', outline:'none', boxSizing:'border-box' },

  levelOption:  { display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px', border:'2px solid #e5e7eb', borderRadius:10, cursor:'pointer', transition:'all 0.15s' },
  levelActive:  { borderColor:'#6366f1', background:'#f5f3ff' },

  checkbox:     { display:'flex', alignItems:'center', gap:8, cursor:'pointer' },
  errorBox:     { background:'#fee2e2', color:'#dc2626', padding:'10px 14px', borderRadius:10, fontSize:13, marginBottom:10 },

  solveBtn:     { width:'100%', marginTop:8, padding:'14px 0', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:12, fontWeight:800, fontSize:15, cursor:'pointer', boxShadow:'0 4px 14px rgba(99,102,241,0.35)' },
  solveBtnOff:  { opacity:0.5, cursor:'not-allowed', boxShadow:'none' },

  emptyRight:   { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:40, minHeight:500 },
  answerPanel:  { flex:1, padding:24, maxHeight:'100vh', overflowY:'auto', boxSizing:'border-box' },
  answerHeader: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14, flexWrap:'wrap', gap:8 },

  iconBtn:      { padding:'7px 12px', background:'#f3f4f6', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600, color:'#374151' },
  tagPill:      { padding:'5px 12px', borderRadius:20, background:'#f1f5f9', color:'#6b7280', fontSize:12 },

  tryBtn:       { marginTop:8, padding:'8px 18px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer' },

  followupBox:  { marginTop:20, background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:14, padding:'14px 16px' },
  fuInput:      { flex:1, padding:'10px 13px', borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:13, color:'#374151', outline:'none', fontFamily:'inherit' },
  fuBtn:        { padding:'10px 18px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:10, fontWeight:800, fontSize:16, cursor:'pointer' },
};
