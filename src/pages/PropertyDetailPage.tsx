import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Building2, Edit3, MapPin, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Property, PropertyImage } from '../types/database'

const typeLabels: Record<string, string> = {
  buy: 'רכישה',
  rent: 'שכירות',
  lottery: 'מחיר למשתכן',
  paper: 'על הנייר'
}

export function PropertyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [property, setProperty] = useState<Property | null>(null)
  const [images, setImages] = useState<PropertyImage[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    if (!id) return

    const [{ data: propertyData, error: propertyError }, { data: imageData }] = await Promise.all([
      supabase.from('properties').select('*').eq('id', id).single(),
      supabase.from('property_images').select('*').eq('property_id', id).order('created_at')
    ])

    if (propertyError || !propertyData) {
      setError('לא הצלחנו לטעון את הנכס')
      setLoading(false)
      return
    }

    setProperty(propertyData as Property)
    setImages((imageData as PropertyImage[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (!id) return

    load()
    const channel = supabase
      .channel(`property-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties', filter: `id=eq.${id}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'property_images', filter: `property_id=eq.${id}` }, load)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  const mortgage = useMemo(
    () => property ? Math.max(0, Number(property.price) - Number(property.equity)) : 0,
    [property]
  )

  const monthlyHousing = useMemo(
    () => property ? Number(property.monthly_rent || 0) + Number(property.monthly_arnona || 0) + Number(property.monthly_building_fee || 0) : 0,
    [property]
  )

  async function deleteProperty() {
    if (!id || !property) return
    const approved = window.confirm(`למחוק את "${property.title}"? לא ניתן לבטל את הפעולה.`)
    if (!approved) return

    setDeleting(true)
    setError('')

    if (images.length > 0) {
      await supabase.storage.from('property-images').remove(images.map(image => image.storage_path))
    }

    const { error: deleteError } = await supabase.from('properties').delete().eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      setDeleting(false)
      return
    }

    navigate('/properties', { replace: true })
  }

  if (loading) return <div className="empty-state">טוען נכס…</div>
  if (!property) return <div className="empty-state">{error || 'הנכס לא נמצא'}</div>

  const heroImage = property.main_image_url || images[0]?.public_url

  return (
    <>
      <div className="detail-toolbar">
        <Link className="back-link" to="/properties"><ArrowRight size={18} /> חזרה לנכסים</Link>
        <div className="detail-actions">
          <Link className="secondary-button compact" to={`/properties/${property.id}/edit`}><Edit3 size={17} /> עריכה</Link>
          <button className="danger-button compact" onClick={deleteProperty} disabled={deleting}><Trash2 size={17} /> {deleting ? 'מוחק…' : 'מחיקה'}</button>
        </div>
      </div>

      <section className={`detail-hero ${heroImage ? 'has-image' : ''}`} style={heroImage ? { backgroundImage: `linear-gradient(180deg, rgba(12,35,29,.16), rgba(12,35,29,.88)), url("${heroImage}")` } : undefined}>
        <div>
          <span className="pill">{typeLabels[property.transaction_type] ?? property.transaction_type}</span>
          <h2>{property.title}</h2>
          <p><MapPin size={17} /> {[property.city, property.neighborhood, property.address].filter(Boolean).join(' · ')}</p>
          <strong>{Number(property.price).toLocaleString('he-IL')} ₪</strong>
        </div>
      </section>

      {error && <div className="error">{error}</div>}

      <div className="quick-facts">
        <article><span>חדרים</span><strong>{property.rooms ?? '—'}</strong></article>
        <article><span>שטח</span><strong>{property.size_sqm ? `${property.size_sqm} מ״ר` : '—'}</strong></article>
        <article><span>מרפסת</span><strong>{property.balcony_sqm ? `${property.balcony_sqm} מ״ר` : '—'}</strong></article>
        <article><span>קומה</span><strong>{property.floor ?? '—'}</strong></article>
      </div>

      {images.length > 0 && (
        <section className="gallery-section">
          <div className="section-heading simple"><div><span className="eyebrow">גלריה</span><h2>תמונות ותכניות</h2></div></div>
          <div className="gallery-grid">
            {images.map(image => <a href={image.public_url} target="_blank" rel="noreferrer" key={image.id}><img src={image.public_url} alt={property.title} /></a>)}
          </div>
        </section>
      )}

      <div className="detail-grid">
        <article className="info-card">
          <div className="card-title"><Building2 size={20} /><h3>נתוני הנכס</h3></div>
          <dl>
            <div><dt>סטטוס</dt><dd>{property.status}</dd></div>
            <div><dt>מצב הנכס</dt><dd>{property.property_condition || '—'}</dd></div>
            <div><dt>קומה</dt><dd>{property.floor == null ? '—' : `${property.floor}${property.total_floors ? ` מתוך ${property.total_floors}` : ''}`}</dd></div>
            <div><dt>חדרי רחצה</dt><dd>{property.bathrooms ?? '—'}</dd></div>
            <div><dt>חניות</dt><dd>{property.parking_spaces ?? '—'}</dd></div>
            <div><dt>מחסן</dt><dd>{property.storage_sqm ? `${property.storage_sqm} מ״ר` : '—'}</dd></div>
          </dl>
        </article>

        <article className="info-card">
          <div className="card-title"><span className="money-icon">₪</span><h3>תמונה כספית</h3></div>
          <dl>
            <div><dt>הון עצמי</dt><dd>{Number(property.equity).toLocaleString('he-IL')} ₪</dd></div>
            <div><dt>מימון נדרש</dt><dd>{mortgage.toLocaleString('he-IL')} ₪</dd></div>
            <div><dt>שכירות</dt><dd>{Number(property.monthly_rent).toLocaleString('he-IL')} ₪</dd></div>
            <div><dt>ארנונה</dt><dd>{Number(property.monthly_arnona).toLocaleString('he-IL')} ₪</dd></div>
            <div><dt>ועד בית</dt><dd>{Number(property.monthly_building_fee).toLocaleString('he-IL')} ₪</dd></div>
            <div><dt>דיור חודשי</dt><dd>{monthlyHousing.toLocaleString('he-IL')} ₪</dd></div>
          </dl>
        </article>
      </div>

      {property.notes && <article className="info-card notes-card"><h3>הערות</h3><p>{property.notes}</p></article>}
    </>
  )
}
