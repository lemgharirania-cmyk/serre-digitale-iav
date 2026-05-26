// src/pages/dashboard/Export.jsx
import { useState } from 'react'
import { dashboardAPI } from '../../api/client'
import { Download, FileText, Table2, Clock } from 'lucide-react'

const SERRES = [
  { id:1, code:'S01', nomFR:'Génétique & Amélioration', nomEN:'Genetics & Improvement',   color:'#22C55E' },
  { id:2, code:'S02', nomFR:'Horticulture',             nomEN:'Horticulture',             color:'#06B6D4' },
  { id:3, code:'S03', nomFR:'Agronomie',                nomEN:'Agronomy',                 color:'#F59E0B' },
  { id:4, code:'S04', nomFR:'Hydroponie',               nomEN:'Hydroponics',              color:'#8B5CF6' },
  { id:5, code:'S05', nomFR:'Protection des Plantes',   nomEN:'Plant Protection',         color:'#EF4444' },
]

const T = {
  FR:{
    title:'Export de données', sub:'Téléchargez les mesures en CSV ou Excel',
    periode:'Période d\'export', periodeDesc:'Sélectionnez la plage de données à exporter',
    h24:'24 heures', h72:'3 jours', h168:'7 jours', h720:'30 jours',
    downloading:'Téléchargement...', success:'Fichier téléchargé ✓',
    errorNetwork:'Erreur réseau', errorFormat:'Format non supporté par le serveur',
    errorDL:'Erreur lors du téléchargement', csvDesc:'Tableur, import universel',
    excelDesc:'Microsoft Excel (.xlsx)',
    tip:'Conseil : utilisez CSV si Excel n\'est pas disponible. Les deux formats contiennent les mêmes données.',
  },
  EN:{
    title:'Data export', sub:'Download measurements as CSV or Excel',
    periode:'Export period', periodeDesc:'Select the data range to export',
    h24:'24 hours', h72:'3 days', h168:'7 days', h720:'30 days',
    downloading:'Downloading...', success:'File downloaded ✓',
    errorNetwork:'Network error', errorFormat:'Format not supported by server',
    errorDL:'Download error', csvDesc:'Spreadsheet, universal import',
    excelDesc:'Microsoft Excel (.xlsx)',
    tip:'Tip: use CSV if Excel is unavailable. Both formats contain the same data.',
  }
}

export default function Export({ theme, lang }) {
  const isDark = theme === 'dark'
  const t      = T[lang] || T.FR

  const [heures,  setHeures]  = useState(168)
  const [loading, setLoading] = useState(null)
  const [toasts,  setToasts]  = useState({})

  const cardBg  = isDark ? 'rgba(16,27,46,0.82)' : 'white'
  const border  = isDark ? 'rgba(255,255,255,0.07)' : 'var(--border)'
  const ink3    = isDark ? '#94A3B8' : 'var(--ink-3)'
  const ink4    = isDark ? '#64748B' : 'var(--ink-4)'
  const infoBg  = isDark ? 'rgba(59,130,246,0.07)' : 'rgba(59,130,246,0.05)'
  const infoBdr = isDark ? 'rgba(59,130,246,0.2)'  : 'rgba(59,130,246,0.15)'

  function setToast(key, msg) {
    setToasts(prev => ({ ...prev, [key]: msg }))
    setTimeout(() => setToasts(prev => ({ ...prev, [key]: '' })), 4000)
  }

  async function doExport(serreId, format) {
    const key = `${serreId}-${format}`
    setLoading(key)

    try {
      const r = await dashboardAPI.export(serreId, format, heures)
      if (!r) { setToast(key, t.errorNetwork); return }

      // Check content type for format support
      const contentType = r.headers?.get?.('content-type') || ''
      if (!r.ok || contentType.includes('json')) {
        // Server returned error or JSON instead of file
        const errData = await r.json().catch(() => ({}))
        const msg = errData.detail || t.errorFormat
        setToast(key, `❌ ${msg}`)
        return
      }

      const blob = await r.blob()
      if (!blob.size) { setToast(key, t.errorFormat); return }

      const ext  = format === 'excel' ? 'xlsx' : 'csv'
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `SDI_S${String(serreId).padStart(2,'0')}_${heures}h_${new Date().toISOString().slice(0,10)}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setToast(key, `✓ ${t.success}`)
    } catch(e) {
      console.error('Export error:', e)
      setToast(key, t.errorNetwork)
    } finally {
      setLoading(null)
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

      {/* Période */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', marginBottom: 16,
        background: cardBg, border: `1px solid ${border}`, borderRadius: 16,
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: isDark ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={15} color="#22C55E" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{t.periode}</div>
            <div style={{ fontSize: 11, color: ink3, marginTop: 2 }}>{t.periodeDesc}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {dureeOptions.map(d => (
            <button key={d.val} onClick={() => setHeures(d.val)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: `1.5px solid ${heures === d.val ? '#22C55E50' : (isDark ? 'rgba(255,255,255,0.08)' : 'var(--border)')}`,
              background: heures === d.val ? 'rgba(34,197,94,0.12)' : 'transparent',
              color: heures === d.val ? '#22C55E' : ink3,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            }}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Info tip */}
      <div style={{ padding: '10px 14px', borderRadius: 12, marginBottom: 16, background: infoBg, border: `1px solid ${infoBdr}`, fontSize: 12, color: isDark ? '#93C5FD' : '#3773bd', display: 'flex', alignItems: 'center', gap: 8 }}>
        <FileText size={13} style={{ flexShrink: 0 }} />
        {t.tip}
      </div>

      {/* Serre cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
        {SERRES.map(s => {
          const keyCSV   = `${s.id}-csv`
          const keyExcel = `${s.id}-excel`
          const msgCSV   = toasts[keyCSV]
          const msgExcel = toasts[keyExcel]

          return (
            <div key={s.id} style={{
              background: cardBg, border: `1px solid ${border}`,
              borderRadius: 16, padding: 20, textAlign: 'center',
              transition: 'transform 0.2s, box-shadow 0.2s',
              borderTop: `3px solid ${s.color}`,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=isDark?'0 8px 24px rgba(0,0,0,0.3)':'0 8px 20px rgba(0,0,0,0.07)' }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}>

              {/* Dot */}
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, margin: '0 auto 10px', boxShadow: `0 0 10px ${s.color}60` }} />

              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                {lang === 'EN' ? s.nomEN : s.nomFR}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: ink4, marginBottom: 16 }}>
                {s.code}
              </div>

              {/* Toast messages */}
              {(msgCSV || msgExcel) && (
                <div style={{
                  fontSize: 11, marginBottom: 10, padding: '5px 8px', borderRadius: 8,
                  background: (msgCSV || msgExcel)?.includes('✓') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  color: (msgCSV || msgExcel)?.includes('✓') ? '#22C55E' : '#EF4444',
                  border: `1px solid ${(msgCSV || msgExcel)?.includes('✓') ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}>
                  {msgCSV || msgExcel}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {/* CSV */}
                <button
                  disabled={loading === keyCSV}
                  onClick={() => doExport(s.id, 'csv')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'var(--border)'}`,
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'var(--surface-glass)',
                    color: isDark ? '#CBD5E1' : 'var(--ink-2)',
                    cursor: loading === keyCSV ? 'not-allowed' : 'pointer',
                    opacity: loading === keyCSV ? 0.6 : 1, fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                >
                  <FileText size={13} />
                  {loading === keyCSV ? '...' : 'CSV'}
                </button>

                {/* Excel */}
                <button
                  disabled={loading === keyExcel}
                  onClick={() => doExport(s.id, 'excel')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                    border: `1px solid rgba(34,197,94,0.3)`,
                    background: 'rgba(34,197,94,0.12)',
                    color: '#22C55E',
                    cursor: loading === keyExcel ? 'not-allowed' : 'pointer',
                    opacity: loading === keyExcel ? 0.6 : 1, fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                >
                  <Table2 size={13} />
                  {loading === keyExcel ? '...' : 'Excel'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
