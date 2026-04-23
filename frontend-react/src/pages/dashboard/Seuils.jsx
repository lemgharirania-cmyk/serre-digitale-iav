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
const LABELS = { temperature:'Température', humidite:'Humidité', vpd:'VPD', ph:'pH', ec:'EC', niveau_eau:'Niveau eau' }
const UNITS  = { temperature:'°C', humidite:'%', vpd:'kPa', ph:'', ec:'mS/cm', niveau_eau:'m' }

export default function Seuils() {
  const [serreId, setSerreId] = useState(1)
  const [seuils, setSeuils]   = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState({})
  const [toast, setToast]     = useState('')

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

  function update(key, val) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function save() {
    setSaving(true)
    let saved = 0
    for (const t of seuils) {
      const body = {
        valeur_min:   parseFloat(form[`${t.capteur}_min`]) || null,
        valeur_max:   parseFloat(form[`${t.capteur}_max`]) || null,
        email_alerte: form[`${t.capteur}_email`] || null,
        actif:        form[`${t.capteur}_actif`] ?? true,
      }
      await dashboardAPI.saveThreshold(serreId, t.capteur, body)
      saved++
    }
    setSaving(false)
    setToast(`${saved} seuil${saved > 1 ? 's' : ''} enregistré${saved > 1 ? 's' : ''} ✓`)
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Seuils agronomiques</h1>
          <div className="admin-sub">Configurez min / max pour déclencher les alertes</div>
        </div>
        <div className="admin-top-r">
          <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer tout'}
          </button>
        </div>
      </div>

      {toast && (
        <div style={{
          background:'var(--green-600)', color:'white', padding:'12px 18px',
          borderRadius:'12px', fontSize:'13px', marginBottom:'16px', fontWeight:500
        }}>
          {toast}
        </div>
      )}

      <div className="panel">
        <div style={{ marginBottom:'16px' }}>
          <select
            className="graph-select"
            value={serreId}
            onChange={e => setSerreId(Number(e.target.value))}
          >
            {SERRES.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'3rem' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
            <thead>
              <tr>
                {['Paramètre','Unité','Min','Max','Email alerte','Actif'].map(h => (
                  <th key={h} style={{
                    textAlign:'left', padding:'10px 12px',
                    fontFamily:'var(--font-mono)', fontSize:'10px',
                    letterSpacing:'0.1em', textTransform:'uppercase',
                    color:'var(--ink-3)', borderBottom:'1px solid var(--border)'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {seuils.map(t => (
                <tr key={t.capteur}>
                  <td style={{ padding:'12px', borderBottom:'1px solid var(--border)' }}>
                    <span style={{
                      display:'inline-flex', alignItems:'center', gap:'6px',
                      padding:'3px 10px', borderRadius:'999px',
                      background:'rgba(16,48,36,0.04)',
                      fontFamily:'var(--font-mono)', fontSize:'11px'
                    }}>
                      {LABELS[t.capteur] || t.capteur}
                    </span>
                  </td>
                  <td style={{ padding:'12px', borderBottom:'1px solid var(--border)', fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--ink-3)' }}>
                    {UNITS[t.capteur] || ''}
                  </td>
                  <td style={{ padding:'12px', borderBottom:'1px solid var(--border)' }}>
                    <input
                      type="number" step="0.1"
                      value={form[`${t.capteur}_min`]}
                      onChange={e => update(`${t.capteur}_min`, e.target.value)}
                      style={{ width:'70px', padding:'5px 8px', border:'1px solid var(--border)', borderRadius:'8px', fontFamily:'var(--font-mono)', fontSize:'12px', textAlign:'center', outline:'none' }}
                    />
                  </td>
                  <td style={{ padding:'12px', borderBottom:'1px solid var(--border)' }}>
                    <input
                      type="number" step="0.1"
                      value={form[`${t.capteur}_max`]}
                      onChange={e => update(`${t.capteur}_max`, e.target.value)}
                      style={{ width:'70px', padding:'5px 8px', border:'1px solid var(--border)', borderRadius:'8px', fontFamily:'var(--font-mono)', fontSize:'12px', textAlign:'center', outline:'none' }}
                    />
                  </td>
                  <td style={{ padding:'12px', borderBottom:'1px solid var(--border)' }}>
                    <input
                      type="email"
                      value={form[`${t.capteur}_email`]}
                      onChange={e => update(`${t.capteur}_email`, e.target.value)}
                      placeholder="email@..."
                      style={{ width:'180px', padding:'5px 8px', border:'1px solid var(--border)', borderRadius:'8px', fontSize:'12px', outline:'none' }}
                    />
                  </td>
                  <td style={{ padding:'12px', borderBottom:'1px solid var(--border)' }}>
                    <input
                      type="checkbox"
                      checked={form[`${t.capteur}_actif`] ?? true}
                      onChange={e => update(`${t.capteur}_actif`, e.target.checked)}
                    />
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