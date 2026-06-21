import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { explainDocument } from '../services/api';

// ─── Shared Voice Button ──────────────────────────────────────

const VOICE_CSS = `
@keyframes voicePulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.5); }
  50%      { box-shadow: 0 0 0 8px rgba(220,38,38,0); }
}
.aria-voice-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 8px 16px; border: none; border-radius: 22px;
  font-size: 13px; font-weight: 700; cursor: pointer;
  transition: all 0.2s; font-family: inherit;
}
.aria-voice-btn.idle     { background: linear-gradient(135deg,#16a34a,#15803d); color:#fff; }
.aria-voice-btn.idle:hover { opacity:.88; transform:scale(1.03); }
.aria-voice-btn.speaking { background: linear-gradient(135deg,#dc2626,#b91c1c); color:#fff;
  animation: voicePulse 1.2s ease-in-out infinite; }
`;

function VoiceBtn({ speaking, onClick, size = 'md' }) {
  return (
    <>
      <style>{VOICE_CSS}</style>
      <button
        className={`aria-voice-btn ${speaking ? 'speaking' : 'idle'}`}
        style={{ padding: size === 'sm' ? '6px 13px' : '8px 16px' }}
        onClick={onClick}
        title={speaking ? 'Stop speaking' : 'Listen'}
      >
        {speaking
          ? <><span style={{ fontSize:15 }}>⏹</span> Stop</>
          : <><span style={{ fontSize:15 }}>🔊</span> Listen</>}
      </button>
    </>
  );
}

// ─── Constants ────────────────────────────────────────────────

const LEVELS = [
  { id: 'BEGINNER',     emoji: '🟢', label: 'Beginner',     grade: 'Grade 1–3',   color: '#16a34a', bg: '#dcfce7', desc: 'Simple words & real-life examples' },
  { id: 'INTERMEDIATE', emoji: '🟡', label: 'Intermediate', grade: 'Grade 4–6',   color: '#d97706', bg: '#fef9c3', desc: 'Clear step-by-step with examples' },
  { id: 'ADVANCED',     emoji: '🔵', label: 'Advanced',     grade: 'Grade 7–9',   color: '#2563eb', bg: '#dbeafe', desc: 'Concepts, formulas & exam tips' },
  { id: 'EXPERT',       emoji: '🔴', label: 'Expert',       grade: 'Grade 10–12', color: '#dc2626', bg: '#fee2e2', desc: 'Board exam level — model answers' },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },    { code: 'hi', label: 'हिंदी' },
  { code: 'te', label: 'తెలుగు' },      { code: 'ta', label: 'தமிழ்' },
  { code: 'kn', label: 'ಕನ್ನಡ' },       { code: 'ml', label: 'മലയാളം' },
  { code: 'mr', label: 'मराठी' },       { code: 'gu', label: 'ગુજરાતી' },
  { code: 'bn', label: 'বাংলা' },       { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'or', label: 'ଓଡ଼ିଆ' },       { code: 'as', label: 'অসমীয়া' },
  { code: 'ur', label: 'اردو' },        { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },     { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },   { code: 'ar', label: 'العربية' },
  { code: 'zh', label: '中文' },        { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },      { code: 'ru', label: 'Русский' },
  { code: 'tr', label: 'Türkçe' },      { code: 'vi', label: 'Tiếng Việt' },
  { code: 'th', label: 'ภาษาไทย' },     { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'ms', label: 'Melayu' },      { code: 'sw', label: 'Swahili' },
  { code: 'ha', label: 'Hausa' },       { code: 'yo', label: 'Yorùbá' },
  { code: 'am', label: 'አማርኛ' },       { code: 'so', label: 'Soomaali' },
  { code: 'ne', label: 'नेपाली' },      { code: 'si', label: 'සිංහල' },
  { code: 'my', label: 'ဗမာ' },
];

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB   = 10;

// ─── Image preprocessing ──────────────────────────────────────

async function preprocessImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1920;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else        { w = Math.round(w * MAX / h); h = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.filter = 'contrast(1.3) brightness(1.05)';
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.src = url;
  });
}

function stripBase64Header(dataUrl) {
  return dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
}

// ─── Markdown renderer ────────────────────────────────────────

function RenderExplanation({ text }) {
  if (!text) return null;
  return (
    <div>
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        const bold = (s) => s.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
          p.startsWith('**') && p.endsWith('**') ? <strong key={j}>{p.slice(2,-2)}</strong> : p
        );
        if (line.startsWith('## ')) return <h3 key={i} style={{ margin:'14px 0 6px', color:'#1a1a2e', fontSize:15, fontWeight:700 }}>{line.slice(3)}</h3>;
        if (line.startsWith('# '))  return <h2 key={i} style={{ margin:'16px 0 8px', color:'#1a1a2e', fontSize:17, fontWeight:800 }}>{line.slice(2)}</h2>;
        if (line.startsWith('• ') || line.startsWith('- '))
          return <div key={i} style={{ display:'flex', gap:8, marginBottom:4 }}><span>•</span><span>{bold(line.slice(2))}</span></div>;
        if (/^\d+\./.test(line))
          return <div key={i} style={{ display:'flex', gap:8, marginBottom:4 }}><span style={{ minWidth:18 }}>{line.split('.')[0]}.</span><span>{bold(line.slice(line.indexOf('.')+1).trim())}</span></div>;
        return <p key={i} style={{ margin:'0 0 6px', lineHeight:1.75 }}>{bold(line)}</p>;
      })}
    </div>
  );
}

// ─── Voice ────────────────────────────────────────────────────

function speak(text, lang, onDone) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/\*\*/g, ''));
  const voices    = window.speechSynthesis.getVoices();
  const match     = voices.find(v => v.lang.startsWith(lang)) || null;
  if (match) utterance.voice = match;
  utterance.rate = 0.95;
  utterance.onend = onDone;
  window.speechSynthesis.speak(utterance);
}

// ─── Camera Modal ─────────────────────────────────────────────

function CameraModal({ onCapture, onClose }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [preview,  setPreview]  = useState('');
  const [active,   setActive]   = useState(false);   // camera is running
  const [error,    setError]    = useState('');
  const [starting, setStarting] = useState(false);

  // Start camera
  const startCamera = async () => {
    setError('');
    setStarting(true);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
      setActive(true);
    } catch {
      setError('Camera not available. Please use the file upload button instead.');
    } finally {
      setStarting(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
  };

  // Auto-start on open, auto-stop on close
  useEffect(() => {
    startCamera();
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  const capture = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.filter = 'contrast(1.3) brightness(1.05)';
    ctx.drawImage(video, 0, 0);
    setPreview(canvas.toDataURL('image/jpeg', 0.85));
  };

  const retake = () => {
    setPreview('');
    if (!active) startCamera();
  };

  const usePhoto = () => {
    stopCamera();
    onCapture(preview);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div style={cm.overlay}>
      <div style={cm.modal}>
        <div style={cm.header}>
          <span style={{ fontWeight:700, fontSize:16 }}>📷 Scan Document</span>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {/* Stop / Start camera toggle */}
            {!preview && (
              active
                ? <button onClick={stopCamera}  style={cm.stopBtn}>⏹ Stop Camera</button>
                : <button onClick={startCamera} style={cm.startBtn} disabled={starting}>
                    {starting ? '⏳ Starting...' : '▶ Start Camera'}
                  </button>
            )}
            <button onClick={handleClose} style={cm.closeBtn}>✕</button>
          </div>
        </div>

        {error ? (
          <div style={{ padding:32, textAlign:'center', color:'#dc2626', fontSize:14 }}>{error}</div>
        ) : preview ? (
          <>
            <img src={preview} alt="captured" style={{ width:'100%', maxHeight:420, objectFit:'contain', display:'block' }} />
            <div style={cm.tips}>✅ Photo captured! Use it or retake.</div>
            <div style={cm.btnRow}>
              <button onClick={retake}   style={cm.secondaryBtn}>↩ Retake</button>
              <button onClick={usePhoto} style={cm.primaryBtn}>✅ Use This Photo</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ position:'relative', background:'#000', minHeight:200 }}>
              {active
                ? <video ref={videoRef} autoPlay playsInline muted style={{ width:'100%', maxHeight:380, display:'block' }} />
                : <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:220, color:'#9ca3af', gap:10 }}>
                    <span style={{ fontSize:40 }}>📷</span>
                    <span style={{ fontSize:14 }}>Camera is stopped</span>
                    <button onClick={startCamera} style={{ ...cm.primaryBtn, padding:'9px 24px', flex:'none', width:'auto' }}>
                      ▶ Start Camera
                    </button>
                  </div>
              }
              {active && (
                <div style={cm.overlay2}>
                  <div>📌 Hold phone steady</div>
                  <div>💡 Ensure text is clear and well-lit</div>
                  <div>📄 Capture the full page</div>
                </div>
              )}
            </div>
            <canvas ref={canvasRef} style={{ display:'none' }} />
            <div style={cm.btnRow}>
              <button onClick={handleClose} style={cm.secondaryBtn}>Cancel</button>
              <button onClick={capture} disabled={!active} style={{ ...cm.primaryBtn, ...(active ? {} : { opacity:0.4 }) }}>
                📸 Capture
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const cm = {
  overlay:     { position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  modal:       { background:'#fff', borderRadius:18, width:'100%', maxWidth:560, overflow:'hidden' },
  header:      { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', borderBottom:'1px solid #f1f5f9' },
  closeBtn:    { background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#6b7280' },
  overlay2:    { position:'absolute', bottom:12, left:12, right:12, background:'rgba(0,0,0,0.65)', borderRadius:10, padding:'10px 14px', color:'#fff', fontSize:12, display:'flex', flexDirection:'column', gap:6 },
  tips:        { padding:'10px 16px', background:'#f0fdf4', color:'#16a34a', fontSize:13, textAlign:'center' },
  btnRow:      { display:'flex', gap:10, padding:16 },
  primaryBtn:  { flex:1, padding:'11px 0', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:14 },
  secondaryBtn:{ flex:1, padding:'11px 0', background:'#f1f5f9', color:'#374151', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer', fontSize:14 },
  stopBtn:     { padding:'5px 12px', background:'#fee2e2', border:'none', borderRadius:8, color:'#dc2626', fontWeight:700, fontSize:12, cursor:'pointer' },
  startBtn:    { padding:'5px 12px', background:'#dcfce7', border:'none', borderRadius:8, color:'#16a34a', fontWeight:700, fontSize:12, cursor:'pointer' },
};

// ─── Main Page ────────────────────────────────────────────────
// NOTE: UploadPanel and ExplanationPanel are rendered with renderUploadPanel()
// and renderExplanationPanel() — NOT as <UploadPanel/> JSX elements.
// This is intentional: inner JSX functions avoid React unmounting the panel
// on every state change (which would cause the textarea to lose focus).

export default function DocumentTeacherPage() {
  const navigate     = useNavigate();
  const fileInputRef = useRef(null);
  const mobileCapRef = useRef(null);

  const [file,        setFile]        = useState(null);
  const [previewUrl,  setPreviewUrl]  = useState('');
  const [fileType,    setFileType]    = useState('');
  const [level,       setLevel]       = useState('INTERMEDIATE');
  const [language,    setLanguage]    = useState('en');
  const [question,    setQuestion]    = useState('');
  const [loading,     setLoading]     = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [error,       setError]       = useState('');
  const [dragOver,    setDragOver]    = useState(false);
  const [activeTab,   setActiveTab]   = useState('upload');
  const [cameraOpen,  setCameraOpen]  = useState(false);
  const [speaking,    setSpeaking]    = useState(false);
  const [expandedQ,   setExpandedQ]   = useState(null);

  const user  = JSON.parse(sessionStorage.getItem('aria_user') || '{}');
  const grade = user.grade || 5;
  const board = user.board || 'CBSE';

  useEffect(() => {
    if (!sessionStorage.getItem('aria_token')) navigate('/login');
  }, [navigate]);

  // ── File processing ─────────────────────────────────────────

  const processFile = useCallback(async (incoming) => {
    setError('');
    if (!ALLOWED_TYPES.includes(incoming.type)) {
      setError('Only PDF, JPG, PNG, and WEBP files are supported.');
      return;
    }
    if (incoming.size > MAX_SIZE_MB * 1024 * 1024) {
      setError('File too large. Maximum allowed size is 10 MB.');
      return;
    }
    setFile(incoming);
    setFileType(incoming.type === 'application/pdf' ? 'pdf' : 'image');
    if (incoming.type === 'application/pdf') {
      setPreviewUrl('pdf');
    } else {
      const processed = await preprocessImage(incoming);
      setPreviewUrl(processed);
    }
    setExplanation(null);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  }, [processFile]);

  const handleFileInput = (e) => {
    if (e.target.files[0]) processFile(e.target.files[0]);
    e.target.value = '';
  };

  const handleCameraCapture = (dataUrl) => {
    setCameraOpen(false);
    setPreviewUrl(dataUrl);
    setFileType('image');
    // Store as a synthetic object; base64 will be used directly
    setFile({ name: 'camera-capture.jpg', _isCamera: true });
    setExplanation(null);
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setPreviewUrl('');
    setExplanation(null);
    setError('');
  };

  // ── Explain ─────────────────────────────────────────────────

  const handleExplain = async () => {
    if (!file) { setError('Please upload or capture a document first.'); return; }
    setLoading(true);
    setError('');
    setExplanation(null);

    try {
      let base64 = '';
      const actualFile = file instanceof File ? file : null;

      if (fileType === 'image' && previewUrl.startsWith('data:')) {
        base64 = stripBase64Header(previewUrl);
      } else if (fileType === 'pdf' && actualFile) {
        const buf = await actualFile.arrayBuffer();
        base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      }

      const result = await explainDocument({
        _file:             actualFile,           // actual File for multipart upload
        document_base64:   base64,               // base64 for AI service direct / camera
        document_type:     fileType,
        student_name:      user.fullName || 'Student',
        grade:             parseInt(grade) || 5,
        level,
        language,
        specific_question: question.trim() || undefined,
        board,
      });

      setExplanation(result.data);
      setActiveTab('explanation');
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Could not get explanation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = () => {
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    if (!explanation?.explanation) return;
    const text = [
      explanation.topic_detected ? `Topic: ${explanation.topic_detected}.` : '',
      explanation.explanation,
    ].filter(Boolean).join(' ');
    setSpeaking(true);
    speak(text, language, () => setSpeaking(false));
  };

  const handleReExplain = (newLevel) => {
    setLevel(newLevel);
    // Use current state but override level
    setTimeout(handleExplain, 50);
  };

  // ── Render helpers ──────────────────────────────────────────
  // IMPORTANT: these are called as renderUploadPanel() not <UploadPanel/>
  // so React treats their output as inline JSX of THIS component —
  // no separate component lifecycle, no unmount on state change.

  const renderUploadPanel = () => (
    <div style={s.panel}>

      {/* Drop zone */}
      <div
        data-testid="dropzone"
        style={{ ...s.dropzone, ...(dragOver ? s.dropHover : {}), ...(file ? s.dropFilled : {}) }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
      >
        {file ? (
          <div style={{ width:'100%', textAlign:'center' }}>
            {fileType === 'image' && previewUrl ? (
              <img src={previewUrl} alt="preview" style={s.preview} />
            ) : (
              <div style={s.pdfPreview}>
                <div style={{ fontSize:52 }}>📄</div>
                <div style={{ fontWeight:700, color:'#1a1a2e', marginTop:8, fontSize:15 }}>
                  {file.name || 'document.pdf'}
                </div>
                <div style={{ color:'#6b7280', fontSize:12, marginTop:2 }}>PDF Document ready</div>
              </div>
            )}
            <button onClick={handleRemoveFile} style={s.removeBtn}>✕ Remove</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize:52, marginBottom:12 }}>📂</div>
            <div style={{ fontWeight:700, color:'#374151', fontSize:16, marginBottom:6 }}>
              Drag & drop your document here
            </div>
            <div style={{ color:'#9ca3af', fontSize:13, marginBottom:18 }}>
              PDF, JPG, PNG, WEBP · Max {MAX_SIZE_MB} MB
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
              <button
                onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                style={s.uploadBtn}>
                📁 Browse File
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
                  if (isMobile) mobileCapRef.current?.click();
                  else setCameraOpen(true);
                }}
                style={s.cameraBtn}>
                📷 Scan Document
              </button>
            </div>
          </>
        )}
      </div>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display:'none' }} onChange={handleFileInput} />
      <input ref={mobileCapRef} type="file" accept="image/*" capture="environment"   style={{ display:'none' }} onChange={handleFileInput} />

      {/* Error */}
      {error && <div style={s.errorBox}>⚠️ {error}</div>}

      {/* Level selector */}
      <div style={s.sectionLabel}>Choose explanation level:</div>
      <div style={s.levelGrid}>
        {LEVELS.map(l => (
          <div key={l.id}
            onClick={() => setLevel(l.id)}
            style={{ ...s.levelCard, ...(level === l.id ? { borderColor: l.color, background: l.bg, transform:'scale(1.03)' } : {}) }}>
            <div style={{ fontSize:20 }}>{l.emoji}</div>
            <div style={{ fontWeight:700, color: level === l.id ? l.color : '#374151', fontSize:13 }}>{l.label}</div>
            <div style={{ fontSize:11, color:'#9ca3af', textAlign:'center' }}>{l.grade}</div>
            {level === l.id && <div style={{ fontSize:10, color: l.color, textAlign:'center', marginTop:2 }}>{l.desc}</div>}
          </div>
        ))}
      </div>

      {/* Language */}
      <div style={s.sectionLabel}>Response language:</div>
      <select
        value={language}
        onChange={e => setLanguage(e.target.value)}
        style={s.select}>
        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
      </select>

      {/* ── SPECIFIC QUESTION ──────────────────────────────────
          This textarea must NOT be inside a component defined inside this
          render function. It is inline JSX here, so it will never unmount
          on state changes and typing will work correctly. */}
      <div style={s.sectionLabel}>Ask a specific question (optional):</div>
      <textarea
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder={
          'Examples:\n' +
          '• What is the formula on this page?\n' +
          '• Explain the highlighted paragraph\n' +
          '• Solve the first example step by step\n' +
          '• What topic is this and how important is it for exams?'
        }
        style={s.textarea}
        rows={4}
      />

      {/* Explain button */}
      <button
        onClick={handleExplain}
        disabled={loading || !file}
        style={{ ...s.explainBtn, ...(loading || !file ? s.explainBtnOff : {}) }}>
        {loading ? '⏳ ARIA is reading your document...' : '🧠 Explain This Document'}
      </button>

      {loading && (
        <div style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'center', padding:'12px 0' }}>
          <span style={{ display:'inline-block', width:10, height:10, borderRadius:'50%', background:'#6366f1',
                         animation:'ariapulse 1.2s ease-in-out infinite' }} />
          <span style={{ color:'#6366f1', fontWeight:600, fontSize:13 }}>ARIA is reading your document...</span>
          <style>{`@keyframes ariapulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }`}</style>
        </div>
      )}
    </div>
  );

  const renderExplanationPanel = () => {
    if (!explanation) {
      return (
        <div style={s.emptyPanel}>
          <div style={{ fontSize:64, marginBottom:16 }}>📖</div>
          <div style={{ fontWeight:700, color:'#374151', fontSize:18, marginBottom:8 }}>
            Upload a document to get started
          </div>
          <div style={{ color:'#9ca3af', fontSize:14, maxWidth:300, textAlign:'center', lineHeight:1.65 }}>
            ARIA will explain it from basics to expert level — in any language, any subject
          </div>
          <div style={{ marginTop:20, display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center' }}>
            {['📚 Any textbook', '📝 Question papers', '🖊️ Handwritten notes', '🖼️ Diagrams'].map(t => (
              <span key={t} style={{ padding:'5px 12px', borderRadius:20, background:'#f3f4f6', color:'#6b7280', fontSize:12 }}>{t}</span>
            ))}
          </div>
        </div>
      );
    }

    const lvl = LEVELS.find(l => l.id === level) || LEVELS[1];
    const keyPoints  = Array.isArray(explanation.key_points) ? explanation.key_points : [];
    const practiceQs = Array.isArray(explanation.practice_questions) ? explanation.practice_questions : [];

    return (
      <div style={s.explPanel}>

        {/* Detected metadata badges */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:18 }}>
          {explanation.subject_detected && (
            <span style={{ ...s.badge, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff' }}>
              {explanation.subject_detected}
            </span>
          )}
          {explanation.topic_detected && (
            <span style={{ ...s.badge, background:'#f3f4f6', color:'#374151' }}>
              {explanation.topic_detected}
            </span>
          )}
          {explanation.grade_detected && (
            <span style={{ ...s.badge, background:'#fef9c3', color:'#92400e' }}>
              Grade {explanation.grade_detected}
            </span>
          )}
          <span style={{ ...s.badge, background: lvl.bg, color: lvl.color }}>
            {lvl.emoji} {lvl.label}
          </span>
          {explanation.difficulty_rating && (
            <span style={{ ...s.badge, background:'#f3f4f6', color:'#6b7280' }}>
              {'⭐'.repeat(explanation.difficulty_rating)} Difficulty
            </span>
          )}
        </div>

        {/* Key points */}
        {keyPoints.length > 0 && (
          <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:'14px 16px', marginBottom:18 }}>
            <div style={{ fontWeight:700, color:'#1a1a2e', marginBottom:10, fontSize:14 }}>🔑 Key Points</div>
            {keyPoints.map((pt, i) => (
              <div key={i} style={{ display:'flex', gap:8, marginBottom:6, fontSize:13, alignItems:'flex-start' }}>
                <span>✅</span>
                <span style={{ color:'#374151', lineHeight:1.55 }}>{pt}</span>
              </div>
            ))}
          </div>
        )}

        {/* Main explanation */}
        <div style={{ fontSize:14, lineHeight:1.8, color:'#374151', marginBottom:20 }}>
          <RenderExplanation text={explanation.explanation} />
        </div>

        {/* Practice questions */}
        {practiceQs.length > 0 && (
          <div style={{ background:'#faf5ff', border:'1px solid #e9d5ff', borderRadius:12, padding:'14px 16px', marginBottom:18 }}>
            <div style={{ fontWeight:700, color:'#1a1a2e', marginBottom:10, fontSize:14 }}>📝 Practice Questions</div>
            {practiceQs.map((q, i) => (
              <div key={i} style={{ marginBottom:8, background:'#fff', borderRadius:8, overflow:'hidden' }}>
                <div
                  style={{ display:'flex', alignItems:'flex-start', padding:'10px 12px', cursor:'pointer', userSelect:'none' }}
                  onClick={() => setExpandedQ(expandedQ === i ? null : i)}>
                  <span style={{ fontWeight:700, color:'#6366f1', marginRight:8 }}>Q{i+1}.</span>
                  <span style={{ flex:1, fontSize:14, color:'#374151', lineHeight:1.5 }}>{q}</span>
                  <span style={{ color:'#9ca3af', fontSize:12, marginLeft:8 }}>{expandedQ === i ? '▲' : '▼'}</span>
                </div>
                {expandedQ === i && (
                  <div style={{ padding:'0 12px 10px 36px', fontSize:12, color:'#7c3aed', fontStyle:'italic' }}>
                    💡 Try solving this yourself first — then ask ARIA to check your answer!
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:16 }}>
          <VoiceBtn speaking={speaking} onClick={handleSpeak} />
          <button onClick={() => { setExplanation(null); setFile(null); setPreviewUrl(''); setActiveTab('upload'); }} style={s.actionBtn}>
            📄 New Document
          </button>
        </div>

        {/* Re-explain at different level */}
        <div>
          <div style={{ fontSize:12, color:'#9ca3af', marginBottom:8 }}>Re-explain at a different level:</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {LEVELS.filter(l => l.id !== level).map(l => (
              <button key={l.id}
                onClick={() => handleReExplain(l.id)}
                style={{ padding:'6px 12px', borderRadius:20, border:`1.5px solid ${l.color}`,
                         background: l.bg, color: l.color, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                {l.emoji} {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8fafc' }}>
      <Sidebar />

      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.title}>📄 Document Teacher</h1>
            <p style={s.subtitle}>
              Upload any textbook page, question paper, or notes — ARIA explains everything
            </p>
          </div>
          <button onClick={() => navigate('/document-history')} style={s.historyBtn}>
            📋 My History
          </button>
        </div>

        {/* Mobile tabs */}
        <div style={s.tabs}>
          <div style={{ ...s.tab, ...(activeTab === 'upload' ? s.tabActive : {}) }}
            onClick={() => setActiveTab('upload')}>📂 Upload</div>
          <div style={{ ...s.tab, ...(activeTab === 'explanation' ? s.tabActive : {}) }}
            onClick={() => setActiveTab('explanation')}>
            🧠 Explanation
            {explanation && <span style={s.tabDot} />}
          </div>
        </div>

        {/* Split layout */}
        <div style={s.splitLayout}>
          <div style={{
            ...s.leftPane,
            display: activeTab === 'upload' ? 'block' : (window.innerWidth >= 768 ? 'block' : 'none'),
          }}>
            {renderUploadPanel()}
          </div>
          <div style={{
            ...s.rightPane,
            display: activeTab === 'explanation' ? 'block' : (window.innerWidth >= 768 ? 'block' : 'none'),
          }}>
            {renderExplanationPanel()}
          </div>
        </div>
      </div>

      {cameraOpen && (
        <CameraModal onCapture={handleCameraCapture} onClose={() => setCameraOpen(false)} />
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const s = {
  header:       { display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'24px 24px 0', flexWrap:'wrap', gap:12 },
  title:        { margin:0, fontSize:24, fontWeight:800, color:'#1a1a2e' },
  subtitle:     { margin:'4px 0 0', color:'#6b7280', fontSize:14 },
  historyBtn:   { padding:'8px 16px', background:'#f3f4f6', border:'none', borderRadius:10, cursor:'pointer', color:'#374151', fontWeight:600, fontSize:13 },
  tabs:         { display:'flex', borderBottom:'2px solid #e5e7eb', margin:'16px 24px 0', gap:0 },
  tab:          { flex:1, padding:'10px 0', textAlign:'center', fontSize:13, fontWeight:600, color:'#9ca3af', cursor:'pointer', borderBottom:'2px solid transparent', marginBottom:-2, position:'relative' },
  tabActive:    { color:'#6366f1', borderBottomColor:'#6366f1' },
  tabDot:       { position:'absolute', top:8, right:'calc(50% - 28px)', width:7, height:7, borderRadius:'50%', background:'#6366f1' },
  splitLayout:  { display:'flex', flex:1, gap:20, padding:24, flexWrap:'wrap', alignItems:'flex-start' },
  leftPane:     { flex:'0 0 400px', maxWidth:480, minWidth:0 },
  rightPane:    { flex:1, minWidth:300 },

  panel:        { background:'#fff', borderRadius:16, padding:24, boxShadow:'0 1px 8px rgba(0,0,0,0.07)' },
  dropzone:     { border:'2.5px dashed #d1d5db', borderRadius:14, padding:'32px 20px', textAlign:'center', cursor:'pointer', transition:'all 0.2s', marginBottom:18, minHeight:180, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', position:'relative' },
  dropHover:    { borderColor:'#6366f1', background:'#f5f3ff' },
  dropFilled:   { border:'2px solid #e5e7eb', cursor:'default', padding:'16px 20px' },
  preview:      { width:'100%', maxHeight:240, objectFit:'contain', borderRadius:10, marginBottom:10 },
  pdfPreview:   { display:'flex', flexDirection:'column', alignItems:'center', padding:'16px 0' },
  removeBtn:    { padding:'5px 14px', background:'#fee2e2', border:'none', borderRadius:8, cursor:'pointer', color:'#dc2626', fontWeight:600, fontSize:12 },
  uploadBtn:    { padding:'9px 18px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontWeight:700, fontSize:13 },
  cameraBtn:    { padding:'9px 18px', background:'#f3f4f6', color:'#374151', border:'none', borderRadius:10, cursor:'pointer', fontWeight:600, fontSize:13 },

  errorBox:     { background:'#fee2e2', color:'#dc2626', padding:'10px 14px', borderRadius:10, fontSize:13, marginBottom:14 },
  sectionLabel: { fontWeight:700, color:'#374151', fontSize:13, marginBottom:8, marginTop:18 },
  levelGrid:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:4 },
  levelCard:    { border:'2px solid #e5e7eb', borderRadius:12, padding:'12px 8px', cursor:'pointer', textAlign:'center', transition:'all 0.15s', display:'flex', flexDirection:'column', alignItems:'center', gap:3 },

  select:       { width:'100%', padding:'9px 12px', borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:13, color:'#374151', background:'#fff', outline:'none', boxSizing:'border-box' },
  textarea:     { width:'100%', padding:'11px 13px', borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:13, color:'#374151', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box', lineHeight:1.6, outline:'none' },

  explainBtn:   { width:'100%', marginTop:18, padding:'13px 0', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:12, fontWeight:800, fontSize:15, cursor:'pointer', boxShadow:'0 4px 14px rgba(99,102,241,0.3)', transition:'all 0.2s' },
  explainBtnOff:{ opacity:0.5, cursor:'not-allowed', boxShadow:'none' },

  emptyPanel:   { background:'#fff', borderRadius:16, minHeight:500, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', boxShadow:'0 1px 8px rgba(0,0,0,0.07)', padding:40 },
  explPanel:    { background:'#fff', borderRadius:16, padding:24, boxShadow:'0 1px 8px rgba(0,0,0,0.07)', maxHeight:'calc(100vh - 180px)', overflowY:'auto' },

  badge:        { padding:'4px 10px', borderRadius:20, fontSize:12, fontWeight:700 },
  actionBtn:    { flex:1, padding:'10px 0', background:'#f3f4f6', border:'none', borderRadius:10, fontWeight:600, fontSize:13, cursor:'pointer', color:'#374151' },
};
