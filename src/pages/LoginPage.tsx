import { FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  if (user) return <Navigate to="/" replace />

  async function submit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('האימייל או הסיסמה אינם נכונים')
    setLoading(false)
  }

  return <div className="auth-page">
    <section className="auth-card">
      <div className="brand-mark"><KeyRound/></div>
      <span className="eyebrow">מרחב פרטי לשניכם</span>
      <h1>בונים החלטה טובה יותר</h1>
      <p>כל הנכסים, המספרים, התכניות וההחלטות שלכם במקום אחד.</p>
      <form onSubmit={submit} className="form-stack">
        <label>אימייל<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
        <label>סיסמה<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></label>
        {error && <div className="error">{error}</div>}
        <button className="primary-button" disabled={loading}>{loading ? 'נכנס…' : 'כניסה למערכת'}</button>
      </form>
    </section>
  </div>
}
