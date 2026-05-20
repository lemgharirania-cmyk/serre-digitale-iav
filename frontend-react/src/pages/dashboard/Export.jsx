// src/pages/dashboard/Export.jsx
import { useState } from 'react'
import { dashboardAPI } from '../../api/client'

const SERRES = [
  { id:1, code:'S01', nom:'Génétique & Amélioration' },
  { id:2, code:'S02', nom:'Horticulture' },
  { id:3, code:'S03', nom:'Agronomie' },
  { id:4, code:'S04', nom:'Hydroponie' },
  { id:5, code:'S05', nom:'Protection des Plantes' },
]

const T = {
  FR:{
    title:'Export de données', sub:'Téléchargez les mesures en CSV ou Excel',
    periode:'Période d\'export', periodeDesc:'Sélectionnez la plage de données à exporter',
    h24:'24 heures', h72:'3 jours', h168:'7 jours', h720:'30 jours',
    loading:'Téléchargement en cours...', success:'Fichier téléchargé ✓', error:'Erreur réseau',
    errorDL:'Erreur lors du téléchargement',
  },
  EN:{
    title:'Data export', sub:'Download measurements as CSV or Excel',
    periode:'Export period', periodeDesc:'Select the data range to export',
    h24:'24 hours', h72:'3 days', h168:'7 days', h720:'30 days',
    loading:'Downloading...', success:'File downloaded ✓', error:'Network error',
    errorDL:'Download error',
  }
}

export default function Export({ theme, lang }) {
  const isDark = theme === 'dark'
  const t      = T[lang] || T.FR
  const [heures,  setHeures]  = useState(168)
  const [loading, setLoading] = useState(null)
  const [toast,   setToast]   = useState('')

  const cardBg  = isDark ? 'rgba(22,35,56,0.85)' : 'white'
  const border  = isDark ? 'rgba(255,255,255,0.07)' : 'var(--border)'
  const ink3    = isDark ? '#94A3B8' : 'var(--ink-3)'
  const gradBg  = isDark
    ? 'linear-gradient(135deg,rgba(34,197,94,0.1),rgba(59,130,246,0.08))'
    : 'linear-gradient(135deg,rgba(208,236,221,0.5),rgba(213,230,247,0.4))'

  async function doExport(serreId, format) {
    const key = `${serreId}-${format}`
    setLoading(key)
    setToast(t.loading)
    try {
      const r = await dashboardAPI.export(serreId, format, heures)
      if (!r?.ok) { setToast(t.errorDL); return }
      const blob = await r.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `serre_${serreId}_${heures}h.${format === 'excel' ? 'xlsx' : 'csv'}`
      a.click()
      URL.revokeObjectURL(url)
      setToast(t.success)
    } catch {
      setToast(t.error)
    } finally {
      setLoading(null)
      setTimeout(() => setToast(''), 3000)
    }
  }

  const dureeOptions = [
    { val:24,  label:t.h24  },
    { val:72,  label:t.h72  },
    { val:168, label:t.h168 },
    { val:720, label:t.h720 },
  ]

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>{t.title}</h1>
          <div className="admin-sub">{t.sub}</div>
        </div>
      </div>

      {toast && (
        <div style={{
          background: toast.includes('✓') ? 'var(--green-600)' : 'var(--warn)',
          color:'white', padding:'12px 18px', borderRadius:12,
          fontSize:13, marginBottom:16, fontWeight:500, transition:'all 0.3s',
        }}>
          {toast}
        </div>
      )}

      {/* Période */}
      <div style={{
        display:'grid', gridTemplateColumns:'1fr auto', gap:16,
        alignItems:'center', padding:'18px 22px', marginBottom:16,
        background:gradBg, border:`1px solid ${border}`, borderRadius:'var(--r-lg)',
      }}>
        <div>
          <div style={{ fontSize:15, fontWeight:500 }}>{t.periode}</div>
          <div style={{ fontSize:12, color:ink3, marginTop:2 }}>{t.periodeDesc}</div>
        </div>
        <select className="graph-select" value={heures}
          onChange={e => setHeures(Number(e.target.value))}>
          {dureeOptions.map(d => <option key={d.val} value={d.val}>{d.label}</option>)}
        </select>
      </div>

      {/* Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:14 }}>
        {SERRES.map(s => (
          <div key={s.id} style={{
            background:cardBg, border:`1px solid ${border}`,
            borderRadius:'var(--r-lg)', padding:20, textAlign:'center',
            transition:'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=isDark?'0 8px 24px rgba(0,0,0,0.3)':'0 8px 20px rgba(12,31,23,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}
          >
            <div style={{ fontSize:15, fontWeight:500, marginBottom:4 }}>{s.nom}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:ink3, marginBottom:16 }}>
              {s.code}
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
              <button className="btn btn-secondary btn-sm"
                disabled={loading === `${s.id}-csv`}
                onClick={() => doExport(s.id, 'csv')}>
                {loading === `${s.id}-csv` ? '...' : 'CSV'}
              </button>
              <button className="btn btn-primary btn-sm"
                disabled={loading === `${s.id}-excel`}
                onClick={() => doExport(s.id, 'excel')}>
                {loading === `${s.id}-excel` ? '...' : 'Excel'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
