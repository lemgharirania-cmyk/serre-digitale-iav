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
  { key:'temperature', label:'Température', unit:'°C', color:'#2f9a64' },
  { key:'humidite',    label:'Humidité',    unit:'%',  color:'#3773bd' },
  { key:'vpd',         label:'VPD',         unit:'kPa',color:'#7c5ccf' },
  { key:'co2',         label:'CO₂',         unit:'ppm',color:'#d6932a' },
  { key:'ph',          label:'pH',          unit:'',   color:'#0891b2' },
  { key:'ec',          label:'EC',          unit:'mS/cm',color:'#059669'},
]
const COLORS = ['#2f9a64','#3773bd','#9333ea','#06b6d4','#d6932a']

export default function Graphiques() {
  const [serreId, setSerreId]   = useState(1)
  const [heures, setHeures]     = useState(24)
  const [capteur, setCapteur]   = useState('temperature')
  const [compCap, setCompCap]   = useState('temperature')
  const histRef  = useRef(null)
  const compRef  = useRef(null)
  const histChart = useRef(null)
  const compChart = useRef(null)

  // Historique chart
  useEffect(() => {
    async function load() {
      const meta = CAPTEURS.find(c => c.key === capteur)
      try {
        const j = await iotAPI.getHistorique(serreId, capteur, heures)
        const labels = j.data.map(d => new Date(d.time).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }))
        const values = j.data.map(d => d.value)
        if (histChart.current) histChart.current.destroy()
        histChart.current = new Chart(histRef.current, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: meta.label,
              data: values,
              borderColor: meta.color,
              backgroundColor: meta.color + '15',
              borderWidth: 2,
              tension: 0.4,
              pointRadius: values.length > 60 ? 0 : 3,
              fill: true,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { maxTicksLimit: 10, font: { family: 'JetBrains Mono', size: 10 }, color: '#9aa8a0' } },
              y: { grid: { color: 'rgba(16,48,36,0.06)' }, ticks: { font: { family: 'JetBrains Mono', size: 10 }, color: '#9aa8a0', callback: v => `${v} ${meta.unit}` } }
            }
          }
        })
      } catch(e) { console.error(e) }
    }
    load()
    return () => { if (histChart.current) histChart.current.destroy() }
  }, [serreId, heures, capteur])

  // Comparaison chart
  useEffect(() => {
    async function load() {
      const meta = CAPTEURS.find(c => c.key === compCap)
      try {
        const data = await dashboardAPI.getComparaison(compCap)
        if (!data) return
        const allTimes = [...new Set(data.flatMap(s => s.data.map(d => d.time)))].sort()
        const labels   = allTimes.map(t => new Date(t).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }))
        const datasets = data.map((s, i) => {
          const map = Object.fromEntries(s.data.map(d => [d.time, d.value]))
          return {
            label: s.nom_fr?.split('&')[0].trim() || s.code,
            data: allTimes.map(t => map[t] ?? null),
            borderColor: COLORS[i],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            tension: 0.4,
            spanGaps: true,
          }
        })
        if (compChart.current) compChart.current.destroy()
        compChart.current = new Chart(compRef.current, {
          type: 'line',
          data: { labels, datasets },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top', labels: { font: { family: 'JetBrains Mono', size: 11 }, usePointStyle: true, color: '#6b7e75' } },
              tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.parsed.y} ${meta.unit}` } }
            },
            scales: {
              x: { grid: { display: false }, ticks: { maxTicksLimit: 8, font: { family: 'JetBrains Mono', size: 10 }, color: '#9aa8a0' } },
              y: { grid: { color: 'rgba(16,48,36,0.06)' }, ticks: { font: { family: 'JetBrains Mono', size: 10 }, color: '#9aa8a0' } }
            }
          }
        })
      } catch(e) { console.error(e) }
    }
    load()
    return () => { if (compChart.current) compChart.current.destroy() }
  }, [compCap])

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Graphiques</h1>
          <div className="admin-sub">Historique et comparaison inter-serres</div>
        </div>
      </div>

      {/* Historique */}
      <div className="panel">
        <div className="panel-head">
          <h2>Historique capteurs</h2>
        </div>
        <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', marginBottom:'14px' }}>
          <select className="graph-select" value={serreId} onChange={e => setSerreId(Number(e.target.value))}>
            {SERRES.map(s => <option key={s.id} value={s.id}>{s.code} — {s.nom}</option>)}
          </select>
          <select className="graph-select" value={heures} onChange={e => setHeures(Number(e.target.value))}>
            <option value={6}>6 heures</option>
            <option value={24}>24 heures</option>
            <option value={72}>3 jours</option>
            <option value={168}>7 jours</option>
          </select>
        </div>
        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'14px' }}>
          {CAPTEURS.map(c => (
            <button
              key={c.key}
              onClick={() => setCapteur(c.key)}
              style={{
                padding:'6px 14px', borderRadius:'999px', fontSize:'12px', fontWeight:500,
                border:'1px solid var(--border-strong)', cursor:'pointer',
                fontFamily:'var(--font-mono)', letterSpacing:'0.04em',
                background: capteur === c.key ? 'var(--ink)' : 'var(--surface-glass)',
                color: capteur === c.key ? 'white' : 'var(--ink-2)',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div style={{ height:'260px' }}>
          <canvas ref={histRef}></canvas>
        </div>
      </div>

      {/* Comparaison */}
      <div className="panel">
        <div className="panel-head">
          <h2>Comparaison inter-serres</h2>
          <select className="graph-select" value={compCap} onChange={e => setCompCap(e.target.value)}>
            {CAPTEURS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
        <div style={{ height:'260px' }}>
          <canvas ref={compRef}></canvas>
        </div>
      </div>
    </>
  )
}