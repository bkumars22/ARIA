import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authLogin } from '../services/api';

const MAX_ATTEMPTS  = 5;
const LOCKOUT_MS    = 5 * 60 * 1000;  // 5 minutes
const SESSION_MS    = 30 * 60 * 1000; // 30 minutes auto-logout

export default function LoginPage() {
  const [username,  setUsername]  = useState('');
  const [password,  setPassword]  = useState('');
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [attempts,  setAttempts]  = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  // Restore lock state from sessionStorage across page reloads
  useEffect(() => {
    const stored = sessionStorage.getItem('aria_lockout');
    if (stored) {
      const until = parseInt(stored, 10);
      if (Date.now() < until) { setLockedUntil(until); }
      else { sessionStorage.removeItem('aria_lockout'); }
    }
  }, []);

  // Countdown timer while locked
  useEffect(() => {
    if (!lockedUntil) return;
    const tick = setInterval(() => {
      const left = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (left <= 0) { setLockedUntil(null); setAttempts(0); setError(''); sessionStorage.removeItem('aria_lockout'); }
      else setCountdown(left);
    }, 1000);
    return () => clearInterval(tick);
  }, [lockedUntil]);

  const handleLogin = async e => {
    e.preventDefault();
    if (lockedUntil) return;
    if (!username.trim() || !password) { setError('Please enter username and password'); return; }

    // Basic XSS protection — reject < > in input
    if (/[<>]/.test(username) || /[<>]/.test(password)) { setError('Invalid characters in input'); return; }

    try {
      setLoading(true); setError('');
      const r = await authLogin(username.trim(), password);
      const { token, role, fullName, userId, language } = r.data.data;

      sessionStorage.setItem('aria_token', token);
      sessionStorage.setItem('aria_user',  JSON.stringify({ userId, role, fullName, language }));
      sessionStorage.setItem('aria_login_time', String(Date.now()));
      sessionStorage.removeItem('aria_lockout');
      setAttempts(0);

      // Auto-logout after SESSION_MS of idle time — stored for App-level check
      sessionStorage.setItem('aria_session_expiry', String(Date.now() + SESSION_MS));

      navigate('/dashboard');
    } catch {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_MS;
        setLockedUntil(until);
        sessionStorage.setItem('aria_lockout', String(until));
        setError(`Too many failed attempts. Account locked for 5 minutes.`);
      } else {
        setError(`Invalid username or password. ${MAX_ATTEMPTS - next} attempt${MAX_ATTEMPTS - next === 1 ? '' : 's'} remaining.`);
      }
    } finally { setLoading(false); }
  };

  const isLocked = !!lockedUntil;

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
                  background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)' }}>

      {/* Background decorations */}
      <div style={{ position:'fixed', top:-80, right:-80, width:300, height:300, borderRadius:'50%',
                    background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />
      <div style={{ position:'fixed', bottom:-60, left:-60, width:200, height:200, borderRadius:'50%',
                    background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />

      <div style={{ background:'#fff', borderRadius:24, padding:'48px 40px', width:440, maxWidth:'95vw',
                    boxShadow:'0 25px 80px rgba(0,0,0,0.2)', position:'relative', zIndex:1 }}>

        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ fontSize:60, marginBottom:10 }}>🧠</div>
          <h1 data-testid="login-title"
              style={{ fontSize:34, fontWeight:900, margin:0, color:'#1a1a2e', letterSpacing:-0.5 }}>ARIA</h1>
          <p style={{ color:'#6b7280', margin:'8px 0 0', fontSize:14 }}>
            Adaptive Real-time Intelligence for Anyone
          </p>
          <div style={{ display:'inline-block', marginTop:10, padding:'4px 14px', borderRadius:20,
                        background:'linear-gradient(135deg,#667eea20,#764ba220)', fontSize:11,
                        color:'#667eea', fontWeight:700, letterSpacing:0.5 }}>
            FREE · OPEN · FOR EVERY CHILD
          </div>
        </div>

        <form onSubmit={handleLogin} autoComplete="off">

          {error && (
            <div data-testid="login-error"
                 style={{ background: isLocked ? '#fef2f2' : '#fff7ed', color: isLocked ? '#dc2626' : '#d97706',
                          border:`1px solid ${isLocked ? '#fecaca' : '#fed7aa'}`,
                          borderRadius:10, padding:'12px 14px', marginBottom:20, fontSize:13, lineHeight:1.5 }}>
              {isLocked ? `🔒 ${error} Please try again in ${countdown}s.` : `⚠️ ${error}`}
            </div>
          )}

          <div style={{ marginBottom:18 }}>
            <label style={{ display:'block', fontWeight:700, fontSize:13, marginBottom:7, color:'#374151' }}>
              Username
            </label>
            <input data-testid="username-input"
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="teacher · admin · parent1"
              disabled={isLocked}
              autoComplete="username"
              style={{ width:'100%', padding:'13px 14px', border:'1.5px solid #e5e7eb', borderRadius:11,
                       fontSize:14, outline:'none', boxSizing:'border-box',
                       background: isLocked ? '#f9fafb' : '#fff' }} />
          </div>

          <div style={{ marginBottom:28 }}>
            <label style={{ display:'block', fontWeight:700, fontSize:13, marginBottom:7, color:'#374151' }}>
              Password
            </label>
            <input data-testid="password-input"
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••"
              disabled={isLocked}
              autoComplete="current-password"
              style={{ width:'100%', padding:'13px 14px', border:'1.5px solid #e5e7eb', borderRadius:11,
                       fontSize:14, outline:'none', boxSizing:'border-box',
                       background: isLocked ? '#f9fafb' : '#fff' }} />
          </div>

          <button data-testid="login-btn" type="submit" disabled={loading || isLocked}
            style={{ width:'100%', padding:'15px', background: isLocked ? '#9ca3af' : 'linear-gradient(135deg,#667eea,#764ba2)',
                     color:'#fff', border:'none', borderRadius:12, fontSize:16, fontWeight:700,
                     cursor: (loading || isLocked) ? 'not-allowed' : 'pointer',
                     opacity: loading ? 0.75 : 1, transition:'all 0.2s', letterSpacing:0.3 }}>
            {loading ? '🔄 Signing in…' : isLocked ? `🔒 Locked (${countdown}s)` : '🔐 Sign In Securely'}
          </button>
        </form>

        {/* Demo credentials */}
        <div style={{ marginTop:28, padding:'14px 16px', background:'#f8fafc', borderRadius:12,
                      fontSize:12, color:'#6b7280', borderTop:'none' }}>
          <div style={{ fontWeight:700, marginBottom:8, color:'#374151', fontSize:11, letterSpacing:0.5 }}>DEMO CREDENTIALS</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
            {[['👨‍🏫 Teacher','teacher / Teacher@2026'],['🛡️ Admin','admin / Admin@2026'],
              ['👪 Parent 1','parent1 / Parent@2026'],['👪 Parent 2','parent2 / Parent@2026']].map(([role,cred]) => (
              <div key={role} style={{ padding:'6px 10px', background:'#fff', borderRadius:8,
                                      border:'1px solid #e5e7eb' }}>
                <div style={{ fontWeight:600, fontSize:10, color:'#374151' }}>{role}</div>
                <div style={{ fontFamily:'monospace', fontSize:10, color:'#667eea', marginTop:2 }}>{cred}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop:14, textAlign:'center' }}>
          <button onClick={() => {
            ['aria_users','aria_users_extra','aria_students','aria_sessions',
             'aria_messages','aria_sid_ctr','aria_progress','aria_lockout'].forEach(k => localStorage.removeItem(k));
            sessionStorage.clear();
            window.location.reload();
          }} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:11,
                      textDecoration:'underline' }}>
            🔄 Reset demo data
          </button>
          <span style={{ color:'#d1d5db', fontSize:11, marginLeft:12 }}>
            🔒 JWT · 30 min sessions
          </span>
        </div>
      </div>
    </div>
  );
}
