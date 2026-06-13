// src/pages/dashboard/EtatSerre.jsx
// ════════════════════════════════════════════════════════════════
// SECTION CENTRALE DU DASHBOARD
// Structure :
//   1. Bannière : sélecteur serre + nom + statut + météo extérieure
//   2. Ambiance intérieure : grandes cartes ENV + IRR
//   3. Schéma SVG enrichi + panneaux actionneurs droite
// ════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react'
import {
  ChevronLeft, ChevronRight, Info, CheckCircle, AlertTriangle, Clock, Lock,
  Thermometer, Droplets, Wind, Leaf, FlaskConical, Zap, Waves, BarChart2, Sun as SunIcon,
  RefreshCw, Wind as WindIcon, Sun, CloudRain, Sunrise, Sunset,
  Pencil, Check, X as XIcon, Flame, AirVent, Settings, Gauge,
} from 'lucide-react'
import { dashboardAPI } from '../../api/client'
import { useAccess } from '../../hooks/useAccess'
import { POPUP_INFO } from '../../components/geoportail/SectionDonnees'

// ── Constantes ────────────────────────────────────────────────
const SERRES = [
  { id:1, code:'S01', color:'#22C55E', nomFR:'Génétique & Amélioration des Plantes', nomEN:'Plant Genetics & Improvement' },
  { id:2, code:'S02', color:'#06B6D4', nomFR:'Horticulture',                          nomEN:'Horticulture' },
  { id:3, code:'S03', color:'#F59E0B', nomFR:'Agronomie',                             nomEN:'Agronomy' },
  { id:4, code:'S04', color:'#8B5CF6', nomFR:'Hydroponie & Systèmes Innovants',       nomEN:'Hydroponics & Innovative Systems' },
  { id:5, code:'S05', color:'#EF4444', nomFR:'Protection des Plantes',                nomEN:'Plant Protection' },
]

const PARAM_ICONS = {
  temperature:Thermometer, humidite:Droplets, vpd:Wind, co2:Leaf,
  luminosite:SunIcon,
  ph:FlaskConical, ec:Zap, temp_eau:Waves, niveau_eau:BarChart2,
}

const ENV_KEYS = ['temperature','humidite','vpd','co2','luminosite']
const IRR_KEYS = ['ph','ec','temp_eau','niveau_eau']

const OPTIMAL = {
  temperature:{ min:20, max:25 }, humidite:{ min:60, max:80 },
  vpd:{ min:0.8, max:1.5 },      co2:{ min:500, max:1000 },
  luminosite:{ min:100, max:600 },
  ph:{ min:5.5, max:7.0 },       ec:{ min:1.5, max:3.5 },
  temp_eau:{ min:18, max:22 },   niveau_eau:{ min:0.6, max:1.0 },
}

// Valeurs par défaut Pro-Leaf — fallback si l'API ne répond pas
const PI_DEFAULTS = {
  ventilation_jour:       { seuil:25,   deadband:2  },
  ventilation_nuit:       { seuil:20,   deadband:2  },
  chauffage_jour:         { seuil:20,   deadband:2  },
  chauffage_nuit:         { seuil:15,   deadband:2  },
  humidification_jour:    { seuil:60,   deadband:5  },
  humidification_nuit:    { seuil:60,   deadband:5  },
  deshumidification_jour: { seuil:80,   deadband:5  },
  deshumidification_nuit: { seuil:80,   deadband:5  },
  co2_injection:          { seuil:1000, deadband:50 },
  co2_purge:              { seuil:500,  deadband:50 },
}

// Convertit le format API plat → format structuré utilisé par equipEtats
function apiToStruct(p) {
  const g = (k) => ({ ...(PI_DEFAULTS[k]), ...(p[k] || {}) })
  return {
    ventilation: {
      cooling_jour: { seuil: g('ventilation_jour').seuil,    deadband: g('ventilation_jour').deadband },
      cooling_nuit: { seuil: g('ventilation_nuit').seuil,    deadband: g('ventilation_nuit').deadband },
    },
    chauffage: {
      heating_jour: { seuil: g('chauffage_jour').seuil,      deadband: g('chauffage_jour').deadband },
      heating_nuit: { seuil: g('chauffage_nuit').seuil,      deadband: g('chauffage_nuit').deadband },
    },
    humidification: {
      jour: { seuil: g('humidification_jour').seuil,         deadband: g('humidification_jour').deadband },
      nuit: { seuil: g('humidification_nuit').seuil,         deadband: g('humidification_nuit').deadband },
    },
    deshumidification: {
      jour: { seuil: g('deshumidification_jour').seuil,      deadband: g('deshumidification_jour').deadband },
      nuit: { seuil: g('deshumidification_nuit').seuil,      deadband: g('deshumidification_nuit').deadband },
    },
    co2: {
      up:   { seuil: g('co2_injection').seuil,               deadband: g('co2_injection').deadband },
      down: { seuil: g('co2_purge').seuil,                   deadband: g('co2_purge').deadband },
      mode_fuzzy: true, lock_cooling: true, lock_dehumidify: true,
    },
  }
}

const ACTIONNEURS = {
  ombrage_ext: { deploie:28, retracte:24, plage:[10,17.5] },
  ombrage_int: { deploie:34, retracte:27, plage:[11,18.5] },
  fenetre:     { ouvre:25, ferme:23, vent_max:40 },
}

// ── Helpers ───────────────────────────────────────────────────
function paramStatus(value, key, seuil) {
  const opt = OPTIMAL[key]
  if (value == null) return 'na'
  if (seuil?.actif !== false) {
    if (seuil?.valeur_min != null && value < seuil.valeur_min) return 'alerte'
    if (seuil?.valeur_max != null && value > seuil.valeur_max) return 'alerte'
  }
  if (opt && (value < opt.min || value > opt.max)) return 'attention'
  return 'ok'
}
function ecranEtat(temp, s) {
  if (temp == null) return { etat:'retracte', na:true }
  if (temp > s.deploie) return { etat:'deploye' }
  if (temp < s.retracte) return { etat:'retracte' }
  return { etat: temp >= (s.deploie+s.retracte)/2 ? 'deploye' : 'retracte', neutre:true }
}
function fenetreEtat(temp, vent, pluie, s) {
  if (pluie || (vent != null && vent > s.vent_max)) return { etat:'ferme', force:true }
  if (temp == null) return { etat:'ferme', na:true }
  if (temp > s.ouvre) return { etat:'ouvert' }
  if (temp < s.ferme) return { etat:'ferme' }
  return { etat: temp >= (s.ouvre+s.ferme)/2 ? 'ouvert' : 'ferme', neutre:true }
}
function dansPlage(plage) {
  const n = new Date(); const h = n.getHours() + n.getMinutes()/60
  return h >= plage[0] && h <= plage[1]
}
function isJour(sunrise, sunset) {
  const now = new Date(); const h = now.getHours() + now.getMinutes()/60
  const lev = parseH(sunrise) ?? 6.5
  const cou = parseH(sunset)  ?? 19.5
  return h >= lev && h <= cou
}
function equipEtats(temp, humid, co2Val, jour, pi) {
  const cooling  = jour ? pi.ventilation.cooling_jour : pi.ventilation.cooling_nuit
  const heating  = jour ? pi.chauffage.heating_jour   : pi.chauffage.heating_nuit
  const deshumid = jour ? pi.deshumidification.jour   : pi.deshumidification.nuit
  const humidif  = jour ? pi.humidification.jour      : pi.humidification.nuit
  return {
    ventilateur: temp  != null ? (temp  > cooling.seuil               ? 'actif' : temp  > cooling.seuil  - cooling.deadband  ? 'neutre' : 'inactif') : 'na',
    chauffage:   temp  != null ? (temp  < heating.seuil               ? 'actif' : temp  < heating.seuil  + heating.deadband  ? 'neutre' : 'inactif') : 'na',
    brumisateur: humid != null ? (humid < humidif.seuil               ? 'actif' : humid < humidif.seuil  + humidif.deadband  ? 'neutre' : 'inactif') : 'na',
    deshumid:    humid != null ? (humid > deshumid.seuil              ? 'actif' : humid > deshumid.seuil - deshumid.deadband ? 'neutre' : 'inactif') : 'na',
    co2inj:      (co2Val != null && jour)  ? (co2Val < pi.co2.up.seuil   - pi.co2.up.deadband   ? 'actif' : co2Val < pi.co2.up.seuil   ? 'neutre' : 'inactif') : 'na',
    co2purge:    (co2Val != null && !jour) ? (co2Val > pi.co2.down.seuil + pi.co2.down.deadband ? 'actif' : co2Val > pi.co2.down.seuil ? 'neutre' : 'inactif') : 'na',
  }
}
const parseH = (iso) => {
  if (!iso) return null
  const t = String(iso).split('T')[1]; if (!t) return null
  const [h,m] = t.split(':'); return +h + (+m||0)/60
}
const fmtPlage = (p) =>
  `${String(Math.floor(p[0])).padStart(2,'0')}:${p[0]%1?'30':'00'}–${String(Math.floor(p[1])).padStart(2,'0')}:${p[1]%1?'30':'00'}`
const fmtT = (iso) => { if (!iso) return '—'; const p = String(iso).split('T')[1]; return p ? p.slice(0,5) : '—' }

// ── Traductions ───────────────────────────────────────────────
const T = {
  FR:{
    env:'Ambiance intérieure', irr:'Irrigation',
    noIrr:'Pas de données d\'irrigation pour cette unité.',
    hover:'Survolez une carte pour voir ce que ce paramètre signifie dans cette serre.',
    optimal:'Zone optimale', seuils:'Seuils', actuelle:'Valeur actuelle',
    stOk:'Optimal', stAtt:'Hors zone optimale', stAl:'Seuil dépassé', stNa:'N/D',
    live:'LIVE', partiel:'PARTIEL',
    schema:'La serre en direct', heure:'heure de Rabat',
    ombrageExt:'Ombrage ext.', ombrageInt:'Ombrage int.', fenetres:'Fenêtres toiture',
    deploye:'Déployé', retracte:'Rétracté', ouvert:'Ouvertes', ferme:'Fermées', fermeSec:'Sécurité',
    active:'Active', horsPlage:'hors plage', neutre:'transition',
    note:'Seuils réglés dans l\'application locale du complexe.',
    ventL:'Vent', rayL:'Rayonnement', pluieL:'Pluie', oui:'Oui', non:'Non',
    leverL:'Lever', coucherL:'Coucher', tempExtL:'Temp. ext.', pressionL:'Pression',
    etatGlobal:'État global', derniereMAJ:'Dernière mise à jour',
    equipTitre:'Équipements internes', jour:'Jour', nuit:'Nuit',
    ventTitre:'Ventilation', chauffTitre:'Chauffage', brumTitre:'Brumisateur', deshumTitre:'Déshumidification', co2Titre:'CO₂',
    actifL:'Actif', inactifL:'Inactif', transitionL:'Transition', naLabel:'N/D',
    deadband:'Deadband', seuilJour:'Seuil jour', seuilNuit:'Seuil nuit',
    fuzzy:'Fuzzy Control actif', lockCool:'Lock Cooling', lockDeshumid:'Lock Déshumid.',
  },
  EN:{
    env:'Indoor climate', irr:'Irrigation',
    noIrr:'No irrigation data for this unit.',
    hover:'Hover a card to see what this parameter means in this greenhouse.',
    optimal:'Optimal zone', seuils:'Thresholds', actuelle:'Current value',
    stOk:'Optimal', stAtt:'Outside optimal', stAl:'Alert exceeded', stNa:'N/A',
    live:'LIVE', partiel:'PARTIAL',
    schema:'Live greenhouse', heure:'Rabat time',
    ombrageExt:'Ext. shade', ombrageInt:'Int. shade', fenetres:'Roof windows',
    deploye:'Deployed', retracte:'Retracted', ouvert:'Open', ferme:'Closed', fermeSec:'Safety',
    active:'Active', horsPlage:'off-schedule', neutre:'transition',
    note:'Thresholds set in the complex\'s local application.',
    ventL:'Wind', rayL:'Radiation', pluieL:'Rain', oui:'Yes', non:'No',
    leverL:'Sunrise', coucherL:'Sunset', tempExtL:'Ext. temp.', pressionL:'Pressure',
    etatGlobal:'Global status', derniereMAJ:'Last update',
    equipTitre:'Internal equipment', jour:'Day', nuit:'Night',
    ventTitre:'Ventilation', chauffTitre:'Heating', brumTitre:'Humidifier', deshumTitre:'Dehumidification', co2Titre:'CO₂',
    actifL:'Active', inactifL:'Inactive', transitionL:'Transition', naLabel:'N/A',
    deadband:'Deadband', seuilJour:'Day threshold', seuilNuit:'Night threshold',
    fuzzy:'Fuzzy Control active', lockCool:'Cooling Lock', lockDeshumid:'Dehumid. Lock',
  },
}

// ════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════════
export default function EtatSerre({ liveData=[], meteo={}, stats={}, countdown, refreshAll, theme, lang, userRole }) {
  const isDark = theme === 'dark'
  const t      = T[lang] || T.FR
  const { isSuperAdmin, allowedSerreId, canAccessSerre } = useAccess(userRole)

  // État local : serre sélectionnée (unique, contrôle toute la section)
  const defaultIdx = allowedSerreId ? allowedSerreId - 1 : 0
  const [idx, setIdx]               = useState(defaultIdx)
  const [thresholds, setThresholds] = useState([])

  // ── Params internes dynamiques ──────────────────────────────
  const [paramsFlat,   setParamsFlat]   = useState({ ...PI_DEFAULTS })
  const [paramsStruct, setParamsStruct] = useState(apiToStruct(PI_DEFAULTS))
  const [editingCard,  setEditingCard]  = useState(null)   // 'ventilation' | 'chauffage' | ...
  const [editForm,     setEditForm]     = useState({})
  const [saving,       setSaving]       = useState(false)
  const [saveOk,       setSaveOk]       = useState(null)   // null | 'ok' | 'err'

  const meta   = SERRES[idx]
  const serre  = liveData[idx] || {}
  const env    = serre.env || {}
  const irr    = serre.irr || {}
  const hasIrr = irr && Object.values(irr).some(v => v != null)
  const temp   = env.temperature
  const canEdit = canAccessSerre(meta.id)

  useEffect(() => {
    let alive = true
    dashboardAPI.getThresholds(meta.id)
      .then(d => { if (alive) setThresholds(d || []) })
      .catch(() => { if (alive) setThresholds([]) })
    return () => { alive = false }
  }, [meta.id])

  // Charger les params internes depuis l'API à chaque changement de serre
  useEffect(() => {
    let alive = true
    dashboardAPI.getParams(meta.id)
      .then(data => {
        if (!alive || !data?.params) return
        const flat = {}
        Object.keys(PI_DEFAULTS).forEach(k => {
          flat[k] = { ...PI_DEFAULTS[k], ...(data.params[k] || {}) }
        })
        setParamsFlat(flat)
        setParamsStruct(apiToStruct(flat))
      })
      .catch(() => { /* garde les defaults */ })
    return () => { alive = false }
  }, [meta.id])

  // ── Helpers édition inline ──────────────────────────────────
  function startEdit(cardKey, actions) {
    const init = {}
    actions.forEach(a => {
      init[a + '_seuil']    = String(paramsFlat[a]?.seuil    ?? PI_DEFAULTS[a].seuil)
      init[a + '_deadband'] = String(paramsFlat[a]?.deadband ?? PI_DEFAULTS[a].deadband)
    })
    setEditForm(init)
    setEditingCard(cardKey)
    setSaveOk(null)
  }
  function cancelEdit() { setEditingCard(null); setEditForm({}); setSaveOk(null) }
  async function saveEdit(actions) {
    setSaving(true)
    try {
      const payload = {}
      actions.forEach(a => {
        const s = parseFloat(editForm[a + '_seuil'])
        const d = parseFloat(editForm[a + '_deadband'])
        if (!isNaN(s) && !isNaN(d)) payload[a] = { seuil: s, deadband: d }
      })
      await dashboardAPI.saveParamsBatch(meta.id, payload)
      const newFlat = { ...paramsFlat }
      Object.entries(payload).forEach(([k, v]) => { newFlat[k] = v })
      setParamsFlat(newFlat)
      setParamsStruct(apiToStruct(newFlat))
      setSaveOk('ok')
      setTimeout(() => { setEditingCard(null); setEditForm({}); setSaveOk(null) }, 900)
    } catch { setSaveOk('err') }
    finally { setSaving(false) }
  }

  const ext   = ecranEtat(temp, ACTIONNEURS.ombrage_ext)
  const int   = ecranEtat(temp, ACTIONNEURS.ombrage_int)
  const fen   = fenetreEtat(temp, meteo.vent, meteo.pluie, ACTIONNEURS.fenetre)
  const jour  = isJour(meteo.sunrise, meteo.sunset)
  const equip = equipEtats(temp, env.humidite, env.co2, jour, paramsStruct)
  const getSeuil = (key) => thresholds.find(s => s.capteur === key) || null

  // Couleurs
  const cardBg   = isDark ? 'rgba(16,27,46,0.85)' : '#FFFFFF'
  const border   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'
  const ink      = isDark ? '#F1F5F9' : '#0F172A'
  const ink2     = isDark ? '#CBD5E1' : '#334155'
  const ink3     = isDark ? '#94A3B8' : '#64748B'
  const ink4     = isDark ? '#475569' : '#94A3B8'
  const surf     = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'

  const navBtn = {
    width:32, height:32, borderRadius:8, cursor:'pointer', border:'1px solid ' + border,
    background: isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)',
    color:ink3, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
  }

  // Météo extérieure
  const extStats = [
    { icon:<WindIcon size={18}/>,    label:t.ventL,      val:meteo.vent     != null ? meteo.vent     : '—', unit:'km/h', color:'#06B6D4' },
    { icon:<Sun size={18}/>,         label:t.rayL,       val:meteo.solaire  != null ? meteo.solaire  : '—', unit:'W/m²', color:'#F59E0B' },
    { icon:<CloudRain size={18}/>,   label:t.pluieL,     val:meteo.pluie ? t.oui : t.non,                   unit:'',     color:meteo.pluie?'#3773bd':ink4 },
    { icon:<Thermometer size={18}/>, label:t.tempExtL,   val:meteo.temp_ext != null ? meteo.temp_ext : '—', unit:'°C',   color:'#EF4444' },
    { icon:<Gauge size={18}/>,       label:t.pressionL,  val:meteo.pression != null ? meteo.pression : '—', unit:'hPa',  color:'#8B5CF6' },
    { icon:<Sunrise size={18}/>,     label:t.leverL,     val:fmtT(meteo.sunrise),                            unit:'',     color:'#F59E0B' },
    { icon:<Sunset size={18}/>,      label:t.coucherL,   val:fmtT(meteo.sunset),                             unit:'',     color:'#8B5CF6' },
  ]

  const alertCount = stats?.alertes_actives || 0

  return (
    <div style={{ fontFamily:"'Manrope','DM Sans',system-ui,sans-serif" }}>

      {/* ══════════════════════════════════════════════════════════
          1. BANNIÈRE PRINCIPALE
          Sélecteur + nom serre + statut + météo + countdown
      ══════════════════════════════════════════════════════════ */}
      <div style={{
        background: isDark
          ? 'linear-gradient(135deg, rgba(16,27,46,0.95) 0%, rgba('+
            (idx===0?'34,197,94':idx===1?'6,182,212':idx===2?'245,158,11':idx===3?'139,92,246':'239,68,68')+
            ',0.08) 100%)'
          : 'linear-gradient(135deg, #FFFFFF 0%, ' + meta.color + '06 100%)',
        border: '1px solid ' + border,
        borderTop: '3px solid ' + meta.color,
        borderRadius: 18, padding: '20px 24px', marginBottom: 16,
        boxShadow: isDark ? '0 4px 32px rgba(0,0,0,0.35)' : '0 4px 16px rgba(0,0,0,0.06)',
      }}>
        {/* Ligne 1 : sélecteur de serre */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:12 }}>
          {/* Sélecteur */}
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <button onClick={() => setIdx(i => (i - 1 + 5) % 5)} style={navBtn}><ChevronLeft size={14}/></button>
            <div style={{ display:'flex', gap:4 }}>
              {SERRES.map((s,i) => (
                <button key={s.id} onClick={() => setIdx(i)} style={{
                  padding:'6px 12px', borderRadius:8, fontSize:12, fontWeight:600,
                  fontFamily:'inherit', whiteSpace:'nowrap', transition:'all 0.2s', cursor:'pointer',
                  border:'1px solid ' + (idx===i ? s.color+'60':'transparent'),
                  background: idx===i ? s.color+'18':'transparent',
                  color: idx===i ? s.color : ink3,
                }}>
                  {s.code}
                </button>
              ))}
            </div>
            <button onClick={() => setIdx(i => (i + 1) % 5)} style={navBtn}><ChevronRight size={14}/></button>
          </div>
          {/* Countdown + refresh */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {countdown && (
              <span style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px',
                borderRadius:999, fontSize:11, fontFamily:'monospace', fontWeight:700,
                background:isDark?'rgba(34,197,94,0.1)':'rgba(34,197,94,0.08)',
                border:'1px solid rgba(34,197,94,0.25)', color:'#22C55E' }}>
                <span style={{ width:5, height:5, borderRadius:'50%', background:'#22C55E',
                  boxShadow:'0 0 5px #22C55E' }} />
                {countdown}
              </span>
            )}
            {refreshAll && (
              <button onClick={refreshAll} style={{ display:'flex', alignItems:'center', gap:5,
                padding:'6px 12px', borderRadius:10, border:'1px solid ' + border,
                background:isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)',
                color:ink3, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                <RefreshCw size={12}/> {lang==='FR'?'Actualiser':'Refresh'}
              </button>
            )}
          </div>
        </div>

        {/* Ligne 2 : nom + statut */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18, flexWrap:'wrap', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:42, height:42, borderRadius:12, flexShrink:0,
              background:meta.color+'18', border:'1px solid ' + meta.color+'30',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:18, fontWeight:900, color:meta.color, fontFamily:'monospace' }}>
                {idx+1}
              </span>
            </div>
            <div>
              <div style={{ fontSize:17, fontWeight:800, color:ink, letterSpacing:'-0.02em', lineHeight:1.2 }}>
                {lang==='EN' ? meta.nomEN : meta.nomFR}
              </div>
              <div style={{ fontSize:11, color:ink3, marginTop:3 }}>
                {meta.code} · {lang==='FR'?'AgroBioTech · IAV Hassan II':'AgroBioTech · IAV Hassan II'}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:20,
              background: serre.statut==='ok' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
              border:'1px solid ' + (serre.statut==='ok' ? 'rgba(34,197,94,0.25)':'rgba(245,158,11,0.25)'),
              color: serre.statut==='ok' ? '#22C55E' : '#F59E0B' }}>
              ● {serre.statut==='ok' ? t.live : t.partiel}
            </span>
            {alertCount > 0 && (
              <span style={{ fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:20,
                background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', color:'#EF4444' }}>
                ⚠ {alertCount} {lang==='FR'?'alerte'+(alertCount>1?'s':''):'alert'+(alertCount>1?'s':'')}
              </span>
            )}
          </div>
        </div>

        {/* Ligne 3 : météo extérieure — cartes grandes intégrées dans la bannière */}
        <div style={{ borderTop:'1px solid ' + border, paddingTop:14 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase',
            color:ink4, marginBottom:10 }}>
            {lang==='FR'?'Conditions extérieures · Rabat (Open-Meteo)':'Outdoor conditions · Rabat (Open-Meteo)'}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
            {extStats.map((s,i) => (
              <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                padding:'12px 8px', borderRadius:12, border:'1px solid ' + border,
                background:isDark?'rgba(255,255,255,0.02)':'rgba(0,0,0,0.015)',
                textAlign:'center' }}>
                <span style={{ width:36, height:36, borderRadius:10, flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background:s.color+'18', color:s.color }}>
                  {s.icon}
                </span>
                <div style={{ fontSize:10, color:ink4, fontWeight:600, letterSpacing:'0.05em',
                  textTransform:'uppercase' }}>{s.label}</div>
                <div style={{ fontSize:22, fontWeight:800, fontFamily:"'JetBrains Mono',monospace",
                  color:s.color, lineHeight:1 }}>
                  {s.val}
                  {s.unit && <span style={{ fontSize:11, color:ink4, marginLeft:2, fontWeight:500 }}>{s.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          2. AMBIANCE INTÉRIEURE — ENV (grandes cartes)
      ══════════════════════════════════════════════════════════ */}
      <div style={{ background:cardBg, border:'1px solid ' + border, borderRadius:18, padding:'20px 24px', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
          <h2 style={{ fontSize:15, fontWeight:800, margin:0, color:ink, letterSpacing:'-0.01em' }}>{t.env}</h2>
          <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10,
            background:meta.color+'15', border:'1px solid ' + meta.color+'25', color:meta.color }}>
            {lang==='EN' ? meta.nomEN.split('&')[0].trim() : meta.nomFR.split('&')[0].trim()}
          </span>
        </div>
        <div style={{ fontSize:11, color:ink3, marginBottom:16, display:'flex', alignItems:'center', gap:5 }}>
          <Info size={11}/> {t.hover}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(195px,1fr))', gap:14 }}>
          {ENV_KEYS.map(key => (
            <ParamCard key={key} paramKey={key} value={env[key]} meta={meta}
              seuil={getSeuil(key)} lang={lang} isDark={isDark} t={t} />
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          IRRIGATION — IRR
      ══════════════════════════════════════════════════════════ */}
      <div style={{ background:cardBg, border:'1px solid ' + border, borderRadius:18, padding:'20px 24px', marginBottom:16 }}>
        <h2 style={{ fontSize:15, fontWeight:800, margin:'0 0 16px', color:ink, letterSpacing:'-0.01em' }}>{t.irr}</h2>
        {hasIrr ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(195px,1fr))', gap:14 }}>
            {IRR_KEYS.map(key => (
              <ParamCard key={key} paramKey={key} value={irr[key]} meta={meta}
                seuil={getSeuil(key)} lang={lang} isDark={isDark} t={t} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign:'center', padding:'2rem', color:ink3, fontSize:13 }}>{t.noIrr}</div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          3. SCHÉMA SVG + PANNEAUX ACTIONNEURS
      ══════════════════════════════════════════════════════════ */}
      <div style={{ background:cardBg, border:'1px solid ' + border, borderRadius:18, overflow:'hidden' }}>
        <div style={{ padding:'16px 24px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <span style={{ fontSize:13, fontWeight:700, color:ink }}>{t.schema}</span>
            <span style={{ fontSize:11, color:ink4, marginLeft:8 }}>· {t.heure}</span>
          </div>
          <span style={{ fontSize:10, fontFamily:'monospace', fontWeight:700, color:meta.color,
            background:meta.color+'12', border:'1px solid ' + meta.color+'25',
            padding:'3px 10px', borderRadius:20 }}>{meta.code}</span>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
          {/* SVG — full width always */}
          <div style={{ padding:'0 16px 12px 16px' }}>
            <Scene
              isDark={isDark} serreColor={meta.color} meteo={meteo}
              ext={ext.etat} int={int.etat} fenetre={fen.etat}
              serreIdx={idx} temp={temp} equip={equip} jour={jour}
            />
          </div>

          {/* Panneaux actionneurs — row wrap below the schema */}
          <div style={{ padding:'0 16px 16px', borderTop:'1px solid ' + border }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10, paddingTop:12 }}>
              <ActionCard isDark={isDark} ink={ink} ink3={ink3} ink4={ink4} border={border}
                titre={t.ombrageExt}
                actif={ext.etat==='deploye'} on={t.deploye} off={t.retracte}
                cOn="#F59E0B" neutre={ext.neutre}
                detail={lang==='FR'
                  ? 'Déploie > ' + ACTIONNEURS.ombrage_ext.deploie + ' °C · Rétracte < ' + ACTIONNEURS.ombrage_ext.retracte + ' °C'
                  : 'Deploys > ' + ACTIONNEURS.ombrage_ext.deploie + ' °C · Retracts < ' + ACTIONNEURS.ombrage_ext.retracte + ' °C'}
                plage={ACTIONNEURS.ombrage_ext.plage} t={t}
              />
              <ActionCard isDark={isDark} ink={ink} ink3={ink3} ink4={ink4} border={border}
                titre={t.ombrageInt}
                actif={int.etat==='deploye'} on={t.deploye} off={t.retracte}
                cOn="#FBBF24" neutre={int.neutre}
                detail={lang==='FR'
                  ? 'Déploie > ' + ACTIONNEURS.ombrage_int.deploie + ' °C · Rétracte < ' + ACTIONNEURS.ombrage_int.retracte + ' °C'
                  : 'Deploys > ' + ACTIONNEURS.ombrage_int.deploie + ' °C · Retracts < ' + ACTIONNEURS.ombrage_int.retracte + ' °C'}
                plage={ACTIONNEURS.ombrage_int.plage} t={t}
              />
              <ActionCard isDark={isDark} ink={ink} ink3={ink3} ink4={ink4} border={border}
                titre={t.fenetres}
                actif={fen.etat==='ouvert'} on={t.ouvert} off={fen.force ? t.fermeSec : t.ferme}
                cOn="#22C55E" cOff={fen.force ? '#EF4444' : undefined}
                force={fen.force} neutre={fen.neutre}
                detail={lang==='FR'
                  ? 'Ouvre > ' + ACTIONNEURS.fenetre.ouvre + ' °C · Ferme < ' + ACTIONNEURS.fenetre.ferme + ' °C'
                  : 'Opens > ' + ACTIONNEURS.fenetre.ouvre + ' °C · Closes < ' + ACTIONNEURS.fenetre.ferme + ' °C'}
                t={t}
              />
            </div>
            <div style={{ fontSize:10, color:ink4, lineHeight:1.6, paddingTop:10,
              borderTop:'1px solid ' + border, marginTop:10, display:'flex', gap:5, alignItems:'flex-start' }}>
              <Info size={10} style={{ flexShrink:0, marginTop:1 }}/>
              {lang==='FR' ? 'Intervalles modifiables dans le panneau ci-dessous.' : 'Intervals editable in the panel below.'}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          4. ÉQUIPEMENTS INTERNES — cartes éditables inline
      ══════════════════════════════════════════════════════════ */}
      <div style={{ background:cardBg, border:'1px solid ' + border, borderRadius:18, padding:'20px 24px', marginTop:12 }}>

        {/* En-tête */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ width:32, height:32, borderRadius:9, display:'flex', alignItems:'center',
              justifyContent:'center', background:meta.color+'18', color:meta.color, flexShrink:0 }}>
              <Settings size={16}/>
            </span>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:ink, letterSpacing:'-0.01em' }}>{t.equipTitre}</div>
              <div style={{ fontSize:11, color:ink3, marginTop:1, display:'flex', alignItems:'center', gap:5 }}>
                {jour
                  ? <><Sun size={11} color="#F59E0B"/> {t.jour}</>
                  : <><Wind size={11}/> {t.nuit}</>
                }
                {' · '}
                {lang==='FR' ? 'Intervalles de pilotage (visualisation)' : 'Control intervals (visualization)'}
              </div>
            </div>
          </div>
          {/* Compteur actifs */}
          {(() => {
            const nb = [equip.ventilateur,equip.chauffage,equip.brumisateur,equip.deshumid]
              .filter(e => e==='actif').length +
              ((equip.co2inj==='actif'||equip.co2purge==='actif') ? 1 : 0)
            return nb > 0 ? (
              <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:99,
                background:'rgba(34,197,94,0.12)', color:'#22C55E',
                border:'1px solid rgba(34,197,94,0.25)' }}>
                {nb} {lang==='FR' ? 'actif'+(nb>1?'s':'') : 'active'}
              </span>
            ) : null
          })()}
        </div>

        {/* Bandeau avertissement visualisation */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:14,
          background:isDark?'rgba(249,115,22,0.07)':'rgba(249,115,22,0.05)',
          border:'1px solid '+(isDark?'rgba(249,115,22,0.2)':'rgba(249,115,22,0.15)'),
          borderRadius:10, padding:'8px 12px' }}>
          <AlertTriangle size={12} color="#F97316" style={{ flexShrink:0, marginTop:1 }}/>
          <span style={{ fontSize:10, color:isDark?'#FED7AA':'#92400E', lineHeight:1.6 }}>
            {lang==='FR'
              ? 'Ces intervalles servent uniquement à la visualisation. Ils ne contrôlent pas l\'équipement réel — les seuils effectifs sont gérés dans l\'application locale Pro-Leaf.'
              : 'These intervals are for visualization only. They do not control real equipment — effective thresholds are managed in the local Pro-Leaf application.'}
          </span>
        </div>

        {/* Grille des 5 cartes */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:10 }}>
          <EquipCard
            isDark={isDark} ink={ink} ink3={ink3} ink4={ink4} border={border} lang={lang} t={t}
            canEdit={canEdit} cardKey='ventilation' Icon={Wind} label={t.ventTitre} color='#06B6D4'
            etat={equip.ventilateur}
            actions={['ventilation_jour','ventilation_nuit']}
            rows={[
              { action:'ventilation_jour', label:t.seuilJour, hint:'> °C' },
              { action:'ventilation_nuit', label:t.seuilNuit, hint:'> °C' },
            ]}
            paramsFlat={paramsFlat} editingCard={editingCard} editForm={editForm}
            setEditForm={setEditForm} saving={saving} saveOk={saveOk}
            startEdit={startEdit} cancelEdit={cancelEdit} saveEdit={saveEdit}
          />
          <EquipCard
            isDark={isDark} ink={ink} ink3={ink3} ink4={ink4} border={border} lang={lang} t={t}
            canEdit={canEdit} cardKey='chauffage' Icon={Flame} label={t.chauffTitre} color='#F59E0B'
            etat={equip.chauffage}
            actions={['chauffage_jour','chauffage_nuit']}
            rows={[
              { action:'chauffage_jour', label:t.seuilJour, hint:'< °C' },
              { action:'chauffage_nuit', label:t.seuilNuit, hint:'< °C' },
            ]}
            paramsFlat={paramsFlat} editingCard={editingCard} editForm={editForm}
            setEditForm={setEditForm} saving={saving} saveOk={saveOk}
            startEdit={startEdit} cancelEdit={cancelEdit} saveEdit={saveEdit}
          />
          <EquipCard
            isDark={isDark} ink={ink} ink3={ink3} ink4={ink4} border={border} lang={lang} t={t}
            canEdit={canEdit} cardKey='humidification' Icon={Droplets} label={t.brumTitre} color='#8B5CF6'
            etat={equip.brumisateur}
            actions={['humidification_jour','humidification_nuit']}
            rows={[
              { action:'humidification_jour', label:t.seuilJour, hint:'< %' },
              { action:'humidification_nuit', label:t.seuilNuit, hint:'< %' },
            ]}
            paramsFlat={paramsFlat} editingCard={editingCard} editForm={editForm}
            setEditForm={setEditForm} saving={saving} saveOk={saveOk}
            startEdit={startEdit} cancelEdit={cancelEdit} saveEdit={saveEdit}
          />
          <EquipCard
            isDark={isDark} ink={ink} ink3={ink3} ink4={ink4} border={border} lang={lang} t={t}
            canEdit={canEdit} cardKey='deshumidification' Icon={AirVent} label={t.deshumTitre} color='#3B82F6'
            etat={equip.deshumid}
            actions={['deshumidification_jour','deshumidification_nuit']}
            rows={[
              { action:'deshumidification_jour', label:t.seuilJour, hint:'> %' },
              { action:'deshumidification_nuit', label:t.seuilNuit, hint:'> %' },
            ]}
            paramsFlat={paramsFlat} editingCard={editingCard} editForm={editForm}
            setEditForm={setEditForm} saving={saving} saveOk={saveOk}
            startEdit={startEdit} cancelEdit={cancelEdit} saveEdit={saveEdit}
          />
          <EquipCard
            isDark={isDark} ink={ink} ink3={ink3} ink4={ink4} border={border} lang={lang} t={t}
            canEdit={canEdit} cardKey='co2' Icon={Leaf} label={t.co2Titre} color='#22C55E'
            etat={equip.co2inj==='actif'||equip.co2purge==='actif' ? 'actif' : equip.co2inj==='neutre'||equip.co2purge==='neutre' ? 'neutre' : 'inactif'}
            actions={['co2_injection','co2_purge']}
            rows={[
              { action:'co2_injection', label: lang==='FR'?'↑ Injection (jour)':'↑ Injection (day)', hint:'< ppm' },
              { action:'co2_purge',     label: lang==='FR'?'↓ Purge (nuit)':'↓ Purge (night)',       hint:'> ppm' },
            ]}
            paramsFlat={paramsFlat} editingCard={editingCard} editForm={editForm}
            setEditForm={setEditForm} saving={saving} saveOk={saveOk}
            startEdit={startEdit} cancelEdit={cancelEdit} saveEdit={saveEdit}
            extraBadge={lang==='FR'?t.fuzzy:'Fuzzy Control'}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          5. PANNEAU SEUILS — comment fonctionnent les alertes
      ══════════════════════════════════════════════════════════ */}
      {thresholds.length > 0 && (
        <div style={{
          background: cardBg, border: '1px solid ' + border, borderRadius: 18,
          padding: '20px 24px', marginTop: 16,
        }}>
          {/* Titre */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <span style={{ width:32, height:32, borderRadius:9, display:'flex', alignItems:'center',
              justifyContent:'center', background: meta.color+'18', color: meta.color, flexShrink:0 }}>
              <AlertTriangle size={16}/>
            </span>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:ink, letterSpacing:'-0.01em' }}>
                {lang==='FR' ? 'Seuils d\'alerte actifs' : 'Active alert thresholds'}
              </div>
              <div style={{ fontSize:11, color:ink3, marginTop:1 }}>
                {lang==='FR'
                  ? 'Paramétrage actuel pour ' + meta.code + ' — déclenchement des alertes automatiques'
                  : 'Current configuration for ' + meta.code + ' — automatic alert triggers'}
              </div>
            </div>
            <span style={{ marginLeft:'auto', fontSize:10, fontWeight:700, padding:'3px 10px',
              borderRadius:20, background: meta.color+'12', border:'1px solid ' + meta.color+'25',
              color: meta.color }}>
              {thresholds.filter(s => s.actif !== false).length} {lang==='FR'?'actifs':'active'}
            </span>
          </div>

          {/* Grille des seuils */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:10 }}>
            {[...ENV_KEYS, ...IRR_KEYS].map(key => {
              const seuil   = getSeuil(key)
              const Icon    = PARAM_ICONS[key]
              const valLive = key in env ? env[key] : (key in irr ? irr[key] : null)
              const opt     = OPTIMAL[key]
              if (!seuil) return null

              const actif   = seuil.actif !== false
              const dMin    = opt ? opt.min * 0.5 : 0
              const dMax    = opt ? opt.max * 1.5 : 100
              const pos     = (v) => Math.min(96, Math.max(2, ((v - dMin) / (dMax - dMin)) * 100))

              const valStatus = valLive != null
                ? (seuil.valeur_min != null && valLive < seuil.valeur_min ? 'bas'
                  : seuil.valeur_max != null && valLive > seuil.valeur_max ? 'haut'
                  : 'ok')
                : null

              const statusColor = valStatus === 'ok' ? '#22C55E'
                                : valStatus === null ? ink4
                                : '#EF4444'

              // Labels des capteurs (raccourcis)
              const LABELS = {
                temperature:'Température', humidite:'Humidité', vpd:'VPD', co2:'CO₂',
                luminosite:'Luminosité',
                ph:'pH', ec:'EC', temp_eau:'T° eau', niveau_eau:'Niveau eau',
              }
              const LABELS_EN = {
                temperature:'Temperature', humidite:'Humidity', vpd:'VPD', co2:'CO₂',
                luminosite:'Light (PPFD)',
                ph:'pH', ec:'EC', temp_eau:'Water temp', niveau_eau:'Water level',
              }
              const UNITS = {
                temperature:'°C', humidite:'%', vpd:'kPa', co2:'ppm',
                luminosite:'µmol/m²/s',
                ph:'', ec:'mS/cm', temp_eau:'°C', niveau_eau:'m',
              }
              const label = lang==='FR' ? LABELS[key] : LABELS_EN[key]
              const unit  = UNITS[key] || ''

              return (
                <div key={key} style={{
                  borderRadius: 12, padding: '12px 14px',
                  border: '1px solid ' + (actif
                    ? (valStatus === null ? border : statusColor + '35')
                    : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)')),
                  background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.018)',
                  opacity: actif ? 1 : 0.5,
                }}>
                  {/* En-tête capteur */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      {Icon && <Icon size={13} color={actif ? meta.color : ink4}/>}
                      <span style={{ fontSize:11, fontWeight:700, color: actif ? ink : ink4 }}>{label}</span>
                    </div>
                    <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:99,
                      background: actif ? statusColor+'18' : (isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)'),
                      color: actif ? statusColor : ink4,
                      border: '1px solid ' + (actif ? statusColor+'30' : 'transparent') }}>
                      {!actif
                        ? (lang==='FR' ? 'Inactif' : 'Inactive')
                        : valStatus === null ? '—'
                        : valStatus === 'ok' ? (lang==='FR' ? '✓ Normal' : '✓ Normal')
                        : valStatus === 'bas' ? (lang==='FR' ? '↓ Trop bas' : '↓ Too low')
                        : (lang==='FR' ? '↑ Trop haut' : '↑ Too high')
                      }
                    </span>
                  </div>

                  {/* Mini barre visuelle : zone opt + seuils + valeur live */}
                  {opt && (
                    <div style={{ marginBottom:8 }}>
                      <div style={{ height:6, background: isDark?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.07)',
                        borderRadius:3, position:'relative', overflow:'visible' }}>
                        {/* Zone optimale */}
                        <div style={{ position:'absolute', top:0, height:'100%', borderRadius:3,
                          left: pos(opt.min)+'%',
                          width: (pos(opt.max)-pos(opt.min))+'%',
                          background: meta.color+'40' }}/>
                        {/* Seuil min (trait rouge pointillé) */}
                        {seuil.valeur_min != null && (
                          <div style={{ position:'absolute', top:-3, height:12,
                            left: pos(seuil.valeur_min)+'%',
                            borderLeft:'2px dashed #EF4444', zIndex:2 }}/>
                        )}
                        {/* Seuil max (trait rouge pointillé) */}
                        {seuil.valeur_max != null && (
                          <div style={{ position:'absolute', top:-3, height:12,
                            left: pos(seuil.valeur_max)+'%',
                            borderLeft:'2px dashed #EF4444', zIndex:2 }}/>
                        )}
                        {/* Valeur live (point coloré) */}
                        {valLive != null && (
                          <div style={{ position:'absolute', top:'50%', zIndex:3,
                            transform:'translate(-50%,-50%)',
                            left: pos(valLive)+'%',
                            width:9, height:9, borderRadius:'50%',
                            background: statusColor,
                            boxShadow:'0 0 5px ' + statusColor,
                            border:'2px solid ' + (isDark?'rgba(16,27,46,1)':'white') }}/>
                        )}
                      </div>
                      {/* Légende sous la barre */}
                      <div style={{ display:'flex', justifyContent:'space-between', marginTop:5,
                        fontSize:9, fontFamily:'monospace', color:ink4, flexWrap:'wrap', gap:2 }}>
                        <span style={{ color: meta.color+'cc' }}>
                          Opt: {opt.min}–{opt.max}{unit}
                        </span>
                        <span style={{ color:'#EF4444cc' }}>
                          {lang==='FR'?'Seuil':'Thresh'}: {seuil.valeur_min??'—'}–{seuil.valeur_max??'—'}{unit}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Explication en texte : comment le seuil fonctionne */}
                  <div style={{ fontSize:10, color:ink3, lineHeight:1.55, borderTop:'1px solid ' + border,
                    paddingTop:7, marginTop:2 }}>
                    {seuil.valeur_min != null && seuil.valeur_max != null ? (
                      <>
                        {lang==='FR'
                          ? <>Alerte si <span style={{ color:'#EF4444', fontWeight:700 }}>&lt; {seuil.valeur_min}{unit}</span> ou <span style={{ color:'#EF4444', fontWeight:700 }}>&gt; {seuil.valeur_max}{unit}</span></>
                          : <>Alert if <span style={{ color:'#EF4444', fontWeight:700 }}>&lt; {seuil.valeur_min}{unit}</span> or <span style={{ color:'#EF4444', fontWeight:700 }}>&gt; {seuil.valeur_max}{unit}</span></>
                        }
                      </>
                    ) : seuil.valeur_min != null ? (
                      <>
                        {lang==='FR'
                          ? <>Alerte si <span style={{ color:'#EF4444', fontWeight:700 }}>&lt; {seuil.valeur_min}{unit}</span></>
                          : <>Alert if <span style={{ color:'#EF4444', fontWeight:700 }}>&lt; {seuil.valeur_min}{unit}</span></>
                        }
                      </>
                    ) : seuil.valeur_max != null ? (
                      <>
                        {lang==='FR'
                          ? <>Alerte si <span style={{ color:'#EF4444', fontWeight:700 }}>&gt; {seuil.valeur_max}{unit}</span></>
                          : <>Alert if <span style={{ color:'#EF4444', fontWeight:700 }}>&gt; {seuil.valeur_max}{unit}</span></>
                        }
                      </>
                    ) : (
                      <span style={{ color:ink4 }}>{lang==='FR'?'Aucune limite configurée':'No limit configured'}</span>
                    )}
                    {valLive != null && (
                      <span style={{ display:'inline-block', marginLeft:8, color:statusColor, fontWeight:700,
                        fontFamily:'monospace' }}>
                        ({lang==='FR'?'actuel':'current'}: {valLive}{unit})
                      </span>
                    )}
                  </div>
                </div>
              )
            }).filter(Boolean)}
          </div>

          {/* Note de bas */}
          <div style={{ marginTop:14, padding:'10px 14px', borderRadius:10,
            background: isDark?'rgba(255,255,255,0.025)':'rgba(0,0,0,0.02)',
            border:'1px solid ' + border,
            display:'flex', alignItems:'flex-start', gap:8 }}>
            <Info size={12} color={ink4} style={{ flexShrink:0, marginTop:1 }}/>
            <div style={{ fontSize:10.5, color:ink4, lineHeight:1.6 }}>
              {lang==='FR'
                ? <>Les seuils sont configurés par les responsables du complexe via l'interface d'administration. Une alerte est enregistrée dès que la valeur mesurée franchit la limite. La zone <span style={{ color:meta.color, fontWeight:700 }}>verte</span> sur chaque barre représente la plage optimale pour cette culture.</>
                : <>Thresholds are configured by complex managers via the admin interface. An alert is logged as soon as a measured value crosses a limit. The <span style={{ color:meta.color, fontWeight:700 }}>colored</span> zone on each bar represents the optimal range for this crop.</>
              }
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// CARTE PARAMÈTRE (grande, avec tooltip, barre optimale)
// ════════════════════════════════════════════════════════════════
function ParamCard({ paramKey, value, meta, seuil, lang, isDark, t }) {
  const [hovered, setHovered] = useState(false)
  const info    = POPUP_INFO?.[paramKey]
  const Icon    = PARAM_ICONS[paramKey]
  const hasVal  = value != null
  const status  = paramStatus(value, paramKey, seuil)
  const opt     = OPTIMAL[paramKey]
  const ink4    = isDark ? '#475569' : '#94A3B8'
  const ink3    = isDark ? '#94A3B8' : '#64748B'
  const ink     = isDark ? '#F1F5F9' : '#0F172A'

  const cardColor = status==='alerte'    ? '#EF4444'
                  : status==='attention' ? '#F59E0B'
                  : status==='ok'        ? meta.color
                  :                       '#64748B'

  const dMin = opt ? opt.min * 0.5 : 0
  const dMax = opt ? opt.max * 1.5 : 100
  const pos  = (v) => Math.min(96, Math.max(2, ((v-dMin)/(dMax-dMin))*100))
  const desc = info?.serres?.[meta.code]?.[lang==='EN'?'en':'fr'] || ''

  return (
    <div style={{ position:'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>

      <div style={{
        borderRadius:16, padding:'20px 16px', textAlign:'center',
        cursor:'default', transition:'all 0.25s',
        background: hovered ? cardColor+'12' : (isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.025)'),
        border:'1px solid ' + (hovered ? cardColor+'45' : (isDark?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.07)')),
        boxShadow: hovered ? '0 8px 28px ' + cardColor+'20' : 'none',
        transform: hovered ? 'translateY(-4px)' : 'none',
      }}>
        {/* Statut badge top-right */}
        <div style={{ position:'absolute', top:10, right:10 }}>
          {status==='ok'      ? <CheckCircle size={14} color={cardColor}/>
           :status==='na'     ? <Info size={14} color="#64748B"/>
           :                    <AlertTriangle size={14} color={cardColor}/>}
        </div>

        {/* Icône */}
        <div style={{ marginBottom:10, display:'flex', justifyContent:'center' }}>
          {Icon && <Icon size={24} color={hovered ? cardColor : ink4} strokeWidth={1.7}/>}
        </div>

        {/* Label */}
        <div style={{ fontSize:10, color:ink4, letterSpacing:'0.07em', textTransform:'uppercase',
          marginBottom:10, fontWeight:600 }}>
          {info ? (lang==='EN' ? info.labelEn : info.labelFr) : paramKey}
        </div>

        {/* Valeur principale */}
        <div style={{ fontSize:'2.1rem', fontWeight:800, lineHeight:1, letterSpacing:'-0.03em',
          fontFamily:"'JetBrains Mono',monospace",
          color: hasVal ? cardColor : ink4 }}>
          {hasVal ? value : '—'}
        </div>
        {hasVal && info && (
          <div style={{ fontSize:12, color:ink4, marginTop:5 }}>{info.unit}</div>
        )}

        {/* Zone optimale */}
        {opt && (
          <div style={{ marginTop:12, fontSize:10, fontFamily:"'JetBrains Mono',monospace",
            color: (status==='attention'||status==='alerte') ? cardColor : ink4 }}>
            Opt. {opt.min}–{opt.max} {info?.unit||''}
          </div>
        )}

        {/* Mini barre de position */}
        {opt && hasVal && (
          <div style={{ marginTop:8, height:4, background:isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.07)',
            borderRadius:2, position:'relative', overflow:'visible' }}>
            <div style={{ position:'absolute', top:0, height:'100%', borderRadius:2,
              left:pos(opt.min)+'%', width:(pos(opt.max)-pos(opt.min))+'%',
              background:cardColor+'50' }}/>
            <div style={{ position:'absolute', top:'50%', left:pos(value)+'%',
              transform:'translate(-50%,-50%)',
              width:10, height:10, borderRadius:'50%',
              background:cardColor, boxShadow:'0 0 6px ' + cardColor,
              border:'2px solid ' + (isDark?'rgba(16,27,46,1)':'white') }}/>
          </div>
        )}
      </div>

      {/* ── Tooltip hover ── */}
      {hovered && info && (
        <div style={{
          position:'absolute', bottom:'calc(100% + 12px)', left:'50%', transform:'translateX(-50%)',
          width:300, background:isDark?'rgba(7,17,31,0.98)':'rgba(255,255,255,0.99)',
          border:'1px solid ' + (isDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'),
          borderRadius:16, padding:18, zIndex:200,
          boxShadow:'0 20px 60px rgba(0,0,0,0.35)', backdropFilter:'blur(20px)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <span style={{ width:30, height:30, borderRadius:9, background:cardColor+'18',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              {Icon && <Icon size={16} color={cardColor}/>}
            </span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:cardColor }}>
                {lang==='EN' ? info.labelEn : info.labelFr}
              </div>
              <div style={{ fontSize:10, color:ink4, fontFamily:'monospace' }}>
                {(lang==='EN'?meta.nomEN:meta.nomFR).split('&')[0].trim()}
              </div>
            </div>
            <span style={{ fontSize:10, fontWeight:700, color:cardColor }}>
              {status==='ok'?t.stOk:status==='attention'?t.stAtt:status==='alerte'?t.stAl:t.stNa}
            </span>
          </div>

          {hasVal && (
            <div style={{ background:cardColor+'12', border:'1px solid ' + cardColor+'25',
              borderRadius:10, padding:'8px 12px', marginBottom:12,
              display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:11, color:ink4 }}>{t.actuelle}</span>
              <span style={{ fontSize:20, fontWeight:800, color:cardColor, fontFamily:'monospace' }}>
                {value} <span style={{ fontSize:12 }}>{info.unit}</span>
              </span>
            </div>
          )}

          {opt && (
            <div style={{ marginBottom:10 }}>
              <div style={{ height:6, background:isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.06)',
                borderRadius:3, position:'relative' }}>
                <div style={{ position:'absolute', top:0, height:'100%', borderRadius:3,
                  left:pos(opt.min)+'%', width:(pos(opt.max)-pos(opt.min))+'%',
                  background:cardColor+'55' }}/>
                {seuil?.valeur_min!=null && (
                  <div style={{ position:'absolute', top:-3, height:12, left:pos(seuil.valeur_min)+'%',
                    borderLeft:'2px dashed #EF4444' }}/>
                )}
                {seuil?.valeur_max!=null && (
                  <div style={{ position:'absolute', top:-3, height:12, left:pos(seuil.valeur_max)+'%',
                    borderLeft:'2px dashed #EF4444' }}/>
                )}
                {hasVal && (
                  <div style={{ position:'absolute', top:'50%', transform:'translate(-50%,-50%)',
                    left:pos(value)+'%', width:10, height:10, borderRadius:'50%',
                    background:cardColor, boxShadow:'0 0 6px ' + cardColor, border:'2px solid white' }}/>
                )}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10,
                color:ink4, fontFamily:'monospace', marginTop:5 }}>
                <span>{t.optimal} : {opt.min}–{opt.max} {info.unit}</span>
                {seuil && <span style={{ color:'#EF4444' }}>{t.seuils} : {seuil.valeur_min??'—'}–{seuil.valeur_max??'—'}</span>}
              </div>
            </div>
          )}

          {desc && (
            <div style={{ fontSize:12, color:isDark?'#CBD5E1':'#475569', lineHeight:1.7, marginTop:8, paddingTop:8,
              borderTop:'1px solid ' + (isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.06)') }}>
              {desc}
            </div>
          )}

          {/* Flèche bas */}
          <div style={{ position:'absolute', bottom:-6, left:'50%', width:12, height:12,
            background:isDark?'rgba(7,17,31,0.98)':'rgba(255,255,255,0.99)',
            borderRight:'1px solid ' + (isDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'),
            borderBottom:'1px solid ' + (isDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'),
            transform:'translateX(-50%) rotate(45deg)' }}/>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// CARTE ÉQUIPEMENT — éditable inline avec crayon
// ════════════════════════════════════════════════════════════════
function EquipCard({
  isDark, ink, ink3, ink4, border, lang, t, canEdit,
  cardKey, Icon, label, color, etat,
  actions, rows,
  paramsFlat, editingCard, editForm, setEditForm,
  saving, saveOk, startEdit, cancelEdit, saveEdit,
  extraBadge,
}) {
  const isEditing = editingCard === cardKey
  const c = etat==='actif' ? color : etat==='neutre' ? '#F59E0B' : (isDark?'#475569':'#94A3B8')
  const statusLabel = etat==='actif'   ? t.actifL
                    : etat==='neutre'  ? t.transitionL
                    : etat==='na'      ? t.naLabel
                    : t.inactifL

  const inputStyle = {
    background: isDark?'rgba(255,255,255,0.09)':'#fff',
    border: '1px solid ' + color + '70',
    borderRadius: 6,
    padding: '3px 7px',
    fontSize: 12,
    fontFamily: "'JetBrains Mono',monospace",
    color: isDark?'#F1F5F9':'#0F172A',
    outline: 'none',
    width: 62,
    textAlign: 'right',
    boxShadow: '0 0 0 2px ' + color + '15',
  }

  return (
    <div style={{
      borderRadius:12, padding:'12px 14px',
      border:'1px solid ' + (etat==='actif' ? color+'35' : border),
      background: etat==='actif'
        ? (isDark ? color+'11' : color+'07')
        : (isDark?'rgba(255,255,255,0.02)':'rgba(0,0,0,0.015)'),
      transition:'border-color 0.2s, background 0.2s',
    }}>

      {/* En-tête carte */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        {/* Left : icon + label + fuzzy badge (vertical stack if badge) */}
        <div style={{ display:'flex', flexDirection:'column', gap:4, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <span style={{ width:22, height:22, borderRadius:6, display:'flex', alignItems:'center',
              justifyContent:'center', background:color+'18', flexShrink:0 }}>
              <Icon size={13} color={color}/>
            </span>
            <span style={{ fontSize:12, fontWeight:700, color:ink }}>{label}</span>
          </div>
          {extraBadge && (
            <span style={{
              display:'inline-flex', alignItems:'center',
              fontSize:8, fontWeight:700,
              padding:'2px 7px', borderRadius:6,
              background:color+'18', color,
              border:'1px solid '+color+'30',
              alignSelf:'flex-start',
              whiteSpace:'nowrap', letterSpacing:'0.02em',
            }}>
              {extraBadge}
            </span>
          )}
        </div>

        {/* Right : status badge + pencil / save buttons */}
        <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0, marginLeft:6 }}>
          <span style={{ fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:99,
            color:c, background:c+'18', border:'1px solid '+c+'30', whiteSpace:'nowrap' }}>
            {statusLabel}
          </span>
          {canEdit && !isEditing && (
            <button onClick={() => startEdit(cardKey, actions)}
              title={lang==='FR'?'Modifier':'Edit'}
              style={{ background:'none', border:'none', cursor:'pointer',
                color:ink4, padding:'3px', borderRadius:5, display:'flex', alignItems:'center',
                transition:'color 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.color=color}
              onMouseLeave={e=>e.currentTarget.style.color=ink4}>
              <Pencil size={12}/>
            </button>
          )}
          {isEditing && (
            <div style={{ display:'flex', gap:4 }}>
              <button onClick={cancelEdit}
                style={{ background:'none', border:'none', cursor:'pointer',
                  color:ink4, padding:'3px', borderRadius:5, display:'flex', alignItems:'center' }}>
                <XIcon size={12}/>
              </button>
              <button onClick={() => saveEdit(actions)} disabled={saving}
                style={{ height:24, padding:'0 8px', borderRadius:6, fontSize:10, fontWeight:700,
                  border:'none', cursor:saving?'not-allowed':'pointer',
                  background: saveOk==='ok' ? '#22C55E' : saving ? ink4 : color,
                  color:'#fff', display:'flex', alignItems:'center', gap:3, transition:'background 0.2s' }}>
                {saving ? '...' : saveOk==='ok' ? <><Check size={10}/> OK</> : <Check size={10}/>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lignes seuil jour / seuil nuit */}
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {rows.map((row, i) => {
          const val = paramsFlat[row.action] ?? PI_DEFAULTS[row.action]
          return (
            <div key={row.action} style={{
              display:'flex', alignItems:'center', justifyContent:'space-between', gap:6,
              paddingTop: i>0 ? 6 : 0,
              borderTop: i>0 ? '1px dashed '+(isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.06)') : 'none',
            }}>
              <span style={{ fontSize:10, color:ink4, flexShrink:0 }}>{row.label}</span>
              {isEditing ? (
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ fontSize:9, color:ink4 }}>{row.hint.replace(/[<>]/g,'').trim()}</span>
                  <input type="number"
                    value={editForm[row.action+'_seuil'] ?? ''}
                    onChange={e => setEditForm(f=>({...f, [row.action+'_seuil']:e.target.value}))}
                    style={inputStyle}/>
                  <span style={{ fontSize:9, color:ink4 }}>±</span>
                  <input type="number"
                    value={editForm[row.action+'_deadband'] ?? ''}
                    onChange={e => setEditForm(f=>({...f, [row.action+'_deadband']:e.target.value}))}
                    style={{ ...inputStyle, width:46 }}/>
                </div>
              ) : (
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}>
                  <b style={{ color }}>
                    {/* hint format: "> °C" | "< %" | "< ppm" — render as: > 80% or > 25°C */}
                    {(() => {
                      const op   = row.hint.match(/^[<>]+/)?.[0] ?? ''
                      const unit = row.hint.replace(/^[<>\s]+/, '').trim()
                      // units that go AFTER the number: °C, %, ppm
                      return `${op} ${val.seuil}${unit}`
                    })()}
                  </b>
                  <span style={{ color:ink4, fontWeight:400, marginLeft:5 }}>· ±{val.deadband}</span>
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Erreur sauvegarde */}
      {isEditing && saveOk==='err' && (
        <div style={{ marginTop:6, fontSize:9, color:'#EF4444' }}>
          {lang==='FR'?'Erreur sauvegarde.':'Save failed.'}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// PANNEAU ACTIONNEUR (droite du schéma)
// ════════════════════════════════════════════════════════════════
function ActionCard({ isDark, ink, ink3, ink4, border, titre, actif, on, off, cOn, cOff, detail, plage, force, neutre, t }) {
  const c = actif ? cOn : (cOff || (isDark?'#64748B':'#94A3B8'))
  const enPlage = plage ? dansPlage(plage) : true
  return (
    <div style={{ borderRadius:12, padding:'12px 14px',
      border:'1px solid ' + (isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.07)'),
      background:isDark?'rgba(255,255,255,0.02)':'rgba(0,0,0,0.015)',
      transition:'all 0.2s' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        <span style={{ fontSize:12, fontWeight:700, color:ink }}>{titre}</span>
        <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:10, fontWeight:700,
          padding:'3px 9px', borderRadius:999, color:c, background:c+'1a', border:'1px solid ' + c+'33' }}>
          {force && <AlertTriangle size={9}/>}
          <span style={{ width:5, height:5, borderRadius:'50%', background:c }}/>
          {actif ? on : off}
        </span>
      </div>
      <div style={{ fontSize:10.5, color:ink3, lineHeight:1.5, marginBottom: plage?4:0 }}>{detail}</div>
      {plage && (
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:10,
          color: enPlage ? '#22C55E' : ink4 }}>
          <Clock size={9}/> {fmtPlage(plage)} {neutre ? '· '+t.neutre : (enPlage?'':' · '+t.horsPlage)}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// SCHÉMA SVG — enrichi avec ombrage/ventilation + plantes par serre
// Base : schéma original conservé et enrichi
// ════════════════════════════════════════════════════════════════
function Scene({ isDark, serreColor, meteo, ext, int, fenetre, serreIdx, temp, equip, jour }) {
  const extDep = ext === 'deploye', intDep = int === 'deploye', ouvert = fenetre === 'ouvert'
  const TR  = '0.65s cubic-bezier(.4,0,.2,1)'
  const sol = Math.min(1, (meteo.solaire || 0) / 900)

  const lever   = parseH(meteo.sunrise) ?? 6.5
  const coucher = parseH(meteo.sunset)  ?? 19.5
  const now     = new Date()
  const hNow    = now.getHours() + now.getMinutes()/60

  const vStart = lever-1, vEnd = coucher+1, X0=45, X1=435
  const xOf = (h) => X0 + ((Math.min(Math.max(h,vStart),vEnd)-vStart)/(vEnd-vStart))*(X1-X0)
  const horizon=198, apex=28
  const yArc = (h) => {
    const f=(h-lever)/(coucher-lever)
    return horizon - Math.sin(Math.max(0,Math.min(1,f))*Math.PI)*(horizon-apex)
  }
  let arc=''
  for (let h=lever; h<=coucher+0.001; h+=(coucher-lever)/40)
    arc += `${arc?'L':'M'} ${xOf(h).toFixed(1)} ${yArc(h).toFixed(1)} `

  const estJour = hNow >= lever && hNow <= coucher
  const aX = xOf(hNow), aY = estJour ? yArc(hNow) : horizon+16

  const cVerre  = isDark ? '#5b86ad' : '#94a3b8'
  const cVerreF = isDark ? 'rgba(127,182,232,0.10)' : 'rgba(148,197,232,0.18)'
  const cSkyTop = estJour ? (isDark?'#16324f':'#dbeafe') : (isDark?'#0c1b2e':'#475569')
  const cSkyBot = isDark ? '#0a1626' : '#eff6ff'
  const cAxis   = isDark ? '#3b5775' : '#cbd5e1'
  const cSol    = isDark ? '#2a4055' : '#cbd5e1'

  // Ouverture fenêtre : angle 0 = fermée, -38deg = ouverte
  const fenetreAngle = ouvert ? -38 : 0

  return (
    <svg viewBox="0 0 480 345" style={{ width:'100%', height:'auto', display:'block' }}>
      <style>{`@keyframes fanSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <defs>
        <linearGradient id="sc-ciel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cSkyTop}/><stop offset="100%" stopColor={cSkyBot}/>
        </linearGradient>
        <radialGradient id="sc-astre" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={jour?'#fff3c4':'#e2e8f0'}/>
          <stop offset="100%" stopColor={jour?'#f5a524':'#94a3b8'}/>
        </radialGradient>
        {/* Ombrage extérieur : hachures diagonales */}
        <pattern id="sc-meshExt" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" fill={isDark?'#1f3d5c':'#475569'}/>
          <line x1="0" y1="0" x2="0" y2="6" stroke={isDark?'#3a6b96':'#94a3b8'} strokeWidth="2.4"/>
        </pattern>
        {/* Ombrage intérieur : hachures horizontales */}
        <pattern id="sc-meshInt" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill={isDark?'#243a4d':'#e2e8f0'}/>
          <line x1="0" y1="3" x2="6" y2="3" stroke="#caa14a" strokeWidth="1.6"/>
        </pattern>
        <clipPath id="sc-roof">
          <polygon points="152,252 240,203 328,252 328,240 240,191 152,240"/>
        </clipPath>
      </defs>

      {/* Ciel */}
      <rect x="0" y="0" width="480" height="210" rx="12" fill="url(#sc-ciel)"/>

      {/* Trajectoire solaire (arc pointillé) */}
      <path d={arc} fill="none" stroke={cAxis} strokeWidth="1.4" strokeDasharray="3 5" opacity="0.8"/>

      {/* Plages horaires ombrage — barres colorées en bas du ciel */}
      <rect x={xOf(ACTIONNEURS.ombrage_ext.plage[0])} y="185" height="5" rx="2"
        width={xOf(ACTIONNEURS.ombrage_ext.plage[1])-xOf(ACTIONNEURS.ombrage_ext.plage[0])}
        fill="#F59E0B" opacity="0.55"/>
      <rect x={xOf(ACTIONNEURS.ombrage_int.plage[0])} y="193" height="5" rx="2"
        width={xOf(ACTIONNEURS.ombrage_int.plage[1])-xOf(ACTIONNEURS.ombrage_int.plage[0])}
        fill="#FBBF24" opacity="0.55"/>

      {/* Ligne verticale heure actuelle */}
      <line x1={aX} y1="12" x2={aX} y2="325"
        stroke={serreColor} strokeWidth="1" strokeDasharray="2 4" opacity="0.5"/>
      <text x={aX} y="10" textAnchor="middle" fontFamily="monospace" fontSize="8.5" fill={serreColor}>
        {String(Math.floor(hNow)).padStart(2,'0')}:{String(Math.round((hNow%1)*60)).padStart(2,'0')}
      </text>

      {/* Soleil / Lune */}
      <g>
        {jour && [...Array(8)].map((_,i) => {
          const a=(i/8)*Math.PI*2, r1=16, r2=16+8*sol+3
          return <line key={i}
            x1={aX+Math.cos(a)*r1} y1={aY+Math.sin(a)*r1}
            x2={aX+Math.cos(a)*r2} y2={aY+Math.sin(a)*r2}
            stroke="#f5a524" strokeWidth="2" strokeLinecap="round" opacity={0.4+0.6*sol}/>
        })}
        <circle cx={aX} cy={aY} r={jour?14:10} fill="url(#sc-astre)"/>
        {!jour && <circle cx={aX+4} cy={aY-3} r="8" fill={cSkyTop}/>}
      </g>

      {/* Sol */}
      <rect x="30" y="323" width="420" height="5" rx="2" fill={cSol}/>

      {/* Structure serre — polygone verre */}
      <polygon points="152,322 152,248 240,203 328,248 328,322"
        fill={cVerreF} stroke={cVerre} strokeWidth="2" strokeLinejoin="round"/>
      <line x1="152" y1="248" x2="152" y2="322" stroke={cVerre} strokeWidth="2.5"/>
      <line x1="328" y1="248" x2="328" y2="322" stroke={cVerre} strokeWidth="2.5"/>
      {/* Montants intermédiaires */}
      <line x1="196" y1="228" x2="196" y2="322" stroke={cVerre} strokeWidth="1" opacity="0.4"/>
      <line x1="240" y1="203" x2="240" y2="322" stroke={cVerre} strokeWidth="1" opacity="0.4"/>
      <line x1="284" y1="228" x2="284" y2="322" stroke={cVerre} strokeWidth="1" opacity="0.4"/>

      {/* ── Plantes intérieures selon serre ── */}
      {serreIdx === 0 && <PlanteGenetique isDark={isDark} color={serreColor}/>}
      {serreIdx === 1 && <PlanteHorticulture isDark={isDark} color={serreColor}/>}
      {serreIdx === 2 && <PlanteAgronomie isDark={isDark} color={serreColor}/>}
      {serreIdx === 3 && <PlanteHydroponie isDark={isDark} color={serreColor}/>}
      {serreIdx === 4 && <PlanteProtection isDark={isDark} color={serreColor}/>}

      {/* ── Ombrage intérieur — bande coulissante ── */}
      <rect x="156" y="243" width="168" height="7" rx="3" fill="url(#sc-meshInt)" opacity="0.95"
        style={{ transformBox:'fill-box', transformOrigin:'left center',
          transform:'scaleX(' + (intDep?1:0) + ')', transition:'transform ' + TR }}/>
      {/* Label ombrage int */}
      {intDep && (
        <text x="240" y="258" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#caa14a" opacity="0.9">
          ombrage int.
        </text>
      )}

      {/* ── Ombrage extérieur — rideau qui glisse depuis la gauche ── */}
      <g clipPath="url(#sc-roof)">
        <rect x="148" y="197" width="200" height="60" fill="url(#sc-meshExt)"
          style={{ transform: extDep ? 'translateX(0)' : 'translateX(-210px)', transition:'transform ' + TR }}/>
      </g>
      {/* Label ombrage ext */}
      {extDep && (
        <text x="240" y="230" textAnchor="middle" fontSize="7" fontFamily="monospace"
          fill={isDark?'#F59E0B':'#92400E'} opacity="0.9">
          ombrage ext.
        </text>
      )}

      {/* ── Fenêtre de toiture — rotative ── */}
      <g style={{
        transformBox:'fill-box', transformOrigin:'240px 203px',
        transform:'rotate(' + fenetreAngle + 'deg)',
        transition:'transform ' + TR,
      }}>
        <polygon points="240,203 302,228 302,233 240,208"
          fill={isDark?'rgba(191,227,255,0.5)':'rgba(191,227,255,0.7)'}
          stroke="#9ec9ef" strokeWidth="2" strokeLinejoin="round"/>
      </g>
      {/* Indicateur ouverture */}
      {ouvert && (
        <g>
          <path d="M 302 218 q 10,-8 16,-4" fill="none" stroke="#22C55E" strokeWidth="1.5"
            strokeDasharray="2 2" opacity="0.8"/>
          <text x="322" y="213" fontSize="7" fontFamily="monospace" fill="#22C55E">ouvert</text>
        </g>
      )}
      {/* Pivot fenêtre */}
      <circle cx="240" cy="203" r="3.5" fill={cVerre}/>

      {/* ── Équipements internes — icônes SVG au-dessus des cultures ── */}

      {/* Ventilateur — gauche, au-dessus des plantes, pale tournante fixe en place */}
      {(() => {
        const c = equip.ventilateur === 'actif' ? '#06B6D4' : equip.ventilateur === 'neutre' ? '#94A3B8' : (isDark?'#2d4a5e':'#cbd5e1')
        const spin = equip.ventilateur === 'actif'
        return (
          <g transform="translate(182,255)">
            {/* Cercle fond statique */}
            <circle cx="0" cy="0" r="11" fill={isDark?'rgba(6,182,212,0.12)':'rgba(6,182,212,0.08)'} stroke={c} strokeWidth="1.4"/>
            {/* Pales — tournent sur place */}
            <g style={spin ? {
              transformBox: 'fill-box',
              transformOrigin: 'center',
              animation: 'fanSpin 0.65s linear infinite',
            } : {}}>
              {[0,90,180,270].map((a,i) => (
                <path key={i} d={'M0,0 C' + (Math.cos((a+40)*Math.PI/180)*8.5) + ',' + (Math.sin((a+40)*Math.PI/180)*8.5) + ' ' + (Math.cos((a+70)*Math.PI/180)*8.5) + ',' + (Math.sin((a+70)*Math.PI/180)*8.5) + ' ' + (Math.cos((a+90)*Math.PI/180)*4) + ',' + (Math.sin((a+90)*Math.PI/180)*4)}
                  fill={c} opacity={spin ? 0.9 : 0.45}/>
              ))}
            </g>
            {/* Moyeu statique */}
            <circle cx="0" cy="0" r="2.5" fill={c}/>
            <text x="0" y="20" textAnchor="middle" fontSize="6" fontFamily="monospace" fill={c} opacity="0.85">VENT.</text>
          </g>
        )
      })()}

      {/* Brumisateur — centre, au-dessus des plantes */}
      {(() => {
        const c = equip.brumisateur === 'actif' ? '#8B5CF6' : equip.brumisateur === 'neutre' ? '#94A3B8' : (isDark?'#2d4a5e':'#cbd5e1')
        return (
          <g transform="translate(240,258)">
            <rect x="-10" y="-8" width="20" height="13" rx="4" fill={isDark?'rgba(139,92,246,0.12)':'rgba(139,92,246,0.07)'} stroke={c} strokeWidth="1.4"/>
            <line x1="0" y1="-8" x2="0" y2="-13" stroke={c} strokeWidth="1.4"/>
            <circle cx="0" cy="-14.5" r="2" fill={c} opacity="0.7"/>
            {equip.brumisateur === 'actif' && [-5,0,5].map((dx,i) => (
              <g key={i}>
                <circle cx={dx} cy={-19-i*3} r="1.4" fill={c} opacity="0.55"/>
                <circle cx={dx+2} cy={-22-i*2} r="1" fill={c} opacity="0.35"/>
              </g>
            ))}
            <text x="0" y="16" textAnchor="middle" fontSize="6" fontFamily="monospace" fill={c} opacity="0.85">BRUM.</text>
          </g>
        )
      })()}

      {/* Chauffage — droite, au-dessus des plantes */}
      {(() => {
        const c = equip.chauffage === 'actif' ? '#F59E0B' : equip.chauffage === 'neutre' ? '#94A3B8' : (isDark?'#2d4a5e':'#cbd5e1')
        return (
          <g transform="translate(298,255)">
            <circle cx="0" cy="0" r="11" fill={isDark?'rgba(245,158,11,0.10)':'rgba(245,158,11,0.06)'} stroke={c} strokeWidth="1.4"/>
            {[-4,0,4].map((dx,i) => (
              <g key={i}>
                <path d={'M' + dx + ',6 q' + (-3+i) + ',-6 ' + dx + ',-12'} fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" opacity={equip.chauffage==='actif'?0.9:0.4}/>
              </g>
            ))}
            <text x="0" y="20" textAnchor="middle" fontSize="6" fontFamily="monospace" fill={c} opacity="0.85">CHAUF.</text>
          </g>
        )
      })()}

      {/* CO₂ — badge flottant centre-haut intérieur, près du faîtage */}
      {(() => {
        const actif = equip.co2inj === 'actif' || equip.co2purge === 'actif'
        const neutre = equip.co2inj === 'neutre' || equip.co2purge === 'neutre'
        const c = actif ? '#22C55E' : neutre ? '#94A3B8' : (isDark?'#2d4a5e':'#cbd5e1')
        const label = equip.co2inj === 'actif' ? 'CO₂↑' : equip.co2purge === 'actif' ? 'CO₂↓' : 'CO₂'
        return (
          <g transform="translate(240,228)">
            <rect x="-14" y="-9" width="28" height="16" rx="5"
              fill={isDark?'rgba(34,197,94,0.10)':'rgba(34,197,94,0.07)'} stroke={c} strokeWidth="1.4"/>
            <text x="0" y="2" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fontWeight="700" fill={c}>{label}</text>
          </g>
        )
      })()}

      {/* Indicateur T° intérieure */}
      <g>
        <rect x="18" y="235" width="70" height="30" rx="7"
          fill={isDark?'rgba(7,17,31,0.88)':'rgba(255,255,255,0.92)'}
          stroke={serreColor+'40'} strokeWidth="1"/>
        <text x="53" y="247" textAnchor="middle" fontFamily="monospace" fontSize="8"
          fill={isDark?'#94A3B8':'#64748B'}>T° INT.</text>
        <text x="53" y="259" textAnchor="middle" fontFamily="monospace" fontSize="11" fontWeight="700"
          fill={serreColor}>{temp != null ? temp + ' °C' : '— °C'}</text>
      </g>

    </svg>
  )
}

// ── Plantes par serre ─────────────────────────────────────────
function PlanteGenetique({ isDark, color }) {
  const pots = [185, 220, 255, 290]
  return (
    <g>
      <rect x="170" y="300" width="155" height="4" rx="2" fill={isDark?'#2d4a5e':'#94a3b8'}/>
      {pots.map((x,i) => (
        <g key={i} transform={'translate(' + x + ',304)'}>
          <path d="M-9,0 L-7,16 L7,16 L9,0 Z" fill={isDark?'#1e3a5f':'#bfdbfe'}
            stroke={isDark?'#3b5a7a':'#93c5fd'} strokeWidth="1"/>
          <line x1="0" y1="0" x2="0" y2={-22-i*5} stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <ellipse cx="-5" cy={-12-i*2} rx="5" ry="3" fill={color} opacity="0.85"
            transform={'rotate(-30,-5,' + (-12-i*2) + ')'}/>
          <ellipse cx="5" cy={-17-i*2} rx="5" ry="3" fill={color} opacity="0.7"
            transform={'rotate(30,5,' + (-17-i*2) + ')'}/>
          <text x="0" y="24" textAnchor="middle" fontSize="6" fontFamily="monospace"
            fill={isDark?'#475569':'#94a3b8'}>G{i+1}</text>
        </g>
      ))}
    </g>
  )
}

function PlanteHorticulture({ isDark, color }) {
  const flowers = [
    {x:180,type:'rose',h:32,c:'#f43f5e'},
    {x:208,type:'tulipe',h:28,c:'#fb923c'},
    {x:240,type:'tournesol',h:36,c:'#facc15'},
    {x:272,type:'lavande',h:30,c:'#a78bfa'},
    {x:300,type:'rose',h:32,c:'#ec4899'},
  ]
  return (
    <g>
      <rect x="168" y="300" width="155" height="16" rx="5" fill={isDark?'#1a2e1a':'#bbf7d0'} opacity="0.6"/>
      {flowers.map((f,i) => (
        <g key={i}>
          <line x1={f.x} y1="300" x2={f.x} y2={300-f.h} stroke={isDark?'#22c55e':'#16a34a'} strokeWidth="2"/>
          <ellipse cx={f.x-7} cy={300-f.h*0.35} rx="7" ry="3.5" fill={isDark?'#22c55e':'#4ade80'}
            opacity="0.6" transform={'rotate(-35,' + (f.x-7) + ',' + (300-f.h*0.35) + ')'}/>
          {f.type==='tournesol' ? (
            <g transform={'translate(' + f.x + ',' + (300-f.h) + ')'}>
              {[...Array(10)].map((_,j) => {
                const a=(j/10)*Math.PI*2
                return <ellipse key={j} cx={Math.cos(a)*10} cy={Math.sin(a)*10} rx="4.5" ry="2.5"
                  fill={f.c} opacity="0.9" transform={'rotate(' + (j/10*360) + ',' + Math.cos(a)*10 + ',' + Math.sin(a)*10 + ')'}/>
              })}
              <circle cx="0" cy="0" r="6" fill={isDark?'#78350f':'#92400e'}/>
            </g>
          ) : f.type==='rose' ? (
            <g transform={'translate(' + f.x + ',' + (300-f.h) + ')'}>
              {[...Array(6)].map((_,j) => {
                const a=(j/6)*Math.PI*2
                return <ellipse key={j} cx={Math.cos(a)*6} cy={Math.sin(a)*6} rx="6" ry="4.5" fill={f.c} opacity="0.75+j*0.04"/>
              })}
              <circle cx="0" cy="0" r="3.5" fill={f.c}/>
            </g>
          ) : f.type==='lavande' ? (
            <g transform={'translate(' + f.x + ',' + (300-f.h) + ')'}>
              {[-3,0,3].map((dx,j) => (
                <g key={j}>
                  <line x1={dx} y1="0" x2={dx} y2="-12" stroke={f.c} strokeWidth="1.8"/>
                  {[...Array(4)].map((_,k) => (
                    <ellipse key={k} cx={dx} cy={-2-k*3} rx="2.5" ry="1.8" fill={f.c} opacity="0.8"/>
                  ))}
                </g>
              ))}
            </g>
          ) : (
            <g transform={'translate(' + f.x + ',' + (300-f.h) + ')'}>
              <path d="M0,0 q-9,-7 -5,-16 q5,3 5,7 q0,-4 5,-7 q4,9 -5,16" fill={f.c} opacity="0.9"/>
            </g>
          )}
        </g>
      ))}
    </g>
  )
}

function PlanteAgronomie({ isDark, color }) {
  const cols = [178,202,226,254,278,304]
  return (
    <g>
      {cols.map((x,i) => {
        const h = 28 + (i%3)*5
        return (
          <g key={i} transform={'translate(' + x + ',302)'}>
            <line x1="0" y1="0" x2="0" y2={-h} stroke={color} strokeWidth="1.8"/>
            <path d={'M0,' + (-h*0.35) + ' q-7,-2 -5,-8'} fill="none" stroke={color} strokeWidth="1.4" opacity="0.65"/>
            <path d={'M0,' + (-h*0.6) + ' q7,-2 5,-8'} fill="none" stroke={color} strokeWidth="1.4" opacity="0.65"/>
            <g transform={'translate(0,' + (-h) + ')'}>
              {[-2,0,2].map((dx,j) => (
                <ellipse key={j} cx={dx} cy={-j*3} rx="2" ry="1.6" fill={color} opacity="0.9"/>
              ))}
              <line x1="0" y1="-9" x2="0" y2="-13" stroke={color} strokeWidth="1"/>
            </g>
          </g>
        )
      })}
    </g>
  )
}

function PlanteHydroponie({ isDark, color }) {
  const tubes = [278, 296, 314]
  return (
    <g>
      <rect x="160" y="272" width="165" height="5" rx="2" fill={isDark?'#1e3a5f':'#bfdbfe'}/>
      <rect x="160" y="318" width="165" height="5" rx="2" fill={isDark?'#1e3a5f':'#bfdbfe'}/>
      <rect x="160" y="272" width="4" height="51" rx="2" fill={isDark?'#1e3a5f':'#bfdbfe'}/>
      <rect x="321" y="272" width="4" height="51" rx="2" fill={isDark?'#1e3a5f':'#bfdbfe'}/>
      {tubes.map((y,ti) => (
        <g key={ti}>
          <rect x="164" y={y} width="157" height="11" rx="5.5"
            fill={isDark?'rgba(6,182,212,0.18)':'rgba(6,182,212,0.1)'}
            stroke={isDark?'#0891b2':'#06b6d4'} strokeWidth="1.2"/>
          <line x1="169" y1={y+5.5} x2="317" y2={y+5.5}
            stroke={isDark?'#22d3ee':'#67e8f9'} strokeWidth="0.8" opacity="0.5" strokeDasharray="6 5"/>
          {[192,216,240,265,290].map((x,i) => (
            <g key={i} transform={'translate(' + x + ',' + y + ')'}>
              <circle cx="0" cy="0" r="5.5" fill={isDark?'#134e2e':'#bbf7d0'} stroke={color+'40'} strokeWidth="1"/>
              <line x1="0" y1="-1" x2="0" y2="-11" stroke={color} strokeWidth="1.5"/>
              <ellipse cx="-3" cy="-7" rx="3.5" ry="2" fill={color} opacity="0.8"
                transform="rotate(-30,-3,-7)"/>
              <ellipse cx="3" cy="-9" rx="3.5" ry="2" fill={color} opacity="0.7"
                transform="rotate(30,3,-9)"/>
            </g>
          ))}
        </g>
      ))}
    </g>
  )
}

function PlanteProtection({ isDark, color }) {
  const plants = [185, 215, 248, 280, 312]
  return (
    <g>
      <rect x="170" y="298" width="158" height="18" rx="5" fill={isDark?'#1a1a1a':'#e2e8f0'} opacity="0.4"/>
      {plants.map((x,i) => {
        const h = 28 + (i%3)*8, healthy = i !== 2
        return (
          <g key={i} transform={'translate(' + x + ',298)'}>
            <line x1="0" y1="0" x2="0" y2={-h} stroke={healthy?color:'#F59E0B'} strokeWidth="2"/>
            <ellipse cx="-6" cy={-h*0.45} rx="6" ry="3.5" fill={healthy?color:'#F59E0B'}
              opacity="0.8" transform={'rotate(-35,-6,' + (-h*0.45) + ')'}/>
            <ellipse cx="6" cy={-h*0.65} rx="6" ry="3.5" fill={healthy?color:'#F59E0B'}
              opacity="0.7" transform={'rotate(35,6,' + (-h*0.65) + ')'}/>
            <ellipse cx="0" cy={-h} rx="7" ry="4.5" fill={healthy?color:'#F59E0B'} opacity="0.9"/>
            {healthy && (
              <g transform={'translate(0,' + (-h-8) + ')'}>
                <path d="M0,-5 L-5,0 L-5,5 L0,7 L5,5 L5,0 Z"
                  fill={color+'1a'} stroke={color} strokeWidth="1" opacity="0.55"/>
                <text x="0" y="3" textAnchor="middle" fontSize="5" fill={color}>✓</text>
              </g>
            )}
          </g>
        )
      })}
      <g transform="translate(340,265)">
        <rect x="-10" y="-16" width="20" height="26" rx="4"
          fill={isDark?'#1e3a5f':'#bfdbfe'} stroke={isDark?'#3b82f6':'#60a5fa'} strokeWidth="1.2"/>
        <line x1="-10" y1="-4" x2="-20" y2="-4" stroke={isDark?'#60a5fa':'#3b82f6'} strokeWidth="1.8"/>
        {[[-22,-8],[-24,-4],[-22,0],[-26,-6],[-20,2]].map(([gx,gy],i) => (
          <circle key={i} cx={gx} cy={gy} r="1.8" fill={isDark?'#93c5fd':'#3b82f6'} opacity="0.55"/>
        ))}
      </g>
    </g>
  )
}
