import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Building2, Download, WalletCards } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { money, propertyMonthlyCost } from '../lib/finance'
import { UpdateAppButton } from '../components/UpdateAppButton'
import type { HouseholdSettings, Property } from '../types/database'

export function DashboardPage() {
  const [items, setItems] = useState<Property[]>([])
  const [settings, setSettings] = useState<HouseholdSettings | null>(null)

  useEffect(() => {
    const load = async () => {
      const [{ data: properties }, { data: householdSettings }] = await Promise.all([
        supabase.from('properties').select('*').order('updated_at', { ascending: false }).limit(4),
        supabase.from('household_settings').select('*').maybeSingle()
      ])
      setItems((properties as Property[]) ?? [])
      setSettings((householdSettings as HouseholdSettings) ?? null)
    }

    load()
    const channel = supabase.channel('dashboard-v3')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'household_settings' }, load)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const total = useMemo(() => items.reduce((sum, property) => sum + Number(property.price || 0), 0), [items])
  const lowestMonthly = useMemo(() => items.length ? Math.min(...items.map(property => propertyMonthlyCost(property))) : 0, [items])

  return (
    <>
      <section className="hero-card">
        <span className="eyebrow">תמונה משותפת</span>
        <h2>מוצאים בית בלי ללכת לאיבוד במספרים</h2>
        <p>רכזו אפשרויות, בדקו את העלות האמיתית וקבלו החלטה יחד.</p>
        <div className="hero-actions">
          <Link className="light-button" to="/properties/new">הוספת נכס <ArrowLeft size={18} /></Link>
          <Link className="ghost-light-button" to="/report"><Download size={18} /> ייצוא דוח</Link>
        </div>
      </section>

      <div className="dashboard-tools">
        <UpdateAppButton />
        <Link className="secondary-button compact" to="/settings">הגדרת תקציב משפחתי</Link>
      </div>

      <div className="stats-grid dashboard-stats">
        <article className="stat-card"><Building2 /><span>נכסים אחרונים</span><strong>{items.length}</strong></article>
        <article className="stat-card"><WalletCards /><span>שווי האפשרויות</span><strong>{money(total)} ₪</strong></article>
        <article className="stat-card"><span>העלות החודשית הנמוכה</span><strong>{money(lowestMonthly)} ₪</strong></article>
        <article className="stat-card"><span>החזר רצוי</span><strong>{settings ? `${money(settings.desired_payment)} ₪` : 'לא הוגדר'}</strong></article>
      </div>

      <div className="section-heading"><h2>עודכנו לאחרונה</h2><Link to="/properties">לכל הנכסים</Link></div>
      <div className="property-grid">
        {items.length === 0 ? <div className="empty-state">עוד לא הוספתם נכס.</div> : items.map(property => (
          <Link className="property-card" key={property.id} to={`/properties/${property.id}`}>
            <div className="property-image">{property.main_image_url ? <img src={property.main_image_url} alt={property.title} /> : <Building2 size={38} />}</div>
            <div className="property-card-content">
              <span className="pill">{property.transaction_type}</span>
              <h3>{property.title}</h3>
              <p>{[property.city, property.neighborhood].filter(Boolean).join(' · ')}</p>
              <strong>{money(Number(property.price))} ₪</strong>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
