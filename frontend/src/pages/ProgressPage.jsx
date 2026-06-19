import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getStudents, getProgress, getSessions } from '../services/api';

const MASTERY_COLOR = { MASTERED:'#22c55e', PRACTISING:'#f59e0b', LEARNING:'#667eea', STARTED:'#9ca3af' };
const MASTERY_LABEL = { MASTERED:'Mastered ✅', PRACTISING:'Practising 🔄', LEARNING:'Learning 📖', STARTED:'Just started 🌱' };

export default function ProgressPage() {
  const [students,  setStudents]  = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [progress,  setProgress]  = useState([]);
  const [sessions,  setSessions]  = useState([]);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    getStudents().then(r => {
      const list = r.data.data || [];
      setStudents(list);
      if (list.length > 0) loadChild(list[0]);
    }).catch(() => {});
  }, []);

  const loadChild = async (student) => {
    setSelected(student); setLoading(true);
    try {
      const [pr, sr] = await Promise.all([getProgress(student.id), getSessions(student.id)]);
      setProgress(pr.data.data || []);
      setSessions(sr.data.data || []);
    } catch {}
    setLoading(false);
  };

  const avgScore = sessions.length
    ? Math.round(sessions.reduce((a,s) => a + (s.understandingScore || 0), 0) / sessions.length)
    : 0;

  const mastered   = progress.filter(p => p.masteryLevel === 'MASTERED').length;
  const practising = progress.filter(p => p.masteryLevel === 'PRACTISING').length;

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8fafc' }}>
      <Sidebar />
      <div style={{ flex:1, padding:24 }}>
        <div style={{ marginBottom:24 }}>
          <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:'#1a1a2e' }}>My Child's Progress</h1>
          <p style={{ margin:'4px 0 0', color:'#6b7280', fontSize:14 }}>Detailed learning progress for your children</p>
        </div>

        {students.length === 0 ? (
          <div style={{ textAlign:'center', padding:80, color:'#9ca3af' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>👶</div>
            <div style={{ fontSize:16 }}>No students linked to your account</div>
            <div style={{ fontSize:13, marginTop:8 }}>Ask your teacher or admin to link your child</div>
          </div>
        ) : (
          <>
            {/* Child selector */}
            <div style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap' }}>
              {students.map(s => (
                <button key={s.id} onClick={() => loadChild(s)}
                  style={{ padding:'10px 20px', borderRadius:12, border:'2px solid',
                           borderColor: selected?.id === s.id ? '#667eea' : '#e5e7eb',
                           background: selected?.id === s.id ? '#667eea' : '#fff',
                           color: selected?.id === s.id ? '#fff' : '#374151',
                           fontWeight:600, cursor:'pointer', fontSize:14 }}>
                  🎓 {s.fullName}
                </button>
              ))}
            </div>

            {selected && (
              <>
                {/* Summary cards */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16, marginBottom:28 }}>
                  {[
                    { label:'Grade', value:`Grade ${selected.grade}`, icon:'🏫' },
                    { label:'Sessions Done', value:sessions.length, icon:'📚' },
                    { label:'Avg Score', value:`${avgScore}/100`, icon:'📊' },
                    { label:'Topics Mastered', value:mastered, icon:'✅' },
                    { label:'Practising', value:practising, icon:'🔄' },
                  ].map(c => (
                    <div key={c.label} style={{ background:'#fff', borderRadius:14, padding:'18px 20px',
                                               boxShadow:'0 1px 6px rgba(0,0,0,0.06)' }}>
                      <div style={{ fontSize:24, marginBottom:8 }}>{c.icon}</div>
                      <div style={{ fontSize:22, fontWeight:800, color:'#1a1a2e' }}>{c.value}</div>
                      <div style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>{c.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                  {/* Progress by topic */}
                  <div style={{ background:'#fff', borderRadius:14, padding:20, boxShadow:'0 1px 6px rgba(0,0,0,0.06)' }}>
                    <h3 style={{ margin:'0 0 16px', fontSize:16, fontWeight:700, color:'#1a1a2e' }}>Topic Progress</h3>
                    {loading ? <div style={{ color:'#9ca3af', textAlign:'center', padding:20 }}>Loading…</div>
                    : progress.length === 0 ? (
                      <div style={{ color:'#9ca3af', textAlign:'center', padding:20 }}>No progress data yet — sessions needed</div>
                    ) : progress.map((p, i) => (
                      <div key={i} style={{ marginBottom:14 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                          <span style={{ fontSize:13, fontWeight:600, color:'#374151' }}>Module {p.moduleId}</span>
                          <span style={{ fontSize:11, fontWeight:700, color:MASTERY_COLOR[p.masteryLevel]||'#9ca3af' }}>
                            {MASTERY_LABEL[p.masteryLevel] || p.masteryLevel}
                          </span>
                        </div>
                        <div style={{ height:8, background:'#f1f5f9', borderRadius:4, overflow:'hidden' }}>
                          <div style={{ height:'100%', borderRadius:4, background:MASTERY_COLOR[p.masteryLevel]||'#9ca3af',
                                        width:`${p.score||0}%`, transition:'width 0.4s' }} />
                        </div>
                        <div style={{ fontSize:11, color:'#9ca3af', marginTop:3 }}>Score: {p.score}/100 · {p.attempts} attempt{p.attempts!==1?'s':''}</div>
                      </div>
                    ))}
                  </div>

                  {/* Recent sessions */}
                  <div style={{ background:'#fff', borderRadius:14, padding:20, boxShadow:'0 1px 6px rgba(0,0,0,0.06)' }}>
                    <h3 style={{ margin:'0 0 16px', fontSize:16, fontWeight:700, color:'#1a1a2e' }}>Recent Sessions</h3>
                    {loading ? <div style={{ color:'#9ca3af', textAlign:'center', padding:20 }}>Loading…</div>
                    : sessions.length === 0 ? (
                      <div style={{ color:'#9ca3af', textAlign:'center', padding:20 }}>No sessions yet</div>
                    ) : sessions.slice(0,6).map(s => (
                      <div key={s.id} style={{ padding:'10px 0', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:'#1a1a2e' }}>{s.subject}</div>
                          <div style={{ fontSize:11, color:'#9ca3af' }}>{s.totalMessages} messages</div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontSize:14, fontWeight:700, color: s.understandingScore>=70?'#22c55e':s.understandingScore>=50?'#f59e0b':'#ef4444' }}>
                            {s.understandingScore}/100
                          </div>
                          <div style={{ fontSize:10, padding:'2px 8px', borderRadius:12, marginTop:2, display:'inline-block',
                                        background: s.status==='ACTIVE'?'#dcfce7':'#f1f5f9',
                                        color: s.status==='ACTIVE'?'#16a34a':'#6b7280', fontWeight:600 }}>
                            {s.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Encouragement message */}
                <div style={{ marginTop:20, background:'linear-gradient(135deg,#667eea,#764ba2)', borderRadius:14,
                              padding:'20px 24px', color:'#fff' }}>
                  <div style={{ fontSize:18, fontWeight:700, marginBottom:6 }}>
                    {avgScore >= 80 ? '🌟 Excellent progress!' : avgScore >= 60 ? '👍 Good progress!' : '💪 Keep going!'}
                  </div>
                  <div style={{ fontSize:14, opacity:0.9 }}>
                    {selected.fullName} has completed {sessions.length} session{sessions.length!==1?'s':''} and mastered {mastered} topic{mastered!==1?'s':''}.
                    {avgScore >= 70 ? ' Outstanding work — keep the momentum!' : ' Encourage daily practice for best results.'}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
