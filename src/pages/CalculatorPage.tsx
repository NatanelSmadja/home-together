import { useMemo, useState } from 'react'

export function CalculatorPage() {
  const [price, setPrice] = useState(1_600_000)
  const [equity, setEquity] = useState(400_000)
  const [years, setYears] = useState(30)
  const [rate, setRate] = useState(4.8)

  const result = useMemo(() => {
    const principal = Math.max(0, price - equity)
    const months = Math.max(1, years * 12)
    const monthlyRate = rate / 100 / 12
    const payment = monthlyRate === 0
      ? principal / months
      : principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1)

    return { principal, payment, total: payment * months }
  }, [price, equity, years, rate])

  return (
    <section className="form-card calculator-card">
      <span className="eyebrow">סימולציה בלבד</span>
      <h2>מחשבון משכנתא</h2>

      <div className="form-grid">
        <label>מחיר הנכס<input type="number" value={price} onChange={event => setPrice(Number(event.target.value))} /></label>
        <label>הון עצמי<input type="number" value={equity} onChange={event => setEquity(Number(event.target.value))} /></label>
        <label>שנים<input type="number" value={years} onChange={event => setYears(Number(event.target.value))} /></label>
        <label>ריבית שנתית משוערת<input type="number" step="0.1" value={rate} onChange={event => setRate(Number(event.target.value))} /></label>
      </div>

      <div className="result-panel">
        <span>משכנתא נדרשת</span>
        <strong>{result.principal.toLocaleString('he-IL')} ₪</strong>
        <span>החזר חודשי משוער</span>
        <strong>{Math.round(result.payment).toLocaleString('he-IL')} ₪</strong>
        <span>סך תשלום משוער</span>
        <strong>{Math.round(result.total).toLocaleString('he-IL')} ₪</strong>
        <small>זהו חישוב מתמטי בסיסי ואינו תמהיל או הצעה מהבנק.</small>
      </div>
    </section>
  )
}
