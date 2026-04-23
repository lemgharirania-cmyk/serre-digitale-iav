// src/pages/dashboard/Alertes.jsx
import { useState, useEffect } from 'react'
import { dashboardAPI } from '../../api/client'

export default function Alertes() {
  const [alertes, setAlertes] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const data = await dashboardAPI.getAlertes()
    setAlertes(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function markRead(id) {
    await dashboardAPI.markAlerteLue(id)
    setAlertes(prev => prev.map(a => a.id === id ? { ...a, lu: true } : a))
  }

  async function markAll() {
    await dashboardAPI.markAllLues()
    setAlertes(prev => prev.map(a => ({ ...a, lu: true })))
  }

  const nonLues = alertes.filter(a => !a.lu).length

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Alertes</h1>
          <div className="admin-sub">
            {nonLues} non lue{nonLues > 1 ? 's' : ''}
          </div>
        </div>
        <div className="admin-top-r">
          <button className="btn btn-secondary btn-sm" onClick={markAll}>
            Tout marquer lu
          </button>
          <button className="btn btn-secondary btn-sm" onClick={load}>
            ↻ Actualiser
          </button>
        </div>
      </div>

      <div className="panel">
        {loading ? (
          <div style={{textAlign:'center',padding:'3rem'}}>
            <div className="spinner"></div>
          </div>
        ) : alertes.length === 0 ? (
          <div style={{textAlign:'center',padding:'3rem',color:'var(--ink-3)'}}>
            Aucune alerte.
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
            {alertes.map(a => (
              <div key={a.id} style={{
                display:'flex', gap:'12px', padding:'12px',
                borderRadius:'12px', border:'1px solid var(--border)',
                background: a.lu ? 'transparent' : 'rgba(16,48,36,0.02)',
                opacity: a.lu ? 0.6 : 1
              }}>
                <div style={{
                  width:'4px', borderRadius:'2px', flexShrink:0,
                  background: a.lu ? 'var(--ok)' : 'var(--warn)'
                }}></div>
                <div style={{flex:1}}>
                  <div style={{fontSize:'13px',fontWeight:500}}>
                    {a.capteur} · {a.nom_fr || a.code}
                  </div>
                  <div style={{fontSize:'12px',color:'var(--ink-3)',marginTop:'2px'}}>
                    {a.message_fr || `Valeur: ${a.valeur}`}
                  </div>
                  <div style={{
                    fontFamily:'var(--font-mono)',fontSize:'10px',
                    color:'var(--ink-4)',marginTop:'6px',textTransform:'uppercase'
                  }}>
                    {a.code} · {new Date(a.created_at).toLocaleString('fr-FR')}
                  </div>
                </div>
                {!a.lu && (
                  <button
                    onClick={() => markRead(a.id)}
                    style={{
                      background:'var(--ok-bg)',color:'var(--green-600)',
                      border:'1px solid rgba(47,154,100,0.2)',
                      padding:'4px 10px',borderRadius:'8px',
                      fontSize:'11px',fontWeight:500,cursor:'pointer',
                      alignSelf:'center',fontFamily:'var(--font-mono)'
                    }}
                  >
                    Lu
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}