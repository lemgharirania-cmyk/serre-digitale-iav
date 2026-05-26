// src/pages/dashboard/Graphiques.jsx
import { useState, useEffect, useRef } from 'react'
import { iotAPI, dashboardAPI } from '../../api/client'
import Chart from 'chart.js/auto'

const SERRES = [
  { id:1, code:'S01', nomFR:'Génétique & Amélioration',   nomEN:'Genetics & Improvement' },
  { id:2, code:'S02', nomFR:'Horticulture',               nomEN:'Horticulture' },
  { id:3, code:'S03', nomFR:'Agronomie',                  nomEN:'Agronomy' },
  { id:4, code:'S04', nomFR:'Hydroponie',                 nomEN:'Hydroponics' },
  { id:5, code:'S05', nomFR:'Protection des Plantes',     nomEN:'Plant Protection' },
]

const CAPTEURS = [
  { key:'temperature', labelFR:'Température', labelEN:'Temperature', unit:'°C',    color:'#2f9a64' },
  { key:'humidite',    labelFR:'Humidité',    labelEN:'Humidity',    unit:'%',     color:'#3773bd' },
  { key:'vpd',         labelFR:'VPD',         labelEN:'VPD',         unit:'kPa',   color:'#7c5ccf' },
  { key:'co2',         labelFR:'CO₂',         labelEN:'CO₂',         unit:'ppm',   color:'#d6932a' },
  { key:'ph',          labelFR:'pH',          labelEN:'pH',          unit:'',      color:'#0891b2' },
  { key:'ec',          labelFR:'EC',          labelEN:'EC',          unit:'mS/cm', color:'#059669' },
]

const COLORS = ['#2f9a64','#3773bd','#9333ea','#06b6d4','#d6932a']

const T = {
  FR:{
    title:'Graphiques', sub:'Historique et comparaison inter-serres',
    historique:'Historique capteurs', comparaison:'Comparaison inter-serres',
    h6:'6 heures', h24:'24 heures', h72:'3 jours', h168:'7 jours',
    noData:'Aucune donnée disponible pour cette période.',
    loading:'Chargement...',
    erreur:'Erreur de chargement des données.',
  },
  EN:{
    title:'Charts', sub:'History and cross-greenhouse comparison',
    historique:'Sensor history', comparaison:'Cross-greenhouse comparison',
    h6:'6 hours', h24:'24 hours', h72:'3 days', h168:'7 days',
    noData:'No data available for this period.',
    loading:'Loading...',
    erreur:'Error loading data.',
  }
}

export default function Graphiques({ theme, lang }) {
  const isDark   = theme === 'dark'
  const t        = T[lang] || T.FR

  const [serreId,   setSerreId]   = useState(1)
  const [heures,    setHeures]    = useState(24)
  const [capteur,   setCapteur]   = useState('temperature')
  const [compCap,   setCompCap]   = useState('temperature')
  const [histMsg,   setHistMsg]   = useState('')
  const [compMsg,   setCompMsg]   = useState('')

  const histRef   = useRef(null)
  const compRef   = useRef(null)
  const histChart = useRef(null)
  const compChart = useRef(null)

  // Couleurs thème
  const tickColor   = isDark ? '#64748B' : '#9aa8a0'
  const gridColor   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(16,48,36,0.06)'
  const legendColor = isDark ? '#94A3B8' : '#6b7e75'
  const cardBg      = isDark ? 'rgba(16,27,46,0.82)' : 'white'
  const cardBorder  = isDark ? 'rgba(255,255,255,0.07)' : 'var(--border)'
  const ink3        = isDark ? '#94A3B8' : 'var(--ink-3)'

  function chartOptions(meta) {
    return {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxTicksLimit: 10, font: { family: 'JetBrains Mono', size: 10 }, color: tickColor }
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            font: { family: 'JetBrains Mono', size: 10 }, color: tickColor,
            callback: v => meta.unit ? `${v} ${meta.unit}` : v
          }
        }
      }
    }
  }

  function compOptions(meta) {
    return {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { font: { family: 'JetBrains Mono', size: 11 }, usePointStyle: true, color: legendColor } },
        tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.parsed.y}${meta.unit ? ' '+meta.unit : ''}` } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 8, font: { family: 'JetBrains Mono', size: 10 }, color: tickColor } },
        y: { grid: { color: gridColor }, ticks: { font: { family: 'JetBrains Mono', size: 10 }, color: tickColor } }
      }
    }
  }

  // ── Historique ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!histRef.current) return
      setHistMsg(t.loading)
      const meta = CAPTEURS.find(c => c.key === capteur)
      try {
        const raw    = await iotAPI.getHistorique(serreId, capteur, heures)
        if (cancelled) return

        // Support both {data:[...]} and [...] shapes
        const points = Array.isArray(raw) ? raw : (raw?.data || raw?.mesures || [])

        if (!points.length) { setHistMsg(t.noData); return }

        const locale = lang === 'EN' ? 'en-US' : 'fr-FR'
        const labels = points.map(d =>
          new Date(d.time || d.timestamp || d.heure || d.date).toLocaleTimeString(locale, { hour:'2-digit', minute:'2-digit' })
        )
        const values = points.map(d => d.value ?? d.valeur ?? d[capteur] ?? null)

        setHistMsg('')
        if (histChart.current) histChart.current.destroy()
        histChart.current = new Chart(histRef.current, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: lang === 'EN' ? meta.labelEN : meta.labelFR,
              data: values,
              borderColor: meta.color,
              backgroundColor: meta.color + '18',
              borderWidth: 2, tension: 0.4,
              pointRadius: values.length > 60 ? 0 : 3,
              fill: true,
            }]
          },
          options: chartOptions(meta)
        })
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
  }, [serreId, heures, capteur, isDark, lang])

  // ── Comparaison ───────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!compRef.current) return
      setCompMsg(t.loading)
      const meta = CAPTEURS.find(c => c.key === compCap)
      try {
        const raw = await dashboardAPI.getComparaison(compCap)
        if (cancelled) return

        const data = Array.isArray(raw) ? raw : (raw?.serres || raw?.data || [])
        if (!data.length) { setCompMsg(t.noData); return }

        const locale    = lang === 'EN' ? 'en-US' : 'fr-FR'
        const allTimes  = [...new Set(data.flatMap(s => (s.data||s.mesures||[]).map(d => d.time || d.timestamp || d.heure)))].sort()
        if (!allTimes.length) { setCompMsg(t.noData); return }

        const labels   = allTimes.map(ts => new Date(ts).toLocaleTimeString(locale, { hour:'2-digit', minute:'2-digit' }))
        const datasets = data.map((s, i) => {
          const pts = s.data || s.mesures || []
          const map = Object.fromEntries(pts.map(d => [d.time || d.timestamp || d.heure, d.value ?? d.valeur ?? d[compCap]]))
          const nom = lang === 'EN'
            ? (s.nom_en || s.nom_fr || s.code || `S0${i+1}`).split('&')[0].trim()
            : (s.nom_fr || s.code || `S0${i+1}`).split('&')[0].trim()
          return {
            label: nom,
            data: allTimes.map(ts => map[ts] ?? null),
            borderColor: COLORS[i % COLORS.length],
            borderWidth: 2, pointRadius: 0,
            fill: false, tension: 0.4, spanGaps: true,
          }
        })

        setCompMsg('')
        if (compChart.current) compChart.current.destroy()
        compChart.current = new Chart(compRef.current, {
          type: 'line',
          data: { labels, datasets },
          options: compOptions(meta)
        })
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

  const tabStyle = (active, color) => ({
    padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500,
    border: `1px solid ${active ? color+'60' : (isDark ? 'rgba(255,255,255,0.08)' : 'var(--border)')}`,
    cursor: 'pointer', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
    background: active ? color+'18' : (isDark ? 'rgba(255,255,255,0.04)' : 'var(--surface-glass)'),
    color: active ? color : (isDark ? '#94A3B8' : 'var(--ink-2)'),
    transition: 'all 0.15s',
  })

  const dureeOptions = [
    { val:6,   label:t.h6   },
    { val:24,  label:t.h24  },
    { val:72,  label:t.h72  },
    { val:168, label:t.h168 },
  ]

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>{t.title}</h1>
          <div className="admin-sub">{t.sub}</div>
        </div>
      </div>

      {/* ── Historique ── */}
      <div className="panel" style={{ background: cardBg, borderColor: cardBorder, marginBottom: 16 }}>
        <div className="panel-head">
          <h2>{t.historique}</h2>
        </div>

        {/* Serre + période */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          <select className="graph-select" value={serreId} onChange={e => setSerreId(Number(e.target.value))}>
            {SERRES.map(s => (
              <option key={s.id} value={s.id}>
                {s.code} — {lang === 'EN' ? s.nomEN : s.nomFR}
              </option>
            ))}
          </select>
          <select className="graph-select" value={heures} onChange={e => setHeures(Number(e.target.value))}>
            {dureeOptions.map(d => <option key={d.val} value={d.val}>{d.label}</option>)}
          </select>
        </div>

        {/* Capteur tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {CAPTEURS.map(c => (
            <button key={c.key} onClick={() => setCapteur(c.key)} style={tabStyle(capteur === c.key, c.color)}>
              {lang === 'EN' ? c.labelEN : c.labelFR}
            </button>
          ))}
        </div>

        {/* Chart area */}
        <div style={{ height: 260, position: 'relative' }}>
          {histMsg && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 13, color: ink3, zIndex: 1,
            }}>
              {histMsg}
            </div>
          )}
          <canvas ref={histRef} style={{ opacity: histMsg ? 0 : 1 }} />
        </div>
      </div>

      {/* ── Comparaison ── */}
      <div className="panel" style={{ background: cardBg, borderColor: cardBorder }}>
        <div className="panel-head">
          <h2>{t.comparaison}</h2>
          <select className="graph-select" value={compCap} onChange={e => setCompCap(e.target.value)}>
            {CAPTEURS.map(c => (
              <option key={c.key} value={c.key}>{lang === 'EN' ? c.labelEN : c.labelFR}</option>
            ))}
          </select>
        </div>

        <div style={{ height: 260, position: 'relative' }}>
          {compMsg && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 13, color: ink3, zIndex: 1,
            }}>
              {compMsg}
            </div>
          )}
          <canvas ref={compRef} style={{ opacity: compMsg ? 0 : 1 }} />
        </div>
      </div>
    </>
  )
}
