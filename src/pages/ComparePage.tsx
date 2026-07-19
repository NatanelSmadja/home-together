import { useEffect, useMemo, useState } from 'react'
import { Building2, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { money, pricePerSqm, propertyMonthlyCost } from '../lib/finance'
import type { Property } from '../types/database'

type Metric = {
  label: string
  value: (property: Property) => number | string
  lowerIsBetter?: boolean
  format?: (value: number | string) => string
}

const metrics: Metric[] = [
  { label: 'מחיר', value: property => Number(property.price), lowerIsBetter: true, format: value => `${money(Number(value))} ₪` },
  { label: 'מחיר משוקלל למ״ר', value: pricePerSqm, lowerIsBetter: true, format: value => `${money(Number(value))} ₪` },
  { label: 'עלות מגורים חודשית', value: propertyMonthlyCost, lowerIsBetter: true, format: value => `${money(Number(value))} ₪` },
  { label: 'שטח בנוי', value: property => Number(property.size_sqm || 0), format: value => `${value} מ״ר` },
  { label: 'מרפסת', value: property => Number(property.balcony_sqm || 0), format: value => `${value} מ״ר` },
  { label: 'חדרים', value: property => Number(property.rooms || 0) },
  { label: 'חניות', value: property => Number(property.parking_spaces || 0) },
  { label: 'קומה', value: property => Number(property.floor || 0) }
]

export function ComparePage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    supabase.from('properties').select('*').order('updated_at', { ascending: false })
      .then(({ data }) => setProperties((data as Property[]) ?? []))
  }, [])

  const chosen = useMemo(() => properties.filter(property => selected.includes(property.id)), [properties, selected])

  function toggle(id: string) {
    setSelected(current => current.includes(id)
      ? current.filter(item => item !== id)
      : current.length < 4 ? [...current, id] : current)
  }

  function isBest(metric: Metric, property: Property) {
    if (chosen.length < 2) return false
    const values = chosen.map(item => Number(metric.value(item))).filter(Number.isFinite)
    const target = Number(metric.value(property))
    return metric.lowerIsBetter ? target === Math.min(...values) : target === Math.max(...values)
  }

  return (
    <>
      <div className="section-heading">
        <div><span className="eyebrow">בחרו עד ארבע אפשרויות</span><h2>השוואת נכסים</h2></div>
      </div>

      <div className="compare-picker">
        {properties.map(property => (
          <button className={`compare-choice ${selected.includes(property.id) ? 'selected' : ''}`} key={property.id} onClick={() => toggle(property.id)}>
            <span>{selected.includes(property.id) ? <Check size={17} /> : <Building2 size={17} />}</span>
            <div><strong>{property.title}</strong><small>{property.city}</small></div>
          </button>
        ))}
      </div>

      {chosen.length === 0 ? (
        <div className="empty-state">בחרו לפחות נכס אחד כדי להתחיל להשוות.</div>
      ) : (
        <div className="comparison-wrap">
          <table className="comparison-table">
            <thead>
              <tr><th>נתון</th>{chosen.map(property => <th key={property.id}>{property.title}</th>)}</tr>
            </thead>
            <tbody>
              {metrics.map(metric => (
                <tr key={metric.label}>
                  <td>{metric.label}</td>
                  {chosen.map(property => {
                    const value = metric.value(property)
                    return <td className={isBest(metric, property) ? 'best-value' : ''} key={property.id}>
                      {metric.format ? metric.format(value) : value}
                      {isBest(metric, property) && <span className="best-label">הטוב ביותר</span>}
                    </td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
