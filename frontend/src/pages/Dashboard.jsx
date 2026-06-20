import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getDashboard, getStudents, getSessions } from '../services/api';

export default function Dashboard() {
  const [stats, setStats]     = useState({});
  const [recent, setRecent]   = useState([]);
  const navigate              = useNavigate();
  const user                  = JSON.parse(sessionStorage.getItem('aria_user') || '{}');

  useEffect(() => {
    getDashboard(user.userId).then(r => setStats(r.data.data || {})).catch(()=>{});
    getSessions().then(r => setRecent((r.data.data || []).slice(0,5))).catch(()=>{});
  }, []);

  const kpis = user.role === 'PARENT' ? [
    { label:'Sessions',      value: stats.totalSessions      || 0, icon:'📚', color:'#667eea' },
    { label:'Avg Score',     value: `${Math.round(stats.avgUnderstandingScore||0)}%`, icon:'⭐', color:'#f59e0b' },
    { label:'Modules Done',  value: stats.totalModulesMastered||0, icon:'✅', color:'#22c55e' },
  ] : [
    { label:'Students',      value: stats.totalStudents      || 0, icon:'🎓', color:'#667eea' },
    { label:'Sessions',      value: stats.totalSessions      || 0, icon:'📚', color:'#764ba2' },
    { label:'Avg Score',     value: `${Math.round(stats.avgUnderstandingScore||0)}%`, icon:'⭐', color:'#f59e0b' },
    { label:'Mastered',      value: stats.totalModulesMastered||0, icon:'✅', color:'#22c55e' },
    { label:'Active Today',  value: stats.activeStudentsToday||0, icon:'🔥', color:'#ef4444' },
  ];

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8fafc' }}>
      <Sidebar />
      <div style={{ flex:1, padding:32 }}>
        <div style={{ marginBottom:24 }}>
          <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:'#1a1a2e' }}>
            Welcome back, {user.fullName?.split(' ')[0]} 👋
          </h1>
          <p style={{ margin:'6px 0 0', color:'#6b7280', fontSize:14 }}>
            {new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
          </p>
        </div>

        {/* KPI cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:16, marginBottom:32 }}>
          {kpis.map(k => (
            <div key={k.label} style={{ background:'#fff', borderRadius:14, padding:'20px 18px',
                                        boxShadow:'0 1px 6px rgba(0,0,0,0.06)', borderTop:`3px solid ${k.color}` }}>
              <div style={{ fontSize:28, marginBottom:8 }}>{k.icon}</div>
              <div style={{ fontSize:26, fontWeight:800, color:'#1a1a2e' }}>{k.value}</div>
              <div style={{ fontSize:12, color:'#6b7280', marginTop:4 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16, marginBottom:24 }}>
          {user.role !== 'PARENT' && (
            <ActionCard icon="🎓" title="Add Student" desc="Enrol a new student" color="#667eea"
              onClick={() => navigate('/students')} />
          )}
          <ActionCard icon="🤖" title="Start Tutoring" desc="Begin an AI session" color="#764ba2"
            onClick={() => navigate('/students')} />
          {user.role !== 'PARENT' && (
            <ActionCard icon="📝" title="Generate Report" desc="Parent progress report" color="#22c55e"
              onClick={() => navigate('/reports')} />
          )}
          {user.role === 'ADMIN' && (
            <ActionCard icon="👥" title="Manage Users" desc="Add teachers & parents" color="#f59e0b"
              onClick={() => navigate('/users')} />
          )}
        </div>

        {/* Document Teacher feature card */}
        {user.role !== 'PARENT' && (
          <div style={{ marginBottom:32 }}>
            <div onClick={() => navigate('/document-teacher')}
              style={{ background:'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a855f7 100%)',
                       borderRadius:16, padding:'24px 28px', cursor:'pointer', position:'relative',
                       overflow:'hidden', boxShadow:'0 4px 20px rgba(99,102,241,0.35)',
                       display:'flex', alignItems:'center', justifyContent:'space-between', gap:20,
                       flexWrap:'wrap' }}>
              {/* Decorative circles */}
              <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120,
                            borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
              <div style={{ position:'absolute', bottom:-20, right:60, width:80, height:80,
                            borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />
              <div style={{ position:'relative' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <span style={{ fontSize:28 }}>📄</span>
                  <div style={{ fontWeight:900, color:'#fff', fontSize:20 }}>Document Teacher</div>
                  <span style={{ background:'#22c55e', color:'#fff', fontSize:10, fontWeight:800,
                                 padding:'3px 8px', borderRadius:6, letterSpacing:0.5 }}>NEW</span>
                </div>
                <div style={{ color:'rgba(255,255,255,0.85)', fontSize:14, maxWidth:480, lineHeight:1.6 }}>
                  Upload any textbook page, question paper, or handwritten notes —
                  ARIA explains everything from basics to expert level in 35+ languages 🌍
                </div>
                <div style={{ display:'flex', gap:8, marginTop:12, flexWrap:'wrap' }}>
                  {['📸 Camera scan','🌐 35 languages','📊 Beginner → Expert','📝 Practice questions'].map(t => (
                    <span key={t} style={{ background:'rgba(255,255,255,0.15)', color:'#fff',
                                           fontSize:11, padding:'4px 10px', borderRadius:20, fontWeight:600 }}>{t}</span>
                  ))}
                </div>
              </div>
              <button style={{ background:'#fff', color:'#6366f1', border:'none', borderRadius:12,
                               padding:'12px 24px', fontWeight:800, fontSize:14, cursor:'pointer',
                               boxShadow:'0 2px 8px rgba(0,0,0,0.12)', whiteSpace:'nowrap', position:'relative' }}>
                Try Now →
              </button>
            </div>
          </div>
        )}

        {/* Recent sessions */}
        <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 1px 6px rgba(0,0,0,0.06)', overflow:'hidden' }}>
          <div style={{ padding:'18px 24px', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ margin:0, fontSize:16, fontWeight:700 }}>Recent Sessions</h3>
            <span onClick={() => navigate('/sessions')}
              style={{ fontSize:13, color:'#667eea', cursor:'pointer', fontWeight:600 }}>View all →</span>
          </div>
          {recent.length === 0
            ? <div style={{ padding:32, textAlign:'center', color:'#9ca3af' }}>No sessions yet. Start tutoring a student!</div>
            : recent.map(s => (
              <div key={s.id} style={{ padding:'14px 24px', borderBottom:'1px solid #f8fafc', display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:'linear-gradient(135deg,#667eea,#764ba2)',
                              display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:18 }}>
                  {s.subject === 'Mathematics' ? '🔢' : s.subject === 'Science' ? '🔬' : s.subject === 'English' ? '📖' : '💡'}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, color:'#1a1a2e', fontSize:14 }}>{s.subject}</div>
                  <div style={{ fontSize:12, color:'#9ca3af' }}>{s.totalMessages} messages · Score: {Math.round(s.understandingScore||0)}%</div>
                </div>
                <div style={{ padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:700,
                              background: s.status==='ACTIVE' ? '#dcfce7' : '#f1f5f9',
                              color: s.status==='ACTIVE' ? '#16a34a' : '#6b7280' }}>
                  {s.status}
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

function ActionCard({ icon, title, desc, color, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background:'#fff', borderRadius:14, padding:'20px', cursor:'pointer',
               boxShadow: hover ? `0 4px 20px rgba(0,0,0,0.1)` : '0 1px 6px rgba(0,0,0,0.06)',
               borderLeft:`4px solid ${color}`, transition:'all 0.2s',
               transform: hover ? 'translateY(-2px)' : 'none' }}>
      <div style={{ fontSize:28, marginBottom:10 }}>{icon}</div>
      <div style={{ fontWeight:700, color:'#1a1a2e', fontSize:15 }}>{title}</div>
      <div style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>{desc}</div>
    </div>
  );
}
