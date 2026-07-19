import { Calculator, GitCompareArrows, Home, LogOut, Plus, Search, Settings } from 'lucide-react'
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
        <div className="topbar-actions">
          <button className="icon-button" aria-label="הגדרות" onClick={() => navigate('/settings')}><Settings size={20} /></button>
          <button className="icon-button" aria-label="התנתקות" onClick={() => signOut()}><LogOut size={20} /></button>
        </div>
      </header>

      <main className="page"><Outlet /></main>

      <nav className="bottom-nav">
        <NavLink to="/" end><Home /><span>בית</span></NavLink>
        <NavLink to="/properties"><Search /><span>נכסים</span></NavLink>
        <button className="add-main" onClick={() => navigate('/properties/new')} aria-label="הוספת נכס"><Plus /></button>
        <NavLink to="/compare"><GitCompareArrows /><span>השוואה</span></NavLink>
        <NavLink to="/calculator"><Calculator /><span>מחשבונים</span></NavLink>
      </nav>
    </div>
  )
}
