import { Calculator, Home, LogOut, Plus, Search } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function AppShell() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">המסע לבית הבא</span>
          <h1>הבית שלנו</h1>
        </div>
        <button className="icon-button" aria-label="התנתקות" onClick={() => signOut()}>
          <LogOut size={20} />
        </button>
      </header>

      <main className="page"><Outlet /></main>

      <nav className="bottom-nav" aria-label="ניווט ראשי">
        <NavLink to="/" end><Home /><span>בית</span></NavLink>
        <NavLink to="/properties"><Search /><span>נכסים</span></NavLink>
        <button className="add-main" onClick={() => navigate('/properties/new')} aria-label="הוספת נכס">
          <Plus />
        </button>
        <NavLink to="/calculator"><Calculator /><span>מחשבון</span></NavLink>
      </nav>
    </div>
  )
}
