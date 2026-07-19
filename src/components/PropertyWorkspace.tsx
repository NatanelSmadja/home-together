import { useEffect, useMemo, useState } from 'react'
import { Check, MessageCircle, Plus, Star, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { money, monthlyMortgage, pricePerSqm, propertyMonthlyCost } from '../lib/finance'
import type { Property, PropertyComment, PropertyRating, PropertyTask } from '../types/database'

export function PropertyWorkspace({ property }: { property: Property }) {
  const { user } = useAuth()
  const [rating, setRating] = useState<PropertyRating>({
    property_id: property.id, user_id: user?.id ?? '', overall: 0, location: 0, layout: 0, price: 0, neighborhood: 0, future_potential: 0
  })
  const [advantages, setAdvantages] = useState<{ id: string; content: string }[]>([])
  const [disadvantages, setDisadvantages] = useState<{ id: string; content: string }[]>([])
  const [tasks, setTasks] = useState<PropertyTask[]>([])
  const [comments, setComments] = useState<PropertyComment[]>([])
  const [newAdvantage, setNewAdvantage] = useState('')
  const [newDisadvantage, setNewDisadvantage] = useState('')
  const [newTask, setNewTask] = useState('')
  const [newComment, setNewComment] = useState('')
  const [scenario, setScenario] = useState({ name: 'תרחיש בסיס', equity: Number(property.equity || 0), years: 30, rate: 4.8 })
  const [scenarios, setScenarios] = useState<{ id: string; name: string; equity: number; years: number; rate: number }[]>([])
  const [milestones, setMilestones] = useState<{ id: string; title: string; amount: number; due_date: string | null; completed: boolean }[]>([])
  const [milestone, setMilestone] = useState({ title: '', amount: 0, due_date: '' })

  const load = async () => {
    if (!user) return
    const [ratingResult, itemResult, taskResult, commentResult, scenarioResult, milestoneResult] = await Promise.all([
      supabase.from('property_ratings').select('*').eq('property_id', property.id).eq('user_id', user.id).maybeSingle(),
      supabase.from('property_items').select('*').eq('property_id', property.id).order('created_at'),
      supabase.from('property_tasks').select('*').eq('property_id', property.id).order('created_at'),
      supabase.from('property_comments').select('*').eq('property_id', property.id).order('created_at'),
      supabase.from('mortgage_scenarios').select('*').eq('property_id', property.id).order('created_at'),
      supabase.from('payment_milestones').select('*').eq('property_id', property.id).order('due_date')
    ])

    if (ratingResult.data) setRating(ratingResult.data as PropertyRating)
    const items = (itemResult.data ?? []) as { id: string; kind: string; content: string }[]
    setAdvantages(items.filter(item => item.kind === 'advantage'))
    setDisadvantages(items.filter(item => item.kind === 'disadvantage'))
    setTasks((taskResult.data as PropertyTask[]) ?? [])
    setComments((commentResult.data as PropertyComment[]) ?? [])
    setScenarios((scenarioResult.data as typeof scenarios) ?? [])
    setMilestones((milestoneResult.data as typeof milestones) ?? [])
  }

  useEffect(() => {
    load()
    const channel = supabase.channel(`workspace-${property.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'property_comments', filter: `property_id=eq.${property.id}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'property_tasks', filter: `property_id=eq.${property.id}` }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [property.id, user?.id])

  async function saveRating(key: keyof PropertyRating, value: number) {
    if (!user) return
    const next = { ...rating, property_id: property.id, user_id: user.id, [key]: value }
    setRating(next)
    await supabase.from('property_ratings').upsert(next, { onConflict: 'property_id,user_id' })
  }

  async function addItem(kind: 'advantage' | 'disadvantage', content: string) {
    if (!user || !content.trim()) return
    await supabase.from('property_items').insert({ property_id: property.id, household_id: property.household_id, user_id: user.id, kind, content: content.trim() })
    kind === 'advantage' ? setNewAdvantage('') : setNewDisadvantage('')
    load()
  }

  async function deleteItem(id: string) {
    await supabase.from('property_items').delete().eq('id', id)
    load()
  }

  async function addTask() {
    if (!user || !newTask.trim()) return
    await supabase.from('property_tasks').insert({ property_id: property.id, household_id: property.household_id, created_by: user.id, title: newTask.trim() })
    setNewTask('')
    load()
  }

  async function toggleTask(task: PropertyTask) {
    await supabase.from('property_tasks').update({ completed: !task.completed }).eq('id', task.id)
    load()
  }

  async function addComment() {
    if (!user || !newComment.trim()) return
    await supabase.from('property_comments').insert({ property_id: property.id, household_id: property.household_id, user_id: user.id, content: newComment.trim() })
    setNewComment('')
    load()
  }

  async function addScenario() {
    if (!user) return
    await supabase.from('mortgage_scenarios').insert({
      property_id: property.id, household_id: property.household_id, created_by: user.id,
      name: scenario.name, equity: scenario.equity, years: scenario.years, rate: scenario.rate
    })
    load()
  }

  async function addMilestone() {
    if (!user || !milestone.title.trim()) return
    await supabase.from('payment_milestones').insert({
      property_id: property.id, household_id: property.household_id, created_by: user.id,
      title: milestone.title, amount: milestone.amount, due_date: milestone.due_date || null
    })
    setMilestone({ title: '', amount: 0, due_date: '' })
    load()
  }

  const scoreLabels: { key: keyof PropertyRating; label: string }[] = [
    { key: 'overall', label: 'ציון כללי' }, { key: 'location', label: 'מיקום' },
    { key: 'layout', label: 'תכנון' }, { key: 'price', label: 'מחיר' },
    { key: 'neighborhood', label: 'שכונה' }, { key: 'future_potential', label: 'פוטנציאל' }
  ]

  const baseMonthly = propertyMonthlyCost(property)
  const sqmPrice = pricePerSqm(property)

  return (
    <div className="workspace-grid">
      <section className="info-card workspace-card">
        <h3>מדדי החלטה</h3>
        <div className="decision-metrics">
          <div><span>מחיר למ״ר משוקלל</span><strong>{money(sqmPrice)} ₪</strong></div>
          <div><span>עלות חודשית אמיתית</span><strong>{money(baseMonthly)} ₪</strong></div>
        </div>
      </section>

      <section className="info-card workspace-card">
        <h3><Star size={18} /> הדירוג שלי</h3>
        <div className="rating-grid">
          {scoreLabels.map(item => (
            <label key={item.key}>{item.label}
              <input type="range" min="0" max="10" value={Number(rating[item.key] || 0)} onChange={event => saveRating(item.key, Number(event.target.value))} />
              <strong>{Number(rating[item.key] || 0)}/10</strong>
            </label>
          ))}
        </div>
      </section>

      <section className="info-card workspace-card pros-cons-card">
        <div>
          <h3>יתרונות</h3>
          <InlineAdd value={newAdvantage} setValue={setNewAdvantage} onAdd={() => addItem('advantage', newAdvantage)} />
          {advantages.map(item => <div className="list-row good-row" key={item.id}><span>+ {item.content}</span><button onClick={() => deleteItem(item.id)}><Trash2 size={15} /></button></div>)}
        </div>
        <div>
          <h3>חסרונות</h3>
          <InlineAdd value={newDisadvantage} setValue={setNewDisadvantage} onAdd={() => addItem('disadvantage', newDisadvantage)} />
          {disadvantages.map(item => <div className="list-row bad-row" key={item.id}><span>− {item.content}</span><button onClick={() => deleteItem(item.id)}><Trash2 size={15} /></button></div>)}
        </div>
      </section>

      <section className="info-card workspace-card">
        <h3>משימות ובדיקות</h3>
        <InlineAdd value={newTask} setValue={setNewTask} onAdd={addTask} placeholder="למשל: לבדוק כיוון אוויר" />
        <div className="task-list">
          {tasks.map(task => <button className={`task-row ${task.completed ? 'completed' : ''}`} key={task.id} onClick={() => toggleTask(task)}>
            <span className="task-check">{task.completed && <Check size={15} />}</span><span>{task.title}</span>
          </button>)}
        </div>
      </section>

      <section className="info-card workspace-card">
        <h3>תרחישי משכנתא</h3>
        <div className="scenario-form">
          <input value={scenario.name} onChange={event => setScenario(current => ({ ...current, name: event.target.value }))} placeholder="שם התרחיש" />
          <input type="number" value={scenario.equity} onChange={event => setScenario(current => ({ ...current, equity: Number(event.target.value) }))} placeholder="הון עצמי" />
          <input type="number" value={scenario.years} onChange={event => setScenario(current => ({ ...current, years: Number(event.target.value) }))} placeholder="שנים" />
          <input type="number" step="0.1" value={scenario.rate} onChange={event => setScenario(current => ({ ...current, rate: Number(event.target.value) }))} placeholder="ריבית" />
          <button className="primary-button compact" onClick={addScenario}><Plus size={16} /> שמירה</button>
        </div>
        <div className="scenario-list">
          {scenarios.map(item => {
            const payment = monthlyMortgage(Math.max(0, Number(property.price) - Number(item.equity)), Number(item.rate), Number(item.years))
            return <article key={item.id}><strong>{item.name}</strong><span>{item.years} שנים · {item.rate}%</span><b>{money(payment)} ₪ בחודש</b></article>
          })}
        </div>
      </section>

      <section className="info-card workspace-card">
        <h3>ציר זמן ותשלומים</h3>
        <div className="milestone-form">
          <input value={milestone.title} onChange={event => setMilestone(current => ({ ...current, title: event.target.value }))} placeholder="שם השלב" />
          <input type="number" value={milestone.amount} onChange={event => setMilestone(current => ({ ...current, amount: Number(event.target.value) }))} placeholder="סכום" />
          <input type="date" value={milestone.due_date} onChange={event => setMilestone(current => ({ ...current, due_date: event.target.value }))} />
          <button className="primary-button compact" onClick={addMilestone}><Plus size={16} /> הוספה</button>
        </div>
        <div className="timeline">
          {milestones.map(item => <article key={item.id}><span className="timeline-dot" /><div><strong>{item.title}</strong><small>{item.due_date ? new Date(item.due_date).toLocaleDateString('he-IL') : 'ללא תאריך'}</small></div><b>{money(Number(item.amount))} ₪</b></article>)}
        </div>
      </section>

      <section className="info-card workspace-card comments-card">
        <h3><MessageCircle size={18} /> הערות משותפות</h3>
        <div className="comment-compose">
          <textarea rows={3} value={newComment} onChange={event => setNewComment(event.target.value)} placeholder="כתבו עדכון או משהו שחשוב לזכור…" />
          <button className="primary-button compact" onClick={addComment}>שליחה</button>
        </div>
        <div className="comments-list">
          {comments.map(comment => <article key={comment.id}><p>{comment.content}</p><small>{new Date(comment.created_at).toLocaleString('he-IL')}</small></article>)}
        </div>
      </section>
    </div>
  )
}

function InlineAdd({ value, setValue, onAdd, placeholder = 'הוספת סעיף' }: {
  value: string
  setValue: (value: string) => void
  onAdd: () => void
  placeholder?: string
}) {
  return <div className="inline-add"><input value={value} onChange={event => setValue(event.target.value)} placeholder={placeholder} /><button onClick={onAdd}><Plus size={17} /></button></div>
}
