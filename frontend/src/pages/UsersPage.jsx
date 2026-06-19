import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getUsers, createUser, updateUser, deleteUser } from '../services/api';

const ROLES   = ['ADMIN','TEACHER','PARENT'];
const BLANK   = { fullName:'', username:'', password:'', role:'TEACHER', language:'en', email:'' };

export default function UsersPage() {
  const [users,   setUsers]   = useState([]);
  const [form,    setForm]    = useState(null);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const r = await getUsers(); setUsers(r.data.data || []); } catch {}
  };

  const save = async () => {
    if (!form.fullName || !form.username || !form.role) { setMsg('Name, Username and Role are required'); return; }
    if (!form.id && !form.password) { setMsg('Password is required for new users'); return; }
    setLoading(true); setMsg('');
    try {
      if (form.id) { await updateUser(form.id, form); setMsg('User updated ✓'); }
      else         { await createUser(form);           setMsg('User created ✓'); }
      setForm(null); load();
    } catch { setMsg('Error saving user'); }
    setLoading(false);
  };

  const remove = async (id, name) => {
    if (!window.confirm(`Remove user ${name}?`)) return;
    try { await deleteUser(id); load(); } catch { setMsg('Error removing user'); }
  };

  const roleColor = r => ({ ADMIN:'#ef4444', TEACHER:'#667eea', PARENT:'#22c55e' })[r] || '#9ca3af';

  const filtered = users.filter(u =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8fafc' }}>
      <Sidebar />
      <div style={{ flex:1, padding:32 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div>
            <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:'#1a1a2e' }}>User Management</h1>
            <p style={{ margin:'4px 0 0', color:'#6b7280', fontSize:14 }}>Manage teachers, parents and admins</p>
          </div>
          <button onClick={() => setForm({ ...BLANK })} style={btn('#667eea')}>+ Add User</button>
        </div>

        <input placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e5e7eb', borderRadius:10,
                   fontSize:14, marginBottom:20, outline:'none' }} />

        {msg && <div style={{ padding:'10px 14px', background:'#f0fdf4', color:'#16a34a', borderRadius:8, marginBottom:16 }}>{msg}</div>}

        {/* Role summary */}
        <div style={{ display:'flex', gap:12, marginBottom:20 }}>
          {ROLES.map(r => (
            <div key={r} style={{ padding:'8px 16px', background:'#fff', borderRadius:10,
                                  boxShadow:'0 1px 4px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:roleColor(r) }} />
              <span style={{ fontSize:13, fontWeight:600 }}>{r}</span>
              <span style={{ fontSize:13, color:'#9ca3af' }}>{users.filter(u=>u.role===r).length}</span>
            </div>
          ))}
        </div>

        <table style={{ width:'100%', background:'#fff', borderRadius:14, boxShadow:'0 1px 6px rgba(0,0,0,0.06)', borderCollapse:'collapse', overflow:'hidden' }}>
          <thead>
            <tr style={{ background:'#f8fafc' }}>
              {['User','Username','Role','Language','Actions'].map(h => (
                <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:12, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                <td style={{ padding:'14px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:`${roleColor(u.role)}20`,
                                  display:'flex', alignItems:'center', justifyContent:'center',
                                  color:roleColor(u.role), fontWeight:700 }}>
                      {u.fullName?.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight:600, color:'#1a1a2e', fontSize:14 }}>{u.fullName}</div>
                      <div style={{ fontSize:11, color:'#9ca3af' }}>{u.email || '—'}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding:'14px 16px', fontSize:14, color:'#374151' }}>{u.username}</td>
                <td style={{ padding:'14px 16px' }}>
                  <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700,
                                 background:`${roleColor(u.role)}20`, color:roleColor(u.role) }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ padding:'14px 16px', fontSize:13, color:'#6b7280' }}>{u.language?.toUpperCase()}</td>
                <td style={{ padding:'14px 16px' }}>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => setForm({...u, password:''})} style={btn('#f59e0b','small')}>Edit</button>
                    <button onClick={() => remove(u.id, u.fullName)} style={btn('#ef4444','small')}>Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:60, color:'#9ca3af' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>👥</div>
            <div>No users found</div>
          </div>
        )}
      </div>

      {form && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex',
                      alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:36, width:440, maxWidth:'95vw',
                        boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin:'0 0 24px', fontSize:20, fontWeight:800 }}>
              {form.id ? 'Edit User' : 'Create User'}
            </h2>

            {[['Full Name','fullName','text'],['Username','username','text'],['Email','email','email'],
              [form.id ? 'New Password (leave blank to keep)' : 'Password','password','password']].map(([label,field,type]) => (
              <div key={field} style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:5 }}>{label}</label>
                <input type={type} value={form[field]||''} onChange={e => setForm(f=>({...f,[field]:e.target.value}))}
                  style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:14, outline:'none' }} />
              </div>
            ))}

            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:5 }}>Role</label>
              <select value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))}
                style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:14 }}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:5 }}>Language</label>
              <select value={form.language||'en'} onChange={e => setForm(f=>({...f,language:e.target.value}))}
                style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:14 }}>
                {[{c:'en',l:'English'},{c:'hi',l:'Hindi'},{c:'ta',l:'Tamil'},{c:'te',l:'Telugu'},{c:'kn',l:'Kannada'},
                  {c:'ml',l:'Malayalam'},{c:'mr',l:'Marathi'},{c:'gu',l:'Gujarati'},{c:'bn',l:'Bengali'},
                  {c:'pa',l:'Punjabi'},{c:'es',l:'Spanish'},{c:'fr',l:'French'},{c:'ar',l:'Arabic'},
                  {c:'pt',l:'Portuguese'},{c:'de',l:'German'},{c:'zh',l:'Chinese'},{c:'ja',l:'Japanese'},
                  {c:'ko',l:'Korean'},{c:'sw',l:'Swahili'},{c:'ru',l:'Russian'}
                ].map(({c,l}) => <option key={c} value={c}>{l}</option>)}
              </select>
            </div>

            {msg && <div style={{ padding:'8px 12px', background:'#fef2f2', color:'#dc2626', borderRadius:6, marginBottom:14, fontSize:13 }}>{msg}</div>}

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => { setForm(null); setMsg(''); }} style={btn('#6b7280')}>Cancel</button>
              <button onClick={save} disabled={loading} style={btn('#667eea')}>
                {loading ? 'Saving…' : form.id ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const btn = (bg, size='normal') => ({
  padding: size==='small' ? '5px 12px' : '10px 20px',
  background:bg, color:'#fff', border:'none', borderRadius:8,
  fontSize: size==='small' ? 12 : 14, fontWeight:600, cursor:'pointer'
});
