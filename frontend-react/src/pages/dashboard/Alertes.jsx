// src/pages/dashboard/Alertes.jsx
import { useState, useEffect } from 'react'
import { dashboardAPI } from '../../api/client'

const T = {
  FR:{
    title:'Alertes', markAll:'Tout marquer lu', refresh:'Actualiser',
    nonLue:'non lue', nonLues:'non lues', aucune:'Aucune alerte.', lu:'Lu',
    valeur:'Valeur',
  },
  EN:{
    title:'Alerts', markAll:'Mark all read', refresh:'Refresh',
    nonLue:'unread', nonLues:'unread', aucune:'No alerts.', lu:'Read',
    valeur:'Value',
  }
}

export default function Alertes({ theme, lang }) {
  const isDark = theme === 'dark'
  const t      = T[lang] || T.FR
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
    setAlertes(prev => prev.map(a => a.id === id ? { ...a, lu:true } : a))
  }
  async function markAll() {
    await dashboardAPI.markAllLues()
    setAlertes(prev => prev.map(a => ({ ...a, lu:true })))
  }

  const nonLues  = alertes.filter(a => !a.lu).length
  const cardBg   = isDark ? 'rgba(16,27,46,0.82)' : 'white'
  const border   = isDark ? 'rgba(255,255,255,0.07)' : 'var(--border)'
  const rowBg    = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(16,48,36,0.02)'
  const ink3     = isDark ? '#94A3B8' : 'var(--ink-3)'
  const ink4     = isDark ? '#64748B' : 'var(--ink-4)'
  const luBtnBg  = isDark ? 'rgba(34,197,94,0.12)' : 'var(--ok-bg)'
  const luBtnClr = isDark ? '#4ADE80' : 'var(--green-600)'

  const locale = lang === 'EN' ? 'en-US' : 'fr-FR'

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>{t.title}</h1>
          <div className="admin-sub">
            {nonLues} {nonLues > 1 ? t.nonLues : t.nonLue}
          </div>
        </div>
        <div className="admin-top-r">
          <button className="btn btn-secondary btn-sm" onClick={markAll}>{t.markAll}</button>
          <button className="btn btn-secondary btn-sm" onClick={load}>↻ {t.refresh}</button>
        </div>
      </div>

      <div className="panel" style={{ background:cardBg, borderColor:border }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:'3rem' }}>
            <div className="spinner" />
          </div>
        ) : alertes.length === 0 ? (
          <div style={{ textAlign:'center', padding:'3rem', color:ink3 }}>{t.aucune}</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {alertes.map(a => (
              <div key={a.id} style={{
                display:'flex', gap:12, padding:12,
                borderRadius:12, border:`1px solid ${border}`,
                background: a.lu ? 'transparent' : rowBg,
                opacity: a.lu ? 0.6 : 1,
                transition:'all 0.2s',
              }}>
                <div style={{ width:4, borderRadius:2, flexShrink:0, background: a.lu ? 'var(--ok)' : 'var(--warn)' }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500 }}>
                    {a.capteur} · {a.nom_fr || a.code}
                  </div>
                  <div style={{ fontSize:12, color:ink3, marginTop:2 }}>
                    {a.message_fr || `${t.valeur}: ${a.valeur}`}
                  </div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:ink4, marginTop:6, textTransform:'uppercase' }}>
                    {a.code} · {new Date(a.created_at).toLocaleString(locale)}
                  </div>
                </div>
                {!a.lu && (
                  <button
                    onClick={() => markRead(a.id)}
                    style={{
                      background:luBtnBg, color:luBtnClr,
                      border:`1px solid rgba(47,154,100,0.2)`,
                      padding:'4px 10px', borderRadius:8,
                      fontSize:11, fontWeight:500, cursor:'pointer',
                      alignSelf:'center', fontFamily:'var(--font-mono)',
                      transition:'all 0.15s',
                    }}
                  >
                    {t.lu}
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
