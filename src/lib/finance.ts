import type { HouseholdSettings, Property } from '../types/database'

export function monthlyMortgage(principal: number, annualRate = 4.8, years = 30) {
  const months = Math.max(1, years * 12)
  const monthlyRate = annualRate / 100 / 12
  if (principal <= 0) return 0
  if (monthlyRate === 0) return principal / months
  return principal * monthlyRate * Math.pow(1 + monthlyRate, months) /
    (Math.pow(1 + monthlyRate, months) - 1)
}

export function pricePerSqm(property: Property) {
  const weightedArea =
    Number(property.size_sqm || 0) +
    Number(property.balcony_sqm || 0) * 0.35 +
    Number(property.storage_sqm || 0) * 0.5

  return weightedArea > 0 ? Number(property.price || 0) / weightedArea : 0
}

export function propertyMonthlyCost(property: Property, rate = 4.8, years = 30) {
  if (property.transaction_type === 'rent') {
    return Number(property.monthly_rent || 0) +
      Number(property.monthly_arnona || 0) +
      Number(property.monthly_building_fee || 0) +
      Number(property.monthly_insurance || 0) +
      Number(property.monthly_maintenance || 0) +
      Number(property.monthly_transport || 0)
  }

  const principal = Math.max(0, Number(property.price || 0) - Number(property.equity || 0))
  return monthlyMortgage(principal, rate, years) +
    Number(property.monthly_arnona || 0) +
    Number(property.monthly_building_fee || 0) +
    Number(property.monthly_insurance || 0) +
    Number(property.monthly_maintenance || 0) +
    Number(property.monthly_transport || 0)
}

export function budgetStatus(property: Property, settings: HouseholdSettings | null) {
  if (!settings) return { label: 'לא הוגדר תקציב', tone: 'neutral' }

  const cost = propertyMonthlyCost(property)
  if (cost <= settings.desired_payment) return { label: 'מתאים לתקציב', tone: 'good' }
  if (cost <= settings.maximum_payment) return { label: 'גבולי', tone: 'warning' }
  return { label: 'חורג מהתקציב', tone: 'danger' }
}

export const money = (value: number) =>
  Math.round(Number.isFinite(value) ? value : 0).toLocaleString('he-IL')
