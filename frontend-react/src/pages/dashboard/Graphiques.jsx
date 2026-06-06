// src/pages/dashboard/Graphiques.jsx
// Refonte complète : axes réels, zoom, navigation temporelle, tooltips avancés
// Bibliothèque : Chart.js (gardée pour compatibilité) — améliorations UX majeures
import { useState, useEffect, useRef, useCallback } from 'react'
import { iotAPI, dashboardAPI } from '../../api/client'
import Chart from 'chart.js/auto'
import 'chartjs-plugin-zoom'
import zoomPlugin from 'chartjs-plugin-zoom'
Chart.register(zoomPlugin)

const SERRES = [
  { id:1, code:'S01', nomFR:'Génétique & Amélioration',   nomEN:'Genetics & Improvement', color:'#22C55E' },
  { id:2, code:'S02', nomFR:'Horticulture',               nomEN:'Horticulture',           color:'#06B6D4' },
  { id:3, code:'S03', nomFR:'Agronomie',                  nomEN:'Agronomy',               color:'#F59E0B' },
  { id:4, code:'S04', nomFR:'Hydroponie',                 nomEN:'Hydroponics',            color:'#8B5CF6' },
  { id:5, code:'S05', nomFR:'Protection des Plantes',     nomEN:'Plant Protection',       color:'#EF4444' },
]

const CAPTEURS = [
  { key:'temperature', labelFR:'Température', labelEN:'Temperature', unit:'°C',    color:'#22C55E', optMin:18, optMax:28 },
  { key:'humidite',    labelFR:'Humidité',    labelEN:'Humidity',    unit:'%',     color:'#06B6D4', optMin:60, optMax:80 },
  { key:'vpd',         labelFR:'VPD',         labelEN:'VPD',         unit:'kPa',   color:'#8B5CF6', optMin:0.8,optMax:1.5 },
  { key:'co2',         labelFR:'CO₂',         labelEN:'CO₂',         unit:'ppm',   color:'#F59E0B', optMin:400,optMax:1200 },
  { key:'ph',          labelFR:'pH',          labelEN:'pH',          unit:'',      color:'#0891b2', optMin:5.5,optMax:7.0 },
  { key:'ec',          labelFR:'EC',          labelEN:'EC',          unit:'mS/cm', color:'#059669', optMin:1.5,optMax:3.5 },
]

const COLORS = ['#22C55E','#06B6D4','#8B5CF6','#F59E0B','#EF4444']

const T = {
  FR:{
    title:'Graphiques analytiques', sub:'Historique, tendances et comparaison inter-serres',
    historique:'Historique capteur', comparaison:'Comparaison inter-serres',
    h6:'6 h', h24:'24 h', h72:'3 j', h168:'7 j',
    noData:'Aucune donnée disponible pour cette période.',
    loading:'Chargement des données…',
    erreur:'Erreur lors du chargement.',
    resetZoom:'Réinitialiser zoom',
    optimalZone:'Zone optimale',
    tooltip:{date:'Date', valeur:'Valeur', unite:'Unité'},
  },
  EN:{
    title:'Analytics charts', sub:'History, trends and cross-greenhouse comparison',
    historique:'Sensor history', comparaison:'Cross-greenhouse comparison',
    h6:'6 h', h24:'24 h', h72:'3 d', h168:'7 d',
    noData:'No data available for this period.',
    loading:'Loading data…',
    erreur:'Error loading data.',
    resetZoom:'Reset zoom',
    optimalZone:'Optimal zone',
    tooltip:{date:'Date', valeur:'Value', unite:'Unit'},
  }
}

export default function Graphiques({ theme, lang }) {
  const isDark   = theme === 'dark'
  const t        = T[lang] || T.FR

  const [serreId, setSerreId] = useState(1)
  const [heures,  setHeures]  = useState(24)
  const [capteur, setCapteur] = useState('temperature')
  const [compCap, setCompCap] = useState('temperature')
  const [histMsg, setHistMsg] = useState('')
  const [compMsg, setCompMsg] = useState('')

  const histRef   = useRef(null)
  const compRef   = useRef(null)
  const histChart = useRef(null)
  const compChart = useRef(null)

  // Couleurs
  const tickColor  = isDark ? '#475569' : '#94A3B8'
  const gridColor  = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'
  const legColor   = isDark ? '#94A3B8' : '#64748B'
  const cardBg     = isDark ? 'rgba(16,27,46,0.85)' : '#FFFFFF'
  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
  const ink        = isDark ? '#F1F5F9' : '#0F172A'
  const ink3       = isDark ? '#94A3B8' : '#64748B'
  const surfaceBg  = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'

  const meta = CAPTEURS.find(c => c.key === capteur) || CAPTEURS[0]

  // Format label selon durée
  function fmtLabel(ts, heures) {
    const d = new Date(ts)
    const locale = lang === 'EN' ? 'en-US' : 'fr-FR'
    if (heures <= 24)  return d.toLocaleTimeString(locale, {hour:'2-digit', minute:'2-digit'})
    if (heures <= 72)  return d.toLocaleDateString(locale, {weekday:'short', hour:'2-digit', minute:'2-digit'})
    if (heures <= 168) return d.toLocaleDateString(locale, {month:'short', day:'numeric', hour:'2-digit'})
    return d.toLocaleDateString(locale, {month:'short', day:'numeric'})
  }

  function baseOptions(meta, showLegend=false) {
    return {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 400, easing:'easeInOutQuart' },
      interaction: { mode:'index', intersect:false },
      plugins: {
        legend: showLegend ? {
          display: true, position:'top',
          labels: { font:{family:'JetBrains Mono,monospace', size:11}, usePointStyle:true, color:legColor, boxWidth:8, padding:16 }
        } : { display:false },
        tooltip: {
          backgroundColor: isDark?'rgba(7,17,31,0.97)':'rgba(255,255,255,0.97)',
          borderColor: isDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)',
          borderWidth:1, padding:12,
          titleColor: isDark?'#F1F5F9':'#0F172A',
          bodyColor: isDark?'#94A3B8':'#64748B',
          titleFont:{family:'Manrope,system-ui,sans-serif',weight:'600',size:12},
          bodyFont:{family:'JetBrains Mono,monospace',size:12},
          callbacks: {
            label: (c) => ` ${c.dataset.label}: ${c.parsed.y != null ? `${c.parsed.y}${meta.unit?' '+meta.unit:''}` : '—'}`
          }
        },
        zoom: {
          zoom: { wheel:{enabled:true}, pinch:{enabled:true}, mode:'x' },
          pan:  { enabled:true, mode:'x' },
        }
      },
      scales: {
        x: {
          grid:  { display:false },
          border:{ display:false },
          ticks: { maxTicksLimit:8, font:{family:'JetBrains Mono,monospace', size:10}, color:tickColor, maxRotation:0 },
        },
        y: {
          grid:  { color:gridColor },
          border:{ display:false, dash:[4,4] },
          ticks: {
            font:{family:'JetBrains Mono,monospace', size:10}, color:tickColor,
            callback: v => meta.unit ? `${v} ${meta.unit}` : v
          }
        }
      }
    }
  }

  // ── Historique ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!histRef.current) return
      setHistMsg(t.loading)
      const cm = CAPTEURS.find(c => c.key === capteur) || CAPTEURS[0]
      try {
        const raw    = await iotAPI.getHistorique(serreId, capteur, heures)
        if (cancelled) return
        const points = Array.isArray(raw) ? raw : (raw?.data || raw?.mesures || [])
        if (!points.length) { setHistMsg(t.noData); return }

        const labels = points.map(d => fmtLabel(d.time || d.timestamp || d.heure || d.date, heures))
        const values = points.map(d => d.value ?? d.valeur ?? d[capteur] ?? null)

        // Annotation zone optimale
        const plugins = { ...baseOptions(cm).plugins }
        if (cm.optMin != null && cm.optMax != null) {
          plugins.annotation = {
            annotations: {
              zone: {
                type:'box', yMin:cm.optMin, yMax:cm.optMax,
                backgroundColor:`${cm.color}10`,
                borderColor:`${cm.color}25`, borderWidth:1,
                label:{ display:true, content:t.optimalZone,
                  font:{size:9,family:'JetBrains Mono,monospace'},
                  color:`${cm.color}80`, position:'start' }
              }
            }
          }
        }

        setHistMsg('')
        if (histChart.current) histChart.current.destroy()
        histChart.current = new Chart(histRef.current, {
          type:'line',
          data:{
            labels,
            datasets:[{
              label: lang==='EN' ? cm.labelEN : cm.labelFR,
              data: values,
              borderColor: cm.color,
              backgroundColor: cm.color+'14',
              borderWidth:2.5, tension:0.4,
              pointRadius: values.length>80 ? 0 : 3,
              pointHoverRadius:5,
              fill:true,
            }]
          },
          options:{
            ...baseOptions(cm),
            plugins: { ...baseOptions(cm).plugins, ...plugins },
          }
        })
      } catch(e) {
        if (!cancelled) setHistMsg(t.erreur)
        console.error('Historique error:', e)
      }
    }
    load()
    return () => { cancelled=true; if(histChart.current){histChart.current.destroy(); histChart.current=null} }
  }, [serreId, heures, capteur, isDark, lang])

  // ── Comparaison ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!compRef.current) return
      setCompMsg(t.loading)
      const cm = CAPTEURS.find(c => c.key === compCap) || CAPTEURS[0]
      try {
        const raw  = await dashboardAPI.getComparaison(compCap)
        if (cancelled) return
        const data = Array.isArray(raw) ? raw : (raw?.serres || raw?.data || [])
        if (!data.length) { setCompMsg(t.noData); return }

        const allTimes  = [...new Set(data.flatMap(s => (s.data||s.mesures||[]).map(d => d.time||d.timestamp||d.heure)))].sort()
        if (!allTimes.length) { setCompMsg(t.noData); return }

        const labels   = allTimes.map(ts => fmtLabel(ts, 24))
        const datasets = data.map((s, i) => {
          const pts = s.data || s.mesures || []
          const map = Object.fromEntries(pts.map(d => [d.time||d.timestamp||d.heure, d.value??d.valeur??d[compCap]]))
          const nom = lang==='EN'
            ? (s.nom_en||s.nom_fr||s.code||`S0${i+1}`).split('&')[0].trim()
            : (s.nom_fr||s.code||`S0${i+1}`).split('&')[0].trim()
          const color = COLORS[i % COLORS.length]
          return {
            label: nom, data: allTimes.map(ts => map[ts]??null),
            borderColor:color, backgroundColor:color+'18',
            borderWidth:2.5, pointRadius:0, pointHoverRadius:4,
            fill:false, tension:0.4, spanGaps:true,
          }
        })

        setCompMsg('')
        if (compChart.current) compChart.current.destroy()
        compChart.current = new Chart(compRef.current, {
          type:'line',
          data:{ labels, datasets },
          options:{ ...baseOptions(cm, true) }
        })
      } catch(e) {
        if (!cancelled) setCompMsg(t.erreur)
        console.error('Comparaison error:', e)
      }
    }
    load()
    return () => { cancelled=true; if(compChart.current){compChart.current.destroy(); compChart.current=null} }
  }, [compCap, isDark, lang])

  // ── Styles ──────────────────────────────────────────────────
  const tabBtn = (active, color) => ({
    padding:'6px 14px', borderRadius:999, fontSize:12, fontWeight:600,
    border:`1px solid ${active ? color+'55' : (isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)')}`,
    background: active ? color+'15' : (isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.02)'),
    color: active ? color : ink3, cursor:'pointer',
    fontFamily:"'Manrope','DM Sans',system-ui,sans-serif",
    transition:'all 0.15s',
  })

  const dureeOpts = [
    { val:6,   label:t.h6   },
    { val:24,  label:t.h24  },
    { val:72,  label:t.h72  },
    { val:168, label:t.h168 },
  ]

  const selStyle = {
    background: isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)',
    border:`1px solid ${isDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.08)'}`,
    borderRadius:10, padding:'7px 12px', fontSize:13, fontWeight:500,
    color:ink, outline:'none', cursor:'pointer', fontFamily:"'Manrope',system-ui,sans-serif",
  }

  return (
    <div style={{ fontFamily:"'Manrope','DM Sans',system-ui,sans-serif" }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:'clamp(1.1rem,2vw,1.4rem)', fontWeight:800, margin:'0 0 4px', color:ink, letterSpacing:'-0.02em' }}>
          {t.title}
        </h1>
        <div style={{ fontSize:13, color:ink3 }}>{t.sub}</div>
      </div>

      {/* ── Historique ── */}
      <div style={{ background:cardBg, border:`1px solid ${cardBorder}`, borderRadius:18, padding:'20px 24px', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:12 }}>
          <h2 style={{ fontSize:14, fontWeight:700, margin:0, color:ink }}>{t.historique}</h2>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
            <select style={selStyle} value={serreId} onChange={e => setSerreId(Number(e.target.value))}>
              {SERRES.map(s => (
                <option key={s.id} value={s.id}>{s.code} — {lang==='EN'?s.nomEN:s.nomFR}</option>
              ))}
            </select>
            <div style={{ display:'flex', gap:4 }}>
              {dureeOpts.map(d => (
                <button key={d.val} onClick={() => setHeures(d.val)} style={tabBtn(heures===d.val, '#22C55E')}>
                  {d.label}
                </button>
              ))}
            </div>
            {histChart.current && (
              <button onClick={() => histChart.current?.resetZoom()} style={tabBtn(false,'#06B6D4')}>
                {t.resetZoom}
              </button>
            )}
          </div>
        </div>

        {/* Capteur tabs */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
          {CAPTEURS.map(c => (
            <button key={c.key} onClick={() => setCapteur(c.key)} style={tabBtn(capteur===c.key, c.color)}>
              {lang==='EN' ? c.labelEN : c.labelFR}
              {c.unit && <span style={{ fontSize:10, opacity:0.7, marginLeft:4 }}>{c.unit}</span>}
            </button>
          ))}
        </div>

        {/* Optimal zone info */}
        {meta.optMin != null && (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, padding:'6px 12px',
            background:`${meta.color}08`, border:`1px solid ${meta.color}20`, borderRadius:8,
            fontSize:11, color:meta.color, fontWeight:600 }}>
            <span style={{ width:8, height:8, borderRadius:2, background:`${meta.color}40` }} />
            {t.optimalZone} : {meta.optMin}–{meta.optMax} {meta.unit}
          </div>
        )}

        <div style={{ height:280, position:'relative' }}>
          {histMsg && (
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:13, color:ink3, zIndex:1 }}>
              {histMsg}
            </div>
          )}
          <canvas ref={histRef} style={{ opacity: histMsg ? 0 : 1 }} />
        </div>
        <div style={{ fontSize:10, color:ink3, marginTop:8, textAlign:'center' }}>
          {lang==='FR'
            ? '🖱 Molette pour zoomer · Glisser pour naviguer · Double-clic pour réinitialiser'
            : '🖱 Scroll to zoom · Drag to navigate · Double-click to reset'}
        </div>
      </div>

      {/* ── Comparaison ── */}
      <div style={{ background:cardBg, border:`1px solid ${cardBorder}`, borderRadius:18, padding:'20px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:12 }}>
          <h2 style={{ fontSize:14, fontWeight:700, margin:0, color:ink }}>{t.comparaison}</h2>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <select style={selStyle} value={compCap} onChange={e => setCompCap(e.target.value)}>
              {CAPTEURS.map(c => (
                <option key={c.key} value={c.key}>{lang==='EN'?c.labelEN:c.labelFR}</option>
              ))}
            </select>
            {compChart.current && (
              <button onClick={() => compChart.current?.resetZoom()} style={tabBtn(false,'#06B6D4')}>
                {t.resetZoom}
              </button>
            )}
          </div>
        </div>

        {/* Legend dots */}
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:12 }}>
          {SERRES.map((s,i) => (
            <div key={s.id} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:ink3 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:COLORS[i%COLORS.length] }} />
              {s.code}
            </div>
          ))}
        </div>

        <div style={{ height:280, position:'relative' }}>
          {compMsg && (
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:13, color:ink3, zIndex:1 }}>
              {compMsg}
            </div>
          )}
          <canvas ref={compRef} style={{ opacity: compMsg ? 0 : 1 }} />
        </div>
      </div>
    </div>
  )
}
