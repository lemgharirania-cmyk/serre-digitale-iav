// src/pages/dashboard/Seuils.jsx
import { useState, useEffect } from 'react'
import { dashboardAPI } from '../../api/client'
import { Info, AlertTriangle, CheckCircle } from 'lucide-react'

const SERRES = [
  { id:1, code:'S01', nomFR:'Génétique & Amélioration', nomEN:'Genetics & Improvement' },
  { id:2, code:'S02', nomFR:'Horticulture',             nomEN:'Horticulture' },
  { id:3, code:'S03', nomFR:'Agronomie',                nomEN:'Agronomy' },
  { id:4, code:'S04', nomFR:'Hydroponie',               nomEN:'Hydroponics' },
  { id:5, code:'S05', nomFR:'Protection des Plantes',   nomEN:'Plant Protection' },
]

const LABELS_FR = { temperature:'Température', humidite:'Humidité', vpd:'VPD', ph:'pH', ec:'EC', niveau_eau:'Niveau eau', co2:'CO₂' }
const LABELS_EN = { temperature:'Temperature',  humidite:'Humidity',   vpd:'VPD', ph:'pH', ec:'EC', niveau_eau:'Water level', co2:'CO₂' }
const UNITS     = { temperature:'°C', humidite:'%', vpd:'kPa', ph:'', ec:'mS/cm', niveau_eau:'m', co2:'ppm' }

const OPTIMAL = {
  temperature:{ min:18, max:28, color:'#F59E0B' },
  humidite:   { min:60, max:80, color:'#06B6D4' },
  vpd:        { min:0.8,max:1.5,color:'#8B5CF6' },
  ph:         { min:5.5,max:7.0,color:'#0891b2' },
  ec:         { min:1.5,max:3.5,color:'#059669' },
  niveau_eau: { min:0.6,max:1.0,color:'#3773bd' },
  co2:        { min:400,max:1200,color:'#22C55E' },
}

const T = {
  FR:{
    title:'Seuils agronomiques', sub:'Configurez min / max pour déclencher les alertes',
    save:'Enregistrer', saving:'Enregistrement...',
    cols:['Paramètre','Unité','Min','Max','Email alerte','Actif'],
    saved:(n) => `${n} seuil${n>1?'s':''} enregistré${n>1?'s':''} ✓`,
    guideTitle:'Comment fonctionnent les seuils ?',
    guide1:'Définissez une valeur minimale et maximale pour chaque paramètre. Le système compare les mesures des capteurs à ces seuils toutes les 2 minutes.',
    guide2:'Quand une valeur dépasse le seuil (trop haute ou trop basse), une alerte est automatiquement créée dans la section Alertes.',
    guide3:'Si vous renseignez une adresse email, un email d\'alerte est envoyé immédiatement au responsable concerné.',
    guide4:'La case "Actif" permet d\'activer ou désactiver la surveillance d\'un paramètre sans supprimer les seuils configurés.',
    stepTitle:'Pipeline d\'alerte',
    step1:'Capteur mesure une valeur',
    step2:'Système compare aux seuils configurés',
    step3:'Valeur hors seuil → Alerte créée',
    step4:'Email envoyé si adresse configurée',
    optimal:'Valeurs optimales recommandées',
  },
  EN:{
    title:'Agronomic thresholds', sub:'Set min / max values to trigger alerts',
    save:'Save', saving:'Saving...',
    cols:['Parameter','Unit','Min','Max','Alert email','Active'],
    saved:(n) => `${n} threshold${n>1?'s':''} saved ✓`,
    guideTitle:'How do thresholds work?',
    guide1:'Set a minimum and maximum value for each parameter. The system compares sensor measurements to these thresholds every 2 minutes.',
    guide2:'When a value exceeds the threshold (too high or too low), an alert is automatically created in the Alerts section.',
    guide3:'If you enter an email address, an alert email is sent immediately to the relevant person.',
    guide4:'The "Active" checkbox allows you to enable or disable monitoring of a parameter without deleting the configured thresholds.',
    stepTitle:'Alert pipeline',
    step1:'Sensor measures a value',
    step2:'System compares to configured thresholds',
    step3:'Value out of range → Alert created',
    step4:'Email sent if address is configured',
    optimal:'Recommended optimal values',
  }
}

export default function Seuils({ theme, lang }) {
  const isDark  = theme === 'dark'
  const t       = T[lang] || T.FR
  const labels  = lang === 'EN' ? LABELS_EN : LABELS_FR

  const [serreId, setSerreId] = useState(1)
  const [seuils,  setSeuils]  = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [form,    setForm]    = useState({})
  const [toast,   setToast]   = useState('')

  const cardBg   = isDark ? 'rgba(16,27,46,0.82)' : 'white'
  const border   = isDark ? 'rgba(255,255,255,0.07)' : 'var(--border)'
  const ink3     = isDark ? '#94A3B8' : 'var(--ink-3)'
  const ink4     = isDark ? '#64748B' : 'var(--ink-4)'
  const inputBg  = isDark ? 'rgba(255,255,255,0.05)' : 'white'
  const inputBdr = isDark ? 'rgba(255,255,255,0.1)'  : 'var(--border)'
  const guideBg  = isDark ? 'rgba(34,197,94,0.06)'   : 'rgba(34,197,94,0.04)'
  const guideBdr = isDark ? 'rgba(34,197,94,0.15)'   : 'rgba(34,197,94,0.12)'

  async function load(id) {
    setLoading(true)
    const data = await dashboardAPI.getThresholds(id)
    setSeuils(data || [])
    const init = {}
    ;(data || []).forEach(s => {
      init[`${s.capteur}_min`]   = s.valeur_min ?? ''
      init[`${s.capteur}_max`]   = s.valeur_max ?? ''
      init[`${s.capteur}_email`] = s.email_alerte ?? ''
      init[`${s.capteur}_actif`] = s.actif ?? true
    })
    setForm(init)
    setLoading(false)
  }

  useEffect(() => { load(serreId) }, [serreId])

  function update(key, val) { setForm(prev => ({ ...prev, [key]: val })) }

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

  const inputStyle = {
    background: inputBg, border: `1px solid ${inputBdr}`, borderRadius: 8,
    fontFamily: 'var(--font-sans)', fontSize: 13, outline: 'none',
    color: isDark ? '#F8FAFC' : 'inherit', transition: 'border-color 0.15s',
  }

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
        <div style={{ background: 'var(--green-600)', color: 'white', padding: '12px 18px', borderRadius: 12, fontSize: 13, marginBottom: 16, fontWeight: 500 }}>
          {toast}
        </div>
      )}

      {/* ── Guide d'utilisation ── */}
      <div style={{ background: guideBg, border: `1px solid ${guideBdr}`, borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Info size={15} color="#22C55E" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#F8FAFC' : '#0F172A' }}>{t.guideTitle}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[t.guide1, t.guide2, t.guide3, t.guide4].map((g, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: '#22C55E' }}>{i+1}</span>
              </div>
              <p style={{ fontSize: 12, color: isDark ? '#CBD5E1' : '#475569', lineHeight: 1.7, margin: 0 }}>{g}</p>
            </div>
          ))}
        </div>

        {/* Pipeline visuel */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#64748B' : '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>{t.stepTitle}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            {[
              { label: t.step1, icon: '📡', color: '#22C55E' },
              { label: t.step2, icon: '⚖️', color: '#06B6D4' },
              { label: t.step3, icon: '🚨', color: '#F59E0B' },
              { label: t.step4, icon: '📧', color: '#8B5CF6' },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ padding: '6px 12px', borderRadius: 20, background: `${step.color}12`, border: `1px solid ${step.color}30`, fontSize: 11, fontWeight: 600, color: step.color, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span>{step.icon}</span>
                  {step.label}
                </div>
                {i < 3 && <span style={{ color: isDark ? '#475569' : '#CBD5E1', fontSize: 16 }}>→</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Valeurs optimales */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#64748B' : '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>{t.optimal}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(OPTIMAL).map(([key, opt]) => (
              <div key={key} style={{ background: `${opt.color}10`, border: `1px solid ${opt.color}25`, borderRadius: 8, padding: '4px 10px', fontSize: 11, color: opt.color, fontFamily: 'monospace', fontWeight: 600 }}>
                {labels[key] || key} : {opt.min}–{opt.max} {UNITS[key]}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Table des seuils ── */}
      <div className="panel" style={{ background: cardBg, borderColor: border }}>
        <div style={{ marginBottom: 16 }}>
          <select className="graph-select" value={serreId} onChange={e => setSerreId(Number(e.target.value))}>
            {SERRES.map(s => (
              <option key={s.id} value={s.id}>
                {s.code} — {lang === 'EN' ? s.nomEN : s.nomFR}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div>
        ) : seuils.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: ink3, fontSize: 13 }}>
            {lang === 'FR' ? 'Aucun seuil configuré pour cette serre.' : 'No thresholds configured for this greenhouse.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {t.cols.map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontFamily: 'var(--font-sans)', fontSize: 12, letterSpacing: '0.02em', textTransform: 'uppercase', color: ink3, borderBottom: `1px solid ${border}` }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {seuils.map(s => {
                  const opt    = OPTIMAL[s.capteur]
                  const curMin = parseFloat(form[`${s.capteur}_min`])
                  const curMax = parseFloat(form[`${s.capteur}_max`])
                  const warnMin = opt && !isNaN(curMin) && curMin < opt.min
                  const warnMax = opt && !isNaN(curMax) && curMax > opt.max
                  return (
                    <tr key={s.capteur} style={{ transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: 12, borderBottom: `1px solid ${border}` }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(16,48,36,0.04)', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500 }}>
                          {opt && <span style={{ width: 6, height: 6, borderRadius: '50%', background: opt.color, flexShrink: 0 }} />}
                          {labels[s.capteur] || s.capteur}
                        </span>
                      </td>
                      <td style={{ padding: 12, borderBottom: `1px solid ${border}`, fontFamily: 'var(--font-mono)', fontSize: 12, color: ink3 }}>
                        {UNITS[s.capteur] || ''}
                      </td>
                      <td style={{ padding: 12, borderBottom: `1px solid ${border}` }}>
                        <div style={{ position: 'relative' }}>
                          <input type="number" step="0.1" value={form[`${s.capteur}_min`]}
                            onChange={e => update(`${s.capteur}_min`, e.target.value)}
                            style={{ ...inputStyle, width: 70, padding: '5px 8px', textAlign: 'center', borderColor: warnMin ? '#F59E0B' : undefined }} />
                          {warnMin && <AlertTriangle size={10} color="#F59E0B" style={{ position: 'absolute', right: -14, top: '50%', transform: 'translateY(-50%)' }} />}
                        </div>
                      </td>
                      <td style={{ padding: 12, borderBottom: `1px solid ${border}` }}>
                        <div style={{ position: 'relative' }}>
                          <input type="number" step="0.1" value={form[`${s.capteur}_max`]}
                            onChange={e => update(`${s.capteur}_max`, e.target.value)}
                            style={{ ...inputStyle, width: 70, padding: '5px 8px', textAlign: 'center', borderColor: warnMax ? '#F59E0B' : undefined }} />
                          {warnMax && <AlertTriangle size={10} color="#F59E0B" style={{ position: 'absolute', right: -14, top: '50%', transform: 'translateY(-50%)' }} />}
                        </div>
                      </td>
                      <td style={{ padding: 12, borderBottom: `1px solid ${border}` }}>
                        <input type="email" value={form[`${s.capteur}_email`]}
                          onChange={e => update(`${s.capteur}_email`, e.target.value)}
                          placeholder="email@..."
                          style={{ ...inputStyle, width: 180, padding: '5px 8px' }} />
                      </td>
                      <td style={{ padding: 12, borderBottom: `1px solid ${border}` }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                          <input type="checkbox"
                            checked={form[`${s.capteur}_actif`] ?? true}
                            onChange={e => update(`${s.capteur}_actif`, e.target.checked)}
                            style={{ width: 16, height: 16, accentColor: '#22C55E', cursor: 'pointer' }} />
                          {form[`${s.capteur}_actif`]
                            ? <CheckCircle size={13} color="#22C55E" />
                            : <span style={{ fontSize: 10, color: ink4 }}>OFF</span>
                          }
                        </label>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
