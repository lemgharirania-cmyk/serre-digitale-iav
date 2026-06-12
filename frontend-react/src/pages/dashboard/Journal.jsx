// src/pages/dashboard/Journal.jsx
// ─────────────────────────────────────────────────────────────────────────────
//  Journal des actions correctives
//  - Résumé du jour : nb activations par équipement
//  - Timeline Gantt : plages d'activation sur 24h
//  - Bar chart : fréquence par jour sur 7 / 14 / 30 jours
//  - Export CSV / Excel
//  - Mobile-first responsive (≤900px)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import { dashboardAPI } from '../../api/client'
import { useAccess } from '../../hooks/useAccess'
import {
  Download, RefreshCw, Calendar, BarChart2,
  Wind, Flame, Droplets, Leaf, ChevronLeft, ChevronRight,
  Clock, Activity, AirVent, ClipboardList, Timer,
  AlertTriangle, Info,
} from 'lucide-react'

// ── Config serres ─────────────────────────────────────────────────────────────
const SERRES = [
  { id:1, code:'S01', color:'#22C55E', nomFR:'Génétique & Amélioration', nomEN:'Plant Genetics'  },
  { id:2, code:'S02', color:'#06B6D4', nomFR:'Horticulture',             nomEN:'Horticulture'    },
  { id:3, code:'S03', color:'#F59E0B', nomFR:'Agronomie',                nomEN:'Agronomy'        },
  { id:4, code:'S04', color:'#8B5CF6', nomFR:'Hydroponie',               nomEN:'Hydroponics'     },
  { id:5, code:'S05', color:'#EF4444', nomFR:'Protection des Plantes',   nomEN:'Plant Protection'},
]

// ── Config équipements — icônes Lucide uniquement ─────────────────────────────
const ACTIONS = [
  { key:'ventilation',       Icon: Wind,     color:'#06B6D4', labelFR:'Ventilation',      labelEN:'Ventilation'      },
  { key:'chauffage',         Icon: Flame,    color:'#F59E0B', labelFR:'Chauffage',         labelEN:'Heating'          },
  { key:'brumisateur',       Icon: Droplets, color:'#8B5CF6', labelFR:'Brumisateur',       labelEN:'Humidifier'       },
  { key:'deshumidification', Icon: AirVent,  color:'#3B82F6', labelFR:'Déshumidification', labelEN:'Dehumidification' },
  { key:'co2_injection',     Icon: Leaf,     color:'#22C55E', labelFR:'CO₂ Injection',     labelEN:'CO₂ Injection'    },
  { key:'co2_purge',         Icon: Leaf,     color:'#4ADE80', labelFR:'CO₂ Purge',         labelEN:'CO₂ Purge'        },
]

// ── Traductions ────────────────────────────────────────────────────────────────
const T = {
  FR: {
    title: 'Journal des actions correctives',
    sub: 'Historique des activations des équipements de contrôle climatique',
    resume: 'Résumé du jour', activations: 'activation(s)',
    timeline: 'Timeline des activations (24h)',
    freq: 'Fréquence par jour',
    exportCSV: 'CSV', exportExcel: 'Excel',
    noData: 'Aucune action enregistrée pour cette période.',
    loading: 'Chargement...', refresh: 'Actualiser',
    visOnly: 'Basé sur les intervalles de visualisation — pas les seuils réels Pro-Leaf.',
    nbJours: 'jours', today: "Aujourd'hui",
  },
  EN: {
    title: 'Corrective actions log',
    sub: 'Activation history for climate control equipment',
    resume: 'Day summary', activations: 'activation(s)',
    timeline: 'Activation timeline (24h)',
    freq: 'Daily frequency',
    exportCSV: 'CSV', exportExcel: 'Excel',
    noData: 'No actions recorded for this period.',
    loading: 'Loading...', refresh: 'Refresh',
    visOnly: 'Based on visualization intervals — not the actual Pro-Leaf thresholds.',
    nbJours: 'days', today: 'Today',
  },
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function todayISO() { return new Date().toISOString().slice(0, 10) }
function fmtTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
function isoToMinutes(iso) {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

// ── Composant principal ────────────────────────────────────────────────────────
export default function Journal({ theme, lang, userRole }) {
  const isDark = theme === 'dark'
  const t      = T[lang] || T.FR
  const { allowedSerreId } = useAccess(userRole)

  const cardBg = isDark ? 'rgba(16,27,46,0.85)' : '#FFFFFF'
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'
  const ink    = isDark ? '#F1F5F9' : '#0F172A'
  const ink3   = isDark ? '#94A3B8' : '#64748B'
  const ink4   = isDark ? '#475569' : '#94A3B8'

  const defaultIdx = allowedSerreId ? allowedSerreId - 1 : 0
  const [serreIdx,   setSerreIdx]   = useState(defaultIdx)
  const [dateSelect, setDateSelect] = useState(todayISO())
  const [freqJours,  setFreqJours]  = useState(7)
  const [resume,     setResume]     = useState(null)
  const [frequence,  setFrequence]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [exporting,  setExporting]  = useState(null)

  const serre = SERRES[serreIdx]

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [res, freq] = await Promise.all([
        dashboardAPI.getJournalResume(serre.id, dateSelect),
        dashboardAPI.getJournalFrequence(serre.id, freqJours),
      ])
      setResume(res || null)
      setFrequence(freq || [])
    } catch (e) { console.error('Journal load error:', e) }
    finally { setLoading(false) }
  }, [serre.id, dateSelect, freqJours])

  useEffect(() => { load() }, [load])

  async function handleExport(format) {
    setExporting(format)
    try {
      const res = await dashboardAPI.exportJournal(serre.id, format, dateSelect)
      if (!res) return
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `SDI_Journal_${serre.code}_${dateSelect}.${format === 'excel' ? 'xlsx' : 'csv'}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) { console.error('Export error:', e) }
    finally { setExporting(null) }
  }

  const totalActivations = resume
    ? Object.values(resume.actions || {}).reduce((s, a) => s + (a.count || 0), 0)
    : 0

  // Btn style helpers
  const btnBase = {
    display:'flex', alignItems:'center', gap:6, padding:'8px 14px',
    borderRadius:10, fontSize:12, fontWeight:600, cursor:'pointer',
    fontFamily:"'Manrope','DM Sans',system-ui,sans-serif", transition:'all 0.15s',
  }

  return (
    <div style={{ fontFamily:"'Manrope','DM Sans',system-ui,sans-serif", maxWidth:1200 }}>

      {/* ── En-tête ─────────────────────────────────────────── */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between',
          flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
              <ClipboardList size={20} color={serre.color}/>
              <h1 style={{ fontSize:20, fontWeight:800, color:ink, letterSpacing:'-0.02em', margin:0 }}>
                {t.title}
              </h1>
            </div>
            <p style={{ fontSize:12, color:ink3, margin:0, display:'flex', alignItems:'center', gap:5 }}>
              <Activity size={12}/> {t.sub}
            </p>
          </div>
          {/* Export buttons */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button onClick={load} style={{
              ...btnBase, border:'1px solid '+border,
              background:isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', color:ink3,
            }}>
              <RefreshCw size={13}/> {t.refresh}
            </button>
            <button onClick={() => handleExport('csv')} disabled={!!exporting} style={{
              ...btnBase,
              border:'1px solid rgba(34,197,94,0.3)',
              background: exporting==='csv' ? '#22C55E' : 'rgba(34,197,94,0.08)',
              color: exporting==='csv' ? '#fff' : '#22C55E',
            }}>
              <Download size={13}/> {t.exportCSV}
            </button>
            <button onClick={() => handleExport('excel')} disabled={!!exporting} style={{
              ...btnBase,
              border:'1px solid rgba(34,197,94,0.3)',
              background: exporting==='excel' ? '#22C55E' : 'rgba(34,197,94,0.08)',
              color: exporting==='excel' ? '#fff' : '#22C55E',
            }}>
              <Download size={13}/> {t.exportExcel}
            </button>
          </div>
        </div>
      </div>

      {/* ── Filtres ──────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        {/* Sélecteur serre */}
        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
          {SERRES.map((s, i) => (
            <button key={s.id} onClick={() => setSerreIdx(i)} style={{
              padding:'6px 12px', borderRadius:8, fontSize:12, fontWeight:600,
              fontFamily:'inherit', cursor:'pointer', transition:'all 0.15s',
              border:'1px solid '+(serreIdx===i ? s.color+'60' : border),
              background: serreIdx===i ? s.color+'18' : 'transparent',
              color: serreIdx===i ? s.color : ink3,
            }}>{s.code}</button>
          ))}
        </div>

        {/* Date picker avec navigation */}
        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
          <button onClick={() => {
            const d = new Date(dateSelect); d.setDate(d.getDate()-1)
            setDateSelect(d.toISOString().slice(0,10))
          }} style={{ ...btnBase, padding:'6px 10px', border:'1px solid '+border,
            background:'transparent', color:ink3 }}>
            <ChevronLeft size={14}/>
          </button>

          <div style={{ display:'flex', alignItems:'center', gap:6, background:cardBg,
            border:'1px solid '+border, borderRadius:8, padding:'6px 12px' }}>
            <Calendar size={13} color={serre.color}/>
            <input type="date" value={dateSelect} max={todayISO()}
              onChange={e => setDateSelect(e.target.value)}
              style={{ background:'none', border:'none', outline:'none', color:ink,
                fontSize:13, fontWeight:600, fontFamily:'inherit', cursor:'pointer' }}
            />
          </div>

          <button onClick={() => {
            const d = new Date(dateSelect); d.setDate(d.getDate()+1)
            const next = d.toISOString().slice(0,10)
            if (next <= todayISO()) setDateSelect(next)
          }} style={{ ...btnBase, padding:'6px 10px', border:'1px solid '+border,
            background:'transparent', color:ink3 }}>
            <ChevronRight size={14}/>
          </button>

          <button onClick={() => setDateSelect(todayISO())} style={{
            ...btnBase, padding:'5px 10px', border:'1px solid '+serre.color+'40',
            background:serre.color+'10', color:serre.color,
          }}>{t.today}</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'4rem', color:ink3 }}>
          <RefreshCw size={20} color={serre.color}
            style={{ animation:'spin 1s linear infinite', marginBottom:10 }}/>
          <br/>{t.loading}
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <>
          {/* ════════════════════════════════════════════════════
              BLOC 1 — Résumé du jour
          ════════════════════════════════════════════════════ */}
          <div style={{ background:cardBg, border:'1px solid '+border, borderRadius:18,
            padding:'20px 24px', marginBottom:16 }}>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
              marginBottom:16, flexWrap:'wrap', gap:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ width:32, height:32, borderRadius:9, display:'flex', alignItems:'center',
                  justifyContent:'center', background:serre.color+'18', color:serre.color }}>
                  <ClipboardList size={16}/>
                </span>
                <div>
                  <div style={{ fontSize:14, fontWeight:800, color:ink }}>{t.resume}</div>
                  <div style={{ fontSize:11, color:ink3 }}>
                    {serre.code} · {lang==='FR' ? serre.nomFR : serre.nomEN} · {dateSelect}
                  </div>
                </div>
              </div>
              <span style={{ fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:20,
                background:serre.color+'15', border:'1px solid '+serre.color+'30', color:serre.color }}>
                {totalActivations} {t.activations}
              </span>
            </div>

            {totalActivations === 0 ? (
              <div style={{ textAlign:'center', padding:'1.5rem', color:ink4, fontSize:13,
                background:isDark?'rgba(255,255,255,0.02)':'rgba(0,0,0,0.02)',
                borderRadius:12, border:'1px dashed '+border }}>
                {t.noData}
              </div>
            ) : (
              <div style={{ display:'grid',
                gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:10 }}>
                {ACTIONS.map(action => {
                  const data  = resume?.actions?.[action.key]
                  const count = data?.count || 0
                  if (!count) return null
                  const times = data?.activations?.map(a => fmtTime(a.timestamp)) || []
                  return (
                    <div key={action.key} style={{
                      borderRadius:12, padding:'12px 14px',
                      border:'1px solid '+action.color+'30',
                      background:isDark ? action.color+'10' : action.color+'07',
                    }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
                        <action.Icon size={14} color={action.color}/>
                        <span style={{ fontSize:11, fontWeight:700, color:ink }}>
                          {lang==='FR' ? action.labelFR : action.labelEN}
                        </span>
                      </div>
                      <div style={{ fontSize:22, fontWeight:800, color:action.color,
                        fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>
                        {count}
                        <span style={{ fontSize:10, fontWeight:500, color:ink3, marginLeft:4 }}>
                          {t.activations}
                        </span>
                      </div>
                      {times.length > 0 && (
                        <div style={{ marginTop:8, display:'flex', flexWrap:'wrap', gap:3 }}>
                          {times.slice(0, 5).map((h, i) => (
                            <span key={i} style={{
                              fontSize:9, fontFamily:"'JetBrains Mono',monospace",
                              padding:'1px 5px', borderRadius:4,
                              background:action.color+'20', color:action.color,
                            }}>{h}</span>
                          ))}
                          {times.length > 5 && (
                            <span style={{ fontSize:9, color:ink4 }}>+{times.length-5}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Note */}
            <div style={{ marginTop:12, fontSize:10, color:ink4, display:'flex',
              alignItems:'flex-start', gap:5, borderTop:'1px solid '+border, paddingTop:10 }}>
              <Info size={10} style={{ flexShrink:0, marginTop:1 }}/> {t.visOnly}
            </div>
          </div>

          {/* ════════════════════════════════════════════════════
              BLOC 2 — Timeline Gantt 24h
          ════════════════════════════════════════════════════ */}
          <div style={{ background:cardBg, border:'1px solid '+border, borderRadius:18,
            padding:'20px 24px', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <span style={{ width:32, height:32, borderRadius:9, display:'flex', alignItems:'center',
                justifyContent:'center', background:serre.color+'18', color:serre.color }}>
                <Timer size={16}/>
              </span>
              <div>
                <div style={{ fontSize:14, fontWeight:800, color:ink }}>{t.timeline}</div>
                <div style={{ fontSize:11, color:ink3 }}>{dateSelect}</div>
              </div>
            </div>
            <GanttChart resume={resume} isDark={isDark} ink={ink} ink3={ink3} ink4={ink4}
              border={border} lang={lang} t={t}/>
          </div>

          {/* ════════════════════════════════════════════════════
              BLOC 3 — Fréquence par jour
          ════════════════════════════════════════════════════ */}
          <div style={{ background:cardBg, border:'1px solid '+border, borderRadius:18,
            padding:'20px 24px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
              marginBottom:16, flexWrap:'wrap', gap:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ width:32, height:32, borderRadius:9, display:'flex', alignItems:'center',
                  justifyContent:'center', background:serre.color+'18', color:serre.color }}>
                  <BarChart2 size={16}/>
                </span>
                <div>
                  <div style={{ fontSize:14, fontWeight:800, color:ink }}>{t.freq}</div>
                  <div style={{ fontSize:11, color:ink3 }}>{freqJours} {t.nbJours}</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                {[7, 14, 30].map(j => (
                  <button key={j} onClick={() => setFreqJours(j)} style={{
                    padding:'4px 10px', borderRadius:8, fontSize:11, fontWeight:600,
                    border:'1px solid '+(freqJours===j ? serre.color+'60' : border),
                    background: freqJours===j ? serre.color+'18' : 'transparent',
                    color: freqJours===j ? serre.color : ink3,
                    cursor:'pointer', fontFamily:'inherit',
                  }}>{j}j</button>
                ))}
              </div>
            </div>
            <FrequenceChart data={frequence} isDark={isDark} ink={ink} ink3={ink3} ink4={ink4}
              border={border} lang={lang} t={t}/>
          </div>
        </>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  GANTT CHART — Timeline 24h responsive
// ═════════════════════════════════════════════════════════════════════════════
function GanttChart({ resume, isDark, ink, ink3, ink4, border, lang, t }) {
  const MIN_TOTAL = 24 * 60
  const LABEL_W   = 120  // px for the left label column

  const actionsAvecData = ACTIONS.filter(a => {
    const d = resume?.actions?.[a.key]
    return d && (d.activations?.length > 0 || d.inactivations?.length > 0)
  })

  if (!actionsAvecData.length) {
    return (
      <div style={{ textAlign:'center', padding:'2rem', color:ink4, fontSize:13,
        background:isDark?'rgba(255,255,255,0.02)':'rgba(0,0,0,0.02)',
        borderRadius:12, border:'1px dashed '+border }}>
        {t.noData}
      </div>
    )
  }

  // Hour tick marks 0,3,6,...,24
  const TICKS = [0, 3, 6, 9, 12, 15, 18, 21, 24]

  return (
    <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
      {/* Hour axis */}
      <div style={{ display:'flex', marginLeft:LABEL_W, marginBottom:4,
        minWidth:480, position:'relative' }}>
        {TICKS.map(h => (
          <div key={h} style={{ position:'absolute', left:((h/24)*100)+'%',
            fontSize:9, color:ink4, fontFamily:"'JetBrains Mono',monospace",
            transform:'translateX(-50%)' }}>
            {String(h).padStart(2,'0')}h
          </div>
        ))}
        <div style={{ height:16 }}/>
      </div>

      {/* Rows */}
      <div style={{ minWidth:480 }}>
        {actionsAvecData.map(action => {
          const data    = resume?.actions?.[action.key] || {}
          const actList = data.activations   || []
          const inList  = data.inactivations || []

          const segments = actList.map(act => {
            const debut = isoToMinutes(act.timestamp)
            const inac  = inList.find(i => new Date(i.timestamp) > new Date(act.timestamp))
            const fin   = inac ? isoToMinutes(inac.timestamp) : Math.min(debut + 30, MIN_TOTAL)
            return { debut, fin: Math.max(fin, debut + 8) }
          })

          return (
            <div key={action.key} style={{ display:'flex', alignItems:'center',
              gap:8, marginBottom:6 }}>
              {/* Label */}
              <div style={{ width:LABEL_W, display:'flex', alignItems:'center',
                gap:6, flexShrink:0 }}>
                <action.Icon size={13} color={action.color}/>
                <span style={{ fontSize:11, fontWeight:600, color:ink, lineHeight:1.2,
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {lang==='FR' ? action.labelFR : action.labelEN}
                </span>
              </div>

              {/* Track */}
              <div style={{ flex:1, height:26,
                background:isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.04)',
                borderRadius:6, position:'relative',
                border:'1px solid '+border, minWidth:0 }}>

                {/* Grid lines */}
                {TICKS.slice(1,-1).map(h => (
                  <div key={h} style={{ position:'absolute', top:0, bottom:0,
                    left:((h/24)*100)+'%', width:1,
                    background:isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.06)'}}/>
                ))}

                {/* Activation segments */}
                {segments.map((seg, si) => {
                  const left  = (seg.debut / MIN_TOTAL) * 100
                  const width = Math.max(0.5, ((seg.fin - seg.debut) / MIN_TOTAL) * 100)
                  const dh = String(Math.floor(seg.debut/60)).padStart(2,'0')
                  const dm = String(seg.debut%60).padStart(2,'0')
                  const fh = String(Math.floor(seg.fin/60)).padStart(2,'0')
                  const fm = String(seg.fin%60).padStart(2,'0')
                  return (
                    <div key={si} title={`${dh}:${dm} → ${fh}:${fm}`} style={{
                      position:'absolute', top:3, height:'calc(100% - 6px)',
                      left:left+'%', width:width+'%',
                      background:action.color, borderRadius:3,
                      opacity:0.85, minWidth:4,
                      boxShadow:'0 0 5px '+action.color+'50',
                    }}/>
                  )
                })}
              </div>

              {/* Count badge */}
              <span style={{ width:24, textAlign:'center', fontSize:11, fontWeight:700,
                color:action.color, fontFamily:"'JetBrains Mono',monospace", flexShrink:0 }}>
                {data.count || 0}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  FREQUENCE CHART — Stacked bar chart, responsive
// ═════════════════════════════════════════════════════════════════════════════
function FrequenceChart({ data, isDark, ink, ink3, ink4, border, lang, t }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'2rem', color:ink4, fontSize:13,
        background:isDark?'rgba(255,255,255,0.02)':'rgba(0,0,0,0.02)',
        borderRadius:12, border:'1px dashed '+border }}>
        {t.noData}
      </div>
    )
  }

  const jours  = [...new Set(data.map(d => d.jour))].sort()
  const maxVal = Math.max(...data.map(d => d.count), 1)

  return (
    <div>
      {/* Légende */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:14 }}>
        {ACTIONS.map(a => {
          const total = data.filter(d => d.action===a.key).reduce((s,d)=>s+d.count,0)
          if (!total) return null
          return (
            <div key={a.key} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:10, height:10, borderRadius:2, background:a.color }}/>
              <span style={{ fontSize:10, color:ink3 }}>
                {lang==='FR' ? a.labelFR : a.labelEN} ({total})
              </span>
            </div>
          )
        })}
      </div>

      {/* Bars — scrollable horizontally on mobile */}
      <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch', paddingBottom:6 }}>
        <div style={{ display:'flex', alignItems:'flex-end', gap:6,
          minHeight:160, minWidth: jours.length * 44 }}>
          {jours.map(jour => {
            const jourData = ACTIONS.map(a => ({
              ...a,
              count: data.find(d => d.jour===jour && d.action===a.key)?.count || 0
            })).filter(a => a.count > 0)

            const totalJour = jourData.reduce((s,a)=>s+a.count, 0)
            const label = jour.slice(5) // MM-DD

            return (
              <div key={jour} style={{ display:'flex', flexDirection:'column',
                alignItems:'center', gap:3, flex:'0 0 auto', minWidth:40 }}>
                {/* Stacked bars */}
                <div style={{ width:'100%', display:'flex', flexDirection:'column-reverse',
                  gap:1, height:120, justifyContent:'flex-start', alignItems:'stretch' }}>
                  {jourData.map(a => {
                    const h = Math.max(4, (a.count / maxVal) * 115)
                    return (
                      <div key={a.key}
                        title={`${lang==='FR'?a.labelFR:a.labelEN}: ${a.count}`}
                        style={{ height:h, background:a.color, borderRadius:3, opacity:0.85 }}/>
                    )
                  })}
                </div>
                {/* Total */}
                <span style={{ fontSize:9, fontWeight:700, color:ink3,
                  fontFamily:"'JetBrains Mono',monospace" }}>
                  {totalJour || ''}
                </span>
                {/* Date label */}
                <span style={{ fontSize:8, color:ink4,
                  fontFamily:"'JetBrains Mono',monospace" }}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
