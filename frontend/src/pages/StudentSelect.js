import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function StudentSelect() {
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/students')
      .then(r => setStudents(r.data.data || []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, []);

  const select = student => {
    sessionStorage.setItem('student', JSON.stringify(student));
    navigate('/tutor');
  };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#667eea,#764ba2)',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#fff', borderRadius:20, padding:40, maxWidth:600, width:'95vw' }}>
        <h2 data-testid="student-select-title"
            style={{ fontSize:24, fontWeight:800, textAlign:'center', marginBottom:28 }}>
          👤 Select Student
        </h2>
        {loading ? (
          <p style={{ textAlign:'center', color:'#6b7280' }}>Loading students…</p>
        ) : (
          <div style={{ display:'grid', gap:12 }}>
            {students.map(s => (
              <button key={s.id} data-testid={`student-card-${s.id}`}
                onClick={() => select(s)}
                style={{ padding:'16px 20px', background:'#f8fafc', border:'2px solid #e5e7eb',
                         borderRadius:12, cursor:'pointer', textAlign:'left', fontSize:15,
                         fontWeight:600, display:'flex', justifyContent:'space-between' }}>
                <span>{s.fullName}</span>
                <span style={{ color:'#6b7280', fontWeight:400 }}>Grade {s.grade} · {s.language.toUpperCase()}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
