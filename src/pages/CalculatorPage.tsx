import { useMemo, useState } from 'react'
import { Banknote, Building2, Calculator, CalendarDays, Scale, WalletCards } from 'lucide-react'

type CalculatorType = 'mortgage' | 'affordability' | 'rent-vs-buy' | 'purchase-costs' | 'paper'

const money = (value: number) => Math.round(Number.isFinite(value) ? value : 0).toLocaleString('he-IL')
const percent = (value: number) => `${(Number.isFinite(value) ? value : 0).toFixed(1)}%`

function monthlyMortgage(principal: number, annualRate: number, years: number) {
  const months = Math.max(1, years * 12)
  const monthlyRate = annualRate / 100 / 12

  if (principal <= 0) return 0
  if (monthlyRate === 0) return principal / months

  return principal * monthlyRate * Math.pow(1 + monthlyRate, months) /
    (Math.pow(1 + monthlyRate, months) - 1)
}

export function CalculatorPage() {
  const [active, setActive] = useState<CalculatorType>('mortgage')

  return (
    <>
      <section className="calculators-hero">
        <span className="eyebrow">כל המספרים במקום אחד</span>
        <h2>מחשבוני הבית שלנו</h2>
        <p>הערכות מהירות שיעזרו לכם להבין מה אפשרי, להשוות חלופות ולתכנן קדימה.</p>
      </section>

      <div className="calculator-tabs">
        <CalculatorTab active={active === 'mortgage'} onClick={() => setActive('mortgage')} icon={<Calculator />} label="משכנתא" />
        <CalculatorTab active={active === 'affordability'} onClick={() => setActive('affordability')} icon={<WalletCards />} label="כמה אפשר לקנות" />
        <CalculatorTab active={active === 'rent-vs-buy'} onClick={() => setActive('rent-vs-buy')} icon={<Scale />} label="שכירות מול קנייה" />
        <CalculatorTab active={active === 'purchase-costs'} onClick={() => setActive('purchase-costs')} icon={<Banknote />} label="הוצאות רכישה" />
        <CalculatorTab active={active === 'paper'} onClick={() => setActive('paper')} icon={<CalendarDays />} label="דירה על הנייר" />
      </div>

      {active === 'mortgage' && <MortgageCalculator />}
      {active === 'affordability' && <AffordabilityCalculator />}
      {active === 'rent-vs-buy' && <RentVsBuyCalculator />}
      {active === 'purchase-costs' && <PurchaseCostsCalculator />}
      {active === 'paper' && <PaperApartmentCalculator />}

      <p className="calculator-disclaimer">
        החישובים הם להמחשה בלבד. ריביות, מיסוי, הצמדות ותנאי מימון בפועל נקבעים מול בעלי המקצוע והגופים הרלוונטיים.
      </p>
    </>
  )
}

function CalculatorTab({ active, onClick, icon, label }: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button className={`calculator-tab ${active ? 'active' : ''}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  )
}

function MortgageCalculator() {
  const [price, setPrice] = useState(1_800_000)
  const [equity, setEquity] = useState(450_000)
  const [years, setYears] = useState(30)
  const [rate, setRate] = useState(4.8)
  const [income, setIncome] = useState(22_000)
  const [commitments, setCommitments] = useState(1_500)

  const result = useMemo(() => {
    const principal = Math.max(0, price - equity)
    const payment = monthlyMortgage(principal, rate, years)
    const total = payment * years * 12
    const availableIncome = Math.max(1, income - commitments)
    const paymentRatio = payment / availableIncome * 100
    const financingRatio = price > 0 ? principal / price * 100 : 0

    return {
      principal,
      payment,
      total,
      interest: Math.max(0, total - principal),
      paymentRatio,
      financingRatio,
      monthlyLeft: income - commitments - payment
    }
  }, [price, equity, years, rate, income, commitments])

  return (
    <CalculatorCard title="מחשבון משכנתא" subtitle="החזר חודשי, מימון וריבית כוללת" icon={<Building2 />}>
      <div className="form-grid">
        <MoneyInput label="מחיר הנכס" value={price} setValue={setPrice} />
        <MoneyInput label="הון עצמי" value={equity} setValue={setEquity} />
        <NumberInput label="תקופה בשנים" value={years} setValue={setYears} min={1} max={40} />
        <NumberInput label="ריבית שנתית משוערת" value={rate} setValue={setRate} step={0.1} />
        <MoneyInput label="הכנסה נטו משותפת" value={income} setValue={setIncome} />
        <MoneyInput label="התחייבויות חודשיות" value={commitments} setValue={setCommitments} />
      </div>

      <Results>
        <Result label="משכנתא נדרשת" value={`${money(result.principal)} ₪`} />
        <Result label="החזר חודשי משוער" value={`${money(result.payment)} ₪`} highlight />
        <Result label="יחס החזר מההכנסה הפנויה" value={percent(result.paymentRatio)} tone={result.paymentRatio > 40 ? 'danger' : result.paymentRatio > 30 ? 'warning' : 'good'} />
        <Result label="אחוז מימון" value={percent(result.financingRatio)} />
        <Result label="סך ריבית משוערת" value={`${money(result.interest)} ₪`} />
        <Result label="יישאר אחרי התחייבויות ומשכנתא" value={`${money(result.monthlyLeft)} ₪`} tone={result.monthlyLeft < 0 ? 'danger' : 'good'} />
      </Results>
    </CalculatorCard>
  )
}

function AffordabilityCalculator() {
  const [income, setIncome] = useState(22_000)
  const [commitments, setCommitments] = useState(1_500)
  const [maxRatio, setMaxRatio] = useState(30)
  const [equity, setEquity] = useState(450_000)
  const [years, setYears] = useState(30)
  const [rate, setRate] = useState(4.8)
  const [extraCosts, setExtraCosts] = useState(80_000)

  const result = useMemo(() => {
    const availableIncome = Math.max(0, income - commitments)
    const maxPayment = availableIncome * maxRatio / 100
    const months = Math.max(1, years * 12)
    const monthlyRate = rate / 100 / 12

    const maxLoan = monthlyRate === 0
      ? maxPayment * months
      : maxPayment * (Math.pow(1 + monthlyRate, months) - 1) /
        (monthlyRate * Math.pow(1 + monthlyRate, months))

    const usableEquity = Math.max(0, equity - extraCosts)
    const estimatedPrice = maxLoan + usableEquity

    return { maxPayment, maxLoan, usableEquity, estimatedPrice }
  }, [income, commitments, maxRatio, equity, years, rate, extraCosts])

  return (
    <CalculatorCard title="כמה דירה אפשר לקנות?" subtitle="הערכה לפי הכנסה, הון עצמי ויחס החזר" icon={<WalletCards />}>
      <div className="form-grid">
        <MoneyInput label="הכנסה נטו משותפת" value={income} setValue={setIncome} />
        <MoneyInput label="התחייבויות חודשיות" value={commitments} setValue={setCommitments} />
        <NumberInput label="יחס החזר רצוי באחוזים" value={maxRatio} setValue={setMaxRatio} step={1} />
        <MoneyInput label="הון עצמי זמין" value={equity} setValue={setEquity} />
        <MoneyInput label="הוצאות רכישה ששומרים בצד" value={extraCosts} setValue={setExtraCosts} />
        <NumberInput label="תקופת משכנתא בשנים" value={years} setValue={setYears} />
        <NumberInput label="ריבית משוערת" value={rate} setValue={setRate} step={0.1} />
      </div>

      <Results>
        <Result label="החזר חודשי מקסימלי שבחרתם" value={`${money(result.maxPayment)} ₪`} />
        <Result label="משכנתא משוערת אפשרית" value={`${money(result.maxLoan)} ₪`} />
        <Result label="הון עצמי שנשאר לנכס" value={`${money(result.usableEquity)} ₪`} />
        <Result label="מחיר נכס משוער" value={`${money(result.estimatedPrice)} ₪`} highlight />
      </Results>
    </CalculatorCard>
  )
}

function RentVsBuyCalculator() {
  const [rent, setRent] = useState(4_800)
  const [rentIncrease, setRentIncrease] = useState(2)
  const [years, setYears] = useState(10)
  const [price, setPrice] = useState(1_800_000)
  const [equity, setEquity] = useState(450_000)
  const [rate, setRate] = useState(4.8)
  const [mortgageYears, setMortgageYears] = useState(30)
  const [monthlyOwnership, setMonthlyOwnership] = useState(900)
  const [purchaseCosts, setPurchaseCosts] = useState(70_000)

  const result = useMemo(() => {
    let totalRent = 0
    let currentRent = rent

    for (let year = 0; year < years; year += 1) {
      totalRent += currentRent * 12
      currentRent *= 1 + rentIncrease / 100
    }

    const principal = Math.max(0, price - equity)
    const mortgagePayment = monthlyMortgage(principal, rate, mortgageYears)
    const totalBuyingCashFlow = equity + purchaseCosts + (mortgagePayment + monthlyOwnership) * years * 12

    return {
      totalRent,
      mortgagePayment,
      totalBuyingCashFlow,
      difference: totalBuyingCashFlow - totalRent
    }
  }, [rent, rentIncrease, years, price, equity, rate, mortgageYears, monthlyOwnership, purchaseCosts])

  return (
    <CalculatorCard title="שכירות מול קנייה" subtitle="השוואת תזרים מזומנים לתקופה שתבחרו" icon={<Scale />}>
      <div className="form-section-title wide">שכירות</div>
      <div className="form-grid">
        <MoneyInput label="שכירות חודשית" value={rent} setValue={setRent} />
        <NumberInput label="עלייה שנתית משוערת בשכירות" value={rentIncrease} setValue={setRentIncrease} step={0.1} />
        <NumberInput label="מספר שנות השוואה" value={years} setValue={setYears} />
      </div>

      <div className="form-section-title wide">קנייה</div>
      <div className="form-grid">
        <MoneyInput label="מחיר הנכס" value={price} setValue={setPrice} />
        <MoneyInput label="הון עצמי" value={equity} setValue={setEquity} />
        <NumberInput label="ריבית משוערת" value={rate} setValue={setRate} step={0.1} />
        <NumberInput label="שנות משכנתא" value={mortgageYears} setValue={setMortgageYears} />
        <MoneyInput label="תחזוקה, ועד וארנונה נוספים בחודש" value={monthlyOwnership} setValue={setMonthlyOwnership} />
        <MoneyInput label="הוצאות רכישה חד פעמיות" value={purchaseCosts} setValue={setPurchaseCosts} />
      </div>

      <Results>
        <Result label={`עלות שכירות מצטברת ל-${years} שנים`} value={`${money(result.totalRent)} ₪`} />
        <Result label="החזר משכנתא חודשי משוער" value={`${money(result.mortgagePayment)} ₪`} />
        <Result label={`תזרים כולל לקנייה ל-${years} שנים`} value={`${money(result.totalBuyingCashFlow)} ₪`} />
        <Result label="פער תזרימי: קנייה פחות שכירות" value={`${money(result.difference)} ₪`} highlight />
      </Results>

      <p className="calculator-note">ההשוואה כאן היא תזרימית בלבד ואינה מחשבת עליית ערך נכס, יתרת משכנתא, תשואה על הון עצמי או עלויות מכירה.</p>
    </CalculatorCard>
  )
}

function PurchaseCostsCalculator() {
  const [price, setPrice] = useState(1_800_000)
  const [lawyerPercent, setLawyerPercent] = useState(0.5)
  const [brokerPercent, setBrokerPercent] = useState(0)
  const [purchaseTax, setPurchaseTax] = useState(0)
  const [renovation, setRenovation] = useState(40_000)
  const [moving, setMoving] = useState(8_000)
  const [mortgageFees, setMortgageFees] = useState(6_000)
  const [other, setOther] = useState(10_000)

  const result = useMemo(() => {
    const lawyer = price * lawyerPercent / 100
    const broker = price * brokerPercent / 100
    const totalExtras = lawyer + broker + purchaseTax + renovation + moving + mortgageFees + other

    return {
      lawyer,
      broker,
      totalExtras,
      realCost: price + totalExtras,
      extraRatio: price > 0 ? totalExtras / price * 100 : 0
    }
  }, [price, lawyerPercent, brokerPercent, purchaseTax, renovation, moving, mortgageFees, other])

  return (
    <CalculatorCard title="העלות האמיתית של הרכישה" subtitle="מעבר למחיר שמופיע במודעה" icon={<Banknote />}>
      <div className="form-grid">
        <MoneyInput label="מחיר הנכס" value={price} setValue={setPrice} />
        <NumberInput label="עורך דין באחוזים" value={lawyerPercent} setValue={setLawyerPercent} step={0.1} />
        <NumberInput label="תיווך באחוזים" value={brokerPercent} setValue={setBrokerPercent} step={0.1} />
        <MoneyInput label="מס רכישה לפי הבדיקה שלכם" value={purchaseTax} setValue={setPurchaseTax} />
        <MoneyInput label="שיפוץ ושדרוגים" value={renovation} setValue={setRenovation} />
        <MoneyInput label="הובלה ומעבר" value={moving} setValue={setMoving} />
        <MoneyInput label="שמאות, פתיחת תיק ועלויות משכנתא" value={mortgageFees} setValue={setMortgageFees} />
        <MoneyInput label="רזרבה והוצאות אחרות" value={other} setValue={setOther} />
      </div>

      <Results>
        <Result label="עורך דין" value={`${money(result.lawyer)} ₪`} />
        <Result label="תיווך" value={`${money(result.broker)} ₪`} />
        <Result label="סך הוצאות מעבר למחיר" value={`${money(result.totalExtras)} ₪`} />
        <Result label="הוצאות כתוספת למחיר הנכס" value={percent(result.extraRatio)} />
        <Result label="עלות רכישה כוללת" value={`${money(result.realCost)} ₪`} highlight />
      </Results>
    </CalculatorCard>
  )
}

function PaperApartmentCalculator() {
  const [price, setPrice] = useState(1_800_000)
  const [firstPaymentPercent, setFirstPaymentPercent] = useState(20)
  const [monthsToDelivery, setMonthsToDelivery] = useState(36)
  const [monthlyRent, setMonthlyRent] = useState(4_800)
  const [linkedPercent, setLinkedPercent] = useState(40)
  const [annualIndex, setAnnualIndex] = useState(2.5)
  const [upgrades, setUpgrades] = useState(45_000)
  const [extraCosts, setExtraCosts] = useState(30_000)

  const result = useMemo(() => {
    const firstPayment = price * firstPaymentPercent / 100
    const remaining = price - firstPayment
    const linkedAmount = remaining * linkedPercent / 100
    const estimatedIndexAddition = linkedAmount * (Math.pow(1 + annualIndex / 100, monthsToDelivery / 12) - 1)
    const rentUntilDelivery = monthlyRent * monthsToDelivery
    const estimatedTotal = price + estimatedIndexAddition + rentUntilDelivery + upgrades + extraCosts

    return {
      firstPayment,
      remaining,
      linkedAmount,
      estimatedIndexAddition,
      rentUntilDelivery,
      estimatedTotal
    }
  }, [price, firstPaymentPercent, monthsToDelivery, monthlyRent, linkedPercent, annualIndex, upgrades, extraCosts])

  return (
    <CalculatorCard title="דירה על הנייר" subtitle="תשלום ראשון, שכירות עד מסירה והצמדה משוערת" icon={<CalendarDays />}>
      <div className="form-grid">
        <MoneyInput label="מחיר בחוזה" value={price} setValue={setPrice} />
        <NumberInput label="תשלום ראשון באחוזים" value={firstPaymentPercent} setValue={setFirstPaymentPercent} step={1} />
        <NumberInput label="חודשים עד המסירה" value={monthsToDelivery} setValue={setMonthsToDelivery} />
        <MoneyInput label="שכירות חודשית עד המסירה" value={monthlyRent} setValue={setMonthlyRent} />
        <NumberInput label="חלק מהיתרה שמוצמד באחוזים" value={linkedPercent} setValue={setLinkedPercent} step={1} />
        <NumberInput label="מדד שנתי משוער" value={annualIndex} setValue={setAnnualIndex} step={0.1} />
        <MoneyInput label="שדרוגי קבלן" value={upgrades} setValue={setUpgrades} />
        <MoneyInput label="הוצאות נוספות" value={extraCosts} setValue={setExtraCosts} />
      </div>

      <Results>
        <Result label="תשלום ראשון" value={`${money(result.firstPayment)} ₪`} />
        <Result label="יתרה לאחר התשלום הראשון" value={`${money(result.remaining)} ₪`} />
        <Result label="סכום שמחושב כמוצמד" value={`${money(result.linkedAmount)} ₪`} />
        <Result label="תוספת הצמדה משוערת" value={`${money(result.estimatedIndexAddition)} ₪`} />
        <Result label="שכירות עד המסירה" value={`${money(result.rentUntilDelivery)} ₪`} />
        <Result label="עלות כוללת משוערת עד הכניסה" value={`${money(result.estimatedTotal)} ₪`} highlight />
      </Results>
    </CalculatorCard>
  )
}

function CalculatorCard({ title, subtitle, icon, children }: {
  title: string
  subtitle: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="form-card calculator-card">
      <div className="calculator-heading">
        <div className="calculator-icon">{icon}</div>
        <div><h2>{title}</h2><p>{subtitle}</p></div>
      </div>
      {children}
    </section>
  )
}

function MoneyInput({ label, value, setValue }: {
  label: string
  value: number
  setValue: (value: number) => void
}) {
  return (
    <label>
      {label}
      <div className="input-with-suffix">
        <input type="number" min="0" inputMode="numeric" value={value} onChange={event => setValue(Number(event.target.value))} />
        <span>₪</span>
      </div>
    </label>
  )
}

function NumberInput({ label, value, setValue, min = 0, max, step = 1 }: {
  label: string
  value: number
  setValue: (value: number) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <label>
      {label}
      <input type="number" min={min} max={max} step={step} inputMode="decimal" value={value} onChange={event => setValue(Number(event.target.value))} />
    </label>
  )
}

function Results({ children }: { children: React.ReactNode }) {
  return <div className="calculator-results">{children}</div>
}

function Result({ label, value, highlight = false, tone }: {
  label: string
  value: string
  highlight?: boolean
  tone?: 'good' | 'warning' | 'danger'
}) {
  return (
    <article className={`calculator-result ${highlight ? 'highlight' : ''} ${tone ?? ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}
