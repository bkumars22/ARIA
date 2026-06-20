import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getHomeworkHistory } from '../services/api';

// ─── Helpers ──────────────────────────────────────────────────

const SUBJECT_COLOR = {
  Mathematics: { bg:'#eff6ff', border:'#bfdbfe', color:'#1d4ed8', emoji:'📐' },
  Science:     { bg:'#f0fdf4', border:'#bbf7d0', color:'#15803d', emoji:'🔬' },
  Physics:     { bg:'#f0fdf4', border:'#bbf7d0', color:'#15803d', emoji:'⚡' },
  Chemistry:   { bg:'#fff7ed', border:'#fed7aa', color:'#c2410c', emoji:'⚗️' },
  Biology:     { bg:'#f0fdf4', border:'#bbf7d0', color:'#15803d', emoji:'🧬' },
  English:     { bg:'#fff7ed', border:'#fde68a', color:'#92400e', emoji:'📖' },
  History:     { bg:'#fdf4ff', border:'#e9d5ff', color:'#6d28d9', emoji:'📜' },
  Geography:   { bg:'#ecfdf5', border:'#a7f3d0', color:'#065f46', emoji:'🗺️' },
  Economics:   { bg:'#f0fdf4', border:'#bbf7d0', color:'#15803d', emoji:'📊' },
  Coding:      { bg:'#faf5ff', border:'#c4b5fd', color:'#5b21b6', emoji:'💻' },
};

function subjectStyle(s) {
  return SUBJECT_COLOR[s] || { bg:'#f9fafb', border:'#e5e7eb', color:'#374151', emoji:'📚' };
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)   return 'just now';
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  < 7)   return `${days}d ago`;
  return d.toLocaleDateString();
}

// ─── Session Modal ────────────────────────────────────────────

function SessionModal({ session, onClose }) {
  const [followup,  setFollowup]  = useState('');
  const [fuLoading, setFuLoading] = useState(false);
  const [fuAnswer,  setFuAnswer]  = useState(null);
  const token = sessionStorage.getItem('aria_token');
  const st = subjectStyle(session.subject);

  const handleFollowup = async () => {
    if (!followup.trim()) return;
    setFuLoading(true);
    try {
      const r = await fetch(`/api/homework/${session.id}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: followup }),
      }).then(r => r.json());
      setFuAnswer(r?.data?.complete_solution || r?.complete_solution || JSON.stringify(r));
      setFollowup('');
    } catch { setFuAnswer('Could not get follow-up answer.'); }
    finally { setFuLoading(false); }
  };

  const download = () => {
    const text = [
      `ARIA Homework Answer`,
      `Subject: ${session.subject}`,
      `Topic: ${session.topicDetected || ''}`,
      `Reference: ${session.boardReference || ''}`,
      ``,
      `Question: ${session.originalQuestion || ''}`,
      ``,
      `Solution:`,
      session.completeSolution || '',
      ``,
      `Exam Tip: ${session.examTip || ''}`,
    ].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
    a.download = `ARIA_${session.subject}_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
  };

  return (
    <div style={m.overlay} onClick={onClose}>
      <div style={m.drawer} onClick={e => e.stopPropagation()}>

        <div style={m.header}>
          <div>
            <div style={{ fontWeight:800, color:'#1a1a2e', fontSize:17 }}>
              <span style={{ marginRight:8 }}>{st.emoji}</span>
              {session.subject} — {session.topicDetected || 'Answer'}
            </div>
            {session.boardReference && (
              <div style={{ color:'#6b7280', fontSize:12, marginTop:2 }}>📚 {session.boardReference}</div>
            )}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={download} style={m.btn}>📥 Download</button>
            <button onClick={onClose}  style={{ ...m.btn, background:'#fee2e2', color:'#dc2626' }}>✕</button>
          </div>
        </div>

        <div style={m.body}>
          {session.originalQuestion && (
            <div style={m.qBox}>
              <strong>Your Question:</strong> {session.originalQuestion}
            </div>
          )}

          {session.conceptExplanation && (
            <div style={m.section}>
              <div style={m.secTitle}>📚 Concept</div>
              <p style={m.secBody}>{session.conceptExplanation}</p>
            </div>
          )}

          {session.completeSolution && (
            <div style={m.section}>
              <div style={m.secTitle}>✏️ Solution</div>
              <p style={{ ...m.secBody, whiteSpace:'pre-wrap' }}>{session.completeSolution}</p>
            </div>
          )}

          {Array.isArray(session.keyPoints) && session.keyPoints.length > 0 && (
            <div style={{ ...m.section, background:'#faf5ff', border:'1.5px solid #e9d5ff' }}>
              <div style={m.secTitle}>🔑 Key Points</div>
              {session.keyPoints.map((pt, i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:5, fontSize:13 }}>
                  <span style={{ color:'#16a34a' }}>✅</span><span>{pt}</span>
                </div>
              ))}
            </div>
          )}

          {session.examTip && (
            <div style={{ ...m.section, background:'#fffbeb', border:'1.5px solid #fde68a' }}>
              <div style={m.secTitle}>🎯 Exam Tip</div>
              <p style={m.secBody}>{session.examTip}</p>
            </div>
          )}

          {session.practiceProblem && (
            <div style={{ ...m.section, background:'#f0fdf4', border:'1.5px solid #bbf7d0' }}>
              <div style={m.secTitle}>🏋️ Practice Problem</div>
              <p style={m.secBody}>{session.practiceProblem}</p>
            </div>
          )}

          {/* Follow-up */}
          <div style={{ marginTop:16, background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontWeight:700, fontSize:13, color:'#1a1a2e', marginBottom:8 }}>
              💬 Ask another question about this topic
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <input
                value={followup}
                onChange={e => setFollowup(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleFollowup(); }}
                placeholder="e.g. Can you explain this differently?"
                style={{ flex:1, padding:'9px 12px', borderRadius:9, border:'1.5px solid #e5e7eb', fontSize:13, outline:'none' }}
              />
              <button onClick={handleFollowup} disabled={fuLoading || !followup.trim()}
                style={{ padding:'9px 16px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:9, fontWeight:700, cursor:'pointer', fontSize:13 }}>
                {fuLoading ? '⏳' : '→'}
              </button>
            </div>
            {fuAnswer && (
              <div style={{ marginTop:10, padding:'10px 12px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:9, fontSize:13, whiteSpace:'pre-wrap', color:'#374151', lineHeight:1.7 }}>
                {fuAnswer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const m = {
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', justifyContent:'flex-end' },
  drawer:  { width:'100%', maxWidth:640, background:'#fff', height:'100vh', display:'flex', flexDirection:'column', overflowY:'hidden', boxShadow:'-4px 0 24px rgba(0,0,0,0.15)' },
  header:  { display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'20px 24px', borderBottom:'1px solid #e5e7eb', flexWrap:'wrap', gap:10 },
  body:    { flex:1, overflowY:'auto', padding:'20px 24px' },
  btn:     { padding:'7px 14px', background:'#f3f4f6', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:13, color:'#374151' },
  section: { background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:12, padding:'12px 16px', marginBottom:12 },
  secTitle:{ fontWeight:800, color:'#1a1a2e', fontSize:13, marginBottom:8 },
  secBody: { margin:0, fontSize:13, color:'#374151', lineHeight:1.75 },
  qBox:    { background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:13, color:'#1d4ed8', lineHeight:1.6 },
};

// ─── Main Page ────────────────────────────────────────────────

export default function HomeworkHistoryPage() {
  const navigate  = useNavigate();
  const [sessions,  setSessions]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [subFilter, setSubFilter] = useState('All');
  const [selected,  setSelected]  = useState(null);

  const user = JSON.parse(sessionStorage.getItem('aria_user') || '{}');

  useEffect(() => {
    if (!sessionStorage.getItem('aria_token')) { navigate('/login'); return; }
    (async () => {
      try {
        const res = await getHomeworkHistory(user.id || 1);
        setSessions(Array.isArray(res?.data) ? res.data : res?.data?.data || []);
      } catch { setSessions([]); }
      finally { setLoading(false); }
    })();
  }, [navigate, user.id]);

  const subjects = ['All', ...Array.from(new Set(sessions.map(s => s.subject).filter(Boolean)))];

  const filtered = sessions.filter(s => {
    const matchSub = subFilter === 'All' || s.subject === subFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || (s.subject || '').toLowerCase().includes(q) ||
      (s.topicDetected || '').toLowerCase().includes(q) ||
      (s.originalQuestion || '').toLowerCase().includes(q);
    return matchSub && matchSearch;
  });

  // Stats
  const total    = sessions.length;
  const subjects_ = new Set(sessions.map(s => s.subject).filter(Boolean));
  const topSubj  = (() => {
    const cnt = {};
    sessions.forEach(s => { if (s.subject) cnt[s.subject] = (cnt[s.subject] || 0) + 1; });
    return Object.entries(cnt).sort((a,b) => b[1]-a[1])[0]?.[0] || '—';
  })();
  const thisWeek = sessions.filter(s => {
    if (!s.createdAt) return false;
    return Date.now() - new Date(s.createdAt).getTime() < 7 * 86400000;
  }).length;

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8fafc' }}>
      <Sidebar />
      <div style={{ flex:1, minWidth:0 }}>

        {/* Header */}
        <div style={p.header}>
          <div>
            <h1 style={p.title}>📋 My Homework History</h1>
            <p style={p.sub}>All questions ARIA has answered for you</p>
          </div>
          <button onClick={() => navigate('/homework-helper')} style={p.newBtn}>
            + Ask New Question
          </button>
        </div>

        {/* Stats bar */}
        <div style={p.statsBar}>
          {[
            { label: 'Total Answered',  value: total },
            { label: 'Subjects',        value: subjects_.size },
            { label: 'Most Studied',    value: topSubj },
            { label: 'This Week',       value: thisWeek },
          ].map(({ label, value }) => (
            <div key={label} style={p.stat}>
              <div style={p.statVal}>{value}</div>
              <div style={p.statLbl}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={p.filterRow}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions..."
            style={p.searchInput}
          />
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {subjects.map(sub => (
              <button key={sub}
                onClick={() => setSubFilter(sub)}
                style={{ ...p.pill, ...(subFilter === sub ? p.pillActive : {}) }}>
                {sub === 'All' ? 'All Subjects' : (subjectStyle(sub).emoji + ' ' + sub)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding:'0 24px 32px' }}>
          {loading ? (
            <div style={p.center}>⏳ Loading your answers...</div>
          ) : filtered.length === 0 ? (
            <div style={p.empty}>
              <div style={{ fontSize:64, marginBottom:14 }}>📚</div>
              <div style={{ fontWeight:700, color:'#374151', fontSize:18, marginBottom:8 }}>
                {total === 0 ? 'No homework answered yet!' : 'No results for this filter'}
              </div>
              <div style={{ color:'#9ca3af', marginBottom:20, fontSize:14 }}>
                {total === 0 ? 'Upload your first homework question and get a genuine answer from ARIA.' : 'Try a different subject or search term.'}
              </div>
              <button onClick={() => navigate('/homework-helper')} style={p.newBtn}>
                Go to Homework Helper
              </button>
            </div>
          ) : (
            <div style={p.timeline}>
              {filtered.map(session => {
                const st = subjectStyle(session.subject);
                return (
                  <div key={session.id} style={p.card}>
                    <div style={p.cardLeft}>
                      <div style={{ ...p.subjectDot, background: st.color + '20', color: st.color }}>
                        {st.emoji}
                      </div>
                      <div style={p.timeLine2} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ ...p.cardBox, borderColor: st.border }}>

                        {/* Card header */}
                        <div style={p.cardHeader}>
                          <div>
                            <span style={{ ...p.subjectBadge, background: st.bg, color: st.color, borderColor: st.border }}>
                              {st.emoji} {session.subject}
                            </span>
                            {session.topicDetected && (
                              <span style={p.topicBadge}>{session.topicDetected}</span>
                            )}
                          </div>
                          <span style={p.timeAgo}>{timeAgo(session.createdAt)}</span>
                        </div>

                        {/* Reference */}
                        {session.boardReference && (
                          <div style={p.boardRef}>📚 {session.boardReference}</div>
                        )}

                        {/* Question preview */}
                        {session.originalQuestion && (
                          <div style={p.questionPreview}>
                            <span style={{ color:'#6b7280', fontWeight:600 }}>Q: </span>
                            {session.originalQuestion.slice(0, 120)}{session.originalQuestion.length > 120 ? '...' : ''}
                          </div>
                        )}

                        {/* Exam tip preview */}
                        {session.examTip && (
                          <div style={p.tipPreview}>
                            🎯 {session.examTip.slice(0, 80)}{session.examTip.length > 80 ? '...' : ''}
                          </div>
                        )}

                        {/* Footer */}
                        <div style={p.cardFooter}>
                          <div style={{ display:'flex', gap:8 }}>
                            {session.hasDocument && <span style={p.tag}>📎 Document</span>}
                            {session.totalFollowups > 0 && <span style={p.tag}>💬 {session.totalFollowups} follow-ups</span>}
                            {session.grade && <span style={p.tag}>Grade {session.grade}</span>}
                          </div>
                          <div style={{ display:'flex', gap:8 }}>
                            <button onClick={() => navigate('/homework-helper')} style={p.cardBtn}>
                              Try Again
                            </button>
                            <button onClick={() => setSelected(session)} style={{ ...p.cardBtn, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff' }}>
                              View Full Solution →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selected && <SessionModal session={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

const p = {
  header:       { display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'24px 24px 0', flexWrap:'wrap', gap:12 },
  title:        { margin:0, fontSize:24, fontWeight:800, color:'#1a1a2e' },
  sub:          { margin:'4px 0 0', color:'#6b7280', fontSize:14 },
  newBtn:       { padding:'9px 18px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontWeight:700, fontSize:13, boxShadow:'0 2px 8px rgba(99,102,241,0.3)' },

  statsBar:     { display:'flex', gap:0, margin:'16px 24px 0', background:'#fff', borderRadius:14, boxShadow:'0 1px 8px rgba(0,0,0,0.07)', overflow:'hidden' },
  stat:         { flex:1, padding:'16px 20px', textAlign:'center', borderRight:'1px solid #f1f5f9' },
  statVal:      { fontSize:24, fontWeight:800, color:'#1a1a2e' },
  statLbl:      { fontSize:11, color:'#9ca3af', marginTop:2 },

  filterRow:    { padding:'16px 24px', display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' },
  searchInput:  { padding:'9px 14px', borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:13, color:'#374151', outline:'none', minWidth:220 },
  pill:         { padding:'6px 14px', borderRadius:20, border:'1.5px solid #e5e7eb', background:'#fff', color:'#6b7280', fontSize:12, fontWeight:600, cursor:'pointer' },
  pillActive:   { borderColor:'#6366f1', background:'#ede9fe', color:'#6366f1' },

  center:       { textAlign:'center', padding:60, color:'#9ca3af', fontSize:14 },
  empty:        { textAlign:'center', padding:'60px 20px', display:'flex', flexDirection:'column', alignItems:'center' },

  timeline:     { display:'flex', flexDirection:'column', gap:0 },
  card:         { display:'flex', gap:0, marginBottom:0 },
  cardLeft:     { display:'flex', flexDirection:'column', alignItems:'center', width:48, paddingTop:4 },
  subjectDot:   { width:36, height:36, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0, zIndex:1 },
  timeLine2:    { flex:1, width:2, background:'#e5e7eb', margin:'4px 0' },

  cardBox:      { flex:1, background:'#fff', borderRadius:14, border:'1.5px solid #e5e7eb', padding:'16px 18px', margin:'0 0 14px 12px', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' },
  cardHeader:   { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8, flexWrap:'wrap', gap:6 },
  subjectBadge: { padding:'4px 10px', borderRadius:12, fontSize:12, fontWeight:700, border:'1px solid', marginRight:6 },
  topicBadge:   { padding:'4px 10px', borderRadius:12, fontSize:12, fontWeight:600, background:'#f3f4f6', color:'#374151' },
  timeAgo:      { fontSize:12, color:'#9ca3af' },
  boardRef:     { fontSize:12, color:'#6b7280', marginBottom:8 },
  questionPreview: { fontSize:13, color:'#374151', lineHeight:1.55, marginBottom:8, padding:'8px 10px', background:'#f9fafb', borderRadius:8 },
  tipPreview:   { fontSize:12, color:'#92400e', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'6px 10px', marginBottom:10 },
  cardFooter:   { display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8, marginTop:10, paddingTop:10, borderTop:'1px solid #f1f5f9' },
  tag:          { padding:'3px 10px', borderRadius:12, background:'#f1f5f9', color:'#6b7280', fontSize:11 },
  cardBtn:      { padding:'6px 14px', background:'#f3f4f6', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:12, color:'#374151' },
};
