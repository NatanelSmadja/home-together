import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Plus, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Property } from '../types/database'

const typeLabels: Record<string, string> = {
  buy: 'רכישה',
  rent: 'שכירות',
  lottery: 'מחיר למשתכן',
  paper: 'על הנייר'
}

export function PropertiesPage() {
  const [items, setItems] = useState<Property[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('properties').select('*').order('updated_at', { ascending: false })
      setItems((data as Property[]) ?? [])
      setLoading(false)
    }

    load()
    const channel = supabase.channel('properties-list').on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, load).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return items
    return items.filter(property => [property.title, property.city, property.neighborhood, property.address]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(normalized)))
  }, [items, query])

  return (
    <>
      <div className="section-heading">
        <div><span className="eyebrow">כל האפשרויות</span><h2>הנכסים שלנו</h2></div>
        <Link className="primary-button compact" to="/properties/new"><Plus size={18} /> הוספה</Link>
      </div>

      <label className="search-field">
        <Search size={19} />
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="חיפוש לפי שם, עיר או שכונה" />
      </label>

      {loading ? (
        <div className="empty-state">טוען…</div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">לא נמצאו נכסים מתאימים.</div>
      ) : (
        <div className="property-grid">
          {filteredItems.map(property => (
            <Link className="property-card" key={property.id} to={`/properties/${property.id}`}>
              <div className="property-image">
                {property.main_image_url ? <img src={property.main_image_url} alt={property.title} /> : <Building2 size={38} />}
              </div>
              <div className="property-card-content">
                <div className="property-card-top">
                  <span className="pill">{typeLabels[property.transaction_type] ?? property.transaction_type}</span>
                  <span className="status-dot">{property.status}</span>
                </div>
                <h3>{property.title}</h3>
                <p>{[property.city, property.neighborhood].filter(Boolean).join(' · ')}</p>
                <div className="property-meta">
                  {property.rooms != null && <span>{property.rooms} חדרים</span>}
                  {property.size_sqm != null && <span>{property.size_sqm} מ״ר</span>}
                  {property.floor != null && <span>קומה {property.floor}</span>}
                </div>
                <strong>{Number(property.price).toLocaleString('he-IL')} ₪</strong>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
