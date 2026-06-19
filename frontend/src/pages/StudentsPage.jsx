import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../services/api';
import { useNavigate } from 'react-router-dom';

// Indian languages (22 official + major) + top world languages
const LANGS = [
  // Indian
  { code:'hi', label:'हिंदी — Hindi' },
  { code:'ta', label:'தமிழ் — Tamil' },
  { code:'te', label:'తెలుగు — Telugu' },
  { code:'kn', label:'ಕನ್ನಡ — Kannada' },
  { code:'ml', label:'മലയാളം — Malayalam' },
  { code:'mr', label:'मराठी — Marathi' },
  { code:'gu', label:'ગુજરાતી — Gujarati' },
  { code:'pa', label:'ਪੰਜਾਬੀ — Punjabi' },
  { code:'bn', label:'বাংলা — Bengali' },
  { code:'or', label:'ଓଡ଼ିଆ — Odia' },
  { code:'as', label:'অসমীয়া — Assamese' },
  { code:'ur', label:'اردو — Urdu' },
  { code:'ks', label:'कॉशुर — Kashmiri' },
  { code:'sd', label:'سنڌي — Sindhi' },
  { code:'ne', label:'नेपाली — Nepali' },
  { code:'sa', label:'संस्कृतम् — Sanskrit' },
  // World languages (most spoken globally)
  { code:'en', label:'English' },
  { code:'es', label:'Español — Spanish' },
  { code:'fr', label:'Français — French' },
  { code:'ar', label:'العربية — Arabic' },
  { code:'pt', label:'Português — Portuguese' },
  { code:'ru', label:'Русский — Russian' },
  { code:'zh', label:'中文 — Chinese (Mandarin)' },
  { code:'de', label:'Deutsch — German' },
  { code:'ja', label:'日本語 — Japanese' },
  { code:'ko', label:'한국어 — Korean' },
  { code:'id', label:'Bahasa Indonesia' },
  { code:'ms', label:'Bahasa Melayu — Malay' },
  { code:'tr', label:'Türkçe — Turkish' },
  { code:'sw', label:'Kiswahili — Swahili' },
  { code:'vi', label:'Tiếng Việt — Vietnamese' },
  { code:'th', label:'ภาษาไทย — Thai' },
  { code:'it', label:'Italiano — Italian' },
  { code:'nl', label:'Nederlands — Dutch' },
];
const BLANK = { fullName:'', age:'', grade:'', language:'en', studentCode:'', parentEmail:'' };

export default function StudentsPage() {
  const [students, setStudents]   = useState([]);
  const [form,     setForm]       = useState(null);   // null=hidden, obj=editing
  const [search,   setSearch]     = useState('');
  const [loading,  setLoading]    = useState(false);
  const [msg,      setMsg]        = useState('');
  const navigate                  = useNavigate();
  const user                      = JSON.parse(sessionStorage.getItem('aria_user') || '{}');
  const canEdit                   = ['ADMIN','TEACHER'].includes(user.role);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const r = await getStudents(); setStudents(r.data.data || []); } catch {}
  };

  const save = async () => {
    if (!form.fullName || !form.grade || !form.age) { setMsg('Name, Grade and Age are required'); return; }
    setLoading(true); setMsg('');
    try {
      if (form.id) { await updateStudent(form.id, form); setMsg('Student updated ✓'); }
      else         { await createStudent(form);           setMsg('Student added ✓'); }
      setForm(null); load();
    } catch { setMsg('Error saving student'); }
    setLoading(false);
  };

  const remove = async (id, name) => {
    if (!window.confirm(`Remove ${name}?`)) return;
    try { await deleteStudent(id); load(); } catch { setMsg('Error removing student'); }
  };

  const startTutor = (s) => {
    sessionStorage.setItem('aria_student', JSON.stringify(s));
    navigate('/tutor');
  };

  const filtered = students.filter(s =>
    s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    s.studentCode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8fafc' }}>
      <Sidebar />
      <div style={{ flex:1, padding:32 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div>
            <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:'#1a1a2e' }}>Students</h1>
            <p style={{ margin:'4px 0 0', color:'#6b7280', fontSize:14 }}>{students.length} enrolled</p>
          </div>
          {canEdit && (
            <button onClick={() => setForm({ ...BLANK })} style={btn('#667eea')}>+ Add Student</button>
          )}
        </div>

        <input placeholder="Search students…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e5e7eb', borderRadius:10,
                   fontSize:14, marginBottom:20, outline:'none' }} />

        {msg && <div style={{ padding:'10px 14px', background:'#f0fdf4', color:'#16a34a', borderRadius:8, marginBottom:16, fontSize:13 }}>{msg}</div>}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
          {filtered.map(s => (
            <div key={s.id} data-testid={`student-card-${s.id}`}
              style={{ background:'#fff', borderRadius:14, padding:20, boxShadow:'0 1px 6px rgba(0,0,0,0.06)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <div style={{ width:46, height:46, borderRadius:12, background:'linear-gradient(135deg,#667eea,#764ba2)',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              color:'#fff', fontWeight:800, fontSize:20 }}>
                  {s.fullName?.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight:700, color:'#1a1a2e', fontSize:15 }}>{s.fullName}</div>
                  <div style={{ fontSize:11, color:'#6b7280' }}>{s.studentCode} · Grade {s.grade} · Age {s.age}</div>
                </div>
              </div>

              <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                <Tag label={`🌍 ${s.language?.toUpperCase()}`} />
                <Tag label={`📊 Grade ${s.grade}`} />
              </div>

              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => startTutor(s)} style={btn('#667eea','small')}>🤖 Tutor</button>
                {canEdit && <>
                  <button onClick={() => setForm({...s})} style={btn('#f59e0b','small')}>✏️ Edit</button>
                  <button onClick={() => remove(s.id, s.fullName)} style={btn('#ef4444','small')}>🗑️</button>
                </>}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:60, color:'#9ca3af' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🎓</div>
            <div style={{ fontSize:16, fontWeight:600 }}>No students found</div>
            {canEdit && <div style={{ fontSize:13, marginTop:6 }}>Click "+ Add Student" to enrol the first student</div>}
          </div>
        )}
      </div>

      {/* Modal */}
      {form && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex',
                      alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:36, width:460, maxWidth:'95vw',
                        boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin:'0 0 24px', fontSize:20, fontWeight:800 }}>
              {form.id ? 'Edit Student' : 'Add New Student'}
            </h2>

            {[['Full Name','fullName','text'],['Age','age','number'],['Grade (1-12)','grade','number'],['Student Code','studentCode','text'],['Parent Email','parentEmail','email']].map(([label,field,type]) => (
              <div key={field} style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:6, color:'#374151' }}>{label}</label>
                <input type={type} value={form[field]||''} onChange={e => setForm(f=>({...f,[field]:e.target.value}))}
                  style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:14, outline:'none' }} />
              </div>
            ))}

            <div style={{ marginBottom:20 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:6, color:'#374151' }}>Language</label>
              <select value={form.language||'en'} onChange={e => setForm(f=>({...f,language:e.target.value}))}
                style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:14 }}>
                {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>

            {msg && <div style={{ padding:'8px 12px', background:'#fef2f2', color:'#dc2626', borderRadius:6, marginBottom:14, fontSize:13 }}>{msg}</div>}

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => { setForm(null); setMsg(''); }} style={btn('#6b7280')}>Cancel</button>
              <button onClick={save} disabled={loading} style={btn('#667eea')}>
                {loading ? 'Saving…' : form.id ? 'Update' : 'Add Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const btn = (bg, size='normal') => ({
  padding: size==='small' ? '6px 12px' : '10px 20px',
  background: bg, color:'#fff', border:'none', borderRadius:8,
  fontSize: size==='small' ? 12 : 14, fontWeight:600, cursor:'pointer'
});
const Tag = ({ label }) => (
  <span style={{ padding:'3px 10px', background:'#f1f5f9', borderRadius:20, fontSize:11, color:'#4b5563', fontWeight:500 }}>{label}</span>
);
