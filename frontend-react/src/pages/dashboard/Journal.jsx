// src/pages/dashboard/Journal.jsx
// ─────────────────────────────────────────────────────────────────────────────
//  Journal des actions correctives
//  - Résumé du jour : nb activations par équipement
//  - Timeline Gantt : plages d'activation sur 24h
//  - Bar chart : fréquence par jour sur 7 / 30 jours
//  - Export CSV / Excel
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import { dashboardAPI } from '../../api/client'
import { useAccess } from '../../hooks/useAccess'
import {
  Download, RefreshCw, Calendar, BarChart2,
  Wind, Flame, Droplets, Leaf, ChevronLeft, ChevronRight,
  Clock, Activity,
} from 'lucide-react'

// ── Config équipements ────────────────────────────────────────────────────────
const SERRES = [
  { id:1, code:'S01', color:'#22C55E', nomFR:'Génétique & Amélioration', nomEN:'Plant Genetics' },
  { id:2, code:'S02', color:'#06B6D4', nomFR:'Horticulture',             nomEN:'Horticulture' },
  { id:3, code:'S03', color:'#F59E0B', nomFR:'Agronomie',                nomEN:'Agronomy' },
  { id:4, code:'S04', color:'#8B5CF6', nomFR:'Hydroponie',               nomEN:'Hydroponics' },
  { id:5, code:'S05', color:'#EF4444', nomFR:'Protection des Plantes',   nomEN:'Plant Protection' },
]

const ACTIONS = [
  { key:'ventilation',       emoji:'💨', color:'#06B6D4', labelFR:'Ventilation',      labelEN:'Ventilation'      },
  { key:'chauffage',         emoji:'🔥', color:'#F59E0B', labelFR:'Chauffage',         labelEN:'Heating'          },
  { key:'brumisateur',       emoji:'💧', color:'#8B5CF6', labelFR:'Brumisateur',       labelEN:'Humidifier'       },
  { key:'deshumidification', emoji:'🌬', color:'#3B82F6', labelFR:'Déshumidification', labelEN:'Dehumidification' },
  { key:'co2_injection',     emoji:'🌿', color:'#22C55E', labelFR:'CO₂ Injection',     labelEN:'CO₂ Injection'    },
  { key:'co2_purge',         emoji:'🌿', color:'#4ADE80', labelFR:'CO₂ Purge',         labelEN:'CO₂ Purge'        },
]

// ── Traductions ───────────────────────────────────────────────────────────────
const T = {
  FR: {
    title: 'Journal des actions correctives',
    sub: 'Historique des activations des équipements de contrôle climatique',
    serre: 'Serre', date: 'Date', periode: '7 jours', periode30: '30 jours',
    resume: 'Résumé du jour', activations: 'activation(s)',
    timeline: 'Timeline des activations', freq: 'Fréquence par jour',
    export: 'Exporter', exportCSV: 'CSV', exportExcel: 'Excel',
    noData: 'Aucune action enregistrée pour cette période.',
    loading: 'Chargement...', refresh: 'Actualiser',
    jourLabel: 'Jour', nuitLabel: 'Nuit',
    visOnly: 'Basé sur les intervalles de visualisation (non les seuils réels Pro-Leaf).',
    nbJours: 'jours',
  },
  EN: {
    title: 'Corrective actions log',
    sub: 'Activation history for climate control equipment',
    serre: 'Greenhouse', date: 'Date', periode: '7 days', periode30: '30 days',
    resume: 'Day summary', activations: 'activation(s)',
    timeline: 'Activation timeline', freq: 'Daily frequency',
    export: 'Export', exportCSV: 'CSV', exportExcel: 'Excel',
    noData: 'No actions recorded for this period.',
    loading: 'Loading...', refresh: 'Refresh',
    jourLabel: 'Day', nuitLabel: 'Night',
    visOnly: 'Based on visualization intervals (not the actual Pro-Leaf thresholds).',
    nbJours: 'days',
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function todayISO() {
  return new Date().toISOString().slice(0, 10)
}
function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
function isoToMinutes(isoStr) {
  const d = new Date(isoStr)
  return d.getHours() * 60 + d.getMinutes()
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function Journal({ theme, lang, userRole }) {
  const isDark = theme === 'dark'
  const t      = T[lang] || T.FR
  const { allowedSerreId, canAccessSerre } = useAccess(userRole)

  // ── Couleurs ──────────────────────────────────────────────
  const cardBg  = isDark ? 'rgba(16,27,46,0.85)' : '#FFFFFF'
  const border  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'
  const ink     = isDark ? '#F1F5F9' : '#0F172A'
  const ink3    = isDark ? '#94A3B8' : '#64748B'
  const ink4    = isDark ? '#475569' : '#94A3B8'
  const pageBg  = isDark ? 'transparent' : 'transparent'

  // ── State ──────────────────────────────────────────────────
  const defaultSerreIdx = allowedSerreId ? allowedSerreId - 1 : 0
  const [serreIdx,    setSerreIdx]    = useState(defaultSerreIdx)
  const [dateSelect,  setDateSelect]  = useState(todayISO())
  const [freqJours,   setFreqJours]   = useState(7)
  const [resume,      setResume]      = useState(null)
  const [frequence,   setFrequence]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [exporting,   setExporting]   = useState(null)

  const serre = SERRES[serreIdx]

  // ── Chargement ────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [res, freq] = await Promise.all([
        dashboardAPI.getJournalResume(serre.id, dateSelect),
        dashboardAPI.getJournalFrequence(serre.id, freqJours),
      ])
      setResume(res || null)
      setFrequence(freq || [])
    } catch (e) {
      console.error('Journal load error:', e)
    } finally {
      setLoading(false)
    }
  }, [serre.id, dateSelect, freqJours])

  useEffect(() => { load() }, [load])

  // ── Export ────────────────────────────────────────────────
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
    } catch (e) {
      console.error('Export error:', e)
    } finally {
      setExporting(null)
    }
  }

  // ── Résumé : total activations du jour ───────────────────
  const totalActivations = resume
    ? Object.values(resume.actions || {}).reduce((s, a) => s + (a.count || 0), 0)
    : 0

  return (
    <div style={{ fontFamily:"'Manrope','DM Sans',system-ui,sans-serif", maxWidth: 1200 }}>

      {/* ── En-tête ────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, color:ink, letterSpacing:'-0.02em', margin:0 }}>
              {t.title}
            </h1>
            <p style={{ fontSize:12, color:ink3, margin:'4px 0 0', display:'flex', alignItems:'center', gap:5 }}>
              <Activity size={12}/> {t.sub}
            </p>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button onClick={load} style={{
              display:'flex', alignItems:'center', gap:6, padding:'8px 14px',
              borderRadius:10, border:'1px solid '+border,
              background:isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)',
              color:ink3, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
            }}>
              <RefreshCw size={13}/> {t.refresh}
            </button>
            <button onClick={() => handleExport('csv')} disabled={!!exporting} style={{
              display:'flex', alignItems:'center', gap:6, padding:'8px 14px',
              borderRadius:10, border:'1px solid rgba(34,197,94,0.3)',
              background: exporting==='csv' ? '#22C55E' : 'rgba(34,197,94,0.08)',
              color: exporting==='csv' ? '#fff' : '#22C55E',
              fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
            }}>
              <Download size={13}/> {t.exportCSV}
            </button>
            <button onClick={() => handleExport('excel')} disabled={!!exporting} style={{
              display:'flex', alignItems:'center', gap:6, padding:'8px 14px',
              borderRadius:10, border:'1px solid rgba(34,197,94,0.3)',
              background: exporting==='excel' ? '#22C55E' : 'rgba(34,197,94,0.08)',
              color: exporting==='excel' ? '#fff' : '#22C55E',
              fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
            }}>
              <Download size={13}/> {t.exportExcel}
            </button>
          </div>
        </div>
      </div>

      {/* ── Filtres ─────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        {/* Sélecteur serre */}
        <div style={{ display:'flex', gap:4 }}>
          {SERRES.map((s, i) => (
            <button key={s.id} onClick={() => setSerreIdx(i)} style={{
              padding:'7px 13px', borderRadius:8, fontSize:12, fontWeight:600,
              fontFamily:'inherit', cursor:'pointer', transition:'all 0.15s',
              border:'1px solid '+(serreIdx===i ? s.color+'60':'border'),
              background: serreIdx===i ? s.color+'18':'transparent',
              color: serreIdx===i ? s.color : ink3,
            }}>{s.code}</button>
          ))}
        </div>

        {/* Date picker */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={() => {
            const d = new Date(dateSelect); d.setDate(d.getDate()-1)
            setDateSelect(d.toISOString().slice(0,10))
          }} style={{ background:'none', border:'1px solid '+border, borderRadius:7, cursor:'pointer',
            color:ink3, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ChevronLeft size={14}/>
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:cardBg,
            border:'1px solid '+border, borderRadius:8, padding:'6px 12px' }}>
            <Calendar size={13} color={serre.color}/>
            <input
              type="date"
              value={dateSelect}
              max={todayISO()}
              onChange={e => setDateSelect(e.target.value)}
              style={{ background:'none', border:'none', outline:'none', color:ink,
                fontSize:13, fontWeight:600, fontFamily:'inherit', cursor:'pointer' }}
            />
          </div>
          <button onClick={() => {
            const d = new Date(dateSelect); d.setDate(d.getDate()+1)
            const today = todayISO()
            const next  = d.toISOString().slice(0,10)
            if (next <= today) setDateSelect(next)
          }} style={{ background:'none', border:'1px solid '+border, borderRadius:7, cursor:'pointer',
            color:ink3, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ChevronRight size={14}/>
          </button>
          <button onClick={() => setDateSelect(todayISO())} style={{
            padding:'5px 10px', borderRadius:7, border:'1px solid '+border, cursor:'pointer',
            fontSize:11, fontWeight:600, color:serre.color, background:serre.color+'10',
            fontFamily:'inherit',
          }}>Aujourd'hui</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'3rem', color:ink3, fontSize:14 }}>
          <RefreshCw size={18} style={{ animation:'spin 1s linear infinite', marginBottom:8 }}/>
          <br/>{t.loading}
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════
              BLOC 1 — Résumé du jour : cartes activations
          ══════════════════════════════════════════════════ */}
          <div style={{ background:cardBg, border:'1px solid '+border, borderRadius:18,
            padding:'20px 24px', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ width:32, height:32, borderRadius:9, display:'flex', alignItems:'center',
                  justifyContent:'center', background:serre.color+'18', color:serre.color, fontSize:16 }}>📋</span>
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
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10 }}>
                {ACTIONS.map(action => {
                  const data = resume?.actions?.[action.key]
                  const count = data?.count || 0
                  if (count === 0) return null
                  const times = data?.activations?.map(a => fmtDate(a.timestamp)) || []
                  return (
                    <div key={action.key} style={{
                      borderRadius:12, padding:'12px 14px',
                      border:'1px solid '+action.color+'30',
                      background:isDark ? action.color+'10' : action.color+'07',
                    }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
                        <span style={{ fontSize:16 }}>{action.emoji}</span>
                        <span style={{ fontSize:11, fontWeight:700, color:ink }}>
                          {lang==='FR' ? action.labelFR : action.labelEN}
                        </span>
                      </div>
                      <div style={{ fontSize:24, fontWeight:800, color:action.color,
                        fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>
                        {count}
                        <span style={{ fontSize:11, fontWeight:500, color:ink3, marginLeft:4 }}>
                          {t.activations}
                        </span>
                      </div>
                      {times.length > 0 && (
                        <div style={{ marginTop:8, display:'flex', flexWrap:'wrap', gap:3 }}>
                          {times.slice(0, 6).map((h, i) => (
                            <span key={i} style={{
                              fontSize:9, fontFamily:"'JetBrains Mono',monospace",
                              padding:'1px 5px', borderRadius:4,
                              background:action.color+'20', color:action.color,
                            }}>{h}</span>
                          ))}
                          {times.length > 6 && (
                            <span style={{ fontSize:9, color:ink4 }}>+{times.length-6}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Note visualisation */}
            <div style={{ marginTop:12, fontSize:10, color:ink4, display:'flex', alignItems:'center', gap:5,
              borderTop:'1px solid '+border, paddingTop:10 }}>
              <Clock size={10}/> {t.visOnly}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              BLOC 2 — Timeline Gantt 24h
          ══════════════════════════════════════════════════ */}
          <div style={{ background:cardBg, border:'1px solid '+border, borderRadius:18,
            padding:'20px 24px', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <span style={{ width:32, height:32, borderRadius:9, display:'flex', alignItems:'center',
                justifyContent:'center', background:serre.color+'18', color:serre.color, fontSize:16 }}>⏱</span>
              <div>
                <div style={{ fontSize:14, fontWeight:800, color:ink }}>{t.timeline}</div>
                <div style={{ fontSize:11, color:ink3 }}>{dateSelect}</div>
              </div>
            </div>

            <GanttChart
              resume={resume} isDark={isDark} ink={ink} ink3={ink3} ink4={ink4}
              border={border} lang={lang}
            />
          </div>

          {/* ══════════════════════════════════════════════════
              BLOC 3 — Fréquence par jour (bar chart)
          ══════════════════════════════════════════════════ */}
          <div style={{ background:cardBg, border:'1px solid '+border, borderRadius:18,
            padding:'20px 24px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
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

            <FrequenceChart
              data={frequence} isDark={isDark} ink={ink} ink3={ink3} ink4={ink4}
              border={border} lang={lang}
            />
          </div>
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  GANTT CHART — Timeline 24h des activations
// ═══════════════════════════════════════════════════════════════════════════
function GanttChart({ resume, isDark, ink, ink3, ink4, border, lang }) {
  const HEURES = Array.from({ length: 25 }, (_, i) => i) // 0h à 24h
  const MIN_TOTAL = 24 * 60

  const actionsAvecData = ACTIONS.filter(a => {
    const d = resume?.actions?.[a.key]
    return d && (d.activations?.length > 0 || d.inactivations?.length > 0)
  })

  if (!actionsAvecData.length) {
    return (
      <div style={{ textAlign:'center', padding:'2rem', color:ink4, fontSize:13,
        background:isDark?'rgba(255,255,255,0.02)':'rgba(0,0,0,0.02)',
        borderRadius:12, border:'1px dashed '+border }}>
        {lang==='FR' ? 'Aucune activation ce jour.' : 'No activations this day.'}
      </div>
    )
  }

  return (
    <div style={{ overflowX:'auto' }}>
      {/* Axe heures */}
      <div style={{ display:'flex', marginLeft:130, marginBottom:4, position:'relative', minWidth:600 }}>
        {HEURES.map(h => (
          <div key={h} style={{ flex:1, textAlign:'center', fontSize:9,
            color:ink4, fontFamily:"'JetBrains Mono',monospace" }}>
            {String(h).padStart(2,'0')}h
          </div>
        ))}
      </div>

      {/* Lignes par équipement */}
      {actionsAvecData.map(action => {
        const data    = resume?.actions?.[action.key] || {}
        const actList = data.activations    || []
        const inList  = data.inactivations  || []

        // Construire les segments [debut, fin] en minutes
        const segments = []
        actList.forEach((act, i) => {
          const debut = isoToMinutes(act.timestamp)
          // La fin = timestamp de l'inactivation suivante, ou fin de journée
          const inac = inList.find(inn => new Date(inn.timestamp) > new Date(act.timestamp))
          const fin   = inac ? isoToMinutes(inac.timestamp) : Math.min(debut + 30, MIN_TOTAL)
          segments.push({ debut, fin: Math.max(fin, debut + 8) })
        })

        return (
          <div key={action.key} style={{ display:'flex', alignItems:'center', gap:10,
            marginBottom:6, minWidth:600+130 }}>
            {/* Label */}
            <div style={{ width:120, display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
              <span style={{ fontSize:14 }}>{action.emoji}</span>
              <span style={{ fontSize:11, fontWeight:600, color:ink, lineHeight:1.2 }}>
                {lang==='FR' ? action.labelFR : action.labelEN}
              </span>
            </div>

            {/* Barre de fond */}
            <div style={{ flex:1, height:28, background:isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.04)',
              borderRadius:6, position:'relative', border:'1px solid '+border }}>

              {/* Segments d'activation */}
              {segments.map((seg, si) => {
                const left  = (seg.debut / MIN_TOTAL) * 100
                const width = Math.max(0.4, ((seg.fin - seg.debut) / MIN_TOTAL) * 100)
                return (
                  <div key={si} style={{
                    position:'absolute', top:3, height:'calc(100% - 6px)',
                    left:left+'%', width:width+'%',
                    background:action.color,
                    borderRadius:4,
                    opacity:0.85,
                    boxShadow:'0 0 6px '+action.color+'60',
                    minWidth:4,
                  }} title={`${String(Math.floor(seg.debut/60)).padStart(2,'0')}:${String(seg.debut%60).padStart(2,'0')} → ${String(Math.floor(seg.fin/60)).padStart(2,'0')}:${String(seg.fin%60).padStart(2,'0')}`}/>
                )
              })}

              {/* Lignes heures grille */}
              {HEURES.slice(1,-1).map(h => (
                <div key={h} style={{ position:'absolute', top:0, bottom:0,
                  left:((h/24)*100)+'%', width:1,
                  background:isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.05)' }}/>
              ))}
            </div>

            {/* Compteur */}
            <span style={{ width:28, textAlign:'center', fontSize:11, fontWeight:700,
              color:action.color, fontFamily:"'JetBrains Mono',monospace", flexShrink:0 }}>
              {data.count || 0}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  FREQUENCE CHART — Bar chart groupé par jour
// ═══════════════════════════════════════════════════════════════════════════
function FrequenceChart({ data, isDark, ink, ink3, ink4, border, lang }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'2rem', color:ink4, fontSize:13,
        background:isDark?'rgba(255,255,255,0.02)':'rgba(0,0,0,0.02)',
        borderRadius:12, border:'1px dashed '+border }}>
        {lang==='FR' ? 'Aucune donnée sur cette période.' : 'No data for this period.'}
      </div>
    )
  }

  // Agréger par jour
  const jours = [...new Set(data.map(d => d.jour))].sort()
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

      {/* Grille de barres */}
      <div style={{ display:'flex', alignItems:'flex-end', gap:6, overflowX:'auto',
        paddingBottom:6, minHeight:160 }}>
        {jours.map(jour => {
          const jourData = ACTIONS.map(a => ({
            ...a,
            count: data.find(d => d.jour===jour && d.action===a.key)?.count || 0
          })).filter(a => a.count > 0)

          const totalJour = jourData.reduce((s,a)=>s+a.count, 0)
          const label = jour.slice(5) // MM-DD

          return (
            <div key={jour} style={{ display:'flex', flexDirection:'column', alignItems:'center',
              gap:4, flex:'0 0 auto', minWidth:48 }}>
              {/* Barres empilées */}
              <div style={{ width:'100%', display:'flex', flexDirection:'column-reverse',
                gap:1, height:120, justifyContent:'flex-start', alignItems:'stretch' }}>
                {jourData.map(a => {
                  const h = Math.max(4, (a.count / maxVal) * 110)
                  return (
                    <div key={a.key} title={`${lang==='FR'?a.labelFR:a.labelEN}: ${a.count}`}
                      style={{ height:h, background:a.color, borderRadius:3,
                        opacity:0.85, transition:'height 0.3s' }}/>
                  )
                })}
              </div>
              {/* Total */}
              <span style={{ fontSize:10, fontWeight:700, color:ink3,
                fontFamily:"'JetBrains Mono',monospace" }}>
                {totalJour || ''}
              </span>
              {/* Label date */}
              <span style={{ fontSize:9, color:ink4, fontFamily:"'JetBrains Mono',monospace" }}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
