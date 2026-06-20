import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getDocumentHistory, explainDocumentFollowup } from '../services/api';

// ─── Constants ─────────────────────────────────────────────────

const LEVEL_META = {
  BEGINNER:     { emoji:'🟢', label:'Beginner',     color:'#16a34a', bg:'#dcfce7' },
  INTERMEDIATE: { emoji:'🟡', label:'Intermediate', color:'#d97706', bg:'#fef9c3' },
  ADVANCED:     { emoji:'🔵', label:'Advanced',     color:'#2563eb', bg:'#dbeafe' },
  EXPERT:       { emoji:'🔴', label:'Expert',       color:'#dc2626', bg:'#fee2e2' },
};

const SUBJECT_ICONS = {
  Mathematics: '🔢', Science: '🔬', English: '📖', Hindi: '🇮🇳',
  History: '🏛️', Geography: '🌍', Physics: '⚡', Chemistry: '⚗️',
  Biology: '🌱', Economics: '📊', Computer: '💻', Coding: '👨‍💻',
};

const subjectIcon = (s = '') => SUBJECT_ICONS[Object.keys(SUBJECT_ICONS).find(k => s.includes(k))] || '📄';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

// ─── Simple markdown renderer (shared) ───────────────────────

function RenderText({ text }) {
  if (!text) return null;
  return (
    <div style={{ fontSize:14, lineHeight:1.75, color:'#374151' }}>
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
          p.startsWith('**') && p.endsWith('**') ? <strong key={j}>{p.slice(2,-2)}</strong> : p
        );
        if (line.startsWith('## ')) return <h3 key={i} style={{ margin:'12px 0 4px', fontSize:15, fontWeight:700 }}>{line.slice(3)}</h3>;
        if (line.startsWith('• ') || line.startsWith('- '))
          return <div key={i} style={{ display:'flex', gap:8, marginBottom:4 }}><span>•</span><span>{parts.slice(1)}</span></div>;
        return <p key={i} style={{ margin:'0 0 6px' }}>{parts}</p>;
      })}
    </div>
  );
}

// ─── Document Detail Modal ────────────────────────────────────

function DocumentModal({ doc, onClose }) {
  const [followup,   setFollowup]   = useState('');
  const [updating,   setUpdating]   = useState(false);
  const [extraReply, setExtraReply] = useState('');
  const [expandedQ,  setExpandedQ]  = useState(null);
  const [speaking,   setSpeaking]   = useState(false);
  const lvl = LEVEL_META[doc.explanation_level] || LEVEL_META.INTERMEDIATE;

  const handleSpeak = () => {
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const text = (doc.explanation || '').replace(/\*\*/g, '');
    const utt  = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const match  = voices.find(v => v.lang.startsWith(doc.language || 'en'));
    if (match) utt.voice = match;
    utt.rate = 0.95;
    window.speechSynthesis.speak(utt);
    setSpeaking(true);
    const check = setInterval(() => {
      if (!window.speechSynthesis.speaking) { setSpeaking(false); clearInterval(check); }
    }, 500);
  };

  const handleFollowup = async () => {
    if (!followup.trim()) return;
    setUpdating(true);
    try {
      const res = await explainDocumentFollowup(doc.id, followup.trim());
      setExtraReply(res.data?.explanation || res.data?.response || '');
    } catch {
      setExtraReply('Unable to get a follow-up response. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadPDF = () => {
    // Simple text-only PDF via print
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>ARIA Explanation — ${doc.topic_detected}</title>
      <style>body{font-family:sans-serif;margin:40px;line-height:1.7} h1{color:#6366f1}</style>
      </head><body>
      <h1>ARIA Document Explanation</h1>
      <p><strong>Subject:</strong> ${doc.subject_detected || ''}</p>
      <p><strong>Topic:</strong> ${doc.topic_detected || ''}</p>
      <p><strong>Level:</strong> ${doc.explanation_level || ''}</p>
      <hr/>
      <div>${(doc.explanation || '').replace(/\n/g,'<br>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')}</div>
      ${doc.practice_questions?.length ? `<h2>Practice Questions</h2><ol>${doc.practice_questions.map(q=>`<li>${q}</li>`).join('')}</ol>` : ''}
      </body></html>`);
    win.document.close();
    win.print();
  };

  const keyPoints = Array.isArray(doc.key_points)
    ? doc.key_points
    : typeof doc.key_points === 'string'
    ? JSON.parse(doc.key_points || '[]')
    : [];

  const practiceQs = Array.isArray(doc.practice_questions)
    ? doc.practice_questions
    : typeof doc.practice_questions === 'string'
    ? JSON.parse(doc.practice_questions || '[]')
    : [];

  return (
    <div style={m.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={m.drawer}>

        {/* Header */}
        <div style={m.header}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:28 }}>{subjectIcon(doc.subject_detected)}</span>
            <div>
              <div style={{ fontWeight:800, fontSize:16, color:'#1a1a2e' }}>{doc.subject_detected || 'Document'}</div>
              <div style={{ fontSize:13, color:'#6b7280' }}>{doc.topic_detected}</div>
            </div>
          </div>
          <button onClick={onClose} style={m.closeBtn}>✕</button>
        </div>

        <div style={m.body}>

          {/* Badges */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
            <span style={{ ...m.badge, background: lvl.bg, color: lvl.color }}>{lvl.emoji} {lvl.label}</span>
            {doc.language && <span style={{ ...m.badge, background:'#f3f4f6', color:'#374151' }}>🌐 {doc.language.toUpperCase()}</span>}
            {doc.board     && <span style={{ ...m.badge, background:'#eff6ff', color:'#2563eb' }}>{doc.board}</span>}
            <span style={{ ...m.badge, background:'#f3f4f6', color:'#6b7280' }}>📅 {formatDate(doc.created_at)}</span>
          </div>

          {/* Key points */}
          {keyPoints.length > 0 && (
            <div style={m.box}>
              <div style={m.boxTitle}>🔑 Key Points</div>
              {keyPoints.map((pt, i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:6, fontSize:13 }}>
                  <span>✅</span><span>{pt}</span>
                </div>
              ))}
            </div>
          )}

          {/* Explanation */}
          <div style={{ marginBottom:20 }}>
            <RenderText text={doc.explanation} />
          </div>

          {/* Practice questions */}
          {practiceQs.length > 0 && (
            <div style={{ ...m.box, background:'#faf5ff', borderColor:'#e9d5ff' }}>
              <div style={m.boxTitle}>📝 Practice Questions</div>
              {practiceQs.map((q, i) => (
                <div key={i} style={m.practiceQ}>
                  <div style={m.practiceHeader} onClick={() => setExpandedQ(expandedQ===i ? null : i)}>
                    <span style={{ fontWeight:600, color:'#6366f1' }}>Q{i+1}.</span>
                    <span style={{ flex:1, marginLeft:8, fontSize:14, color:'#374151' }}>{q}</span>
                    <span style={{ color:'#9ca3af', fontSize:12 }}>{expandedQ===i?'▲':'▼'}</span>
                  </div>
                  {expandedQ===i && (
                    <div style={{ padding:'8px 14px', fontSize:12, color:'#7c3aed', fontStyle:'italic' }}>
                      💡 Try solving this yourself, then ask ARIA to check your answer!
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Follow-up question */}
          <div style={{ ...m.box, background:'#f8fafc', borderColor:'#e5e7eb' }}>
            <div style={m.boxTitle}>💬 Ask a Follow-up Question</div>
            <textarea
              value={followup}
              onChange={e => setFollowup(e.target.value)}
              placeholder="e.g. Can you explain step 2 in more detail? What is the formula used here?"
              rows={2}
              style={m.textarea}
            />
            <button onClick={handleFollowup} disabled={updating || !followup.trim()} style={m.followupBtn}>
              {updating ? '⏳ Thinking...' : '🧠 Ask ARIA'}
            </button>
            {extraReply && (
              <div style={{ marginTop:12 }}>
                <div style={{ fontWeight:600, color:'#6366f1', marginBottom:6, fontSize:13 }}>ARIA's answer:</div>
                <RenderText text={extraReply} />
              </div>
            )}
          </div>

          {/* Action row */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button onClick={handleSpeak} style={speaking ? m.activeBtn : m.secBtn}>
              {speaking ? '⏹ Stop' : '🔊 Listen'}
            </button>
            <button onClick={handleDownloadPDF} style={m.secBtn}>
              ⬇️ Download PDF
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

const m = {
  overlay:       { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', justifyContent:'flex-end' },
  drawer:        { background:'#fff', width:'min(680px, 100%)', height:'100vh', overflowY:'auto',
                   boxShadow:'-4px 0 24px rgba(0,0,0,0.12)', display:'flex', flexDirection:'column' },
  header:        { display:'flex', justifyContent:'space-between', alignItems:'flex-start',
                   padding:'20px 24px', borderBottom:'1px solid #f1f5f9', position:'sticky', top:0, background:'#fff', zIndex:1 },
  closeBtn:      { background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#6b7280', padding:4 },
  body:          { padding:'20px 24px', flex:1 },
  badge:         { padding:'4px 10px', borderRadius:20, fontSize:12, fontWeight:700 },
  box:           { background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:'14px 16px', marginBottom:16 },
  boxTitle:      { fontWeight:700, color:'#1a1a2e', marginBottom:10, fontSize:14 },
  practiceQ:     { marginBottom:8 },
  practiceHeader:{ display:'flex', alignItems:'flex-start', padding:'8px 10px', background:'#fff', borderRadius:8, cursor:'pointer' },
  textarea:      { width:'100%', padding:'9px 12px', borderRadius:10, border:'1.5px solid #e5e7eb',
                   fontSize:13, resize:'vertical', fontFamily:'inherit', marginBottom:10, boxSizing:'border-box' },
  followupBtn:   { padding:'9px 20px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff',
                   border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:13 },
  secBtn:        { padding:'9px 16px', background:'#f3f4f6', border:'none', borderRadius:10,
                   fontWeight:600, fontSize:13, cursor:'pointer', color:'#374151' },
  activeBtn:     { padding:'9px 16px', background:'#fef3c7', border:'none', borderRadius:10,
                   fontWeight:600, fontSize:13, cursor:'pointer', color:'#92400e' },
};

// ─── Main Page ────────────────────────────────────────────────

const FILTER_LEVELS = ['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

export default function DocumentHistoryPage() {
  const navigate = useNavigate();
  const [docs,      setDocs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);
  const [search,    setSearch]    = useState('');
  const [levelFilt, setLevelFilt] = useState('ALL');

  const user = JSON.parse(sessionStorage.getItem('aria_user') || '{}');

  useEffect(() => {
    if (!sessionStorage.getItem('aria_token')) { navigate('/login'); return; }
    getDocumentHistory(user.userId)
      .then(r => setDocs(r.data?.data || r.data || []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [navigate, user.userId]);

  const filtered = docs.filter(d => {
    const matchLevel   = levelFilt === 'ALL' || d.explanation_level === levelFilt;
    const matchSearch  = !search || [d.subject_detected, d.topic_detected, d.document_name]
      .join(' ').toLowerCase().includes(search.toLowerCase());
    return matchLevel && matchSearch;
  });

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8fafc' }}>
      <Sidebar />
      <div style={{ flex:1, padding:24 }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:'#1a1a2e' }}>📋 Document History</h1>
            <p style={{ margin:'4px 0 0', color:'#6b7280', fontSize:14 }}>{docs.length} document{docs.length !== 1 ? 's' : ''} explained by ARIA</p>
          </div>
          <button onClick={() => navigate('/document-teacher')} style={p.uploadBtn}>
            📄 Upload New Document
          </button>
        </div>

        {/* Filter bar */}
        <div style={p.filterBar}>
          <input
            type="text"
            placeholder="Search by subject, topic..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={p.searchInput}
          />
          <div style={p.levelFilters}>
            {FILTER_LEVELS.map(l => (
              <button key={l}
                onClick={() => setLevelFilt(l)}
                style={{ ...p.filterBtn, ...(levelFilt === l ? p.filterBtnActive : {}) }}>
                {l === 'ALL' ? 'All' : `${LEVEL_META[l]?.emoji} ${LEVEL_META[l]?.label}`}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={p.center}>
            <div style={{ fontSize:40, marginBottom:12 }}>⏳</div>
            <div style={{ color:'#6b7280' }}>Loading your documents...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={p.center}>
            <div style={{ fontSize:72, marginBottom:16 }}>📭</div>
            <div style={{ fontWeight:700, color:'#374151', fontSize:20, marginBottom:8 }}>
              {docs.length === 0 ? 'No documents yet' : 'No results found'}
            </div>
            <div style={{ color:'#9ca3af', marginBottom:24, fontSize:14 }}>
              {docs.length === 0
                ? 'Upload your first document and ARIA will explain everything!'
                : 'Try a different search or filter'}
            </div>
            {docs.length === 0 && (
              <button onClick={() => navigate('/document-teacher')} style={p.uploadBtn}>
                📄 Upload First Document
              </button>
            )}
          </div>
        ) : (
          <div style={p.grid}>
            {filtered.map(doc => (
              <DocumentCard key={doc.id} doc={doc} onClick={() => setSelected(doc)} />
            ))}
          </div>
        )}
      </div>

      {selected && <DocumentModal doc={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─── Document Card ────────────────────────────────────────────

function DocumentCard({ doc, onClick }) {
  const [hover, setHover] = useState(false);
  const lvl = LEVEL_META[doc.explanation_level] || LEVEL_META.INTERMEDIATE;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...p.card, ...(hover ? p.cardHover : {}) }}
    >
      {/* Icon / thumbnail */}
      <div style={{ ...p.cardIcon, background:'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
        <span style={{ fontSize:28 }}>{subjectIcon(doc.subject_detected)}</span>
      </div>

      {/* Subject + topic */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, color:'#1a1a2e', fontSize:15, marginBottom:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {doc.subject_detected || 'Document'}
        </div>
        {doc.topic_detected && (
          <div style={{ color:'#6b7280', fontSize:12, marginBottom:6, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {doc.topic_detected}
          </div>
        )}

        {/* Badges */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
          <span style={{ padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:700, background: lvl.bg, color: lvl.color }}>
            {lvl.emoji} {lvl.label}
          </span>
          {doc.language && (
            <span style={{ padding:'2px 8px', borderRadius:10, fontSize:11, background:'#f3f4f6', color:'#6b7280', fontWeight:600 }}>
              {doc.language.toUpperCase()}
            </span>
          )}
        </div>

        {/* Preview text */}
        {doc.explanation && (
          <div style={{ fontSize:12, color:'#9ca3af', lineHeight:1.5, display:'-webkit-box',
                        WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {doc.explanation.replace(/\*\*/g,'').slice(0, 120)}...
          </div>
        )}

        {/* Date */}
        <div style={{ marginTop:8, fontSize:11, color:'#9ca3af' }}>
          📅 {formatDate(doc.created_at)}
        </div>
      </div>

      <div style={{ fontSize:16, color:'#d1d5db', marginLeft:4 }}>›</div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const p = {
  uploadBtn:      { padding:'9px 18px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff',
                    border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:13, whiteSpace:'nowrap' },
  filterBar:      { display:'flex', gap:12, marginBottom:24, flexWrap:'wrap', alignItems:'center' },
  searchInput:    { flex:'1 1 200px', padding:'9px 14px', borderRadius:10, border:'1.5px solid #e5e7eb',
                    fontSize:13, color:'#374151', outline:'none', minWidth:150 },
  levelFilters:   { display:'flex', gap:6, flexWrap:'wrap' },
  filterBtn:      { padding:'7px 12px', borderRadius:20, border:'1.5px solid #e5e7eb', background:'#fff',
                    color:'#6b7280', fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' },
  filterBtnActive:{ borderColor:'#6366f1', background:'#eff6ff', color:'#6366f1' },
  grid:           { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16 },
  card:           { background:'#fff', borderRadius:14, padding:16, cursor:'pointer', display:'flex',
                    gap:14, alignItems:'flex-start', boxShadow:'0 1px 6px rgba(0,0,0,0.06)',
                    transition:'all 0.18s', border:'1px solid transparent' },
  cardHover:      { transform:'translateY(-2px)', boxShadow:'0 4px 16px rgba(99,102,241,0.12)', borderColor:'#c7d2fe' },
  cardIcon:       { width:52, height:52, borderRadius:12, display:'flex', alignItems:'center',
                    justifyContent:'center', flexShrink:0 },
  center:         { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                    minHeight:400, textAlign:'center' },
};
