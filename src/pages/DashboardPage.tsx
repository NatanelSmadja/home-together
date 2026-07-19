import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Building2, WalletCards } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Property } from '../types/database'

export function DashboardPage() {
  const [items, setItems] = useState<Property[]>([])
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('properties').select('*').order('updated_at', { ascending: false }).limit(4)
      setItems((data as Property[]) ?? [])
    }
    load()
    const channel = supabase.channel('dashboard-properties').on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, load).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])
  const total = useMemo(() => items.reduce((sum, p) => sum + Number(p.price || 0), 0), [items])
  return <>
    <section className="hero-card">
      <span className="eyebrow">תמונה משותפת</span>
      <h2>מוצאים בית בלי ללכת לאיבוד במספרים</h2>
      <p>רכזו כל אפשרות, בדקו עלויות והשוו ביניהן יחד.</p>
      <Link className="light-button" to="/properties/new">הוספת נכס חדש <ArrowLeft size={18}/></Link>
    </section>
    <div className="stats-grid">
      <article className="stat-card"><Building2/><span>נכסים בבדיקה</span><strong>{items.length}</strong></article>
      <article className="stat-card"><WalletCards/><span>שווי אפשרויות מוצגות</span><strong>{total.toLocaleString('he-IL')} ₪</strong></article>
    </div>
    <div className="section-heading"><h2>עודכנו לאחרונה</h2><Link to="/properties">לכל הנכסים</Link></div>
    <div className="property-grid">
      {items.length === 0 ? <div className="empty-state">עוד לא הוספתם נכס. זה המקום להתחיל.</div> : items.map(p => <Link className="property-card" key={p.id} to={`/properties/${p.id}`}>
        <div className="property-image">{p.main_image_url ? <img src={p.main_image_url} alt=""/> : <Building2 size={38}/>}</div>
        <div><span className="pill">{labelType(p.transaction_type)}</span><h3>{p.title}</h3><p>{[p.city,p.neighborhood].filter(Boolean).join(' · ')}</p><strong>{Number(p.price).toLocaleString('he-IL')} ₪</strong></div>
      </Link>)}
    </div>
  </>
}
function labelType(type: Property['transaction_type']) { return ({ buy:'רכישה', rent:'שכירות', lottery:'מחיר למשתכן', paper:'על הנייר' })[type] }
