// src/pages/dashboard/EtatSerre.jsx
// ════════════════════════════════════════════════════════════════
// SECTION CENTRALE DU DASHBOARD
// Structure :
//   1. Bannière : sélecteur serre + nom + statut + météo extérieure
//   2. Ambiance intérieure : grandes cartes ENV + IRR
//   3. Schéma SVG enrichi + panneaux actionneurs droite
// ════════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, Info, CheckCircle, AlertTriangle, Clock, Lock,
  Thermometer, Droplets, Wind, Leaf, FlaskConical, Zap, Waves, BarChart2,
  RefreshCw, Wind as WindIcon, Sun, CloudRain, Sunrise, Sunset,
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
  ph:FlaskConical, ec:Zap, temp_eau:Waves, niveau_eau:BarChart2,
}

const ENV_KEYS = ['temperature','humidite','vpd','co2']
const IRR_KEYS = ['ph','ec','temp_eau','niveau_eau']

const OPTIMAL = {
  temperature:{ min:18, max:28 }, humidite:{ min:60, max:80 },
  vpd:{ min:0.8, max:1.5 },      co2:{ min:400, max:1200 },
  ph:{ min:5.5, max:7.0 },       ec:{ min:1.5, max:3.5 },
  temp_eau:{ min:18, max:22 },   niveau_eau:{ min:0.6, max:1.0 },
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
    leverL:'Lever', coucherL:'Coucher',
    etatGlobal:'État global', derniereMAJ:'Dernière mise à jour',
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
    leverL:'Sunrise', coucherL:'Sunset',
    etatGlobal:'Global status', derniereMAJ:'Last update',
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

  const meta   = SERRES[idx]
  const serre  = liveData[idx] || {}
  const env    = serre.env || {}
  const irr    = serre.irr || {}
  const hasIrr = irr && Object.values(irr).some(v => v != null)
  const temp   = env.temperature

  useEffect(() => {
    let alive = true
    dashboardAPI.getThresholds(meta.id)
      .then(d => { if (alive) setThresholds(d || []) })
      .catch(() => { if (alive) setThresholds([]) })
    return () => { alive = false }
  }, [meta.id])

  const ext = ecranEtat(temp, ACTIONNEURS.ombrage_ext)
  const int = ecranEtat(temp, ACTIONNEURS.ombrage_int)
  const fen = fenetreEtat(temp, meteo.vent, meteo.pluie, ACTIONNEURS.fenetre)
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
    { icon:<WindIcon size={18}/>,    label:t.ventL,    val:meteo.vent    != null ? meteo.vent    : '—', unit:'km/h', color:'#06B6D4' },
    { icon:<Sun size={18}/>,         label:t.rayL,     val:meteo.solaire != null ? meteo.solaire : '—', unit:'W/m²', color:'#F59E0B' },
    { icon:<CloudRain size={18}/>,   label:t.pluieL,   val:meteo.pluie ? t.oui : t.non,                unit:'',     color:meteo.pluie?'#3773bd':ink4 },
    { icon:<Sunrise size={18}/>,     label:t.leverL,   val:fmtT(meteo.sunrise),                        unit:'',     color:'#F59E0B' },
    { icon:<Sunset size={18}/>,      label:t.coucherL, val:fmtT(meteo.sunset),                         unit:'',     color:'#8B5CF6' },
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

        <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:0 }}>
          {/* SVG */}
          <div style={{ padding:'0 0 16px 16px' }}>
            <Scene
              isDark={isDark} serreColor={meta.color} meteo={meteo}
              ext={ext.etat} int={int.etat} fenetre={fen.etat}
              serreIdx={idx}
            />
          </div>

          {/* Panneaux actionneurs droite */}
          <div style={{ padding:'0 16px 16px', display:'flex', flexDirection:'column', gap:10, justifyContent:'center' }}>
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
            <div style={{ fontSize:10, color:ink4, lineHeight:1.6, padding:'8px 0',
              borderTop:'1px solid ' + border, display:'flex', gap:5, alignItems:'flex-start' }}>
              <Info size={10} style={{ flexShrink:0, marginTop:1 }}/> {t.note}
            </div>
          </div>
        </div>
      </div>

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
function Scene({ isDark, serreColor, meteo, ext, int, fenetre, serreIdx }) {
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

  const jour = hNow >= lever && hNow <= coucher
  const aX = xOf(hNow), aY = jour ? yArc(hNow) : horizon+16

  const cVerre  = isDark ? '#5b86ad' : '#94a3b8'
  const cVerreF = isDark ? 'rgba(127,182,232,0.10)' : 'rgba(148,197,232,0.18)'
  const cSkyTop = jour ? (isDark?'#16324f':'#dbeafe') : (isDark?'#0c1b2e':'#475569')
  const cSkyBot = isDark ? '#0a1626' : '#eff6ff'
  const cAxis   = isDark ? '#3b5775' : '#cbd5e1'
  const cSol    = isDark ? '#2a4055' : '#cbd5e1'

  // Ouverture fenêtre : angle 0 = fermée, -38deg = ouverte
  const fenetreAngle = ouvert ? -38 : 0

  return (
    <svg viewBox="0 0 480 320" style={{ width:'100%', height:'auto', display:'block' }}>
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
          <polygon points="168,252 240,214 312,252 312,242 240,204 168,242"/>
        </clipPath>
      </defs>

      {/* Ciel */}
      <rect x="0" y="0" width="480" height="208" rx="12" fill="url(#sc-ciel)"/>

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
      <line x1={aX} y1="12" x2={aX} y2="300"
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
      <rect x="30" y="298" width="420" height="5" rx="2" fill={cSol}/>

      {/* Structure serre — polygone verre */}
      <polygon points="168,298 168,250 240,214 312,250 312,298"
        fill={cVerreF} stroke={cVerre} strokeWidth="2" strokeLinejoin="round"/>
      <line x1="168" y1="250" x2="168" y2="298" stroke={cVerre} strokeWidth="2.5"/>
      <line x1="312" y1="250" x2="312" y2="298" stroke={cVerre} strokeWidth="2.5"/>
      {/* Montants intermédiaires */}
      <line x1="204" y1="232" x2="204" y2="298" stroke={cVerre} strokeWidth="1" opacity="0.4"/>
      <line x1="240" y1="214" x2="240" y2="298" stroke={cVerre} strokeWidth="1" opacity="0.4"/>
      <line x1="276" y1="232" x2="276" y2="298" stroke={cVerre} strokeWidth="1" opacity="0.4"/>

      {/* ── Plantes intérieures selon serre ── */}
      {serreIdx === 0 && <PlanteGenetique isDark={isDark} color={serreColor}/>}
      {serreIdx === 1 && <PlanteHorticulture isDark={isDark} color={serreColor}/>}
      {serreIdx === 2 && <PlanteAgronomie isDark={isDark} color={serreColor}/>}
      {serreIdx === 3 && <PlanteHydroponie isDark={isDark} color={serreColor}/>}
      {serreIdx === 4 && <PlanteProtection isDark={isDark} color={serreColor}/>}

      {/* ── Ombrage intérieur — bande coulissante ── */}
      <rect x="172" y="244" width="136" height="7" rx="3" fill="url(#sc-meshInt)" opacity="0.95"
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
        <rect x="160" y="200" width="160" height="58" fill="url(#sc-meshExt)"
          style={{ transform: extDep ? 'translateX(0)' : 'translateX(-170px)', transition:'transform ' + TR }}/>
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
        transformBox:'fill-box', transformOrigin:'240px 214px',
        transform:'rotate(' + fenetreAngle + 'deg)',
        transition:'transform ' + TR,
      }}>
        <polygon points="240,214 296,234 296,239 240,219"
          fill={isDark?'rgba(191,227,255,0.5)':'rgba(191,227,255,0.7)'}
          stroke="#9ec9ef" strokeWidth="2" strokeLinejoin="round"/>
      </g>
      {/* Indicateur ouverture */}
      {ouvert && (
        <g>
          <path d="M 296 222 q 10,-8 16,-4" fill="none" stroke="#22C55E" strokeWidth="1.5"
            strokeDasharray="2 2" opacity="0.8"/>
          <text x="315" y="217" fontSize="7" fontFamily="monospace" fill="#22C55E">ouvert</text>
        </g>
      )}
      {/* Pivot fenêtre */}
      <circle cx="240" cy="214" r="3.5" fill={cVerre}/>

      {/* Indicateur T° intérieure */}
      <g>
        <rect x="18" y="220" width="70" height="30" rx="7"
          fill={isDark?'rgba(7,17,31,0.88)':'rgba(255,255,255,0.92)'}
          stroke={serreColor+'40'} strokeWidth="1"/>
        <text x="53" y="232" textAnchor="middle" fontFamily="monospace" fontSize="8"
          fill={isDark?'#94A3B8':'#64748B'}>T° INT.</text>
        <text x="53" y="244" textAnchor="middle" fontFamily="monospace" fontSize="11" fontWeight="700"
          fill={serreColor}>— °C</text>
      </g>

    </svg>
  )
}

// ── Plantes par serre ─────────────────────────────────────────
function PlanteGenetique({ isDark, color }) {
  const pots = [185, 220, 255, 290]
  return (
    <g>
      <rect x="175" y="275" width="140" height="4" rx="2" fill={isDark?'#2d4a5e':'#94a3b8'}/>
      {pots.map((x,i) => (
        <g key={i} transform={'translate(' + x + ',279)'}>
          <path d="M-9,0 L-7,16 L7,16 L9,0 Z" fill={isDark?'#1e3a5f':'#bfdbfe'}
            stroke={isDark?'#3b5a7a':'#93c5fd'} strokeWidth="1"/>
          <line x1="0" y1="0" x2="0" y2={-18-i*4} stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <ellipse cx="-5" cy={-10-i*2} rx="5" ry="3" fill={color} opacity="0.85"
            transform={'rotate(-30,-5,' + (-10-i*2) + ')'}/>
          <ellipse cx="5" cy={-14-i*2} rx="5" ry="3" fill={color} opacity="0.7"
            transform={'rotate(30,5,' + (-14-i*2) + ')'}/>
          <text x="0" y="24" textAnchor="middle" fontSize="6" fontFamily="monospace"
            fill={isDark?'#475569':'#94a3b8'}>G{i+1}</text>
        </g>
      ))}
    </g>
  )
}

function PlanteHorticulture({ isDark, color }) {
  const flowers = [
    {x:185,type:'rose',h:52,c:'#f43f5e'},
    {x:213,type:'tulipe',h:45,c:'#fb923c'},
    {x:241,type:'tournesol',h:60,c:'#facc15'},
    {x:269,type:'lavande',h:48,c:'#a78bfa'},
    {x:297,type:'rose',h:50,c:'#ec4899'},
  ]
  return (
    <g>
      <rect x="175" y="278" width="130" height="16" rx="5" fill={isDark?'#1a2e1a':'#bbf7d0'} opacity="0.6"/>
      {flowers.map((f,i) => (
        <g key={i}>
          <line x1={f.x} y1="278" x2={f.x} y2={278-f.h} stroke={isDark?'#22c55e':'#16a34a'} strokeWidth="2"/>
          <ellipse cx={f.x-7} cy={278-f.h*0.35} rx="7" ry="3.5" fill={isDark?'#22c55e':'#4ade80'}
            opacity="0.6" transform={'rotate(-35,' + (f.x-7) + ',' + (278-f.h*0.35) + ')'}/>
          {f.type==='tournesol' ? (
            <g transform={'translate(' + f.x + ',' + (278-f.h) + ')'}>
              {[...Array(10)].map((_,j) => {
                const a=(j/10)*Math.PI*2
                return <ellipse key={j} cx={Math.cos(a)*10} cy={Math.sin(a)*10} rx="4.5" ry="2.5"
                  fill={f.c} opacity="0.9" transform={'rotate(' + (j/10*360) + ',' + Math.cos(a)*10 + ',' + Math.sin(a)*10 + ')'}/>
              })}
              <circle cx="0" cy="0" r="6" fill={isDark?'#78350f':'#92400e'}/>
            </g>
          ) : f.type==='rose' ? (
            <g transform={'translate(' + f.x + ',' + (278-f.h) + ')'}>
              {[...Array(6)].map((_,j) => {
                const a=(j/6)*Math.PI*2
                return <ellipse key={j} cx={Math.cos(a)*6} cy={Math.sin(a)*6} rx="6" ry="4.5" fill={f.c} opacity="0.75+j*0.04"/>
              })}
              <circle cx="0" cy="0" r="3.5" fill={f.c}/>
            </g>
          ) : f.type==='lavande' ? (
            <g transform={'translate(' + f.x + ',' + (278-f.h) + ')'}>
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
            <g transform={'translate(' + f.x + ',' + (278-f.h) + ')'}>
              <path d="M0,0 q-9,-7 -5,-16 q5,3 5,7 q0,-4 5,-7 q4,9 -5,16" fill={f.c} opacity="0.9"/>
            </g>
          )}
        </g>
      ))}
    </g>
  )
}

function PlanteAgronomie({ isDark, color }) {
  const cols = [183,207,231,255,279,303]
  return (
    <g>
      {cols.map((x,i) => {
        const h = 42 + (i%3)*8
        return (
          <g key={i} transform={'translate(' + x + ',278)'}>
            <line x1="0" y1="0" x2="0" y2={-h} stroke={color} strokeWidth="1.8"/>
            <path d={'M0,' + (-h*0.35) + ' q-9,-3 -7,-11'} fill="none" stroke={color} strokeWidth="1.4" opacity="0.65"/>
            <path d={'M0,' + (-h*0.6) + ' q9,-3 7,-11'} fill="none" stroke={color} strokeWidth="1.4" opacity="0.65"/>
            <g transform={'translate(0,' + (-h) + ')'}>
              {[-3,-1,1,3].map((dx,j) => (
                <ellipse key={j} cx={dx} cy={-j*4.5} rx="2.5" ry="2" fill={color} opacity="0.9"/>
              ))}
              <line x1="0" y1="-18" x2="0" y2="-24" stroke={color} strokeWidth="1"/>
            </g>
          </g>
        )
      })}
    </g>
  )
}

function PlanteHydroponie({ isDark, color }) {
  const tubes = [240, 262, 284]
  return (
    <g>
      <rect x="175" y="230" width="140" height="5" rx="2" fill={isDark?'#1e3a5f':'#bfdbfe'}/>
      <rect x="175" y="292" width="140" height="5" rx="2" fill={isDark?'#1e3a5f':'#bfdbfe'}/>
      <rect x="175" y="230" width="4" height="67" rx="2" fill={isDark?'#1e3a5f':'#bfdbfe'}/>
      <rect x="311" y="230" width="4" height="67" rx="2" fill={isDark?'#1e3a5f':'#bfdbfe'}/>
      {tubes.map((y,ti) => (
        <g key={ti}>
          <rect x="179" y={y} width="132" height="11" rx="5.5"
            fill={isDark?'rgba(6,182,212,0.18)':'rgba(6,182,212,0.1)'}
            stroke={isDark?'#0891b2':'#06b6d4'} strokeWidth="1.2"/>
          <line x1="184" y1={y+5.5} x2="307" y2={y+5.5}
            stroke={isDark?'#22d3ee':'#67e8f9'} strokeWidth="0.8" opacity="0.5" strokeDasharray="6 5"/>
          {[200,224,248,272,296].map((x,i) => (
            <g key={i} transform={'translate(' + x + ',' + y + ')'}>
              <circle cx="0" cy="0" r="5.5" fill={isDark?'#134e2e':'#bbf7d0'} stroke={color+'40'} strokeWidth="1"/>
              <line x1="0" y1="-2" x2="0" y2="-14" stroke={color} strokeWidth="1.5"/>
              <ellipse cx="-4" cy="-9" rx="4" ry="2.5" fill={color} opacity="0.8"
                transform="rotate(-30,-4,-9)"/>
              <ellipse cx="4" cy="-11" rx="4" ry="2.5" fill={color} opacity="0.7"
                transform="rotate(30,4,-11)"/>
              {[-3,0,3].map((dx,ri) => (
                <path key={ri} d={'M' + dx + ',6 q' + (dx*0.4) + ',7 0,14'} fill="none"
                  stroke={isDark?'#a3e635':'#84cc16'} strokeWidth="0.9" opacity="0.65"/>
              ))}
            </g>
          ))}
        </g>
      ))}
    </g>
  )
}

function PlanteProtection({ isDark, color }) {
  const plants = [190, 220, 252, 282, 310]
  return (
    <g>
      <rect x="178" y="276" width="140" height="16" rx="5" fill={isDark?'#1a1a1a':'#e2e8f0'} opacity="0.4"/>
      {plants.map((x,i) => {
        const h = 38 + (i%3)*10, healthy = i !== 2
        return (
          <g key={i} transform={'translate(' + x + ',276)'}>
            <line x1="0" y1="0" x2="0" y2={-h} stroke={healthy?color:'#F59E0B'} strokeWidth="2"/>
            <ellipse cx="-6" cy={-h*0.45} rx="6" ry="3.5" fill={healthy?color:'#F59E0B'}
              opacity="0.8" transform={'rotate(-35,-6,' + (-h*0.45) + ')'}/>
            <ellipse cx="6" cy={-h*0.65} rx="6" ry="3.5" fill={healthy?color:'#F59E0B'}
              opacity="0.7" transform={'rotate(35,6,' + (-h*0.65) + ')'}/>
            <ellipse cx="0" cy={-h} rx="7" ry="4.5" fill={healthy?color:'#F59E0B'} opacity="0.9"/>
            {healthy && (
              <g transform={'translate(0,' + (-h-12) + ')'}>
                <path d="M0,-7 L-7,0 L-7,7 L0,10 L7,7 L7,0 Z"
                  fill={color+'1a'} stroke={color} strokeWidth="1" opacity="0.55"/>
                <text x="0" y="4" textAnchor="middle" fontSize="6" fill={color}>✓</text>
              </g>
            )}
          </g>
        )
      })}
      <g transform="translate(340,248)">
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
