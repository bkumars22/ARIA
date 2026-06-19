import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  const handleLogin = async e => {
    e.preventDefault();
    if (!username || !password) { setError('Please enter username and password'); return; }
    try {
      setLoading(true); setError('');
      const r = await api.post('/api/auth/login', { username, password });
      const { token, role, fullName, userId, language } = r.data.data;
      sessionStorage.setItem('aria_token', token);
      sessionStorage.setItem('aria_user', JSON.stringify({ userId, role, fullName, language }));
      navigate(role === 'PARENT' || role === 'TEACHER' || role === 'ADMIN' ? '/dashboard' : '/tutor');
    } catch {
      setError('Invalid username or password');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
                  background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)' }}>
      <div style={{ background:'#fff', borderRadius:20, padding:'48px 40px', width:420, maxWidth:'95vw',
                    boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:56, marginBottom:8 }}>🧠</div>
          <h1 data-testid="login-title"
              style={{ fontSize:32, fontWeight:900, margin:0, color:'#1a1a2e' }}>ARIA</h1>
          <p style={{ color:'#6b7280', margin:'6px 0 0', fontSize:14 }}>
            Adaptive Real-time Intelligence for Anyone
          </p>
        </div>

        <form onSubmit={handleLogin}>
          {error && (
            <div data-testid="login-error"
                 style={{ background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca',
                          borderRadius:10, padding:'10px 14px', marginBottom:20, fontSize:13 }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom:18 }}>
            <label style={{ display:'block', fontWeight:600, fontSize:13, marginBottom:6, color:'#374151' }}>
              Username
            </label>
            <input data-testid="username-input"
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="teacher / admin / parent1"
              style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #e5e7eb', borderRadius:10,
                       fontSize:14, outline:'none' }} />
          </div>

          <div style={{ marginBottom:24 }}>
            <label style={{ display:'block', fontWeight:600, fontSize:13, marginBottom:6, color:'#374151' }}>
              Password
            </label>
            <input data-testid="password-input"
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Teacher@2026"
              style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #e5e7eb', borderRadius:10,
                       fontSize:14, outline:'none' }} />
          </div>

          <button data-testid="login-btn" type="submit" disabled={loading}
            style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#667eea,#764ba2)',
                     color:'#fff', border:'none', borderRadius:10, fontSize:16, fontWeight:700,
                     cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1 }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop:24, padding:14, background:'#f8fafc', borderRadius:10, fontSize:12,
                      color:'#6b7280', textAlign:'center' }}>
          Demo: <strong>teacher / Teacher@2026</strong> &nbsp;|&nbsp; <strong>admin / Admin@2026</strong>
        </div>
      </div>
    </div>
  );
}
