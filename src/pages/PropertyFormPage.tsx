import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { ImagePlus, Loader2, Save, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Property } from '../types/database'

type FormState = {
  title: string
  city: string
  neighborhood: string
  address: string
  transaction_type: string
  price: string
  rooms: string
  size_sqm: string
  balcony_sqm: string
  floor: string
  total_floors: string
  bathrooms: string
  parking_spaces: string
  storage_sqm: string
  property_condition: string
  equity: string
  monthly_rent: string
  monthly_arnona: string
  monthly_building_fee: string
  status: string
  notes: string
}

const emptyForm: FormState = {
  title: '',
  city: '',
  neighborhood: '',
  address: '',
  transaction_type: 'buy',
  price: '',
  rooms: '',
  size_sqm: '',
  balcony_sqm: '',
  floor: '',
  total_floors: '',
  bathrooms: '',
  parking_spaces: '',
  storage_sqm: '',
  property_condition: '',
  equity: '',
  monthly_rent: '',
  monthly_arnona: '',
  monthly_building_fee: '',
  status: 'בודקים',
  notes: ''
}

const numberOrNull = (value: string) => value === '' ? null : Number(value)
const numberOrZero = (value: string) => value === '' ? 0 : Number(value)

export function PropertyFormPage() {
  const { user } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState<FormState>(emptyForm)
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState('')

  const pageTitle = useMemo(() => isEdit ? 'עריכת נכס' : 'הוספת נכס', [isEdit])

  useEffect(() => {
    if (!id) return

    const load = async () => {
      const { data, error: loadError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single()

      if (loadError || !data) {
        setError('לא הצלחנו לטעון את הנכס')
        setLoading(false)
        return
      }

      const p = data as Property
      setForm({
        title: p.title ?? '',
        city: p.city ?? '',
        neighborhood: p.neighborhood ?? '',
        address: p.address ?? '',
        transaction_type: p.transaction_type ?? 'buy',
        price: String(p.price ?? ''),
        rooms: p.rooms == null ? '' : String(p.rooms),
        size_sqm: p.size_sqm == null ? '' : String(p.size_sqm),
        balcony_sqm: p.balcony_sqm == null ? '' : String(p.balcony_sqm),
        floor: p.floor == null ? '' : String(p.floor),
        total_floors: p.total_floors == null ? '' : String(p.total_floors),
        bathrooms: p.bathrooms == null ? '' : String(p.bathrooms),
        parking_spaces: p.parking_spaces == null ? '' : String(p.parking_spaces),
        storage_sqm: p.storage_sqm == null ? '' : String(p.storage_sqm),
        property_condition: p.property_condition ?? '',
        equity: String(p.equity ?? ''),
        monthly_rent: String(p.monthly_rent ?? ''),
        monthly_arnona: String(p.monthly_arnona ?? ''),
        monthly_building_fee: String(p.monthly_building_fee ?? ''),
        status: p.status ?? 'בודקים',
        notes: p.notes ?? ''
      })
      setLoading(false)
    }

    load()
  }, [id])

  useEffect(() => {
    return () => previews.forEach(url => URL.revokeObjectURL(url))
  }, [previews])

  const set = (key: keyof FormState, value: string) => {
    setForm(current => ({ ...current, [key]: value }))
  }

  const selectImages = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []).slice(0, 8)
    previews.forEach(url => URL.revokeObjectURL(url))
    setFiles(selected)
    setPreviews(selected.map(file => URL.createObjectURL(file)))
  }

  const removeSelectedImage = (index: number) => {
    URL.revokeObjectURL(previews[index])
    setFiles(current => current.filter((_, i) => i !== index))
    setPreviews(current => current.filter((_, i) => i !== index))
  }

  async function uploadImages(propertyId: string, householdId: string) {
    if (!user || files.length === 0) return

    const rows = []

    for (const file of files) {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const safeName = `${crypto.randomUUID()}.${extension}`
      const storagePath = `${householdId}/${propertyId}/${safeName}`

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || undefined
        })

      if (uploadError) throw uploadError

      const { data: publicData } = supabase.storage
        .from('property-images')
        .getPublicUrl(storagePath)

      rows.push({
        property_id: propertyId,
        household_id: householdId,
        storage_path: storagePath,
        public_url: publicData.publicUrl,
        created_by: user.id
      })
    }

    const { error: imageRowsError } = await supabase.from('property_images').insert(rows)
    if (imageRowsError) throw imageRowsError

    const { data: currentProperty } = await supabase
      .from('properties')
      .select('main_image_url')
      .eq('id', propertyId)
      .single()

    if (!currentProperty?.main_image_url && rows[0]) {
      await supabase
        .from('properties')
        .update({ main_image_url: rows[0].public_url })
        .eq('id', propertyId)
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!user) return

    setSaving(true)
    setError('')

    try {
      const { data: membership, error: membershipError } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .single()

      if (membershipError || !membership) {
        throw new Error('המשתמש עדיין לא שויך למשפחה')
      }

      const payload = {
        household_id: membership.household_id,
        title: form.title.trim(),
        city: form.city.trim(),
        neighborhood: form.neighborhood.trim() || null,
        address: form.address.trim() || null,
        transaction_type: form.transaction_type,
        price: numberOrZero(form.price),
        rooms: numberOrNull(form.rooms),
        size_sqm: numberOrNull(form.size_sqm),
        balcony_sqm: numberOrNull(form.balcony_sqm),
        floor: numberOrNull(form.floor),
        total_floors: numberOrNull(form.total_floors),
        bathrooms: numberOrNull(form.bathrooms),
        parking_spaces: numberOrNull(form.parking_spaces),
        storage_sqm: numberOrNull(form.storage_sqm),
        property_condition: form.property_condition || null,
        equity: numberOrZero(form.equity),
        monthly_rent: numberOrZero(form.monthly_rent),
        monthly_arnona: numberOrZero(form.monthly_arnona),
        monthly_building_fee: numberOrZero(form.monthly_building_fee),
        status: form.status,
        notes: form.notes.trim() || null
      }

      let propertyId = id

      if (isEdit && id) {
        const { error: updateError } = await supabase
          .from('properties')
          .update(payload)
          .eq('id', id)

        if (updateError) throw updateError
      } else {
        const { data, error: insertError } = await supabase
          .from('properties')
          .insert({ ...payload, created_by: user.id })
          .select('id')
          .single()

        if (insertError || !data) throw insertError ?? new Error('הנכס לא נשמר')
        propertyId = data.id
      }

      if (!propertyId) throw new Error('מזהה הנכס חסר')

      await uploadImages(propertyId, membership.household_id)
      navigate(`/properties/${propertyId}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'אירעה שגיאה בשמירה')
      setSaving(false)
    }
  }

  if (loading) return <div className="empty-state">טוען את הנכס…</div>

  return (
    <section className="form-card property-form-card">
      <div className="form-title">
        <div>
          <span className="eyebrow">{isEdit ? 'עדכון פרטים' : 'אפשרות חדשה'}</span>
          <h2>{pageTitle}</h2>
        </div>
        <span className="form-badge">{isEdit ? 'מצב עריכה' : 'נכס חדש'}</span>
      </div>

      <form onSubmit={submit} className="form-grid">
        <label className="wide">
          שם הנכס
          <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="לדוגמה: פסגת נוף, רמות" required />
        </label>

        <label>
          סוג עסקה
          <select value={form.transaction_type} onChange={e => set('transaction_type', e.target.value)}>
            <option value="buy">רכישה</option>
            <option value="rent">שכירות</option>
            <option value="lottery">מחיר למשתכן</option>
            <option value="paper">דירה על הנייר</option>
          </select>
        </label>

        <label>
          סטטוס
          <select value={form.status} onChange={e => set('status', e.target.value)}>
            <option>בודקים</option>
            <option>מועדף</option>
            <option>ממתינים לתשובה</option>
            <option>ירד מהפרק</option>
            <option>נסגר</option>
          </select>
        </label>

        <label>
          מחיר
          <input type="number" min="0" inputMode="numeric" value={form.price} onChange={e => set('price', e.target.value)} required />
        </label>

        <label>
          עיר
          <input value={form.city} onChange={e => set('city', e.target.value)} required />
        </label>

        <label>
          שכונה
          <input value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)} />
        </label>

        <label className="wide">
          כתובת
          <input value={form.address} onChange={e => set('address', e.target.value)} />
        </label>

        <div className="form-section-title wide">פרטי הנכס</div>

        <label>
          חדרים
          <input type="number" min="0" step="0.5" inputMode="decimal" value={form.rooms} onChange={e => set('rooms', e.target.value)} />
        </label>

        <label>
          שטח בנוי במ״ר
          <input type="number" min="0" inputMode="decimal" value={form.size_sqm} onChange={e => set('size_sqm', e.target.value)} />
        </label>

        <label>
          מרפסת במ״ר
          <input type="number" min="0" inputMode="decimal" value={form.balcony_sqm} onChange={e => set('balcony_sqm', e.target.value)} />
        </label>

        <label>
          קומה
          <input type="number" inputMode="numeric" value={form.floor} onChange={e => set('floor', e.target.value)} />
        </label>

        <label>
          מספר קומות בבניין
          <input type="number" min="0" inputMode="numeric" value={form.total_floors} onChange={e => set('total_floors', e.target.value)} />
        </label>

        <label>
          חדרי רחצה
          <input type="number" min="0" step="0.5" inputMode="decimal" value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)} />
        </label>

        <label>
          חניות
          <input type="number" min="0" inputMode="numeric" value={form.parking_spaces} onChange={e => set('parking_spaces', e.target.value)} />
        </label>

        <label>
          מחסן במ״ר
          <input type="number" min="0" inputMode="decimal" value={form.storage_sqm} onChange={e => set('storage_sqm', e.target.value)} />
        </label>

        <label className="wide">
          מצב הנכס
          <select value={form.property_condition} onChange={e => set('property_condition', e.target.value)}>
            <option value="">לא הוגדר</option>
            <option value="חדש מקבלן">חדש מקבלן</option>
            <option value="חדש">חדש</option>
            <option value="משופץ">משופץ</option>
            <option value="שמור">שמור</option>
            <option value="דורש שיפוץ">דורש שיפוץ</option>
          </select>
        </label>

        <div className="form-section-title wide">כספים</div>

        <label>
          הון עצמי
          <input type="number" min="0" inputMode="numeric" value={form.equity} onChange={e => set('equity', e.target.value)} />
        </label>

        <label>
          שכירות חודשית
          <input type="number" min="0" inputMode="numeric" value={form.monthly_rent} onChange={e => set('monthly_rent', e.target.value)} />
        </label>

        <label>
          ארנונה חודשית
          <input type="number" min="0" inputMode="numeric" value={form.monthly_arnona} onChange={e => set('monthly_arnona', e.target.value)} />
        </label>

        <label>
          ועד בית חודשי
          <input type="number" min="0" inputMode="numeric" value={form.monthly_building_fee} onChange={e => set('monthly_building_fee', e.target.value)} />
        </label>

        <div className="form-section-title wide">תמונות</div>

        <label className="image-upload wide">
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectImages} />
          <ImagePlus size={26} />
          <strong>בחירת תמונות</strong>
          <span>אפשר לבחור עד 8 תמונות בכל שמירה</span>
        </label>

        {previews.length > 0 && (
          <div className="image-preview-grid wide">
            {previews.map((src, index) => (
              <div className="image-preview" key={src}>
                <img src={src} alt={`תצוגה מקדימה ${index + 1}`} />
                <button type="button" onClick={() => removeSelectedImage(index)} aria-label="הסרת תמונה">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <label className="wide">
          הערות
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={6} placeholder="כל דבר שחשוב לזכור על הנכס…" />
        </label>

        {error && <div className="error wide">{error}</div>}

        <button className="primary-button wide save-button" disabled={saving}>
          {saving ? <><Loader2 className="spin" size={20} /> שומר…</> : <><Save size={20} /> {isEdit ? 'שמירת השינויים' : 'שמירת הנכס'}</>}
        </button>
      </form>
    </section>
  )
}
