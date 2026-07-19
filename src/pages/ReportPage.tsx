import { useEffect, useState } from 'react'
import { Printer } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { money, pricePerSqm, propertyMonthlyCost } from '../lib/finance'
import type { HouseholdSettings, Property } from '../types/database'

export function ReportPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [settings, setSettings] = useState<HouseholdSettings | null>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('properties').select('*').order('updated_at', { ascending: false }),
      supabase.from('household_settings').select('*').maybeSingle()
    ]).then(([propertyResult, settingsResult]) => {
      setProperties((propertyResult.data as Property[]) ?? [])
      setSettings((settingsResult.data as HouseholdSettings) ?? null)
    })
  }, [])

  return (
    <div className="print-report">
      <div className="report-toolbar no-print">
        <div><span className="eyebrow">ייצוא לדוח</span><h2>סיכום הבית שלנו</h2></div>
        <button className="primary-button" onClick={() => window.print()}><Printer size={18} /> הדפסה / שמירה כ־PDF</button>
      </div>

      <header className="report-header">
        <h1>הבית שלנו</h1>
        <p>דוח אפשרויות ותקציב · {new Date().toLocaleDateString('he-IL')}</p>
      </header>

      {settings && (
        <section className="report-budget">
          <h2>תקציב משפחתי</h2>
          <div><span>הון עצמי</span><strong>{money(settings.current_equity)} ₪</strong></div>
          <div><span>החזר רצוי</span><strong>{money(settings.desired_payment)} ₪</strong></div>
          <div><span>החזר מקסימלי</span><strong>{money(settings.maximum_payment)} ₪</strong></div>
        </section>
      )}

      <section>
        <h2>נכסים שנבדקים</h2>
        <div className="report-properties">
          {properties.map(property => (
            <article className="report-property" key={property.id}>
              <h3>{property.title}</h3>
              <p>{[property.city, property.neighborhood, property.address].filter(Boolean).join(' · ')}</p>
              <dl>
                <div><dt>מחיר</dt><dd>{money(Number(property.price))} ₪</dd></div>
                <div><dt>מחיר למ״ר משוקלל</dt><dd>{money(pricePerSqm(property))} ₪</dd></div>
                <div><dt>עלות חודשית משוערת</dt><dd>{money(propertyMonthlyCost(property))} ₪</dd></div>
                <div><dt>חדרים</dt><dd>{property.rooms ?? '—'}</dd></div>
                <div><dt>שטח</dt><dd>{property.size_sqm ?? '—'} מ״ר</dd></div>
                <div><dt>מרפסת</dt><dd>{property.balcony_sqm ?? '—'} מ״ר</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
