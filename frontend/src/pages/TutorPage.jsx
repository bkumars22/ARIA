import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { startSession, chat, endSession } from '../services/api';

const SUBJECTS = [
  { id:'Mathematics', emoji:'🔢' }, { id:'Science',    emoji:'🔬' },
  { id:'English',     emoji:'📖' }, { id:'Coding',     emoji:'💻' },
  { id:'Life Skills', emoji:'🌱' },
];

const VOICE_LANG = {
  hi:'hi-IN', ta:'ta-IN', te:'te-IN', kn:'kn-IN', ml:'ml-IN',
  mr:'mr-IN', gu:'gu-IN', pa:'pa-IN', bn:'bn-IN', ur:'ur-PK',
  es:'es-ES', fr:'fr-FR', ar:'ar-SA', pt:'pt-BR', ru:'ru-RU',
  zh:'zh-CN', de:'de-DE', ja:'ja-JP', ko:'ko-KR', id:'id-ID',
  ms:'ms-MY', tr:'tr-TR', sw:'sw-KE', vi:'vi-VN', th:'th-TH',
  it:'it-IT', nl:'nl-NL',
};

const GREET = {
  en: (n,s) => `Hi ${n}! 👋 I'm ARIA, your learning buddy! Let's explore ${s} together. What do you already know about it?`,
  hi: (n,s) => `नमस्ते ${n}! 👋 मैं ARIA हूँ! आज हम ${s} सीखेंगे। आप इसके बारे में क्या जानते हैं?`,
  ta: (n,s) => `வணக்கம் ${n}! 👋 நான் ARIA! ${s} பற்றி என்ன தெரியும்?`,
  kn: (n,s) => `ನಮಸ್ಕಾರ ${n}! 👋 ನಾನು ARIA! ${s} ಬಗ್ಗೆ ಏನು ಗೊತ್ತು?`,
  te: (n,s) => `నమస్కారం ${n}! 👋 నేను ARIA! ${s} గురించి మీకు ఏమి తెలుసు?`,
  ml: (n,s) => `നമസ്കാരം ${n}! 👋 ഞാൻ ARIA! ${s} നെ കുറിച്ച് നിങ്ങൾക്ക് എന്ത് അറിയാം?`,
  mr: (n,s) => `नमस्कार ${n}! 👋 मी ARIA आहे! ${s} बद्दल तुम्हाला काय माहित आहे?`,
  gu: (n,s) => `નમસ્તે ${n}! 👋 હું ARIA છું! ${s} વિશે તમને શું ખબર છે?`,
  bn: (n,s) => `নমস্কার ${n}! 👋 আমি ARIA! ${s} সম্পর্কে তুমি কি জানো?`,
  es: (n,s) => `¡Hola ${n}! 👋 Soy ARIA. ¿Qué sabes ya sobre ${s}?`,
  fr: (n,s) => `Bonjour ${n}! 👋 Je suis ARIA! Que sais-tu sur ${s}?`,
  ar: (n,s) => `مرحباً ${n}! 👋 أنا ARIA! ماذا تعرف عن ${s}؟`,
  pt: (n,s) => `Olá ${n}! 👋 Eu sou ARIA! O que você já sabe sobre ${s}?`,
  de: (n,s) => `Hallo ${n}! 👋 Ich bin ARIA! Was weißt du schon über ${s}?`,
  zh: (n,s) => `你好 ${n}! 👋 我是ARIA！你对${s}了解多少？`,
  ja: (n,s) => `こんにちは ${n}! 👋 ARIAです！${s}について何を知っていますか？`,
  ko: (n,s) => `안녕하세요 ${n}! 👋 저는 ARIA예요! ${s}에 대해 무엇을 알고 있나요?`,
  sw: (n,s) => `Habari ${n}! 👋 Mimi ni ARIA! Unajua nini kuhusu ${s}?`,
};

export default function TutorPage() {
  const [student,    setStudent]    = useState(null);
  const [sessionId,  setSessionId]  = useState(null);
  const [subject,    setSubject]    = useState('');
  const [messages,   setMessages]   = useState([]);
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [listening,  setListening]  = useState(false);
  const [score,      setScore]      = useState(50);
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [history,    setHistory]    = useState([]);
  const [showSubj,   setShowSubj]   = useState(true);
  const [ended,      setEnded]      = useState(false);
  const bottomRef  = useRef(null);
  const recognRef  = useRef(null);
  const navigate   = useNavigate();

  useEffect(() => {
    const s = sessionStorage.getItem('aria_student');
    if (!s) { navigate('/students'); return; }
    setStudent(JSON.parse(s));
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const begin = async (subj) => {
    setSubject(subj); setShowSubj(false);
    try {
      const r   = await startSession(student.id, subj);
      const sid = r.data.data.id;
      setSessionId(sid);
      const greeting = (GREET[student.language] || GREET.en)(student.fullName, subj);
      setMessages([{ role:'aria', content:greeting }]);
      speak(greeting, student.language);
    } catch {
      setMessages([{ role:'aria', content:`Hi ${student.fullName}! 👋 Ready to learn ${subj}? Tell me what you already know!` }]);
    }
  };

  const send = async (text = input) => {
    if (!text.trim() || loading || ended) return;
    setMessages(prev => [...prev, { role:'student', content:text }]);
    setInput(''); setLoading(true);
    try {
      const r    = await chat(sessionId, {
        student_id: String(student.id), student_name: student.fullName,
        grade: student.grade, language: student.language || 'en',
        student_input: text, subject, conversation_history: history,
        understanding_score: score, difficulty
      });
      const data = r.data?.data;
      if (data) {
        setScore(data.understanding_score || score);
        setHistory(data.conversation_history || history);
        setDifficulty(data.difficulty || difficulty);
        setMessages(prev => [...prev, { role:'aria', content:data.response }]);
        speak(data.response, student.language || 'en');
        if (data.should_advance) setTimeout(() =>
          setMessages(prev => [...prev, { role:'system', content:'🎉 Excellent! Moving to the next topic!' }]), 400);
      }
    } catch {
      setMessages(prev => [...prev, { role:'aria', content:"Sorry, let me think again! 🤔 Can you rephrase?" }]);
    }
    setLoading(false);
  };

  const finish = async () => {
    setEnded(true);
    try { await endSession(sessionId); } catch {}
    setMessages(prev => [...prev, { role:'system', content:`✅ Great session! Score: ${Math.round(score)}/100. Well done ${student?.fullName}! 🌟` }]);
    speak(`Great job ${student?.fullName}! Session complete. You scored ${Math.round(score)} out of 100!`, student?.language);
  };

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Voice input not supported. Try Chrome.'); return; }
    const rec = new SR();
    rec.lang           = VOICE_LANG[student?.language] || 'en-US';
    rec.continuous     = false;
    rec.interimResults = false;
    rec.onresult = e => { setInput(e.results[0][0].transcript); setListening(false); };
    rec.onerror  = ()  => setListening(false);
    rec.onend    = ()  => setListening(false);
    recognRef.current  = rec;
    rec.start(); setListening(true);
  };
  const stopListening = () => { recognRef.current?.stop(); setListening(false); };

  const speak = (text, lang = 'en') => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/\*\*/g,'').replace(/```[\s\S]*?```/g,'').replace(/[🌟💪📚✅🎉🤔🧠🎯🔢🔬📖💻🌱➕✖️÷]/g,'').replace(/---/g,'');
    const u = new SpeechSynthesisUtterance(clean);
    u.lang  = VOICE_LANG[lang] || 'en-US';
    u.rate  = 0.88; u.pitch = 1.1;
    window.speechSynthesis.speak(u);
  };

  const scoreColor = n => n >= 75 ? '#22c55e' : n >= 50 ? '#f59e0b' : '#ef4444';

  // Render markdown-lite: bold, code blocks, bullet lines, dividers
  const formatMsg = (text) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('```')) return null;
      if (line === '---') return <hr key={i} style={{ border:'none', borderTop:'1px solid #e5e7eb', margin:'8px 0' }} />;

      // bold **text**
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const rendered = parts.map((p, j) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={j}>{p.slice(2,-2)}</strong>
          : p
      );

      if (line.startsWith('• ') || line.startsWith('✏️') || line.startsWith('📖') ||
          line.startsWith('✅') || line.startsWith('❓') || line.startsWith('🔍') ||
          line.match(/^\d+\./)) {
        return <div key={i} style={{ marginLeft: line.startsWith('  ') ? 16 : 0,
                                      margin:'2px 0', lineHeight:1.7 }}>{rendered}</div>;
      }
      if (line.trim() === '') return <div key={i} style={{ height:6 }} />;
      return <div key={i} style={{ lineHeight:1.7 }}>{rendered}</div>;
    }).filter(Boolean);
  };

  if (!student) return null;

  if (showSubj) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#667eea,#764ba2)',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#fff', borderRadius:24, padding:40, width:500, maxWidth:'95vw',
                    boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <button onClick={() => navigate('/students')}
          style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:14, marginBottom:20, padding:0 }}>
          ← Back to Students
        </button>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>👋</div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:'#1a1a2e' }}>Hi {student.fullName}!</h2>
          <p style={{ color:'#6b7280', margin:'8px 0 0', fontSize:14 }}>What would you like to learn today?</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {SUBJECTS.map(s => (
            <button key={s.id} onClick={() => begin(s.id)}
              style={{ padding:'20px 16px', background:'#f8fafc', border:'2px solid #e5e7eb', borderRadius:14,
                       cursor:'pointer', fontSize:14, fontWeight:700, color:'#1a1a2e', transition:'all 0.15s' }}
              onMouseEnter={e => Object.assign(e.currentTarget.style, { background:'#667eea', color:'#fff', borderColor:'#667eea' })}
              onMouseLeave={e => Object.assign(e.currentTarget.style, { background:'#f8fafc', color:'#1a1a2e', borderColor:'#e5e7eb' })}>
              <div style={{ fontSize:32, marginBottom:6 }}>{s.emoji}</div>
              {s.id}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#f8fafc' }}>
      <div style={{ background:'linear-gradient(135deg,#667eea,#764ba2)', padding:'14px 24px',
                    display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <button onClick={() => navigate('/students')}
            style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:8, padding:'6px 12px', color:'#fff', cursor:'pointer', fontSize:13 }}>
            ← Exit
          </button>
          <div>
            <div style={{ fontWeight:800, color:'#fff', fontSize:16 }}>{student.fullName} · {subject}</div>
            <div style={{ color:'rgba(255,255,255,0.75)', fontSize:12 }}>Grade {student.grade} · {student.language?.toUpperCase()}</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ color:'rgba(255,255,255,0.7)', fontSize:11 }}>Understanding</div>
            <div style={{ fontWeight:800, color:'#fff', fontSize:18 }}>{Math.round(score)}/100</div>
          </div>
          {!ended && (
            <button onClick={finish}
              style={{ background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.4)',
                       borderRadius:8, padding:'8px 16px', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>
              End Session
            </button>
          )}
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display:'flex', justifyContent: m.role==='student' ? 'flex-end' : 'flex-start' }}>
            {m.role === 'system' ? (
              <div style={{ background:'#f0fdf4', color:'#16a34a', padding:'10px 16px', borderRadius:10,
                            fontSize:13, fontWeight:600, margin:'0 auto', maxWidth:'80%' }}>{m.content}</div>
            ) : (
              <div style={{ maxWidth:'70%', display:'flex', gap:10, alignItems:'flex-start',
                            flexDirection: m.role==='student' ? 'row-reverse' : 'row' }}>
                {m.role === 'aria' && (
                  <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#667eea,#764ba2)',
                                display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:18, flexShrink:0 }}>🧠</div>
                )}
                <div style={{ padding:'14px 18px', borderRadius:16, fontSize:14, lineHeight:1.65,
                              background: m.role==='student' ? '#667eea' : '#fff',
                              color:      m.role==='student' ? '#fff' : '#1a1a2e',
                              boxShadow:'0 1px 6px rgba(0,0,0,0.08)',
                              borderTopRightRadius: m.role==='student' ? 4 : 16,
                              borderTopLeftRadius:  m.role==='aria'    ? 4 : 16,
                              maxWidth: '100%' }}>
                  {m.role === 'aria' ? formatMsg(m.content) : m.content}
                </div>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#667eea,#764ba2)',
                          display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:18 }}>🧠</div>
            <div style={{ background:'#fff', padding:'12px 18px', borderRadius:'4px 16px 16px 16px',
                          boxShadow:'0 1px 4px rgba(0,0,0,0.08)', display:'flex', gap:4 }}>
              {[0,1,2].map(n => (
                <span key={n} style={{ width:8, height:8, borderRadius:'50%', background:'#667eea', display:'inline-block',
                                       animation:`bounce 1.2s ${n*0.2}s infinite ease-in-out` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {!ended ? (
        <div style={{ padding:'16px 24px', background:'#fff', borderTop:'1px solid #f1f5f9',
                      display:'flex', gap:10, alignItems:'center', flexShrink:0 }}>
          <button onClick={listening ? stopListening : startListening}
            style={{ width:44, height:44, borderRadius:12, border:'none', cursor:'pointer', flexShrink:0, fontSize:20,
                     background: listening ? '#ef4444' : '#f1f5f9',
                     color:      listening ? '#fff' : '#667eea' }}
            title={listening ? 'Stop listening' : 'Speak your answer'}>
            {listening ? '⏹' : '🎤'}
          </button>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key==='Enter' && !e.shiftKey && send()}
            placeholder={listening ? '🎤 Listening…' : 'Type your answer or press 🎤 to speak…'}
            disabled={listening || loading}
            style={{ flex:1, padding:'12px 16px', border:'1.5px solid #e5e7eb', borderRadius:12,
                     fontSize:14, outline:'none', background: listening ? '#fff7ed' : '#fff' }} />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            style={{ width:44, height:44, borderRadius:12, background:'#667eea', color:'#fff', border:'none',
                     cursor:'pointer', fontSize:20, flexShrink:0, opacity: input.trim() ? 1 : 0.4 }}>
            ➤
          </button>
        </div>
      ) : (
        <div style={{ padding:20, background:'#f0fdf4', borderTop:'2px solid #22c55e', textAlign:'center' }}>
          <span style={{ fontWeight:700, color:'#16a34a', fontSize:15 }}>Session complete! </span>
          <button onClick={() => navigate('/students')}
            style={{ marginLeft:16, padding:'8px 20px', background:'#667eea', color:'#fff',
                     border:'none', borderRadius:8, cursor:'pointer', fontWeight:600 }}>
            Back to Students
          </button>
        </div>
      )}
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-8px)}}`}</style>
    </div>
  );
}
