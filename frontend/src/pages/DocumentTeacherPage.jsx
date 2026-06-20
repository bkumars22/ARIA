import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { explainDocument } from '../services/api';

// ─── Constants ────────────────────────────────────────────────

const LEVELS = [
  { id: 'BEGINNER',     emoji: '🟢', label: 'Beginner',     grade: 'Grade 1–3', color: '#16a34a', bg: '#dcfce7', desc: 'Very simple words & real-life examples' },
  { id: 'INTERMEDIATE', emoji: '🟡', label: 'Intermediate', grade: 'Grade 4–6', color: '#d97706', bg: '#fef9c3', desc: 'Clear step-by-step with examples' },
  { id: 'ADVANCED',     emoji: '🔵', label: 'Advanced',     grade: 'Grade 7–9', color: '#2563eb', bg: '#dbeafe', desc: 'Concepts, formulas & exam tips' },
  { id: 'EXPERT',       emoji: '🔴', label: 'Expert',       grade: 'Grade 10–12', color: '#dc2626', bg: '#fee2e2', desc: 'Board exam level — model answers' },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },       { code: 'hi', label: 'हिंदी' },
  { code: 'te', label: 'తెలుగు' },         { code: 'ta', label: 'தமிழ்' },
  { code: 'kn', label: 'ಕನ್ನಡ' },          { code: 'ml', label: 'മലയാളം' },
  { code: 'mr', label: 'मराठी' },          { code: 'gu', label: 'ગુજરાતી' },
  { code: 'bn', label: 'বাংলা' },          { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'or', label: 'ଓଡ଼ିଆ' },          { code: 'as', label: 'অসমীয়া' },
  { code: 'ur', label: 'اردو' },           { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },        { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },      { code: 'ar', label: 'العربية' },
  { code: 'zh', label: '中文' },           { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },         { code: 'ru', label: 'Русский' },
  { code: 'tr', label: 'Türkçe' },         { code: 'vi', label: 'Tiếng Việt' },
  { code: 'th', label: 'ภาษาไทย' },        { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'ms', label: 'Melayu' },         { code: 'sw', label: 'Swahili' },
  { code: 'ha', label: 'Hausa' },          { code: 'yo', label: 'Yorùbá' },
  { code: 'am', label: 'አማርኛ' },          { code: 'so', label: 'Soomaali' },
  { code: 'ne', label: 'नेपाली' },         { code: 'si', label: 'සිංහල' },
  { code: 'my', label: 'ဗမာ' },
];

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB   = 10;

// ─── Image preprocessing with Canvas ─────────────────────────

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

      // Increase contrast for better OCR
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

// ─── Simple markdown-like renderer ───────────────────────────

function RenderExplanation({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div>
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        // Bold **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={j}>{p.slice(2, -2)}</strong>
            : p
        );
        if (line.startsWith('## '))   return <h3 key={i} style={{ margin:'14px 0 6px', color:'#1a1a2e', fontSize:15, fontWeight:700 }}>{line.slice(3)}</h3>;
        if (line.startsWith('# '))    return <h2 key={i} style={{ margin:'16px 0 8px', color:'#1a1a2e', fontSize:17, fontWeight:800 }}>{line.slice(2)}</h2>;
        if (line.startsWith('• ') || line.startsWith('- '))
          return <div key={i} style={{ display:'flex', gap:8, marginBottom:4 }}><span>•</span><span>{parts.slice(1)}</span></div>;
        if (/^\d+\./.test(line))
          return <div key={i} style={{ display:'flex', gap:8, marginBottom:4 }}><span style={{ minWidth:18 }}>{line.split('.')[0]}.</span><span>{parts}</span></div>;
        return <p key={i} style={{ margin:'0 0 6px', lineHeight:1.7 }}>{parts}</p>;
      })}
    </div>
  );
}

// ─── Voice output ─────────────────────────────────────────────

function speak(text, lang) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/\*\*/g, ''));
  const voices = window.speechSynthesis.getVoices();
  const match  = voices.find(v => v.lang.startsWith(lang)) || null;
  if (match) utterance.voice = match;
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

// ─── Camera Modal ─────────────────────────────────────────────

function CameraModal({ onCapture, onClose }) {
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const [preview, setPreview]   = useState('');
  const [stream,  setStream]    = useState(null);
  const [error,   setError]     = useState('');

  useEffect(() => {
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
      .then(s => { setStream(s); if (videoRef.current) videoRef.current.srcObject = s; })
      .catch(() => setError('Camera not available. Please use the file upload instead.'));
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);

  const capture = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.filter = 'contrast(1.3) brightness(1.05)';
    ctx.drawImage(video, 0, 0);
    setPreview(canvas.toDataURL('image/jpeg', 0.85));
  };

  const retake = () => setPreview('');

  const usePhoto = () => {
    if (preview) { onCapture(preview); stream?.getTracks().forEach(t => t.stop()); }
  };

  return (
    <div style={cm.overlay}>
      <div style={cm.modal}>
        <div style={cm.header}>
          <span style={{ fontWeight:700, fontSize:16 }}>📷 Scan Document</span>
          <button onClick={onClose} style={cm.closeBtn}>✕</button>
        </div>

        {error ? (
          <div style={{ padding:32, textAlign:'center', color:'#dc2626' }}>{error}</div>
        ) : preview ? (
          <>
            <img src={preview} alt="captured" style={{ width:'100%', maxHeight:420, objectFit:'contain' }} />
            <div style={cm.tips}>✅ Looks good? Use this photo or retake.</div>
            <div style={cm.btnRow}>
              <button onClick={retake}  style={cm.secondaryBtn}>↩ Retake</button>
              <button onClick={usePhoto} style={cm.primaryBtn}>✅ Use This Photo</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ position:'relative' }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width:'100%', maxHeight:420, background:'#000' }} />
              <div style={cm.tipsOverlay}>
                <div>📌 Hold phone steady</div>
                <div>💡 Ensure text is clear and well-lit</div>
                <div>📄 Capture the full page</div>
              </div>
            </div>
            <canvas ref={canvasRef} style={{ display:'none' }} />
            <div style={cm.btnRow}>
              <button onClick={onClose} style={cm.secondaryBtn}>Cancel</button>
              <button onClick={capture} style={cm.primaryBtn}>📸 Capture</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const cm = {
  overlay:      { position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  modal:        { background:'#fff', borderRadius:18, width:'100%', maxWidth:560, overflow:'hidden' },
  header:       { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', borderBottom:'1px solid #f1f5f9' },
  closeBtn:     { background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#6b7280' },
  tipsOverlay:  { position:'absolute', bottom:12, left:12, right:12, background:'rgba(0,0,0,0.65)', borderRadius:10,
                  padding:'10px 14px', color:'#fff', fontSize:12, display:'flex', flexDirection:'column', gap:6 },
  tips:         { padding:'10px 16px', background:'#f0fdf4', color:'#16a34a', fontSize:13, textAlign:'center' },
  btnRow:       { display:'flex', gap:10, padding:16 },
  primaryBtn:   { flex:1, padding:'11px 0', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff',
                  border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:14 },
  secondaryBtn: { flex:1, padding:'11px 0', background:'#f1f5f9', color:'#374151',
                  border:'none', borderRadius:10, fontWeight:600, cursor:'pointer', fontSize:14 },
};

// ─── Main Page ────────────────────────────────────────────────

export default function DocumentTeacherPage() {
  const navigate   = useNavigate();
  const fileInputRef  = useRef(null);
  const mobileCapRef  = useRef(null);

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
  const [activeTab,   setActiveTab]   = useState('upload'); // mobile tab
  const [cameraOpen,  setCameraOpen]  = useState(false);
  const [speaking,    setSpeaking]    = useState(false);
  const [expandedQ,   setExpandedQ]   = useState(null);

  const user  = JSON.parse(sessionStorage.getItem('aria_user') || '{}');
  const grade = user.grade || 5;
  const board = user.board || 'CBSE';

  // Auth guard
  useEffect(() => {
    if (!sessionStorage.getItem('aria_token')) navigate('/login');
  }, [navigate]);

  // ── File validation & processing ────────────────────────────

  const processFile = useCallback(async (incoming) => {
    setError('');
    if (!ALLOWED_TYPES.includes(incoming.type)) {
      setError('Only PDF, JPG, PNG, and WEBP files are supported.');
      return;
    }
    if (incoming.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Maximum allowed size is ${MAX_SIZE_MB} MB.`);
      return;
    }
    setFile(incoming);
    const isPdf = incoming.type === 'application/pdf';
    setFileType(isPdf ? 'pdf' : 'image');
    if (isPdf) {
      setPreviewUrl('pdf');
    } else {
      const processed = await preprocessImage(incoming);
      setPreviewUrl(processed);
    }
    setExplanation(null);
    setActiveTab('upload');
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) processFile(dropped);
  }, [processFile]);

  const handleFileInput = (e) => {
    if (e.target.files[0]) processFile(e.target.files[0]);
  };

  const handleCameraCapture = (dataUrl) => {
    setCameraOpen(false);
    setPreviewUrl(dataUrl);
    setFileType('image');
    setFile({ name: 'camera-capture.jpg', type: 'image/jpeg' });
    setExplanation(null);
  };

  // ── Mobile camera (input[capture]) ─────────────────────────

  const openMobileCamera = () => mobileCapRef.current?.click();

  // ── Explain ─────────────────────────────────────────────────

  const handleExplain = async () => {
    if (!file && !previewUrl) { setError('Please upload or capture a document first.'); return; }
    setLoading(true);
    setError('');
    setExplanation(null);

    try {
      let base64 = '';
      if (fileType === 'image' && previewUrl.startsWith('data:')) {
        base64 = stripBase64Header(previewUrl);
      } else if (fileType === 'pdf' && file instanceof File) {
        const buf = await file.arrayBuffer();
        base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      }

      const result = await explainDocument({
        document_base64:  base64,
        document_type:    fileType,
        student_name:     user.fullName || 'Student',
        grade:            parseInt(grade) || 5,
        level,
        language,
        specific_question: question.trim() || undefined,
        board,
      });

      setExplanation(result.data);
      setActiveTab('explanation');
    } catch (e) {
      setError(e.message || 'Failed to explain document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Voice ────────────────────────────────────────────────────

  const handleSpeak = () => {
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    if (!explanation?.explanation) return;
    const text = [
      explanation.topic_detected ? `Topic: ${explanation.topic_detected}.` : '',
      explanation.explanation,
    ].filter(Boolean).join(' ');
    speak(text, language);
    setSpeaking(true);
    // Auto-clear speaking flag when done
    const check = setInterval(() => {
      if (!window.speechSynthesis.speaking) { setSpeaking(false); clearInterval(check); }
    }, 500);
  };

  // ─── Upload Panel ──────────────────────────────────────────

  const UploadPanel = () => (
    <div style={s.panel}>

      {/* Drop zone */}
      <div
        style={{ ...s.dropzone, ...(dragOver ? s.dropzoneHover : {}), ...(file ? s.dropzoneFilled : {}) }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
      >
        {file ? (
          <div style={{ width:'100%' }}>
            {fileType === 'image' && previewUrl ? (
              <img src={previewUrl} alt="preview" style={s.preview} />
            ) : (
              <div style={s.pdfPreview}>
                <div style={{ fontSize:56 }}>📄</div>
                <div style={{ fontWeight:700, color:'#1a1a2e', marginTop:8 }}>{file.name}</div>
                <div style={{ color:'#6b7280', fontSize:13 }}>PDF Document</div>
              </div>
            )}
            <button
              onClick={e => { e.stopPropagation(); setFile(null); setPreviewUrl(''); setExplanation(null); }}
              style={s.removeBtn}>✕ Remove</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize:52, marginBottom:12 }}>📂</div>
            <div style={{ fontWeight:700, color:'#374151', fontSize:16, marginBottom:6 }}>
              Drag & drop your document here
            </div>
            <div style={{ color:'#9ca3af', fontSize:13, marginBottom:16 }}>
              PDF, JPG, PNG, WEBP · Max {MAX_SIZE_MB} MB
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
              <button onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }} style={s.uploadBtn}>
                📁 Browse File
              </button>
              <button onClick={e => {
                e.stopPropagation();
                const isMobile = /Android|iPhone|iPad/.test(navigator.userAgent);
                if (isMobile) openMobileCamera();
                else setCameraOpen(true);
              }} style={s.cameraBtn}>
                📷 Scan Document
              </button>
            </div>
          </>
        )}
      </div>

      {/* Hidden inputs */}
      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display:'none' }} onChange={handleFileInput} />
      <input ref={mobileCapRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={handleFileInput} />

      {error && <div style={s.errorBox}>⚠️ {error}</div>}

      {/* Level selector */}
      <div style={s.sectionTitle}>Choose explanation level:</div>
      <div style={s.levelGrid}>
        {LEVELS.map(l => (
          <div key={l.id}
            onClick={() => setLevel(l.id)}
            style={{ ...s.levelCard, ...(level === l.id ? { ...s.levelCardActive, borderColor: l.color, background: l.bg } : {}) }}>
            <div style={{ fontSize:22 }}>{l.emoji}</div>
            <div style={{ fontWeight:700, color: level === l.id ? l.color : '#374151', fontSize:14 }}>{l.label}</div>
            <div style={{ fontSize:11, color:'#6b7280', textAlign:'center', marginTop:2 }}>{l.grade}</div>
            <div style={{ fontSize:10, color:'#9ca3af', textAlign:'center', marginTop:2, display: level === l.id ? 'block' : 'none' }}>{l.desc}</div>
          </div>
        ))}
      </div>

      {/* Language */}
      <div style={s.sectionTitle}>Language:</div>
      <select value={language} onChange={e => setLanguage(e.target.value)} style={s.select}>
        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
      </select>

      {/* Specific question */}
      <div style={s.sectionTitle}>Ask a specific question (optional):</div>
      <textarea
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder="e.g. Explain the highlighted paragraph, What is the formula on page 2?, Solve the first example..."
        style={s.textarea}
        rows={3}
      />

      {/* Explain button */}
      <button onClick={handleExplain} disabled={loading || !file} style={{ ...s.explainBtn, ...(loading || !file ? s.explainBtnDisabled : {}) }}>
        {loading ? '⏳ ARIA is reading your document...' : '🧠 Explain This Document'}
      </button>

      {loading && (
        <div style={s.loadingBox}>
          <div style={s.loadingDot} />
          <span style={{ color:'#6366f1', fontWeight:600, fontSize:14 }}>ARIA is reading your document...</span>
        </div>
      )}
    </div>
  );

  // ─── Explanation Panel ────────────────────────────────────

  const ExplanationPanel = () => {
    if (!explanation) {
      return (
        <div style={s.emptyExplanation}>
          <div style={{ fontSize:64, marginBottom:16 }}>📖</div>
          <div style={{ fontWeight:700, color:'#374151', fontSize:18, marginBottom:8 }}>
            Upload a document to get started
          </div>
          <div style={{ color:'#9ca3af', fontSize:14, maxWidth:280, textAlign:'center', lineHeight:1.6 }}>
            ARIA will explain it from basics to expert level — in any language, any subject
          </div>
        </div>
      );
    }

    const lvl = LEVELS.find(l => l.id === level);

    return (
      <div style={s.explanationPanel}>

        {/* Header badges */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
          {explanation.subject_detected && (
            <span style={s.badge}>{explanation.subject_detected}</span>
          )}
          {explanation.topic_detected && (
            <span style={{ ...s.badge, background:'#f3f4f6', color:'#374151' }}>{explanation.topic_detected}</span>
          )}
          {explanation.grade_detected && (
            <span style={{ ...s.badge, background:'#fef9c3', color:'#92400e' }}>Grade {explanation.grade_detected}</span>
          )}
          {lvl && (
            <span style={{ ...s.badge, background: lvl.bg, color: lvl.color }}>{lvl.emoji} {lvl.label}</span>
          )}
        </div>

        {/* Key points */}
        {explanation.key_points?.length > 0 && (
          <div style={s.keyPointsBox}>
            <div style={{ fontWeight:700, color:'#1a1a2e', marginBottom:10, fontSize:14 }}>🔑 Key Points</div>
            {explanation.key_points.map((pt, i) => (
              <div key={i} style={{ display:'flex', gap:8, marginBottom:6, fontSize:13 }}>
                <span>✅</span><span style={{ color:'#374151', lineHeight:1.5 }}>{pt}</span>
              </div>
            ))}
          </div>
        )}

        {/* Main explanation */}
        <div style={s.explanationText}>
          <RenderExplanation text={explanation.explanation} />
        </div>

        {/* Practice questions */}
        {explanation.practice_questions?.length > 0 && (
          <div style={s.practiceBox}>
            <div style={{ fontWeight:700, color:'#1a1a2e', marginBottom:10, fontSize:14 }}>📝 Practice Questions</div>
            {explanation.practice_questions.map((q, i) => (
              <div key={i} style={s.practiceQ}>
                <div style={s.practiceQHeader} onClick={() => setExpandedQ(expandedQ === i ? null : i)}>
                  <span style={{ fontWeight:600, color:'#6366f1' }}>Q{i + 1}.</span>
                  <span style={{ flex:1, marginLeft:8, color:'#374151', fontSize:14 }}>{q}</span>
                  <span style={{ color:'#9ca3af', fontSize:12 }}>{expandedQ === i ? '▲' : '▼'}</span>
                </div>
                {expandedQ === i && (
                  <div style={s.practiceHint}>
                    💡 Try solving this on your own first — then ask ARIA to check your answer!
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={s.actionRow}>
          <button onClick={handleSpeak} style={speaking ? s.speakBtnActive : s.speakBtn}>
            {speaking ? '⏹ Stop' : '🔊 Listen'}
          </button>
          <button onClick={() => { setExplanation(null); setActiveTab('upload'); }} style={s.newDocBtn}>
            📄 New Document
          </button>
        </div>

        {/* Re-explain at different level */}
        <div style={{ marginTop:16 }}>
          <div style={{ fontSize:12, color:'#9ca3af', marginBottom:8 }}>Re-explain at a different level:</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {LEVELS.filter(l => l.id !== level).map(l => (
              <button key={l.id}
                onClick={() => { setLevel(l.id); handleExplain(); }}
                style={{ padding:'6px 12px', borderRadius:20, border:`1px solid ${l.color}`,
                         background: l.bg, color: l.color, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                {l.emoji} {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8fafc' }}>
      <Sidebar />

      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.title}>📄 Document Teacher</h1>
            <p style={s.subtitle}>Upload any textbook page, question paper, or notes — ARIA explains everything</p>
          </div>
          <button onClick={() => navigate('/document-history')} style={s.historyBtn}>
            📋 My History
          </button>
        </div>

        {/* Mobile tabs */}
        <div style={s.mobileTabs}>
          <div style={{ ...s.mobileTab, ...(activeTab === 'upload' ? s.mobileTabActive : {}) }}
            onClick={() => setActiveTab('upload')}>📂 Upload</div>
          <div style={{ ...s.mobileTab, ...(activeTab === 'explanation' ? s.mobileTabActive : {}) }}
            onClick={() => setActiveTab('explanation')}>
            🧠 Explanation
            {explanation && <span style={s.tabDot} />}
          </div>
        </div>

        {/* Split layout */}
        <div style={s.splitLayout}>
          <div style={{ ...s.leftPane, display: activeTab === 'upload' || window.innerWidth >= 768 ? 'block' : 'none' }}>
            <UploadPanel />
          </div>
          <div style={{ ...s.rightPane, display: activeTab === 'explanation' || window.innerWidth >= 768 ? 'block' : 'none' }}>
            <ExplanationPanel />
          </div>
        </div>
      </div>

      {cameraOpen && (
        <CameraModal
          onCapture={handleCameraCapture}
          onClose={() => setCameraOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const s = {
  header:          { display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'24px 24px 0', flexWrap:'wrap', gap:12 },
  title:           { margin:0, fontSize:24, fontWeight:800, color:'#1a1a2e' },
  subtitle:        { margin:'4px 0 0', color:'#6b7280', fontSize:14 },
  historyBtn:      { padding:'8px 16px', background:'#f3f4f6', border:'none', borderRadius:10, cursor:'pointer',
                     color:'#374151', fontWeight:600, fontSize:13, whiteSpace:'nowrap' },
  mobileTabs:      { display:'flex', borderBottom:'2px solid #e5e7eb', margin:'16px 24px 0', gap:0 },
  mobileTab:       { flex:1, padding:'10px 0', textAlign:'center', fontSize:13, fontWeight:600, color:'#9ca3af',
                     cursor:'pointer', borderBottom:'2px solid transparent', marginBottom:-2, position:'relative' },
  mobileTabActive: { color:'#6366f1', borderBottomColor:'#6366f1' },
  tabDot:          { position:'absolute', top:8, right:'calc(50% - 24px)', width:7, height:7,
                     borderRadius:'50%', background:'#6366f1' },
  splitLayout:     { display:'flex', flex:1, gap:20, padding:24,
                     flexWrap:'wrap' },
  leftPane:        { flex:'0 0 400px', minWidth:0, maxWidth:480 },
  rightPane:       { flex:1, minWidth:300, minHeight:500 },
  panel:           { background:'#fff', borderRadius:16, padding:24, boxShadow:'0 1px 8px rgba(0,0,0,0.07)' },

  // Drop zone
  dropzone:        { border:'2.5px dashed #d1d5db', borderRadius:14, padding:32, textAlign:'center',
                     cursor:'pointer', transition:'all 0.2s', marginBottom:20, minHeight:200,
                     display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', position:'relative' },
  dropzoneHover:   { borderColor:'#6366f1', background:'#f5f3ff' },
  dropzoneFilled:  { border:'2px solid #e5e7eb', cursor:'default', paddingTop:16, paddingBottom:16 },
  preview:         { width:'100%', maxHeight:260, objectFit:'contain', borderRadius:10, marginBottom:12 },
  pdfPreview:      { display:'flex', flexDirection:'column', alignItems:'center', padding:'20px 0' },
  removeBtn:       { padding:'6px 14px', background:'#fee2e2', border:'none', borderRadius:8, cursor:'pointer',
                     color:'#dc2626', fontWeight:600, fontSize:12, marginTop:4 },
  uploadBtn:       { padding:'9px 18px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff',
                     border:'none', borderRadius:10, cursor:'pointer', fontWeight:700, fontSize:13 },
  cameraBtn:       { padding:'9px 18px', background:'#f3f4f6', color:'#374151',
                     border:'none', borderRadius:10, cursor:'pointer', fontWeight:600, fontSize:13 },

  errorBox:        { background:'#fee2e2', color:'#dc2626', padding:'10px 14px', borderRadius:10,
                     fontSize:13, marginBottom:16 },
  sectionTitle:    { fontWeight:700, color:'#374151', fontSize:13, marginBottom:8, marginTop:16 },

  // Level grid
  levelGrid:       { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:4 },
  levelCard:       { border:'2px solid #e5e7eb', borderRadius:12, padding:'12px 10px', cursor:'pointer',
                     textAlign:'center', transition:'all 0.15s', display:'flex', flexDirection:'column', alignItems:'center' },
  levelCardActive: { transform:'scale(1.02)', boxShadow:'0 2px 8px rgba(99,102,241,0.2)' },

  select:          { width:'100%', padding:'9px 12px', borderRadius:10, border:'1.5px solid #e5e7eb',
                     fontSize:13, color:'#374151', background:'#fff', marginBottom:4 },
  textarea:        { width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e5e7eb',
                     fontSize:13, color:'#374151', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box' },

  explainBtn:      { width:'100%', marginTop:18, padding:'13px 0', background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                     color:'#fff', border:'none', borderRadius:12, fontWeight:800, fontSize:15, cursor:'pointer',
                     boxShadow:'0 4px 14px rgba(99,102,241,0.35)', transition:'all 0.2s' },
  explainBtnDisabled: { opacity:0.5, cursor:'not-allowed', boxShadow:'none' },
  loadingBox:      { display:'flex', alignItems:'center', gap:10, justifyContent:'center', padding:'12px 0' },
  loadingDot:      { width:10, height:10, borderRadius:'50%', background:'#6366f1',
                     animation:'pulse 1.2s ease-in-out infinite' },

  // Explanation panel
  emptyExplanation: { background:'#fff', borderRadius:16, height:'100%', minHeight:500,
                       display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                       boxShadow:'0 1px 8px rgba(0,0,0,0.07)' },
  explanationPanel: { background:'#fff', borderRadius:16, padding:24, boxShadow:'0 1px 8px rgba(0,0,0,0.07)',
                       overflowY:'auto', maxHeight:'calc(100vh - 180px)' },
  badge:           { padding:'4px 10px', borderRadius:20, background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                     color:'#fff', fontSize:12, fontWeight:700 },
  keyPointsBox:    { background:'#f0fdf4', borderRadius:12, padding:'14px 16px', marginBottom:16,
                     border:'1px solid #bbf7d0' },
  explanationText: { fontSize:14, lineHeight:1.75, color:'#374151', marginBottom:20 },
  practiceBox:     { background:'#faf5ff', borderRadius:12, padding:'14px 16px', marginBottom:16,
                     border:'1px solid #e9d5ff' },
  practiceQ:       { marginBottom:10 },
  practiceQHeader: { display:'flex', alignItems:'flex-start', gap:0, cursor:'pointer', padding:'8px 10px',
                     background:'#fff', borderRadius:8, userSelect:'none' },
  practiceHint:    { padding:'8px 14px 4px', fontSize:12, color:'#7c3aed', fontStyle:'italic' },
  actionRow:       { display:'flex', gap:10, marginTop:16 },
  speakBtn:        { flex:1, padding:'10px 0', background:'#f3f4f6', border:'none', borderRadius:10,
                     fontWeight:600, fontSize:13, cursor:'pointer', color:'#374151' },
  speakBtnActive:  { flex:1, padding:'10px 0', background:'#fef3c7', border:'none', borderRadius:10,
                     fontWeight:600, fontSize:13, cursor:'pointer', color:'#92400e' },
  newDocBtn:       { flex:1, padding:'10px 0', background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                     border:'none', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', color:'#fff' },
};
