// src/pages/dashboard/Seuils.jsx
import { useState, useEffect } from 'react'
import { dashboardAPI } from '../../api/client'

const SERRES = [
  { id:1, nom:'S01 — Génétique & Amélioration' },
  { id:2, nom:'S02 — Horticulture' },
  { id:3, nom:'S03 — Agronomie' },
  { id:4, nom:'S04 — Hydroponie' },
  { id:5, nom:'S05 — Protection des Plantes' },
]
const LABELS_FR = { temperature:'Température', humidite:'Humidité', vpd:'VPD', ph:'pH', ec:'EC', niveau_eau:'Niveau eau' }
const LABELS_EN = { temperature:'Temperature',  humidite:'Humidity',   vpd:'VPD', ph:'pH', ec:'EC', niveau_eau:'Water level' }
const UNITS     = { temperature:'°C', humidite:'%', vpd:'kPa', ph:'', ec:'mS/cm', niveau_eau:'m' }

const T = {
  FR:{
    title:'Seuils agronomiques', sub:'Configurez min / max pour déclencher les alertes',
    save:'Enregistrer tout', saving:'Enregistrement...',
    cols:['Paramètre','Unité','Min','Max','Email alerte','Actif'],
    saved:(n)=>`${n} seuil${n>1?'s':''} enregistré${n>1?'s':''} ✓`,
  },
  EN:{
    title:'Agronomic thresholds', sub:'Set min / max values to trigger alerts',
    save:'Save all', saving:'Saving...',
    cols:['Parameter','Unit','Min','Max','Alert email','Active'],
    saved:(n)=>`${n} threshold${n>1?'s':''} saved ✓`,
  }
}

export default function Seuils({ theme, lang }) {
  const isDark = theme === 'dark'
  const t      = T[lang] || T.FR
  const labels = lang === 'EN' ? LABELS_EN : LABELS_FR
  const [serreId, setSerreId] = useState(1)
  const [seuils,  setSeuils]  = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [form,    setForm]    = useState({})
  const [toast,   setToast]   = useState('')

  const cardBg   = isDark ? 'rgba(16,27,46,0.82)' : 'white'
  const border   = isDark ? 'rgba(255,255,255,0.07)' : 'var(--border)'
  const ink3     = isDark ? '#94A3B8' : 'var(--ink-3)'
  const inputBg  = isDark ? 'rgba(255,255,255,0.05)' : 'white'
  const inputBdr = isDark ? 'rgba(255,255,255,0.1)'  : 'var(--border)'

  async function load(id) {
    setLoading(true)
    const data = await dashboardAPI.getThresholds(id)
    setSeuils(data || [])
    const init = {}
    ;(data || []).forEach(t => {
      init[`${t.capteur}_min`]   = t.valeur_min ?? ''
      init[`${t.capteur}_max`]   = t.valeur_max ?? ''
      init[`${t.capteur}_email`] = t.email_alerte ?? ''
      init[`${t.capteur}_actif`] = t.actif ?? true
    })
    setForm(init)
    setLoading(false)
  }
  useEffect(() => { load(serreId) }, [serreId])

  function update(key, val) { setForm(prev => ({ ...prev, [key]:val })) }

  async function save() {
    setSaving(true)
    let saved = 0
    for (const s of seuils) {
      await dashboardAPI.saveThreshold(serreId, s.capteur, {
        valeur_min:   parseFloat(form[`${s.capteur}_min`]) || null,
        valeur_max:   parseFloat(form[`${s.capteur}_max`]) || null,
        email_alerte: form[`${s.capteur}_email`] || null,
        actif:        form[`${s.capteur}_actif`] ?? true,
      })
      saved++
    }
    setSaving(false)
    setToast(t.saved(saved))
    setTimeout(() => setToast(''), 3000)
  }

  const inputStyle = { background:inputBg, border:`1px solid ${inputBdr}`, borderRadius:8,
    fontFamily:'var(--font-mono)', fontSize:12, outline:'none', color: isDark?'#F8FAFC':'inherit',
    transition:'border-color 0.15s' }

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>{t.title}</h1>
          <div className="admin-sub">{t.sub}</div>
        </div>
        <div className="admin-top-r">
          <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
            {saving ? t.saving : t.save}
          </button>
        </div>
      </div>

      {toast && (
        <div style={{ background:'var(--green-600)', color:'white', padding:'12px 18px',
          borderRadius:12, fontSize:13, marginBottom:16, fontWeight:500 }}>
          {toast}
        </div>
      )}

      <div className="panel" style={{ background:cardBg, borderColor:border }}>
        <div style={{ marginBottom:16 }}>
          <select className="graph-select" value={serreId}
            onChange={e => setSerreId(Number(e.target.value))}>
            {SERRES.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'3rem' }}><div className="spinner" /></div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr>
                {t.cols.map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'10px 12px',
                    fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.1em',
                    textTransform:'uppercase', color:ink3, borderBottom:`1px solid ${border}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {seuils.map(s => (
                <tr key={s.capteur}>
                  <td style={{ padding:12, borderBottom:`1px solid ${border}` }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:6,
                      padding:'3px 10px', borderRadius:999,
                      background: isDark?'rgba(255,255,255,0.06)':'rgba(16,48,36,0.04)',
                      fontFamily:'var(--font-mono)', fontSize:11 }}>
                      {labels[s.capteur] || s.capteur}
                    </span>
                  </td>
                  <td style={{ padding:12, borderBottom:`1px solid ${border}`,
                    fontFamily:'var(--font-mono)', fontSize:11, color:ink3 }}>
                    {UNITS[s.capteur] || ''}
                  </td>
                  <td style={{ padding:12, borderBottom:`1px solid ${border}` }}>
                    <input type="number" step="0.1"
                      value={form[`${s.capteur}_min`]}
                      onChange={e => update(`${s.capteur}_min`, e.target.value)}
                      style={{ ...inputStyle, width:70, padding:'5px 8px', textAlign:'center' }}/>
                  </td>
                  <td style={{ padding:12, borderBottom:`1px solid ${border}` }}>
                    <input type="number" step="0.1"
                      value={form[`${s.capteur}_max`]}
                      onChange={e => update(`${s.capteur}_max`, e.target.value)}
                      style={{ ...inputStyle, width:70, padding:'5px 8px', textAlign:'center' }}/>
                  </td>
                  <td style={{ padding:12, borderBottom:`1px solid ${border}` }}>
                    <input type="email"
                      value={form[`${s.capteur}_email`]}
                      onChange={e => update(`${s.capteur}_email`, e.target.value)}
                      placeholder="email@..."
                      style={{ ...inputStyle, width:180, padding:'5px 8px' }}/>
                  </td>
                  <td style={{ padding:12, borderBottom:`1px solid ${border}` }}>
                    <input type="checkbox"
                      checked={form[`${s.capteur}_actif`] ?? true}
                      onChange={e => update(`${s.capteur}_actif`, e.target.checked)}/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
