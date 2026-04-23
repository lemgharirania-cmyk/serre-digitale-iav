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

export default function Export() {
  const [heures, setHeures]   = useState(168)
  const [loading, setLoading] = useState(null) // 'S01-csv' etc.
  const [toast, setToast]     = useState('')

  async function doExport(serreId, format) {
    const key = `${serreId}-${format}`
    setLoading(key)
    setToast('Téléchargement en cours...')
    try {
      const r = await dashboardAPI.export(serreId, format, heures)
      if (!r?.ok) { setToast('Erreur lors du téléchargement'); return }
      const blob = await r.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `serre_${serreId}_${heures}h.${format === 'excel' ? 'xlsx' : 'csv'}`
      a.click()
      URL.revokeObjectURL(url)
      setToast('Fichier téléchargé ✓')
    } catch {
      setToast('Erreur réseau')
    } finally {
      setLoading(null)
      setTimeout(() => setToast(''), 3000)
    }
  }

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Export de données</h1>
          <div className="admin-sub">Téléchargez les mesures en CSV ou Excel</div>
        </div>
      </div>

      {toast && (
        <div style={{
          background: toast.includes('✓') ? 'var(--green-600)' : 'var(--warn)',
          color:'white', padding:'12px 18px', borderRadius:'12px',
          fontSize:'13px', marginBottom:'16px', fontWeight:500
        }}>
          {toast}
        </div>
      )}

      {/* Période selector */}
      <div style={{
        display:'grid', gridTemplateColumns:'1fr auto', gap:'16px',
        alignItems:'center', padding:'18px 22px', marginBottom:'16px',
        background:'linear-gradient(135deg,rgba(208,236,221,0.5),rgba(213,230,247,0.4))',
        border:'1px solid var(--border)', borderRadius:'var(--r-lg)'
      }}>
        <div>
          <div style={{ fontSize:'15px', fontWeight:500 }}>Période d'export</div>
          <div style={{ fontSize:'12px', color:'var(--ink-3)', marginTop:'2px' }}>
            Sélectionnez la plage de données à exporter
          </div>
        </div>
        <select
          className="graph-select"
          value={heures}
          onChange={e => setHeures(Number(e.target.value))}
        >
          <option value={24}>24 heures</option>
          <option value={72}>3 jours</option>
          <option value={168}>7 jours</option>
          <option value={720}>30 jours</option>
        </select>
      </div>

      {/* Serre export cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:'14px' }}>
        {SERRES.map(s => (
          <div key={s.id} style={{
            background:'white', border:'1px solid var(--border)',
            borderRadius:'var(--r-lg)', padding:'20px', textAlign:'center'
          }}>
            <div style={{ fontSize:'15px', fontWeight:500, marginBottom:'4px' }}>{s.nom}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--ink-3)', marginBottom:'16px' }}>
              {s.code}
            </div>
            <div style={{ display:'flex', gap:'8px', justifyContent:'center' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={loading === `${s.id}-csv`}
                onClick={() => doExport(s.id, 'csv')}
              >
                {loading === `${s.id}-csv` ? '...' : 'CSV'}
              </button>
              <button
                className="btn btn-primary btn-sm"
                disabled={loading === `${s.id}-excel`}
                onClick={() => doExport(s.id, 'excel')}
              >
                {loading === `${s.id}-excel` ? '...' : 'Excel'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}