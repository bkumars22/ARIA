import { useState } from 'react'

const SUBJECTS = ['Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology',
                  'English', 'History', 'Geography', 'Economics', 'Computer Science']
const GRADES = Array.from({ length: 12 }, (_, i) => i + 1)

function getCurrentStudentId() {
  try {
    const raw = localStorage.getItem('aria_student') || '{}'
    return JSON.parse(raw).student_id || 'anonymous'
  } catch { return 'anonymous' }
}

function getCurrentLanguage() {
  try {
    const raw = localStorage.getItem('aria_student') || '{}'
    return JSON.parse(raw).language || 'English'
  } catch { return 'English' }
}

const API_BASE = import.meta.env.VITE_AI_API || 'http://localhost:8000'

export function HomeworkHelperRAG() {
  const [file, setFile]           = useState(null)
  const [subject, setSubject]     = useState('Mathematics')
  const [grade, setGrade]         = useState(8)
  const [question, setQuestion]   = useState('')
  const [answer, setAnswer]       = useState('')
  const [uploaded, setUploaded]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [chunkCount, setChunkCount] = useState(0)
  const [error, setError]         = useState('')

  const uploadTextbook = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    const form = new FormData()
    form.append('file', file)
    form.append('student_id', getCurrentStudentId())
    form.append('subject', subject)
    form.append('grade', String(grade))
    form.append('language', getCurrentLanguage())
    try {
      const res = await fetch(`${API_BASE}/document/ingest`, { method: 'POST', body: form })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setChunkCount(data.chunks_stored || 0)
      setUploaded(true)
    } catch (e) {
      setError('Upload failed: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const askQuestion = async () => {
    if (!question.trim()) return
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        student_id: getCurrentStudentId(),
        question,
        top_k: '4',
      })
      const res = await fetch(`${API_BASE}/student/memory/retrieve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: getCurrentStudentId(), question, top_k: 4 }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setAnswer(data.context || 'No relevant content found. Try uploading your textbook first.')
    } catch (e) {
      setError('Query failed: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">📚</span>
        <div>
          <h2 className="text-xl font-bold text-white">Homework Helper</h2>
          <p className="text-gray-400 text-sm">Upload your textbook — ARIA teaches from YOUR book</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 rounded p-3 text-red-300 text-sm mb-4">
          {error}
        </div>
      )}

      {!uploaded ? (
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <p className="text-gray-300 text-sm mb-4">
            Upload a PDF page from your textbook. ARIA will answer questions using exactly what's in your book.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wide">PDF File</label>
              <input
                type="file"
                accept=".pdf"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-300 mt-1
                           file:mr-4 file:py-2 file:px-4 file:rounded
                           file:border-0 file:text-sm file:bg-blue-600
                           file:text-white hover:file:bg-blue-700 cursor-pointer"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-gray-400 text-xs uppercase tracking-wide">Subject</label>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full mt-1 bg-gray-700 border border-gray-600 text-white
                             rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                >
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="w-32">
                <label className="text-gray-400 text-xs uppercase tracking-wide">Grade</label>
                <select
                  value={grade}
                  onChange={e => setGrade(Number(e.target.value))}
                  className="w-full mt-1 bg-gray-700 border border-gray-600 text-white
                             rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                >
                  {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>
              </div>
            </div>

            <button
              onClick={uploadTextbook}
              disabled={!file || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                         disabled:cursor-not-allowed text-white px-4 py-2.5
                         rounded-lg text-sm font-medium transition"
            >
              {loading ? 'Processing textbook...' : 'Upload Textbook'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-900 border border-green-700 rounded-lg p-3 flex items-center gap-2">
            <span className="text-green-400 text-lg">✓</span>
            <div>
              <p className="text-green-300 text-sm font-medium">
                {subject} textbook ready — {chunkCount} sections indexed
              </p>
              <button
                onClick={() => { setUploaded(false); setAnswer(''); setFile(null) }}
                className="text-green-500 hover:text-green-400 text-xs underline mt-0.5"
              >
                Upload different book
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && askQuestion()}
              placeholder={`Ask about ${subject}...`}
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg
                         px-4 py-2.5 text-white text-sm focus:border-blue-500 outline-none"
            />
            <button
              onClick={askQuestion}
              disabled={loading || !question.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                         text-white px-5 py-2.5 rounded-lg text-sm font-medium transition"
            >
              {loading ? '...' : 'Ask'}
            </button>
          </div>

          {answer && (
            <div className="bg-gray-800 rounded-xl p-4 text-gray-200 text-sm leading-relaxed
                            border-l-4 border-blue-500 whitespace-pre-wrap">
              {answer}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default HomeworkHelperRAG
