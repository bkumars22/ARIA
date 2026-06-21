import { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { getStudents, getProgress, generateReport } from '../services/api';

// ─── Voice Button ─────────────────────────────────────────────
const VOICE_CSS = `
@keyframes voicePulse {
  0%,100% { box-shadow:0 0 0 0 rgba(220,38,38,0.5); }
  50%      { box-shadow:0 0 0 8px rgba(220,38,38,0); }
}
.aria-voice-btn { display:inline-flex; align-items:center; gap:7px; padding:7px 16px;
  border:none; border-radius:22px; font-size:13px; font-weight:700; cursor:pointer;
  transition:all 0.2s; font-family:inherit; }
.aria-voice-btn.idle { background:linear-gradient(135deg,#16a34a,#15803d); color:#fff; }
.aria-voice-btn.idle:hover { opacity:.88; transform:scale(1.03); }
.aria-voice-btn.speaking { background:linear-gradient(135deg,#dc2626,#b91c1c); color:#fff;
  animation:voicePulse 1.2s ease-in-out infinite; }
`;
function VoiceBtn({ speaking, onClick }) {
  return (
    <>
      <style>{VOICE_CSS}</style>
      <button className={`aria-voice-btn ${speaking ? 'speaking' : 'idle'}`} onClick={onClick}>
        {speaking ? <><span style={{fontSize:15}}>⏹</span> Stop</> : <><span style={{fontSize:15}}>🔊</span> Read Aloud</>}
      </button>
    </>
  );
}

export default function ReportsPage() {
  const [students,  setStudents]  = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [progress,  setProgress]  = useState([]);
  const [report,    setReport]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [listening, setListening] = useState(false);
  const reportRef = useRef(null);
  const synthRef  = useRef(null);
  const user      = JSON.parse(sessionStorage.getItem('aria_user') || '{}');

  useEffect(() => { getStudents().then(r => setStudents(r.data.data || [])).catch(()=>{}); }, []);

  const selectStudent = async (s) => {
    setSelected(s); setReport(''); setLoading(false);
    try { const r = await getProgress(s.id); setProgress(r.data.data || []); } catch { setProgress([]); }
  };

  const generate = async () => {
    if (!selected) return;
    setLoading(true); setReport('');
    try {
      const strong = progress.filter(p => p.score >= 70).map(p => `Module ${p.moduleId}`);
      const weak   = progress.filter(p => p.score  < 50).map(p => `Module ${p.moduleId}`);
      const r = await generateReport({
        student_name:     selected.fullName,
        grade:            selected.grade,
        language:         selected.language,
        sessions_count:   progress.reduce((s,p)=>s+p.attempts,0),
        avg_score:        progress.length ? progress.reduce((s,p)=>s+p.score,0)/progress.length : 0,
        strong_topics:    strong.slice(0,3),
        weak_topics:      weak.slice(0,3),
        parent_language:  selected.language,
      });
      setReport(r.data.report || '');
    } catch { setReport('Could not generate report. Please check AI service.'); }
    setLoading(false);
  };

  // Voice read-aloud
  const readAloud = () => {
    if (!report) return;
    if (window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); setListening(false); return; }
    const utterance = new SpeechSynthesisUtterance(report.replace(/[🌟💪📚✅]/g,''));
    utterance.lang  = selected?.language === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate  = 0.9;
    utterance.onend = () => setListening(false);
    window.speechSynthesis.speak(utterance);
    setListening(true);
  };

  const copyReport = () => {
    navigator.clipboard.writeText(report);
  };

  const printReport = () => {
    const w = window.open('','_blank');
    w.document.write(`<html><head><title>ARIA Report - ${selected?.fullName}</title></head><body><pre style="font-family:sans-serif;white-space:pre-wrap;padding:40px">${report}</pre></body></html>`);
    w.document.close(); w.print();
  };

  const masteryLabel = l => ({ MASTERED:'✅ Mastered', PRACTISING:'🔄 Practising', LEARNING:'📚 Learning', NOT_STARTED:'⬜ Not started' })[l] || l;
  const scoreColor   = n => n >= 75 ? '#22c55e' : n >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8fafc' }}>
      <Sidebar />
      <div style={{ flex:1, padding:32, display:'flex', gap:24 }}>

        {/* Left: student list */}
        <div style={{ width:240, flexShrink:0 }}>
          <h2 style={{ margin:'0 0 16px', fontSize:18, fontWeight:800 }}>Select Student</h2>
          {students.map(s => (
            <div key={s.id} onClick={() => selectStudent(s)}
              style={{ padding:'12px 14px', borderRadius:10, marginBottom:8, cursor:'pointer',
                       background: selected?.id===s.id ? 'linear-gradient(135deg,#667eea,#764ba2)' : '#fff',
                       color: selected?.id===s.id ? '#fff' : '#1a1a2e',
                       boxShadow:'0 1px 4px rgba(0,0,0,0.06)', transition:'all 0.15s' }}>
              <div style={{ fontWeight:700, fontSize:14 }}>{s.fullName}</div>
              <div style={{ fontSize:11, opacity:0.7, marginTop:3 }}>Grade {s.grade} · {s.language?.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* Right: report panel */}
        <div style={{ flex:1 }}>
          {!selected ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#9ca3af' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:56, marginBottom:16 }}>📝</div>
                <div style={{ fontSize:18, fontWeight:600 }}>Select a student to generate their report</div>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <div>
                  <h2 style={{ margin:0, fontSize:22, fontWeight:800 }}>Report: {selected.fullName}</h2>
                  <p style={{ margin:'4px 0 0', color:'#6b7280', fontSize:13 }}>Grade {selected.grade} · {progress.length} modules tracked</p>
                </div>
                <button onClick={generate} disabled={loading}
                  style={{ padding:'10px 22px', background:'linear-gradient(135deg,#667eea,#764ba2)',
                           color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer' }}>
                  {loading ? '🤖 Generating…' : '🤖 Generate AI Report'}
                </button>
              </div>

              {/* Progress cards */}
              {progress.length > 0 && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:12, marginBottom:24 }}>
                  {progress.map(p => (
                    <div key={p.id} style={{ background:'#fff', borderRadius:10, padding:'14px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                      <div style={{ fontSize:11, color:'#9ca3af', marginBottom:4 }}>Module {p.moduleId}</div>
                      <div style={{ fontSize:22, fontWeight:800, color:scoreColor(p.score) }}>{Math.round(p.score)}%</div>
                      <div style={{ fontSize:11, marginTop:4 }}>{masteryLabel(p.masteryLevel)}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Report output */}
              {report && (
                <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 1px 6px rgba(0,0,0,0.06)', overflow:'hidden' }}>
                  <div style={{ padding:'14px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ flex:1, fontWeight:700, fontSize:15 }}>📄 Parent Report</span>
                    <VoiceBtn speaking={listening} onClick={readAloud} />
                    <button onClick={copyReport}
                      style={{ padding:'6px 14px', background:'#f1f5f9', color:'#374151', border:'none', borderRadius:8, fontSize:12, cursor:'pointer', fontWeight:600 }}>
                      📋 Copy
                    </button>
                    <button onClick={printReport}
                      style={{ padding:'6px 14px', background:'#f1f5f9', color:'#374151', border:'none', borderRadius:8, fontSize:12, cursor:'pointer', fontWeight:600 }}>
                      🖨️ Print
                    </button>
                  </div>
                  <div ref={reportRef}
                    style={{ padding:24, fontSize:15, lineHeight:1.8, color:'#374151', whiteSpace:'pre-wrap' }}>
                    {report}
                  </div>
                </div>
              )}

              {loading && (
                <div style={{ background:'#fff', borderRadius:14, padding:48, textAlign:'center',
                              boxShadow:'0 1px 6px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>🤖</div>
                  <div style={{ color:'#667eea', fontWeight:600 }}>ARIA is writing the parent report…</div>
                  <div style={{ color:'#9ca3af', fontSize:13, marginTop:8 }}>Analysing learning patterns and crafting personalised insights</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
