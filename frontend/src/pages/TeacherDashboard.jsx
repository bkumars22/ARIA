// TeacherDashboard.js — Class-wide analytics for teachers

import { useState, useEffect } from "react";
import { getStudents, generateReport as apiReport, getProgress } from "../services/api";

export default function TeacherDashboard() {
  const [students, setStudents]   = useState([]);
  const [selected, setSelected]   = useState(null);
  const [report, setReport]       = useState(null);
  const [loading, setLoading]     = useState(false);

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    try {
      const res = await getStudents();
      setStudents(res.data.data || []);
    } catch { setStudents([]); }
  };

  const generateReport = async (student) => {
    setSelected(student);
    setLoading(true);
    try {
      const progRes = await getProgress(student.id);
      const progress = progRes.data.data || [];
      const strong = progress.filter(p => p.score >= 70).map(p => `Module ${p.moduleId}`);
      const weak   = progress.filter(p => p.score  < 50).map(p => `Module ${p.moduleId}`);
      const res = await apiReport({
        student_name: student.fullName, grade: student.grade,
        language: student.language, sessions_count: 5,
        avg_score: progress.reduce((s,p)=>s+p.score,0) / (progress.length||1),
        strong_topics: strong.slice(0,3), weak_topics: weak.slice(0,3),
        parent_language: student.language
      });
      setReport(res.data.report);
    } catch { setReport("Report generation failed — please check AI service."); }
    setLoading(false);
  };

  const masteryColor = (score) =>
    score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";

  const masteryLabel = (level) => ({
    MASTERED: "✅ Mastered",
    PRACTISING: "🔄 Practising",
    LEARNING: "📚 Learning",
    NOT_STARTED: "⬜ Not started"
  })[level] || level;

  return (
    <div style={s.page}>
      {/* Sidebar — student list */}
      <div style={s.sidebar}>
        <div style={s.sidebarHeader}>
          <div style={s.logo}>🎓 ARIA</div>
          <div style={s.logoSub}>Teacher Dashboard</div>
        </div>
        <div style={s.sidebarLabel}>MY STUDENTS</div>
        {students.map(st => (
          <div key={st.id}
            style={{ ...s.studentRow, ...(selected?.id === st.id ? s.studentActive : {}) }}
            onClick={() => generateReport(st)}>
            <div style={s.studentAvatar}>
              {st.fullName.charAt(0)}
            </div>
            <div>
              <div style={s.studentName}>{st.fullName}</div>
              <div style={s.studentMeta}>Grade {st.grade} · {st.language?.toUpperCase()}</div>
            </div>
            <div style={{ ...s.scorePill, background: masteryColor(st.avgScore || 50) }}>
              {Math.round(st.avgScore || 50)}%
            </div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={s.main}>
        {!selected ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>👆</div>
            <div style={s.emptyText}>Select a student to see their progress</div>
          </div>
        ) : loading ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>⏳</div>
            <div style={s.emptyText}>Generating AI report for {selected.fullName}...</div>
          </div>
        ) : report ? (
          <div style={s.reportWrap}>
            {/* KPI cards */}
            <h2 style={s.reportTitle}>{selected.fullName} — Progress Report</h2>
            <div style={s.kpiRow}>
              <div style={s.kpi}>
                <div style={s.kpiNum}>{report.totalSessions}</div>
                <div style={s.kpiLabel}>Sessions</div>
              </div>
              <div style={s.kpi}>
                <div style={{ ...s.kpiNum, color: masteryColor(report.avgScore) }}>
                  {Math.round(report.avgScore)}%
                </div>
                <div style={s.kpiLabel}>Avg Score</div>
              </div>
              <div style={s.kpi}>
                <div style={s.kpiNum}>{report.masteredTopics}</div>
                <div style={s.kpiLabel}>Topics Mastered</div>
              </div>
              <div style={s.kpi}>
                <div style={s.kpiNum}>{report.totalMinutes}m</div>
                <div style={s.kpiLabel}>Learning Time</div>
              </div>
            </div>

            {/* Claude AI Report */}
            <div style={s.aiReport}>
              <div style={s.aiReportLabel}>🤖 ARIA Weekly Report</div>
              <div style={s.aiReportText}>{report.aiReport}</div>
            </div>

            {/* Progress by subject */}
            <h3 style={s.sectionTitle}>Progress by Topic</h3>
            <div style={s.progressList}>
              {(report.progress || []).map((p, i) => (
                <div key={i} style={s.progressRow}>
                  <div style={s.progressTopic}>{p.topic}</div>
                  <div style={s.progressBarWrap}>
                    <div style={{
                      ...s.progressBar,
                      width: `${p.score}%`,
                      background: masteryColor(p.score)
                    }} />
                  </div>
                  <div style={{ ...s.progressStatus, color: masteryColor(p.score) }}>
                    {masteryLabel(p.masteryLevel)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const s = {
  page: { display: "flex", height: "100vh", fontFamily: "system-ui, sans-serif", background: "#f8fafc" },
  sidebar: { width: 280, background: "#1e1b4b", display: "flex", flexDirection: "column", overflowY: "auto" },
  sidebarHeader: { padding: "24px 20px 16px", borderBottom: "1px solid rgba(255,255,255,.1)" },
  logo: { fontSize: 22, fontWeight: 800, color: "#fff" },
  logoSub: { fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 2 },
  sidebarLabel: { fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "rgba(255,255,255,.4)", padding: "16px 20px 8px", textTransform: "uppercase" },
  studentRow: { display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", cursor: "pointer", transition: "all .15s" },
  studentActive: { background: "rgba(255,255,255,.1)" },
  studentAvatar: { width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #667eea, #764ba2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16, flexShrink: 0 },
  studentName: { fontSize: 14, fontWeight: 600, color: "#fff" },
  studentMeta: { fontSize: 11, color: "rgba(255,255,255,.5)" },
  scorePill: { marginLeft: "auto", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, color: "#fff" },
  main: { flex: 1, overflowY: "auto", padding: 32 },
  empty: { height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 },
  emptyIcon: { fontSize: 56 },
  emptyText: { fontSize: 16, color: "#94a3b8" },
  reportWrap: { maxWidth: 800 },
  reportTitle: { fontSize: 24, fontWeight: 800, color: "#1e293b", marginBottom: 24 },
  kpiRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 },
  kpi: { background: "#fff", borderRadius: 12, padding: "20px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,.06)" },
  kpiNum: { fontSize: 32, fontWeight: 800, color: "#1e293b" },
  kpiLabel: { fontSize: 12, color: "#64748b", marginTop: 4 },
  aiReport: { background: "linear-gradient(135deg, #ede9fe, #ddd6fe)", borderRadius: 16, padding: 24, marginBottom: 28 },
  aiReportLabel: { fontSize: 11, fontWeight: 700, color: "#6d28d9", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 },
  aiReportText: { fontSize: 15, color: "#3730a3", lineHeight: 1.7 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 16 },
  progressList: { display: "flex", flexDirection: "column", gap: 12 },
  progressRow: { display: "flex", alignItems: "center", gap: 16, background: "#fff", borderRadius: 10, padding: "14px 16px", boxShadow: "0 2px 4px rgba(0,0,0,.04)" },
  progressTopic: { width: 180, fontSize: 13, fontWeight: 600, color: "#1e293b", flexShrink: 0 },
  progressBarWrap: { flex: 1, height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" },
  progressBar: { height: "100%", borderRadius: 4, transition: "width .5s" },
  progressStatus: { width: 120, fontSize: 12, fontWeight: 600, flexShrink: 0, textAlign: "right" }
};
