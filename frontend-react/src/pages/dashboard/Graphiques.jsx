// src/pages/dashboard/Graphiques.jsx
import { useState, useEffect, useRef } from 'react'
import { iotAPI, dashboardAPI } from '../../api/client'
import Chart from 'chart.js/auto'

const SERRES = [
  { id:1, code:'S01', nom:'Génétique' },
  { id:2, code:'S02', nom:'Horticulture' },
  { id:3, code:'S03', nom:'Agronomie' },
  { id:4, code:'S04', nom:'Hydroponie' },
  { id:5, code:'S05', nom:'Protection' },
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
  },
  EN:{
    title:'Charts', sub:'History and cross-greenhouse comparison',
    historique:'Sensor history', comparaison:'Cross-greenhouse comparison',
    h6:'6 hours', h24:'24 hours', h72:'3 days', h168:'7 days',
  }
}

export default function Graphiques({ theme, lang }) {
  const isDark   = theme === 'dark'
  const t        = T[lang] || T.FR
  const [serreId, setSerreId] = useState(1)
  const [heures,  setHeures]  = useState(24)
  const [capteur, setCapteur] = useState('temperature')
  const [compCap, setCompCap] = useState('temperature')
  const histRef   = useRef(null)
  const compRef   = useRef(null)
  const histChart = useRef(null)
  const compChart = useRef(null)

  // Couleurs selon thème pour Chart.js
  const tickColor  = isDark ? '#64748B' : '#9aa8a0'
  const gridColor  = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(16,48,36,0.06)'
  const legendColor= isDark ? '#94A3B8' : '#6b7e75'
  const cardBg     = isDark ? 'rgba(22,35,56,0.85)' : 'white'
  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : 'var(--border)'
  const tabActive  = isDark
    ? 'linear-gradient(135deg,rgba(34,197,94,0.2),rgba(6,182,212,0.15))'
    : 'var(--ink)'
  const tabActiveColor = isDark ? '#F8FAFC' : 'white'
  const tabInactiveBg  = isDark ? 'rgba(255,255,255,0.04)' : 'var(--surface-glass)'
  const tabInactiveColor= isDark ? '#94A3B8' : 'var(--ink-2)'

  // Chart options factory
  function chartOptions(meta) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend:{ display:false } },
      scales: {
        x: { grid:{ display:false }, ticks:{ maxTicksLimit:10, font:{ family:'JetBrains Mono', size:10 }, color:tickColor } },
        y: { grid:{ color:gridColor }, ticks:{ font:{ family:'JetBrains Mono', size:10 }, color:tickColor, callback: v => `${v} ${meta.unit}` } }
      }
    }
  }
  function compOptions(meta) {
    return {
      responsive:true, maintainAspectRatio:false,
      plugins:{
        legend:{ position:'top', labels:{ font:{ family:'JetBrains Mono', size:11 }, usePointStyle:true, color:legendColor } },
        tooltip:{ callbacks:{ label: c => `${c.dataset.label}: ${c.parsed.y} ${meta.unit}` } }
      },
      scales:{
        x:{ grid:{ display:false }, ticks:{ maxTicksLimit:8, font:{ family:'JetBrains Mono', size:10 }, color:tickColor } },
        y:{ grid:{ color:gridColor }, ticks:{ font:{ family:'JetBrains Mono', size:10 }, color:tickColor } }
      }
    }
  }

  // Historique chart
  useEffect(() => {
    async function load() {
      const meta = CAPTEURS.find(c => c.key === capteur)
      try {
        const j = await iotAPI.getHistorique(serreId, capteur, heures)
        const locale = lang === 'EN' ? 'en-US' : 'fr-FR'
        const labels = j.data.map(d => new Date(d.time).toLocaleTimeString(locale, { hour:'2-digit', minute:'2-digit' }))
        const values = j.data.map(d => d.value)
        if (histChart.current) histChart.current.destroy()
        histChart.current = new Chart(histRef.current, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: lang === 'EN' ? meta.labelEN : meta.labelFR,
              data: values,
              borderColor: meta.color,
              backgroundColor: meta.color + '15',
              borderWidth: 2, tension: 0.4,
              pointRadius: values.length > 60 ? 0 : 3,
              fill: true,
            }]
          },
          options: chartOptions(meta)
        })
      } catch(e) { console.error(e) }
    }
    load()
    return () => { if (histChart.current) histChart.current.destroy() }
  }, [serreId, heures, capteur, isDark, lang])

  // Comparaison chart
  useEffect(() => {
    async function load() {
      const meta = CAPTEURS.find(c => c.key === compCap)
      try {
        const data = await dashboardAPI.getComparaison(compCap)
        if (!data) return
        const allTimes = [...new Set(data.flatMap(s => s.data.map(d => d.time)))].sort()
        const locale = lang === 'EN' ? 'en-US' : 'fr-FR'
        const labels = allTimes.map(t => new Date(t).toLocaleTimeString(locale, { hour:'2-digit', minute:'2-digit' }))
        const datasets = data.map((s, i) => {
          const map = Object.fromEntries(s.data.map(d => [d.time, d.value]))
          return {
            label: s.nom_fr?.split('&')[0].trim() || s.code,
            data: allTimes.map(t => map[t] ?? null),
            borderColor: COLORS[i], borderWidth:2, pointRadius:0,
            fill:false, tension:0.4, spanGaps:true,
          }
        })
        if (compChart.current) compChart.current.destroy()
        compChart.current = new Chart(compRef.current, {
          type:'line',
          data:{ labels, datasets },
          options: compOptions(meta)
        })
      } catch(e) { console.error(e) }
    }
    load()
    return () => { if (compChart.current) compChart.current.destroy() }
  }, [compCap, isDark, lang])

  const tabStyle = (active) => ({
    padding:'6px 14px', borderRadius:999, fontSize:12, fontWeight:500,
    border:'1px solid var(--border-strong)', cursor:'pointer',
    fontFamily:'var(--font-mono)', letterSpacing:'0.04em',
    background: active ? tabActive : tabInactiveBg,
    color: active ? tabActiveColor : tabInactiveColor,
    transition:'all 0.15s',
  })

  const dureeOptions = [
    { val:6,   label:t.h6  },
    { val:24,  label:t.h24 },
    { val:72,  label:t.h72 },
    { val:168, label:t.h168},
  ]

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>{t.title}</h1>
          <div className="admin-sub">{t.sub}</div>
        </div>
      </div>

      {/* Historique */}
      <div className="panel" style={{ background: isDark?'rgba(16,27,46,0.82)':'white', borderColor:cardBorder, marginBottom:16 }}>
        <div className="panel-head">
          <h2>{t.historique}</h2>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:14 }}>
          <select className="graph-select" value={serreId} onChange={e => setSerreId(Number(e.target.value))}>
            {SERRES.map(s => <option key={s.id} value={s.id}>{s.code} — {s.nom}</option>)}
          </select>
          <select className="graph-select" value={heures} onChange={e => setHeures(Number(e.target.value))}>
            {dureeOptions.map(d => <option key={d.val} value={d.val}>{d.label}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
          {CAPTEURS.map(c => (
            <button key={c.key} onClick={() => setCapteur(c.key)} style={tabStyle(capteur === c.key)}>
              {lang === 'EN' ? c.labelEN : c.labelFR}
            </button>
          ))}
        </div>
        <div style={{ height:260 }}>
          <canvas ref={histRef} />
        </div>
      </div>

      {/* Comparaison */}
      <div className="panel" style={{ background: isDark?'rgba(16,27,46,0.82)':'white', borderColor:cardBorder }}>
        <div className="panel-head">
          <h2>{t.comparaison}</h2>
          <select className="graph-select" value={compCap} onChange={e => setCompCap(e.target.value)}>
            {CAPTEURS.map(c => <option key={c.key} value={c.key}>{lang === 'EN' ? c.labelEN : c.labelFR}</option>)}
          </select>
        </div>
        <div style={{ height:260 }}>
          <canvas ref={compRef} />
        </div>
      </div>
    </>
  )
}
