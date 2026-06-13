// src/pages/dashboard/Graphiques.jsx
// ── Fixes : dropdown dark mode · export PNG · show all · zoom→période auto
import { useState, useEffect, useRef, useCallback } from 'react'
import { iotAPI, dashboardAPI } from '../../api/client'
import { useAccess } from '../../hooks/useAccess'
import Chart from 'chart.js/auto'
import zoomPlugin from 'chartjs-plugin-zoom'
import { Download, Layers } from 'lucide-react'

// Register zoom plugin globally (once)
Chart.register(zoomPlugin)

const SERRES = [
  { id:1, code:'S01', nomFR:'Génétique & Amélioration', nomEN:'Genetics & Improvement',  color:'#22C55E' },
  { id:2, code:'S02', nomFR:'Horticulture',             nomEN:'Horticulture',            color:'#06B6D4' },
  { id:3, code:'S03', nomFR:'Agronomie',                nomEN:'Agronomy',                color:'#F59E0B' },
  { id:4, code:'S04', nomFR:'Hydroponie',               nomEN:'Hydroponics',             color:'#8B5CF6' },
  { id:5, code:'S05', nomFR:'Protection des Plantes',   nomEN:'Plant Protection',        color:'#EF4444' },
]

const CAPTEURS = [
  { key:'temperature', labelFR:'Température', labelEN:'Temperature', unit:'°C',    color:'#22C55E' },
  { key:'humidite',    labelFR:'Humidité',    labelEN:'Humidity',    unit:'%',     color:'#3773bd' },
  { key:'vpd',         labelFR:'VPD',         labelEN:'VPD',         unit:'kPa',   color:'#8B5CF6' },
  { key:'co2',         labelFR:'CO₂',         labelEN:'CO₂',         unit:'ppm',   color:'#d6932a' },
  { key:'luminosite',  labelFR:'Luminosité',  labelEN:'Light (PPFD)',unit:'µmol/m²/s', color:'#F59E0B' },
  { key:'ph',          labelFR:'pH',          labelEN:'pH',          unit:'',      color:'#0891b2' },
  { key:'ec',          labelFR:'EC',          labelEN:'EC',          unit:'mS/cm', color:'#059669' },
]

const COLORS_COMP = ['#22C55E','#06B6D4','#8B5CF6','#F59E0B','#EF4444']

// Périodes : heures → label
const PERIODES = [
  { val:6,   labelFR:'6 h',  labelEN:'6 h'  },
  { val:24,  labelFR:'24 h', labelEN:'24 h' },
  { val:72,  labelFR:'3 j',  labelEN:'3 d'  },
  { val:168, labelFR:'7 j',  labelEN:'7 d'  },
  { val:720, labelFR:'30 j', labelEN:'30 d' },
]

// Zoom level → période (heures) : quand le zoom recule, on charge plus de données
const ZOOM_THRESHOLDS = [
  { maxPts: 30,  heures: 6   },
  { maxPts: 80,  heures: 24  },
  { maxPts: 200, heures: 72  },
  { maxPts: 400, heures: 168 },
  { maxPts: Infinity, heures: 720 },
]

const T = {
  FR:{
    title:'Graphiques analytiques', sub:'Historique, corrélations et comparaison inter-serres',
    historique:'Historique capteur', tousParams:'Tous les paramètres',
    comparaison:'Comparaison inter-serres',
    noData:'Aucune donnée pour cette période.',
    loading:'Chargement…', erreur:'Erreur de chargement.',
    export:'Exporter', exportPNG:'Image PNG', exportCSV:'Export CSV',
    resetZoom:'Réinitialiser zoom', showAll:'Tout afficher',
    zoomHint:'Molette = zoom · Glisser = déplacer · Double-clic = reset',
  },
  EN:{
    title:'Analytics charts', sub:'History, correlations and cross-greenhouse comparison',
    historique:'Sensor history', tousParams:'All parameters',
    comparaison:'Cross-greenhouse comparison',
    noData:'No data for this period.',
    loading:'Loading…', erreur:'Loading error.',
    export:'Export', exportPNG:'PNG image', exportCSV:'Export CSV',
    resetZoom:'Reset zoom', showAll:'Show all',
    zoomHint:'Scroll = zoom · Drag = pan · Double-click = reset',
  }
}

// ── Formater le label temporel selon la durée ─────────────────
function fmtLabel(ts, heures, locale) {
  const d = new Date(ts)
  if (heures <= 24)  return d.toLocaleTimeString(locale, { hour:'2-digit', minute:'2-digit' })
  if (heures <= 72)  return d.toLocaleDateString(locale, { weekday:'short' }) + ' ' + d.toLocaleTimeString(locale, { hour:'2-digit', minute:'2-digit' })
  return d.toLocaleDateString(locale, { month:'short', day:'numeric' })
}

export default function Graphiques({ theme, lang, userRole }) {
  const isDark  = theme === 'dark'
  const t       = T[lang] || T.FR
  const locale  = lang === 'EN' ? 'en-US' : 'fr-FR'
  const { canAccessSerre, allowedSerreId } = useAccess(userRole)

  const [serreId,  setSerreId]  = useState(allowedSerreId || 1)
  const [heures,   setHeures]   = useState(24)
  const [capteur,  setCapteur]  = useState('temperature')
  const [showAll,  setShowAll]  = useState(false)   // "Tous les paramètres"
  const [compCap,  setCompCap]  = useState('temperature')
  const [histMsg,  setHistMsg]  = useState('')
  const [compMsg,  setCompMsg]  = useState('')

  const histRef    = useRef(null)
  const compRef    = useRef(null)
  const histChart  = useRef(null)
  const compChart  = useRef(null)
  const heuresRef  = useRef(heures)   // ref pour accéder à heures dans les callbacks

  useEffect(() => { heuresRef.current = heures }, [heures])

  // ── Couleurs ──
  const cardBg    = isDark ? 'rgba(16,27,46,0.85)' : '#FFFFFF'
  const border    = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'
  const ink       = isDark ? '#F1F5F9' : '#0F172A'
  const ink3      = isDark ? '#94A3B8' : '#64748B'
  const ink4      = isDark ? '#475569' : '#94A3B8'
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'
  const tickColor = isDark ? '#475569' : '#94A3B8'
  const selBg     = isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF'
  const selColor  = isDark ? '#F1F5F9' : '#0F172A'
  const selBdr    = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'

  // Sélecteur custom dark-mode : <select> natif avec override de style
  const selStyle = {
    background: selBg, color: selColor,
    border: '1px solid ' + selBdr,
    borderRadius: 10, padding: '7px 12px',
    fontSize: 13, fontWeight: 500, outline: 'none', cursor: 'pointer',
    fontFamily: "'Manrope',system-ui,sans-serif",
    // forcer le fond en dark via colorScheme
    colorScheme: isDark ? 'dark' : 'light',
  }

  const tabBtn = (active, color) => ({
    padding:'6px 14px', borderRadius:999, fontSize:12, fontWeight:600,
    border:'1px solid ' + (active ? color+'55' : (isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)')),
    background: active ? color+'15' : (isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.02)'),
    color: active ? color : ink3, cursor:'pointer',
    fontFamily:"'Manrope',system-ui,sans-serif", transition:'all 0.15s',
  })

  // ── Export PNG ────────────────────────────────────────────
  function exportPNG(chartRef, filename) {
    if (!chartRef.current) return
    const url = chartRef.current.toBase64Image('image/png', 1.0)
    const a   = document.createElement('a')
    a.href     = url
    a.download = filename + '_' + new Date().toISOString().slice(0,10) + '.png'
    a.click()
  }

  // ── Export CSV historique ─────────────────────────────────
  const rawDataRef = useRef([])   // stocke les dernières données chargées
  function exportCSV() {
    if (!rawDataRef.current.length) return
    const meta = CAPTEURS.find(c => c.key === capteur)
    const rows = [
      ['timestamp', 'valeur', 'unite'],
      ...rawDataRef.current.map(d => [
        d.time || d.timestamp || d.heure || d.date,
        d.value ?? d.valeur ?? d[capteur] ?? '',
        meta?.unit || '',
      ])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const b   = new Blob([csv], { type:'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(b)
    const a   = document.createElement('a')
    a.href     = url
    a.download = 'SDI_S' + String(serreId).padStart(2,'0') + '_' + capteur + '_' + heures + 'h_' + new Date().toISOString().slice(0,10) + '.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Zoom → auto-switch de période ────────────────────────
  // Zoom IN  (molette haut, voir moins) → période plus courte : 30j→7j→3j→24h→6h
  // Zoom OUT (molette bas,  voir plus)  → période plus longue : 6h→24h→3j→7j→30j
  const prevRangeRef = useRef(null)
  const PERIODES_VALS = [6, 24, 72, 168, 720]

  const onZoomComplete = useCallback((ctx) => {
    const chart   = ctx.chart
    const scale   = chart.scales.x
    if (!scale) return

    const currentRange = scale.max - scale.min
    const prev         = prevRangeRef.current

    if (prev !== null) {
      const zoomedIn  = currentRange < prev * 0.75   // range diminué → zoom IN
      const zoomedOut = currentRange > prev * 1.33   // range augmenté → zoom OUT

      if (zoomedIn || zoomedOut) {
        const current = heuresRef.current
        const idx     = PERIODES_VALS.indexOf(current)

        let nextIdx = idx
        if (zoomedIn  && idx > 0)                       nextIdx = idx - 1  // plus court
        if (zoomedOut && idx < PERIODES_VALS.length - 1) nextIdx = idx + 1  // plus long

        if (nextIdx !== idx) {
          prevRangeRef.current = null
          setHeures(PERIODES_VALS[nextIdx])
          // reset le zoom visuel après rechargement
          setTimeout(() => { chart.resetZoom?.() }, 80)
          return
        }
      }
    }
    prevRangeRef.current = currentRange
  }, [])

  // ── options Chart.js communes ─────────────────────────────
  function makeOptions(isDark, onZoomCb) {
    return {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 300 },
      interaction: { mode:'index', intersect:false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark?'rgba(7,17,31,0.97)':'rgba(255,255,255,0.97)',
          borderColor: isDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)', borderWidth:1,
          padding:12, titleColor:isDark?'#F1F5F9':'#0F172A',
          bodyColor:isDark?'#94A3B8':'#64748B',
          titleFont:{ family:'Manrope,system-ui', size:12, weight:'600' },
          bodyFont:{ family:'JetBrains Mono,monospace', size:12 },
        },
        zoom: {
          zoom: {
            wheel:  { enabled: true, speed: 0.15 },
            pinch:  { enabled: true },
            mode:   'x',
            ...(onZoomCb ? { onZoomComplete: onZoomCb } : {}),
          },
          pan: { enabled: true, mode: 'x' },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxTicksLimit: 8, font:{ family:'JetBrains Mono,monospace', size:10 }, color:tickColor }
        },
        y: {
          grid: { color: gridColor },
          ticks: { font:{ family:'JetBrains Mono,monospace', size:10 }, color:tickColor }
        }
      }
    }
  }

  // ── Charger historique (1 capteur OU tous) ────────────────
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!histRef.current) return
      setHistMsg(t.loading)
      try {
        if (showAll) {
          // Charger tous les capteurs en parallèle
          const results = await Promise.all(
            CAPTEURS.map(cap => iotAPI.getHistorique(serreId, cap.key, heures).catch(() => []))
          )
          if (cancelled) return

          // Normaliser les points et construire un index temps commun
          const allData = results.map((raw, ci) => ({
            cap: CAPTEURS[ci],
            pts: Array.isArray(raw) ? raw : (raw?.data || raw?.mesures || []),
          }))

          const allTimes = [...new Set(
            allData.flatMap(d => d.pts.map(p => p.time || p.timestamp || p.heure || p.date))
          )].sort()

          if (!allTimes.length) { setHistMsg(t.noData); return }

          const labels   = allTimes.map(ts => fmtLabel(ts, heures, locale))
          const datasets = allData
            .filter(d => d.pts.length > 0)
            .map(d => {
              const map = Object.fromEntries(
                d.pts.map(p => [p.time||p.timestamp||p.heure||p.date, p.value??p.valeur??p[d.cap.key]])
              )
              // Normaliser 0-100 pour permettre la comparaison visuelle
              const vals = allTimes.map(ts => map[ts] ?? null)
              return {
                label: lang==='EN' ? d.cap.labelEN : d.cap.labelFR,
                data: vals,
                borderColor: d.cap.color,
                backgroundColor: 'transparent',
                borderWidth: 2, tension: 0.4,
                pointRadius: 0, pointHoverRadius: 4,
                fill: false, spanGaps: true,
                yAxisID: 'y',
              }
            })

          setHistMsg('')
          if (histChart.current) histChart.current.destroy()
          const opts = makeOptions(isDark, onZoomComplete)
          opts.plugins.legend = {
            display: true, position: 'top',
            labels: {
              font:{ family:'JetBrains Mono,monospace', size:10 },
              usePointStyle:true, color:isDark?'#94A3B8':'#64748B',
              boxWidth:8, padding:12,
            }
          }
          opts.scales.y.ticks.callback = v => v  // pas d'unité dans "tout"
          histChart.current = new Chart(histRef.current, { type:'line', data:{ labels, datasets }, options:opts })

        } else {
          // Un seul capteur
          const meta = CAPTEURS.find(c => c.key === capteur)
          const raw  = await iotAPI.getHistorique(serreId, capteur, heures)
          if (cancelled) return

          const pts = Array.isArray(raw) ? raw : (raw?.data || raw?.mesures || [])
          rawDataRef.current = pts  // pour export CSV
          if (!pts.length) { setHistMsg(t.noData); return }

          const labels = pts.map(d => fmtLabel(d.time||d.timestamp||d.heure||d.date, heures, locale))
          const values = pts.map(d => d.value ?? d.valeur ?? d[capteur] ?? null)

          setHistMsg('')
          if (histChart.current) histChart.current.destroy()
          const opts = makeOptions(isDark, onZoomComplete)
          opts.scales.y.ticks.callback = v => meta.unit ? v + ' ' + meta.unit : v
          histChart.current = new Chart(histRef.current, {
            type: 'line',
            data: {
              labels,
              datasets: [{
                label: lang==='EN' ? meta.labelEN : meta.labelFR,
                data: values,
                borderColor: meta.color,
                backgroundColor: meta.color + '14',
                borderWidth: 2.5, tension: 0.4,
                pointRadius: values.length > 80 ? 0 : 3,
                pointHoverRadius: 5, fill: true,
              }]
            },
            options: opts
          })
        }
      } catch(e) {
        if (!cancelled) setHistMsg(t.erreur)
        console.error('Historique error:', e)
      }
    }
    load()
    return () => {
      cancelled = true
      if (histChart.current) { histChart.current.destroy(); histChart.current = null }
    }
  }, [serreId, heures, capteur, showAll, isDark, lang])

  // ── Charger comparaison ───────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!compRef.current) return
      setCompMsg(t.loading)
      const meta = CAPTEURS.find(c => c.key === compCap)
      try {
        const raw  = await dashboardAPI.getComparaison(compCap)
        if (cancelled) return
        const data = Array.isArray(raw) ? raw : (raw?.serres || raw?.data || [])
        if (!data.length) { setCompMsg(t.noData); return }

        const allTimes = [...new Set(
          data.flatMap(s => (s.data||s.mesures||[]).map(d => d.time||d.timestamp||d.heure))
        )].sort()
        if (!allTimes.length) { setCompMsg(t.noData); return }

        const labels   = allTimes.map(ts => fmtLabel(ts, 24, locale))
        const datasets = data.map((s, i) => {
          const pts = s.data || s.mesures || []
          const map = Object.fromEntries(pts.map(d => [d.time||d.timestamp||d.heure, d.value??d.valeur??d[compCap]]))
          const nom = lang==='EN'
            ? (s.nom_en||s.nom_fr||s.code||`S0${i+1}`).split('&')[0].trim()
            : (s.nom_fr||s.code||`S0${i+1}`).split('&')[0].trim()
          return {
            label: nom, data: allTimes.map(ts => map[ts]??null),
            borderColor: COLORS_COMP[i%COLORS_COMP.length],
            borderWidth: 2, pointRadius: 0, pointHoverRadius: 4,
            fill: false, tension: 0.4, spanGaps: true,
          }
        })

        setCompMsg('')
        if (compChart.current) compChart.current.destroy()
        const opts = makeOptions(isDark, null)
        opts.plugins.legend = {
          display: true, position: 'top',
          labels: {
            font:{ family:'JetBrains Mono,monospace', size:11 },
            usePointStyle:true, color:isDark?'#94A3B8':'#64748B',
            boxWidth:8, padding:14,
          }
        }
        opts.scales.y.ticks.callback = v => meta.unit ? v + ' ' + meta.unit : v
        compChart.current = new Chart(compRef.current, { type:'line', data:{ labels, datasets }, options:opts })
      } catch(e) {
        if (!cancelled) setCompMsg(t.erreur)
        console.error('Comparaison error:', e)
      }
    }
    load()
    return () => {
      cancelled = true
      if (compChart.current) { compChart.current.destroy(); compChart.current = null }
    }
  }, [compCap, isDark, lang])

  // ── Rendu ─────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"'Manrope','DM Sans',system-ui,sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:'clamp(1.1rem,2vw,1.4rem)', fontWeight:800, margin:'0 0 4px', color:ink, letterSpacing:'-0.02em' }}>
          {t.title}
        </h1>
        <div style={{ fontSize:13, color:ink3 }}>{t.sub}</div>
      </div>

      {/* ══ Historique ══ */}
      <div style={{ background:cardBg, border:'1px solid ' + border, borderRadius:18, padding:'20px 24px', marginBottom:16 }}>

        {/* Toolbar ligne 1 : serre + durée + export */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:10 }}>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
            {/* Sélecteur serre — dark mode correct via colorScheme */}
            <select value={serreId} onChange={e => setSerreId(Number(e.target.value))} style={selStyle}>
              {SERRES.map(s => (
                <option key={s.id} value={s.id} disabled={!canAccessSerre(s.code)}
                  style={{ background:isDark?'#0F172A':'#FFFFFF', color:isDark?'#F1F5F9':'#0F172A' }}>
                  {s.code} — {lang==='EN' ? s.nomEN : s.nomFR}{!canAccessSerre(s.code)?' 🔒':''}
                </option>
              ))}
            </select>

            {/* Sélecteur période — pills boutons */}
            <div style={{ display:'flex', gap:4 }}>
              {PERIODES.map(p => (
                <button key={p.val} onClick={() => setHeures(p.val)} style={tabBtn(heures===p.val, '#22C55E')}>
                  {lang==='EN' ? p.labelEN : p.labelFR}
                </button>
              ))}
            </div>
          </div>

          {/* Boutons export */}
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={() => exportPNG(histChart, 'SDI_graphique_' + capteur)} style={{
              display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:9,
              border:'1px solid ' + border, background:isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)',
              color:ink3, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
            }}>
              <Download size={13}/> PNG
            </button>
            <button onClick={exportCSV} disabled={showAll} style={{
              display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:9,
              border:'1px solid ' + border,
              background: showAll ? (isDark?'rgba(255,255,255,0.02)':'rgba(0,0,0,0.02)') : (isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)'),
              color: showAll ? ink4 : ink3, fontSize:12, fontWeight:600,
              cursor: showAll ? 'not-allowed' : 'pointer', fontFamily:'inherit', opacity: showAll?0.5:1,
            }}>
              <Download size={13}/> CSV
            </button>
          </div>
        </div>

        {/* Toolbar ligne 2 : capteur tabs + "Tout afficher" */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14, alignItems:'center' }}>
          {/* Bouton "Tout afficher" */}
          <button onClick={() => setShowAll(v => !v)} style={{
            ...tabBtn(showAll, '#F59E0B'),
            display:'flex', alignItems:'center', gap:5,
          }}>
            <Layers size={13}/> {t.showAll}
          </button>
          {/* Capteur tabs — désactivés en mode "tout afficher" */}
          {CAPTEURS.map(c => (
            <button key={c.key} onClick={() => { setShowAll(false); setCapteur(c.key) }}
              style={{ ...tabBtn(!showAll && capteur===c.key, c.color), opacity:showAll?0.4:1, cursor:showAll?'default':'pointer' }}>
              {lang==='EN' ? c.labelEN : c.labelFR}
            </button>
          ))}
        </div>

        {/* Zone graphique */}
        <div style={{ height:280, position:'relative' }}>
          {histMsg && (
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:13, color:ink3, zIndex:1 }}>
              {histMsg}
            </div>
          )}
          <canvas ref={histRef} style={{ opacity:histMsg?0:1 }}
            onDoubleClick={() => histChart.current?.resetZoom?.()}
          />
        </div>

        {/* Reset + légende zoom */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
          <button onClick={() => histChart.current?.resetZoom?.()} style={{
            fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:8,
            border:'1px solid ' + border, background:isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)',
            color:ink3, cursor:'pointer', fontFamily:'inherit',
          }}>
            ↺ {t.resetZoom}
          </button>
          <span style={{ fontSize:10, color:ink4, fontFamily:'monospace' }}>
            {t.zoomHint}
          </span>
        </div>
      </div>

      {/* ══ Comparaison inter-serres ══ */}
      <div style={{ background:cardBg, border:'1px solid ' + border, borderRadius:18, padding:'20px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
          <h2 style={{ fontSize:14, fontWeight:700, margin:0, color:ink }}>{t.comparaison}</h2>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <select value={compCap} onChange={e => setCompCap(e.target.value)} style={selStyle}>
              {CAPTEURS.map(c => (
                <option key={c.key} value={c.key}
                  style={{ background:isDark?'#0F172A':'#FFFFFF', color:isDark?'#F1F5F9':'#0F172A' }}>
                  {lang==='EN' ? c.labelEN : c.labelFR}
                </option>
              ))}
            </select>
            <button onClick={() => exportPNG(compChart, 'SDI_comparaison_' + compCap)} style={{
              display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:9,
              border:'1px solid ' + border, background:isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)',
              color:ink3, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
            }}>
              <Download size={13}/> PNG
            </button>
          </div>
        </div>

        {/* Légende dots serres */}
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:12 }}>
          {SERRES.map((s,i) => (
            <div key={s.id} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:ink3 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:COLORS_COMP[i%COLORS_COMP.length] }}/>
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
          <canvas ref={compRef} style={{ opacity:compMsg?0:1 }}/>
        </div>
      </div>
    </div>
  )
}
