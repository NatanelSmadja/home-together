import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function PropertyFormPage() {
  const { user } = useAuth(); const navigate = useNavigate(); const [saving,setSaving]=useState(false); const [error,setError]=useState('')
  const [form,setForm]=useState({ title:'', city:'', neighborhood:'', address:'', transaction_type:'buy', price:'', rooms:'', size_sqm:'', equity:'', monthly_rent:'', notes:'' })
  const set = (key:string,value:string) => setForm(v=>({...v,[key]:value}))
  async function submit(e:FormEvent){e.preventDefault(); if(!user)return; setSaving(true); setError('')
    const { data: membership } = await supabase.from('household_members').select('household_id').eq('user_id',user.id).single()
    if(!membership){setError('המשתמש עדיין לא שויך למשפחה. הרץ את שלב יצירת המשתמשים ב-SQL.');setSaving(false);return}
    const { data,error }=await supabase.from('properties').insert({ household_id:membership.household_id, created_by:user.id, title:form.title, city:form.city, neighborhood:form.neighborhood||null, address:form.address||null, transaction_type:form.transaction_type, price:Number(form.price||0), rooms:form.rooms?Number(form.rooms):null, size_sqm:form.size_sqm?Number(form.size_sqm):null, equity:Number(form.equity||0), monthly_rent:Number(form.monthly_rent||0), notes:form.notes||null }).select().single()
    if(error){setError(error.message);setSaving(false);return} navigate(`/properties/${data.id}`)
  }
  return <section className="form-card"><span className="eyebrow">אפשרות חדשה</span><h2>הוספת נכס</h2><form onSubmit={submit} className="form-grid">
    <label className="wide">שם הנכס<input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="לדוגמה: 4 חדרים בשכונת הפארק" required/></label>
    <label>סוג עסקה<select value={form.transaction_type} onChange={e=>set('transaction_type',e.target.value)}><option value="buy">רכישה</option><option value="rent">שכירות</option><option value="lottery">מחיר למשתכן</option><option value="paper">דירה על הנייר</option></select></label>
    <label>מחיר<input type="number" value={form.price} onChange={e=>set('price',e.target.value)} required/></label>
    <label>עיר<input value={form.city} onChange={e=>set('city',e.target.value)} required/></label><label>שכונה<input value={form.neighborhood} onChange={e=>set('neighborhood',e.target.value)}/></label>
    <label className="wide">כתובת<input value={form.address} onChange={e=>set('address',e.target.value)}/></label>
    <label>חדרים<input type="number" step="0.5" value={form.rooms} onChange={e=>set('rooms',e.target.value)}/></label><label>שטח במ״ר<input type="number" value={form.size_sqm} onChange={e=>set('size_sqm',e.target.value)}/></label>
    <label>הון עצמי<input type="number" value={form.equity} onChange={e=>set('equity',e.target.value)}/></label><label>שכירות חודשית<input type="number" value={form.monthly_rent} onChange={e=>set('monthly_rent',e.target.value)}/></label>
    <label className="wide">הערות<textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={5}/></label>
    {error&&<div className="error wide">{error}</div>}<button className="primary-button wide" disabled={saving}>{saving?'שומר…':'שמירת הנכס'}</button>
  </form></section>
}
