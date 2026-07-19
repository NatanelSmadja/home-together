import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Building2, WalletCards } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Property } from '../types/database'

const typeLabels: Record<string, string> = {
  buy: 'רכישה',
  rent: 'שכירות',
  lottery: 'מחיר למשתכן',
  paper: 'על הנייר'
}

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

  const total = useMemo(() => items.reduce((sum, property) => sum + Number(property.price || 0), 0), [items])

  return (
    <>
      <section className="hero-card">
        <span className="eyebrow">תמונה משותפת</span>
        <h2>מוצאים בית בלי ללכת לאיבוד במספרים</h2>
        <p>רכזו כל אפשרות, בדקו עלויות והשוו ביניהן יחד.</p>
        <Link className="light-button" to="/properties/new">הוספת נכס חדש <ArrowLeft size={18} /></Link>
      </section>

      <div className="stats-grid">
        <article className="stat-card"><Building2 /><span>נכסים בבדיקה</span><strong>{items.length}</strong></article>
        <article className="stat-card"><WalletCards /><span>שווי אפשרויות מוצגות</span><strong>{total.toLocaleString('he-IL')} ₪</strong></article>
      </div>

      <div className="section-heading"><h2>עודכנו לאחרונה</h2><Link to="/properties">לכל הנכסים</Link></div>

      <div className="property-grid">
        {items.length === 0 ? (
          <div className="empty-state">עוד לא הוספתם נכס. זה המקום להתחיל.</div>
        ) : items.map(property => (
          <Link className="property-card" key={property.id} to={`/properties/${property.id}`}>
            <div className="property-image">
              {property.main_image_url ? <img src={property.main_image_url} alt={property.title} /> : <Building2 size={38} />}
            </div>
            <div className="property-card-content">
              <span className="pill">{typeLabels[property.transaction_type] ?? property.transaction_type}</span>
              <h3>{property.title}</h3>
              <p>{[property.city, property.neighborhood].filter(Boolean).join(' · ')}</p>
              <div className="property-meta">
                {property.rooms != null && <span>{property.rooms} חדרים</span>}
                {property.size_sqm != null && <span>{property.size_sqm} מ״ר</span>}
              </div>
              <strong>{Number(property.price).toLocaleString('he-IL')} ₪</strong>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
