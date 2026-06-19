import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getSessions, getStudents } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function SessionsPage() {
  const [sessions,  setSessions]  = useState([]);
  const [students,  setStudents]  = useState({});
  const [filter,    setFilter]    = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    getSessions().then(r => setSessions(r.data.data || [])).catch(()=>{});
    getStudents().then(r => {
      const map = {};
      (r.data.data || []).forEach(s => { map[s.id] = s; });
      setStudents(map);
    }).catch(()=>{});
  }, []);

  const filtered = sessions.filter(s => filter === 'ALL' || s.status === filter);

  const scoreColor = n => n >= 75 ? '#22c55e' : n >= 50 ? '#f59e0b' : '#ef4444';
  const subjIcon   = s => ({ Mathematics:'🔢', Science:'🔬', English:'📖', Coding:'💻', 'Life Skills':'🌱' })[s] || '📚';

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8fafc' }}>
      <Sidebar />
      <div style={{ flex:1, padding:32 }}>
        <div style={{ marginBottom:24 }}>
          <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:'#1a1a2e' }}>Sessions</h1>
          <p style={{ margin:'4px 0 0', color:'#6b7280', fontSize:14 }}>{sessions.length} total sessions</p>
        </div>

        {/* Filter tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:20 }}>
          {['ALL','ACTIVE','COMPLETED'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding:'8px 18px', borderRadius:20, border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
                       background: filter===f ? '#667eea' : '#fff',
                       color:      filter===f ? '#fff' : '#6b7280',
                       boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              {f === 'ALL' ? `All (${sessions.length})` : f === 'ACTIVE' ? `Active (${sessions.filter(s=>s.status==='ACTIVE').length})` : `Completed (${sessions.filter(s=>s.status==='COMPLETED').length})`}
            </button>
          ))}
        </div>

        <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 1px 6px rgba(0,0,0,0.06)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f8fafc' }}>
                {['Session','Student','Subject','Messages','Score','Status','Actions'].map(h => (
                  <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:12, fontWeight:700, color:'#6b7280', textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const stu = students[s.studentId];
                return (
                  <tr key={s.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'14px 16px', fontSize:13, color:'#9ca3af', fontFamily:'monospace' }}>{s.sessionCode}</td>
                    <td style={{ padding:'14px 16px' }}>
                      <div style={{ fontWeight:600, fontSize:14, color:'#1a1a2e' }}>{stu?.fullName || `Student #${s.studentId}`}</div>
                      <div style={{ fontSize:11, color:'#9ca3af' }}>Grade {stu?.grade}</div>
                    </td>
                    <td style={{ padding:'14px 16px' }}>
                      <span style={{ fontSize:18 }}>{subjIcon(s.subject)}</span>
                      <span style={{ marginLeft:8, fontSize:13 }}>{s.subject}</span>
                    </td>
                    <td style={{ padding:'14px 16px', fontSize:14, color:'#374151' }}>{s.totalMessages || 0}</td>
                    <td style={{ padding:'14px 16px' }}>
                      <span style={{ fontWeight:700, fontSize:14, color:scoreColor(s.understandingScore||0) }}>
                        {Math.round(s.understandingScore||0)}%
                      </span>
                    </td>
                    <td style={{ padding:'14px 16px' }}>
                      <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700,
                                     background: s.status==='ACTIVE' ? '#dcfce7' : '#f1f5f9',
                                     color:      s.status==='ACTIVE' ? '#16a34a' : '#6b7280' }}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ padding:'14px 16px' }}>
                      {s.status === 'ACTIVE' && stu && (
                        <button onClick={() => { sessionStorage.setItem('aria_student',JSON.stringify(stu)); navigate('/tutor'); }}
                          style={{ padding:'5px 12px', background:'#667eea', color:'#fff', border:'none', borderRadius:6, fontSize:12, cursor:'pointer', fontWeight:600 }}>
                          Resume
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding:48, textAlign:'center', color:'#9ca3af' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📚</div>
              <div>No sessions found</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
