import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { HouseholdSettings } from '../types/database'

const empty: HouseholdSettings = {
  household_id: '',
  monthly_income: 0,
  fixed_expenses: 0,
  current_equity: 0,
  protected_reserve: 0,
  desired_payment: 0,
  maximum_payment: 0
}

export function SettingsPage() {
  const { user } = useAuth()
  const [form, setForm] = useState<HouseholdSettings>(empty)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!user) return

    const load = async () => {
      const { data: member } = await supabase.from('household_members').select('household_id').eq('user_id', user.id).single()
      if (!member) return
      const { data } = await supabase.from('household_settings').select('*').eq('household_id', member.household_id).maybeSingle()
      setForm(data ? data as HouseholdSettings : { ...empty, household_id: member.household_id })
    }
    load()
  }, [user])

  const set = (key: keyof HouseholdSettings, value: number) => setForm(current => ({ ...current, [key]: value }))

  async function save() {
    setSaving(true)
    setMessage('')
    const { error } = await supabase.from('household_settings').upsert(form, { onConflict: 'household_id' })
    setMessage(error ? error.message : 'התקציב נשמר')
    setSaving(false)
  }

  return (
    <section className="form-card">
      <span className="eyebrow">משמש את כל החישובים</span>
      <h2>התקציב המשפחתי שלנו</h2>
      <div className="form-grid">
        <MoneyField label="הכנסה נטו משותפת" value={form.monthly_income} onChange={value => set('monthly_income', value)} />
        <MoneyField label="הוצאות קבועות חודשיות" value={form.fixed_expenses} onChange={value => set('fixed_expenses', value)} />
        <MoneyField label="הון עצמי נוכחי" value={form.current_equity} onChange={value => set('current_equity', value)} />
        <MoneyField label="רזרבה שלא נוגעים בה" value={form.protected_reserve} onChange={value => set('protected_reserve', value)} />
        <MoneyField label="החזר חודשי רצוי" value={form.desired_payment} onChange={value => set('desired_payment', value)} />
        <MoneyField label="החזר חודשי מקסימלי" value={form.maximum_payment} onChange={value => set('maximum_payment', value)} />
        {message && <div className="success-message wide">{message}</div>}
        <button className="primary-button wide" onClick={save} disabled={saving}><Save size={19} /> {saving ? 'שומר…' : 'שמירת התקציב'}</button>
      </div>
    </section>
  )
}

function MoneyField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label>{label}<input type="number" min="0" value={value} onChange={event => onChange(Number(event.target.value))} /></label>
}
