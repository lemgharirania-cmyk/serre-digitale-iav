// src/pages/dashboard/Seuils.jsx
import { useState, useEffect } from 'react'
import { dashboardAPI } from '../../api/client'
import { Info, AlertTriangle, Lock, ToggleLeft, ToggleRight } from 'lucide-react'
import { useAccess } from '../../hooks/useAccess'

const SERRES = [
  { id:1, code:'S01', color:'#22C55E', nomFR:'Génétique & Amélioration', nomEN:'Genetics & Improvement' },
  { id:2, code:'S02', color:'#06B6D4', nomFR:'Horticulture',             nomEN:'Horticulture' },
  { id:3, code:'S03', color:'#F59E0B', nomFR:'Agronomie',                nomEN:'Agronomy' },
  { id:4, code:'S04', color:'#8B5CF6', nomFR:'Hydroponie',               nomEN:'Hydroponics' },
  { id:5, code:'S05', color:'#EF4444', nomFR:'Protection des Plantes',   nomEN:'Plant Protection' },
]

const LABELS_FR = { temperature:'Température', humidite:'Humidité', vpd:'VPD', ph:'pH', ec:'EC', niveau_eau:'Niveau eau', co2:'CO₂', luminosite:'Luminosité' }
const LABELS_EN = { temperature:'Temperature',  humidite:'Humidity',  vpd:'VPD', ph:'pH', ec:'EC', niveau_eau:'Water level', co2:'CO₂', luminosite:'Light (PPFD)' }
const UNITS     = { temperature:'°C', humidite:'%', vpd:'kPa', ph:'', ec:'mS/cm', niveau_eau:'m', co2:'ppm', luminosite:'µmol/m²/s' }

const OPTIMAL = {
  temperature:{ min:18,  max:28,   color:'#F59E0B' },
  humidite:   { min:60,  max:80,   color:'#06B6D4' },
  vpd:        { min:0.8, max:1.5,  color:'#8B5CF6' },
  ph:         { min:5.5, max:7.0,  color:'#0891b2' },
  ec:         { min:1.5, max:3.5,  color:'#059669' },
  niveau_eau: { min:0.6, max:1.0,  color:'#3773bd' },
  co2:        { min:400, max:1200, color:'#22C55E' },
  luminosite: { min:100, max:600,  color:'#F59E0B' },
}

const T = {
  FR:{
    title:'Seuils agronomiques', sub:'Configurez min / max pour déclencher les alertes',
    save:'Enregistrer', saving:'Enregistrement...',
    cols:['Paramètre','Unité','Min','Max','Email alerte','Actif'],
    saved:(n) => `${n} seuil${n>1?'s':''} enregistré${n>1?'s':''} ✓`,
    selectAll:'Tout activer', deselectAll:'Tout désactiver',
    activeCount:(n,t) => `${n}/${t} actifs`,
    guideTitle:'Comment fonctionnent les seuils ?',
    guide1:'Définissez une valeur min et max pour chaque paramètre. Le système compare les mesures des capteurs à ces seuils toutes les 2 minutes.',
    guide2:'Quand une valeur dépasse le seuil, une alerte est automatiquement créée dans la section Alertes.',
    guide3:'Si vous renseignez une adresse email, un email d\'alerte est envoyé immédiatement au responsable.',
    guide4:'Le toggle "Actif" permet d\'activer ou désactiver la surveillance sans supprimer les seuils configurés.',
    optimal:'Valeurs optimales recommandées',
    noSeuils:'Aucun seuil configuré pour cette serre.',
    locked:'Accès restreint', lockedSub:'Votre compte est lié à ',
    accessAll:'Accès complet à toutes les serres',
  },
  EN:{
    title:'Agronomic thresholds', sub:'Set min / max values to trigger alerts',
    save:'Save', saving:'Saving...',
    cols:['Parameter','Unit','Min','Max','Alert email','Active'],
    saved:(n) => `${n} threshold${n>1?'s':''} saved ✓`,
    selectAll:'Enable all', deselectAll:'Disable all',
    activeCount:(n,t) => `${n}/${t} active`,
    guideTitle:'How do thresholds work?',
    guide1:'Set a minimum and maximum value for each parameter. The system compares sensor measurements to these thresholds every 2 minutes.',
    guide2:'When a value exceeds the threshold, an alert is automatically created in the Alerts section.',
    guide3:'If you enter an email address, an alert email is sent immediately to the relevant person.',
    guide4:'The "Active" toggle lets you enable or disable monitoring without deleting configured thresholds.',
    optimal:'Recommended optimal values',
    noSeuils:'No thresholds configured for this greenhouse.',
    locked:'Restricted access', lockedSub:'Your account is linked to ',
    accessAll:'Full access to all greenhouses',
  }
}

// ── Toggle switch ─────────────────────────────────────────────
function Toggle({ checked, onChange, isDark, disabled }) {
  return (
    <button role="switch" aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width:44, height:24, borderRadius:12, border:'none',
        cursor: disabled ? 'not-allowed' : 'pointer', padding:2,
        transition:'background 0.25s',
        background: disabled ? (isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.08)')
          : checked ? 'linear-gradient(135deg,#22C55E,#16A34A)'
          : (isDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.12)'),
        display:'flex', alignItems:'center',
        justifyContent: checked ? 'flex-end' : 'flex-start',
        flexShrink:0, opacity: disabled ? 0.4 : 1,
        boxShadow: (!disabled && checked) ? '0 0 8px rgba(34,197,94,0.4)' : 'none',
      }}>
      <div style={{ width:20, height:20, borderRadius:'50%', background:'white',
        boxShadow:'0 1px 4px rgba(0,0,0,0.25)', transition:'transform 0.25s' }}/>
    </button>
  )
}

export default function Seuils({ theme, lang, userRole }) {
  const isDark = theme === 'dark'
  const t      = T[lang] || T.FR
  const labels = lang === 'EN' ? LABELS_EN : LABELS_FR

  const { isSuperAdmin, allowedCode, allowedSerreId, canAccessSerre } = useAccess(userRole)
  // Email de l'utilisateur connecté — pré-rempli dans les champs email vides
  const userEmail = (() => {
    try { return JSON.parse(localStorage.getItem('sdi_user') || '{}').email || '' }
    catch { return '' }
  })()

  // Si l'utilisateur a une serre assignée, on démarre dessus
  const defaultId = allowedSerreId || 1  // supradmin: allowedSerreId=null → defaults to 1 (can switch freely)
  const [serreId, setSerreId] = useState(defaultId)
  const [seuils,  setSeuils]  = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [form,    setForm]    = useState({})
  const [toast,   setToast]   = useState({ msg:'', type:'' })

  // ── Couleurs ──
  const cardBg    = isDark ? 'rgba(16,27,46,0.85)' : '#FFFFFF'
  const border    = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'
  const ink       = isDark ? '#F1F5F9' : '#0F172A'
  const ink2      = isDark ? '#CBD5E1' : '#334155'
  const ink3      = isDark ? '#94A3B8' : '#64748B'
  const ink4      = isDark ? '#475569' : '#94A3B8'
  const inputBg   = isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF'
  const inputBdr  = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
  const rowHover  = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.015)'
  const guideBg   = isDark ? 'rgba(34,197,94,0.06)' : 'rgba(34,197,94,0.04)'
  const guideBdr  = isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.12)'

  const inputStyle = {
    background: inputBg, border:'1px solid ' + inputBdr, borderRadius:8,
    fontSize:13, outline:'none', color:isDark?'#F1F5F9':'#0F172A',
    fontFamily:"'JetBrains Mono',monospace", transition:'border-color 0.15s, box-shadow 0.15s',
  }

  async function load(id) {
    setLoading(true)
    const data = await dashboardAPI.getThresholds(id)
    setSeuils(data || [])
    const init = {}
    ;(data || []).forEach(s => {
      init[s.capteur + '_min']   = s.valeur_min ?? ''
      init[s.capteur + '_max']   = s.valeur_max ?? ''
      init[s.capteur + '_email'] = s.email_alerte || userEmail  // pré-rempli avec l'email de l'admin si vide
      init[s.capteur + '_actif'] = s.actif ?? true
    })
    setForm(init)
    setLoading(false)
  }

  useEffect(() => { load(serreId) }, [serreId])

  function update(key, val) { setForm(prev => ({ ...prev, [key]: val })) }

  // ── Select All / Deselect All ──
  const allActive   = seuils.length > 0 && seuils.every(s => form[s.capteur + '_actif'] !== false)
  const noneActive  = seuils.length > 0 && seuils.every(s => form[s.capteur + '_actif'] === false)
  const activeCount = seuils.filter(s => form[s.capteur + '_actif'] !== false).length

  function setAllActif(val) {
    setForm(prev => {
      const next = { ...prev }
      seuils.forEach(s => { next[s.capteur + '_actif'] = val })
      return next
    })
  }

  function showToast(msg, type='success') {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg:'', type:'' }), 3000)
  }

  async function save() {
    setSaving(true)
    let saved = 0
    for (const s of seuils) {
      await dashboardAPI.saveThreshold(serreId, s.capteur, {
        valeur_min:   parseFloat(form[s.capteur + '_min']) || null,
        valeur_max:   parseFloat(form[s.capteur + '_max']) || null,
        email_alerte: form[s.capteur + '_email'] || null,
        actif:        form[s.capteur + '_actif'] ?? true,
      })
      saved++
    }
    setSaving(false)
    showToast(t.saved(saved))
  }

  // Serre courante
  const serreMeta = SERRES.find(s => s.id === serreId) || SERRES[0]

  return (
    <div style={{ fontFamily:"'Manrope','DM Sans',system-ui,sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:'clamp(1.1rem,2vw,1.4rem)', fontWeight:800, margin:'0 0 4px',
            color:ink, letterSpacing:'-0.02em' }}>{t.title}</h1>
          <div style={{ fontSize:13, color:ink3 }}>{t.sub}</div>
        </div>
        <button onClick={save} disabled={saving} style={{
          padding:'10px 22px', borderRadius:12, border:'none',
          background:'linear-gradient(135deg,#22C55E,#16A34A)',
          color:'white', fontSize:13, fontWeight:700,
          cursor:saving?'not-allowed':'pointer',
          opacity:saving?0.7:1, boxShadow:'0 4px 14px rgba(34,197,94,0.3)',
          transition:'all 0.2s',
        }}
          onMouseEnter={e => { if(!saving) e.currentTarget.style.transform='translateY(-1px)' }}
          onMouseLeave={e => e.currentTarget.style.transform='none'}>
          {saving ? t.saving : t.save}
        </button>
      </div>

      {/* Toast */}
      {toast.msg && (
        <div style={{
          padding:'12px 18px', borderRadius:12, marginBottom:16, fontSize:13, fontWeight:600,
          background: toast.type==='success'
            ? 'linear-gradient(135deg,#22C55E,#16A34A)'
            : '#dc2626',
          color:'white', boxShadow:'0 4px 14px rgba(34,197,94,0.3)',
        }}>{toast.msg}</div>
      )}

      {/* ── Badge accès utilisateur ── */}
      <div style={{ marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
        {isSuperAdmin ? (
          <span style={{ fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:20,
            background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.25)', color:'#22C55E' }}>
            ✓ {t.accessAll}
          </span>
        ) : (
          <span style={{ fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:20,
            background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.25)', color:'#8B5CF6' }}>
            🔒 {t.locked} · {t.lockedSub}{allowedCode}
          </span>
        )}
      </div>

      {/* ── Guide ── */}
      <div style={{ background:guideBg, border:'1px solid ' + guideBdr, borderRadius:16, padding:'18px 22px', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <div style={{ width:32, height:32, borderRadius:10, background:'rgba(34,197,94,0.15)',
            border:'1px solid rgba(34,197,94,0.25)', display:'flex', alignItems:'center',
            justifyContent:'center', flexShrink:0 }}>
            <Info size={15} color="#22C55E"/>
          </div>
          <span style={{ fontSize:14, fontWeight:700, color:ink }}>{t.guideTitle}</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
          {[t.guide1, t.guide2, t.guide3, t.guide4].map((g, i) => (
            <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
              <div style={{ width:18, height:18, borderRadius:'50%', background:'rgba(34,197,94,0.15)',
                border:'1px solid rgba(34,197,94,0.3)', display:'flex', alignItems:'center',
                justifyContent:'center', flexShrink:0, marginTop:1 }}>
                <span style={{ fontSize:9, fontWeight:800, color:'#22C55E' }}>{i+1}</span>
              </div>
              <p style={{ fontSize:12, color:ink2, lineHeight:1.7, margin:0 }}>{g}</p>
            </div>
          ))}
        </div>
        <div style={{ fontSize:11, fontWeight:700, color:ink4, letterSpacing:'0.08em',
          textTransform:'uppercase', marginBottom:8 }}>{t.optimal}</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {Object.entries(OPTIMAL).map(([key, opt]) => (
            <div key={key} style={{ background:opt.color+'10', border:'1px solid ' + opt.color+'25',
              borderRadius:8, padding:'4px 10px', fontSize:11, color:opt.color,
              fontFamily:'monospace', fontWeight:600 }}>
              {labels[key]||key} : {opt.min}–{opt.max} {UNITS[key]}
            </div>
          ))}
        </div>
      </div>

      {/* ── Table des seuils ── */}
      <div style={{ background:cardBg, border:'1px solid ' + border, borderRadius:18, overflow:'hidden' }}>

        {/* Toolbar : sélecteur serre + select all/none */}
        <div style={{ padding:'16px 20px', borderBottom:'1px solid ' + border,
          display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>

          {/* ── Sélecteur de serre avec accès conditionnel ── */}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {SERRES.map(s => {
              const allowed  = canAccessSerre(s.code)
              const selected = s.id === serreId
              return (
                <button key={s.id}
                  onClick={() => allowed && setSerreId(s.id)}
                  title={!allowed ? (lang==='FR' ? 'Accès restreint à ' + allowedCode : 'Access restricted to ' + allowedCode) : ''}
                  style={{
                    display:'flex', alignItems:'center', gap:5,
                    padding:'7px 14px', borderRadius:10, fontSize:12, fontWeight:700,
                    fontFamily:'inherit', transition:'all 0.2s',
                    cursor: allowed ? 'pointer' : 'not-allowed',
                    // Style sélectionné
                    ...(selected ? {
                      background: s.color + '18',
                      border:'1.5px solid ' + s.color + '55',
                      color: s.color,
                    } : allowed ? {
                      background:'transparent',
                      border:'1px solid ' + border,
                      color: ink3,
                    } : {
                      // Verrouillé
                      background: isDark?'rgba(255,255,255,0.02)':'rgba(0,0,0,0.03)',
                      border:'1px solid ' + border,
                      color: isDark?'rgba(255,255,255,0.15)':'rgba(0,0,0,0.2)',
                      opacity: 0.45,
                    }),
                  }}
                  onMouseEnter={e => { if(allowed && !selected) {
                    e.currentTarget.style.background = s.color+'0d'
                    e.currentTarget.style.borderColor = s.color+'30'
                    e.currentTarget.style.color = s.color
                  }}}
                  onMouseLeave={e => { if(allowed && !selected) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.borderColor = border
                    e.currentTarget.style.color = ink3
                  }}}
                >
                  {!allowed && <Lock size={10} style={{ flexShrink:0 }}/>}
                  {allowed && selected && (
                    <span style={{ width:6, height:6, borderRadius:'50%', background:s.color, flexShrink:0 }}/>
                  )}
                  {s.code}
                  {!allowed && <span style={{ fontSize:9 }}>🔒</span>}
                </button>
              )
            })}
          </div>

          {/* Compteur + Tout activer/désactiver */}
          {seuils.length > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              {/* Compteur */}
              <span style={{ fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:20,
                background: isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)',
                border:'1px solid ' + border, color:ink3, fontFamily:'monospace' }}>
                {t.activeCount(activeCount, seuils.length)}
              </span>
              {/* Tout activer */}
              <button onClick={() => setAllActif(true)} disabled={allActive} style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'7px 14px', borderRadius:10,
                border:'1px solid rgba(34,197,94,0.3)',
                background: allActive
                  ? (isDark?'rgba(34,197,94,0.04)':'rgba(34,197,94,0.03)')
                  : (isDark?'rgba(34,197,94,0.12)':'rgba(34,197,94,0.08)'),
                color: allActive ? ink4 : '#22C55E',
                fontSize:12, fontWeight:600, cursor:allActive?'not-allowed':'pointer',
                fontFamily:'inherit', transition:'all 0.15s', opacity:allActive?0.5:1,
              }}
                onMouseEnter={e => { if(!allActive) e.currentTarget.style.background = isDark?'rgba(34,197,94,0.2)':'rgba(34,197,94,0.15)' }}
                onMouseLeave={e => { if(!allActive) e.currentTarget.style.background = isDark?'rgba(34,197,94,0.12)':'rgba(34,197,94,0.08)' }}>
                <ToggleRight size={15}/> {t.selectAll}
              </button>
              {/* Tout désactiver */}
              <button onClick={() => setAllActif(false)} disabled={noneActive} style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'7px 14px', borderRadius:10,
                border:'1px solid ' + (isDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'),
                background: isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)',
                color: noneActive ? ink4 : ink3,
                fontSize:12, fontWeight:600, cursor:noneActive?'not-allowed':'pointer',
                fontFamily:'inherit', transition:'all 0.15s', opacity:noneActive?0.5:1,
              }}
                onMouseEnter={e => { if(!noneActive) { e.currentTarget.style.background='rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor='rgba(239,68,68,0.25)'; e.currentTarget.style.color='#EF4444' } }}
                onMouseLeave={e => { if(!noneActive) { e.currentTarget.style.background=isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)'; e.currentTarget.style.borderColor=isDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'; e.currentTarget.style.color=ink3 } }}>
                <ToggleLeft size={15}/> {t.deselectAll}
              </button>
            </div>
          )}
        </div>

        {/* Nom serre + indicateur */}
        <div style={{ padding:'10px 20px', borderBottom:'1px solid ' + border,
          background: isDark?'rgba(255,255,255,0.015)':'rgba(0,0,0,0.01)',
          display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:serreMeta.color,
            boxShadow:'0 0 6px ' + serreMeta.color }}/>
          <span style={{ fontSize:13, fontWeight:700, color:ink }}>
            {serreMeta.code} — {lang==='EN' ? serreMeta.nomEN : serreMeta.nomFR}
          </span>
          {!canAccessSerre(serreMeta.code) && (
            <span style={{ fontSize:11, color:'#EF4444', display:'flex', alignItems:'center', gap:4 }}>
              <Lock size={11}/> {t.locked}
            </span>
          )}
        </div>

        {/* Corps table */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'3rem' }}><div className="spinner"/></div>
        ) : seuils.length === 0 ? (
          <div style={{ textAlign:'center', padding:'3rem', color:ink3, fontSize:13 }}>{t.noSeuils}</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:isDark?'rgba(255,255,255,0.02)':'rgba(0,0,0,0.02)' }}>
                  {t.cols.map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'10px 16px',
                      fontSize:11, letterSpacing:'0.06em', textTransform:'uppercase',
                      color:ink4, borderBottom:'1px solid ' + border, fontWeight:700 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {seuils.map(s => {
                  const opt    = OPTIMAL[s.capteur]
                  const curMin = parseFloat(form[s.capteur + '_min'])
                  const curMax = parseFloat(form[s.capteur + '_max'])
                  const warnMin = opt && !isNaN(curMin) && curMin < opt.min
                  const warnMax = opt && !isNaN(curMax) && curMax > opt.max
                  const isActif = form[s.capteur + '_actif'] !== false

                  return (
                    <tr key={s.capteur}
                      style={{ transition:'background 0.15s', opacity:isActif?1:0.5 }}
                      onMouseEnter={e => e.currentTarget.style.background = rowHover}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                      {/* Paramètre */}
                      <td style={{ padding:'12px 16px', borderBottom:'1px solid ' + border }}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:6,
                          padding:'4px 12px', borderRadius:999,
                          background:isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)',
                          fontSize:13, fontWeight:500, color:ink2 }}>
                          {opt && <span style={{ width:6, height:6, borderRadius:'50%', background:opt.color, flexShrink:0 }}/>}
                          {labels[s.capteur]||s.capteur}
                        </span>
                      </td>

                      {/* Unité */}
                      <td style={{ padding:'12px 16px', borderBottom:'1px solid ' + border,
                        fontFamily:'monospace', fontSize:12, color:ink3 }}>
                        {UNITS[s.capteur]||''}
                      </td>

                      {/* Min */}
                      <td style={{ padding:'12px 16px', borderBottom:'1px solid ' + border }}>
                        <div style={{ position:'relative', display:'inline-flex', alignItems:'center' }}>
                          <input type="number" step="0.1" value={form[s.capteur + '_min']}
                            onChange={e => update(s.capteur + '_min', e.target.value)}
                            style={{ ...inputStyle, width:72, padding:'6px 8px', textAlign:'center',
                              borderColor:warnMin?'#F59E0B':inputBdr,
                              boxShadow:warnMin?'0 0 0 2px rgba(245,158,11,0.15)':'none' }}
                            onFocus={e => { e.target.style.borderColor='#22C55E'; e.target.style.boxShadow='0 0 0 2px rgba(34,197,94,0.15)' }}
                            onBlur={e  => { e.target.style.borderColor=warnMin?'#F59E0B':inputBdr; e.target.style.boxShadow=warnMin?'0 0 0 2px rgba(245,158,11,0.15)':'none' }}
                          />
                          {warnMin && <AlertTriangle size={11} color="#F59E0B" style={{ position:'absolute', right:-16, top:'50%', transform:'translateY(-50%)' }}/>}
                        </div>
                      </td>

                      {/* Max */}
                      <td style={{ padding:'12px 16px', borderBottom:'1px solid ' + border }}>
                        <div style={{ position:'relative', display:'inline-flex', alignItems:'center' }}>
                          <input type="number" step="0.1" value={form[s.capteur + '_max']}
                            onChange={e => update(s.capteur + '_max', e.target.value)}
                            style={{ ...inputStyle, width:72, padding:'6px 8px', textAlign:'center',
                              borderColor:warnMax?'#F59E0B':inputBdr,
                              boxShadow:warnMax?'0 0 0 2px rgba(245,158,11,0.15)':'none' }}
                            onFocus={e => { e.target.style.borderColor='#22C55E'; e.target.style.boxShadow='0 0 0 2px rgba(34,197,94,0.15)' }}
                            onBlur={e  => { e.target.style.borderColor=warnMax?'#F59E0B':inputBdr; e.target.style.boxShadow=warnMax?'0 0 0 2px rgba(245,158,11,0.15)':'none' }}
                          />
                          {warnMax && <AlertTriangle size={11} color="#F59E0B" style={{ position:'absolute', right:-16, top:'50%', transform:'translateY(-50%)' }}/>}
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding:'12px 16px', borderBottom:'1px solid ' + border }}>
                        <input type="email" value={form[s.capteur + '_email']}
                          onChange={e => update(s.capteur + '_email', e.target.value)}
                          placeholder={userEmail || "email@..."}
                          style={{ ...inputStyle, width:190, padding:'6px 10px',
                            color:isDark?'#94A3B8':'#64748B' }}
                          onFocus={e => { e.target.style.borderColor='#22C55E'; e.target.style.boxShadow='0 0 0 2px rgba(34,197,94,0.15)'; e.target.style.color=isDark?'#F1F5F9':'#0F172A' }}
                          onBlur={e  => { e.target.style.borderColor=inputBdr; e.target.style.boxShadow='none'; e.target.style.color=isDark?'#94A3B8':'#64748B' }}
                        />
                      </td>

                      {/* Actif — Toggle */}
                      <td style={{ padding:'12px 16px', borderBottom:'1px solid ' + border }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <Toggle
                            checked={isActif}
                            onChange={val => update(s.capteur + '_actif', val)}
                            isDark={isDark}
                          />
                          <span style={{ fontSize:11, fontWeight:600, fontFamily:'monospace',
                            color:isActif?'#22C55E':ink4, minWidth:28 }}>
                            {isActif?'ON':'OFF'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
