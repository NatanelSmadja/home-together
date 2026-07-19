import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Property } from '../types/database'

export function PropertyDetailPage(){const{id}=useParams();const[p,setP]=useState<Property|null>(null)
 useEffect(()=>{if(!id)return;const load=async()=>{const{data}=await supabase.from('properties').select('*').eq('id',id).single();setP(data as Property)};load();const c=supabase.channel(`property-${id}`).on('postgres_changes',{event:'*',schema:'public',table:'properties',filter:`id=eq.${id}`},load).subscribe();return()=>{supabase.removeChannel(c)}},[id])
 const mortgage=useMemo(()=>p?Math.max(0,Number(p.price)-Number(p.equity)):0,[p]);if(!p)return <div className="empty-state">טוען נכס…</div>
 return <><section className="detail-hero"><span className="pill">{p.transaction_type}</span><h2>{p.title}</h2><p>{[p.city,p.neighborhood,p.address].filter(Boolean).join(' · ')}</p><strong>{Number(p.price).toLocaleString('he-IL')} ₪</strong></section>
 <div className="detail-grid"><article className="info-card"><h3>נתוני הנכס</h3><dl><div><dt>חדרים</dt><dd>{p.rooms??'—'}</dd></div><div><dt>שטח</dt><dd>{p.size_sqm?`${p.size_sqm} מ״ר`:'—'}</dd></div><div><dt>סטטוס</dt><dd>{p.status}</dd></div></dl></article><article className="info-card"><h3>תמונה כספית</h3><dl><div><dt>הון עצמי</dt><dd>{Number(p.equity).toLocaleString('he-IL')} ₪</dd></div><div><dt>מימון נדרש</dt><dd>{mortgage.toLocaleString('he-IL')} ₪</dd></div><div><dt>שכירות</dt><dd>{Number(p.monthly_rent).toLocaleString('he-IL')} ₪</dd></div></dl></article></div>
 {p.notes&&<article className="info-card"><h3>הערות</h3><p>{p.notes}</p></article>}</>
}
