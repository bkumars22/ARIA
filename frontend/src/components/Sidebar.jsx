import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV = {
  ADMIN: [
    { path: '/dashboard',         icon: '📊', label: 'Dashboard' },
    { path: '/users',             icon: '👥', label: 'Users' },
    { path: '/students',          icon: '🎓', label: 'All Students' },
    { path: '/sessions',          icon: '📚', label: 'Sessions' },
    { path: '/homework-helper',   icon: '🏠', label: 'Homework Helper', badge: 'NEW' },
    { path: '/homework-history',  icon: '📋', label: 'My Answers' },
    { path: '/document-teacher',  icon: '📄', label: 'Document Teacher' },
    { path: '/document-history',  icon: '🗂️', label: 'Document History' },
  ],
  TEACHER: [
    { path: '/dashboard',         icon: '📊', label: 'Dashboard' },
    { path: '/students',          icon: '🎓', label: 'My Students' },
    { path: '/sessions',          icon: '📚', label: 'Sessions' },
    { path: '/reports',           icon: '📝', label: 'Reports' },
    { path: '/homework-helper',   icon: '🏠', label: 'Homework Helper', badge: 'NEW' },
    { path: '/homework-history',  icon: '📋', label: 'My Answers' },
    { path: '/document-teacher',  icon: '📄', label: 'Document Teacher' },
    { path: '/document-history',  icon: '🗂️', label: 'Document History' },
  ],
  PARENT: [
    { path: '/dashboard',         icon: '🏠', label: 'Home' },
    { path: '/progress',          icon: '📈', label: 'Progress' },
    { path: '/reports',           icon: '📝', label: 'Reports' },
  ],
};

const CSS = `
  .aria-hamburger {
    display: block;
    position: fixed;
    top: 12px;
    left: 12px;
    z-index: 300;
    background: #1a1a2e;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  .aria-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 150;
  }
  .aria-sidebar-wrap {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 200;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
  }
  .aria-sidebar-wrap.open {
    transform: translateX(0);
  }
  .aria-close-btn {
    background: transparent;
    border: none;
    color: #9ca3af;
    font-size: 18px;
    cursor: pointer;
    padding: 0;
    margin-left: auto;
  }
  @media (min-width: 768px) {
    .aria-hamburger { display: none !important; }
    .aria-overlay   { display: none !important; }
    .aria-sidebar-wrap {
      position: relative !important;
      transform: translateX(0) !important;
      height: auto !important;
    }
    .aria-close-btn { display: none !important; }
  }
`;

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user     = JSON.parse(sessionStorage.getItem('aria_user') || '{}');
  const role     = user.role || 'TEACHER';
  const links    = NAV[role] || NAV.TEACHER;
  const [open, setOpen] = useState(false);

  const logout = () => { sessionStorage.clear(); navigate('/login'); };
  const go     = (path) => { navigate(path); setOpen(false); };

  return (
    <>
      <style>{CSS}</style>

      <button className="aria-hamburger" onClick={() => setOpen(true)} aria-label="Open menu">
        ☰ ARIA
      </button>

      {open && <div className="aria-overlay" onClick={() => setOpen(false)} />}

      <div className={`aria-sidebar-wrap${open ? ' open' : ''}`}>
        <div style={s.sidebar}>
          <div style={s.brand}>
            <span style={s.logo}>🧠</span>
            <div style={{ flex:1 }}>
              <div style={s.brandName}>ARIA</div>
              <div style={s.brandSub}>AI Tutor Platform</div>
            </div>
            <button className="aria-close-btn" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div style={s.userBox}>
            <div style={s.avatar}>{(user.fullName || 'U').charAt(0)}</div>
            <div>
              <div style={s.userName}>{user.fullName || 'User'}</div>
              <div style={s.userRole}>{role}</div>
            </div>
          </div>

          <nav style={s.nav}>
            {links.map(l => (
              <div key={l.path}
                onClick={() => go(l.path)}
                style={{ ...s.link, ...(location.pathname === l.path ? s.active : {}) }}>
                <span style={s.icon}>{l.icon}</span>
                <span style={{ flex:1 }}>{l.label}</span>
                {l.badge && (
                  <span style={{ fontSize:9, fontWeight:800, background:'#22c55e', color:'#fff',
                                 padding:'2px 6px', borderRadius:6, letterSpacing:0.5 }}>
                    {l.badge}
                  </span>
                )}
              </div>
            ))}
          </nav>

          <div style={s.bottom}>
            <div onClick={logout} style={s.link}>
              <span style={s.icon}>🚪</span><span>Logout</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const s = {
  sidebar:   { width:220, minHeight:'100vh', background:'#1a1a2e', display:'flex', flexDirection:'column', padding:'0 0 24px', flexShrink:0 },
  brand:     { display:'flex', alignItems:'center', gap:12, padding:'24px 20px 20px', borderBottom:'1px solid #2d2d4e' },
  logo:      { fontSize:28 },
  brandName: { fontWeight:900, color:'#fff', fontSize:18 },
  brandSub:  { fontSize:10, color:'#6b7280', letterSpacing:1 },
  userBox:   { display:'flex', alignItems:'center', gap:10, padding:'16px 20px', borderBottom:'1px solid #2d2d4e' },
  avatar:    { width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#667eea,#764ba2)',
               display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14, flexShrink:0 },
  userName:  { color:'#e5e7eb', fontSize:13, fontWeight:600 },
  userRole:  { color:'#6b7280', fontSize:11 },
  nav:       { flex:1, padding:'12px 0' },
  link:      { display:'flex', alignItems:'center', gap:12, padding:'11px 20px', color:'#9ca3af', cursor:'pointer',
               fontSize:14, transition:'all 0.15s', borderLeft:'3px solid transparent' },
  active:    { color:'#fff', background:'rgba(102,126,234,0.15)', borderLeftColor:'#667eea' },
  icon:      { fontSize:16, width:20, textAlign:'center' },
  bottom:    { padding:'12px 0', borderTop:'1px solid #2d2d4e' },
};
