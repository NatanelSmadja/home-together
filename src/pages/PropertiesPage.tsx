import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Property } from '../types/database'

export function PropertiesPage() {
  const [items, setItems] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const load = async () => { const { data } = await supabase.from('properties').select('*').order('updated_at', { ascending:false }); setItems((data as Property[]) ?? []); setLoading(false) }
    load()
    const channel = supabase.channel('properties-list').on('postgres_changes', { event:'*', schema:'public', table:'properties' }, load).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])
  return <>
    <div className="section-heading"><div><span className="eyebrow">כל האפשרויות</span><h2>הנכסים שלנו</h2></div><Link className="primary-button compact" to="/properties/new"><Plus size={18}/> הוספה</Link></div>
    {loading ? <div className="empty-state">טוען…</div> : <div className="property-grid">{items.map(p => <Link className="property-card" key={p.id} to={`/properties/${p.id}`}><div className="property-image">{p.main_image_url ? <img src={p.main_image_url} alt=""/> : <Building2 size={38}/>}</div><div><h3>{p.title}</h3><p>{p.city} {p.neighborhood && `· ${p.neighborhood}`}</p><strong>{Number(p.price).toLocaleString('he-IL')} ₪</strong></div></Link>)}</div>}
  </>
}
