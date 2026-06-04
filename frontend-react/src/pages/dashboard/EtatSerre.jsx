// src/pages/dashboard/EtatSerre.jsx
import { useState, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, RefreshCw, Info,
  Thermometer, Droplets, Wind, Gauge, FlaskConical, Zap,
  CheckCircle, AlertTriangle, Clock,
} from 'lucide-react'
import { dashboardAPI } from '../../api/client'

const SERRES = [
  { id:1, code:'S01', color:'#22C55E', nomFR:'Génétique',            nomEN:'Genetics' },
  { id:2, code:'S02', color:'#06B6D4', nomFR:'Horticulture',         nomEN:'Horticulture' },
  { id:3, code:'S03', color:'#F59E0B', nomFR:'Agronomie',            nomEN:'Agronomy' },
  { id:4, code:'S04', color:'#8B5CF6', nomFR:'Hydroponie',           nomEN:'Hydroponics' },
  { id:5, code:'S05', color:'#EF4444', nomFR:'Protection des Plantes',nomEN:'Plant Protection' },
]

// Seuils de pilotage des actionneurs (app pro-leaf) — ombrage & fenêtre.
// >>> vent_max provisoire (40) en attendant la valeur réelle de "Fermeture - vent".
const ACTIONNEURS = {
  ombrage_ext: { deploie:28, retracte:24, plage:[10,17.5] },
  ombrage_int: { deploie:34, retracte:27, plage:[11,18.5] },
  fenetre:     { ouvre:25, ferme:23, vent_max:40 },
}

// Conditions optimales par culture (références agronomiques, cf. SectionDonnees).
const OPTIMAL = {
  temperature:{ min:18, max:28 }, humidite:{ min:60, max:80 }, vpd:{ min:0.8, max:1.5 },
  co2:{ min:400, max:1200 }, ph:{ min:5.5, max:7.0 }, ec:{ min:1.5, max:3.5 },
}

const PARAMS = [
  { key:'temperature', src:'env', Icon:Thermometer,  fr:'Température', en:'Temperature', unit:'°C',    color:'#F59E0B' },
  { key:'humidite',    src:'env', Icon:Droplets,     fr:'Humidité',   en:'Humidity',    unit:'%',     color:'#06B6D4' },
  { key:'vpd',         src:'env', Icon:Wind,         fr:'VPD',        en:'VPD',         unit:'kPa',   color:'#8B5CF6' },
  { key:'co2',         src:'env', Icon:Gauge,        fr:'CO₂',        en:'CO₂',         unit:'ppm',   color:'#22C55E' },
  { key:'ph',          src:'irr', Icon:FlaskConical, fr:'pH',         en:'pH',          unit:'',      color:'#0891b2' },
  { key:'ec',          src:'irr', Icon:Zap,          fr:'EC',         en:'EC',          unit:'mS/cm', color:'#059669' },
]

const T = {
  FR:{
    title:'État de la serre', sub:'Actionneurs & variations des paramètres internes',
    refresh:'Actualiser', live:'Données en temps réel',
    twin:'Jumeau numérique', heure:'heure de Rabat',
    ombrageExt:'Ombrage extérieur', ombrageInt:'Ombrage intérieur', fenetres:'Fenêtres',
    deploye:'Déployé', retracte:'Rétracté', ouvert:'Ouvertes', ferme:'Fermées', fermeSec:'Fermées (sécurité)',
    neutre:'zone neutre', active:'active', horsPlage:'hors plage',
    shadow:"État estimé selon les seuils et l'heure — l'API capteurs ne renvoie pas la position physique des actionneurs (« digital shadow »).",
    paramsTitle:'Variations des paramètres internes',
    legende:'Bande colorée = zone optimale de la culture · repères pointillés = seuils admin (alerte) · point = valeur actuelle',
    optimal:'Optimal', seuils:'Seuils admin', actuelle:'Valeur actuelle',
    statutOk:'Optimal', statutAtt:'Hors zone optimale', statutAl:'Hors seuil admin', statutNa:'Indisponible',
  },
  EN:{
    title:'Greenhouse status', sub:'Actuators & internal parameter variations',
    refresh:'Refresh', live:'Real-time data',
    twin:'Digital twin', heure:'Rabat time',
    ombrageExt:'Exterior shade', ombrageInt:'Interior shade', fenetres:'Windows',
    deploye:'Deployed', retracte:'Retracted', ouvert:'Open', ferme:'Closed', fermeSec:'Closed (safety)',
    neutre:'neutral zone', active:'active', horsPlage:'off-schedule',
    shadow:'State estimated from thresholds and time — the sensor API does not return the physical actuator position ("digital shadow").',
    paramsTitle:'Internal parameter variations',
    legende:'Colored band = crop optimal zone · dashed marks = admin thresholds (alert) · dot = current value',
    optimal:'Optimal', seuils:'Admin thresholds', actuelle:'Current value',
    statutOk:'Optimal', statutAtt:'Outside optimal zone', statutAl:'Out of admin threshold', statutNa:'Unavailable',
  },
}

/* ── logique d'état ── */
function ecranEtat(temp, s) {
  if (temp == null) return { etat:'retracte', na:true }
  if (temp > s.deploie) return { etat:'deploye' }
  if (temp < s.retracte) return { etat:'retracte' }
  return { etat: temp >= (s.deploie + s.retracte) / 2 ? 'deploye' : 'retracte', neutre:true }
}
function fenetreEtat(temp, vent, pluie, s) {
  if (pluie || (vent != null && vent > s.vent_max)) return { etat:'ferme', force:true }
  if (temp == null) return { etat:'ferme', na:true }
  if (temp > s.ouvre) return { etat:'ouvert' }
  if (temp < s.ferme) return { etat:'ferme' }
  return { etat: temp >= (s.ouvre + s.ferme) / 2 ? 'ouvert' : 'ferme', neutre:true }
}
function dansPlage(plage) {
  const n = new Date(); const h = n.getHours() + n.getMinutes() / 60
  return h >= plage[0] && h <= plage[1]
}
function paramStatus(value, optimal, seuil) {
  if (value == null) return 'na'
  if (seuil) {
    if (seuil.valeur_min != null && value < seuil.valeur_min) return 'alerte'
    if (seuil.valeur_max != null && value > seuil.valeur_max) return 'alerte'
  }
  if (optimal && (value < optimal.min || value > optimal.max)) return 'attention'
  return 'ok'
}
const parseH = (iso) => {
  if (!iso) return null
  const t = String(iso).split('T')[1]; if (!t) return null
  const [h, m] = t.split(':'); return +h + (+m || 0) / 60
}
const fmtPlage = (p) =>
  `${String(Math.floor(p[0])).padStart(2,'0')}:${p[0]%1?'30':'00'}–${String(Math.floor(p[1])).padStart(2,'0')}:${p[1]%1?'30':'00'}`

export default function EtatSerre({ liveData = [], meteo = {}, theme, lang, countdown, refreshAll }) {
  const isDark = theme === 'dark'
  const t      = T[lang] || T.FR
  const [idx, setIdx]               = useState(0)
  const [thresholds, setThresholds] = useState([])

  const meta  = SERRES[idx]
  const serre = liveData[idx] || {}
  const env   = serre.env || {}
  const irr   = serre.irr || {}
  const temp  = env.temperature

  useEffect(() => {
    let alive = true
    dashboardAPI.getThresholds(meta.id)
      .then(d => { if (alive) setThresholds(d || []) })
      .catch(() => { if (alive) setThresholds([]) })
    return () => { alive = false }
  }, [meta.id])

  // Couleurs réactives (alignées au reste de l'admin)
  const cardBg   = isDark ? 'rgba(16,27,46,0.82)' : 'white'
  const border   = isDark ? 'rgba(255,255,255,0.07)' : 'var(--border)'
  const ink      = isDark ? '#F8FAFC' : '#0F172A'
  const ink3     = isDark ? '#94A3B8' : 'var(--ink-3)'
  const ink4     = isDark ? '#64748B' : 'var(--ink-4)'
  const okC   = '#22C55E', attC = '#F59E0B', alC = '#EF4444'

  const ext = ecranEtat(temp, ACTIONNEURS.ombrage_ext)
  const int = ecranEtat(temp, ACTIONNEURS.ombrage_int)
  const fen = fenetreEtat(temp, meteo.vent, meteo.pluie, ACTIONNEURS.fenetre)

  const getSeuil = (key) => thresholds.find(s => s.capteur === key) || null

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>{t.title}</h1>
          <div className="admin-sub">{t.sub}</div>
        </div>
        <div className="admin-top-r">
          <span className="chip"><span className="dot ok" />{countdown}</span>
          <button className="btn btn-secondary btn-sm" onClick={refreshAll}>↻ {t.refresh}</button>
        </div>
      </div>

      {/* Sélecteur de serre */}
      <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, background:cardBg, border:`1px solid ${border}`, borderRadius:14, padding:6 }}>
          <button onClick={() => setIdx(i => (i - 1 + 5) % 5)} style={navBtn(isDark, border, ink3)}><ChevronLeft size={15} /></button>
          {SERRES.map((s, i) => (
            <button key={s.id} onClick={() => setIdx(i)} style={{
              padding:'7px 16px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer',
              fontFamily:'inherit', whiteSpace:'nowrap', transition:'all 0.2s',
              border:`1px solid ${idx===i ? s.color+'50':'transparent'}`,
              background: idx===i ? `${s.color}15`:'transparent',
              color: idx===i ? s.color : ink3,
            }}>
              {lang==='EN' ? s.nomEN.split('&')[0].trim() : s.nomFR.split('&')[0].trim()}
            </button>
          ))}
          <button onClick={() => setIdx(i => (i + 1) % 5)} style={navBtn(isDark, border, ink3)}><ChevronRight size={15} /></button>
        </div>
      </div>

      {/* Bandeau nom de serre */}
      <div style={{ textAlign:'center', marginBottom:18, padding:'12px 20px', background:`${meta.color}0d`, border:`1px solid ${meta.color}22`, borderRadius:14 }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:10 }}>
          <span style={{ width:11, height:11, borderRadius:'50%', background:meta.color, boxShadow:`0 0 10px ${meta.color}` }} />
          <span style={{ fontSize:16, fontWeight:700, color:ink }}>{meta.code} · {lang==='EN' ? meta.nomEN : meta.nomFR}</span>
        </span>
      </div>

      {/* Schéma + cartes d'état */}
      <div className="panel" style={{ background:cardBg, borderColor:border, marginBottom:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:18, alignItems:'stretch' }}>
          <div>
            <div style={{ fontSize:11, color:ink4, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>
              {t.twin} · {t.heure}
            </div>
            <Scene isDark={isDark} serreColor={meta.color} meteo={meteo}
              ext={ext.etat} int={int.etat} fenetre={fen.etat} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <EtatCard t={t} isDark={isDark} ink={ink} ink3={ink3} titre={t.ombrageExt}
              actif={ext.etat==='deploye'} on={t.deploye} off={t.retracte} cOn="#F59E0B"
              detail={`> ${ACTIONNEURS.ombrage_ext.deploie}°C · < ${ACTIONNEURS.ombrage_ext.retracte}°C`}
              plage={ACTIONNEURS.ombrage_ext.plage} neutre={ext.neutre} />
            <EtatCard t={t} isDark={isDark} ink={ink} ink3={ink3} titre={t.ombrageInt}
              actif={int.etat==='deploye'} on={t.deploye} off={t.retracte} cOn="#FBBF24"
              detail={`> ${ACTIONNEURS.ombrage_int.deploie}°C · < ${ACTIONNEURS.ombrage_int.retracte}°C`}
              plage={ACTIONNEURS.ombrage_int.plage} neutre={int.neutre} />
            <EtatCard t={t} isDark={isDark} ink={ink} ink3={ink3} titre={t.fenetres}
              actif={fen.etat==='ouvert'} on={t.ouvert} off={fen.force ? t.fermeSec : t.ferme}
              cOn="#22C55E" cOff={fen.force ? '#EF4444' : undefined}
              detail={`> ${ACTIONNEURS.fenetre.ouvre}°C · < ${ACTIONNEURS.fenetre.ferme}°C · vent > ${ACTIONNEURS.fenetre.vent_max} km/h`}
              force={fen.force} neutre={fen.neutre} />
          </div>
        </div>
        <div style={{ fontSize:11, color:ink4, fontStyle:'italic', marginTop:14 }}>{t.shadow}</div>
      </div>

      {/* Variations des paramètres internes */}
      <div className="panel" style={{ background:cardBg, borderColor:border }}>
        <div className="panel-head" style={{ marginBottom:6 }}>
          <h2>{t.paramsTitle}</h2>
        </div>
        <div style={{ fontSize:11.5, color:ink3, marginBottom:18, display:'flex', alignItems:'center', gap:6 }}>
          <Info size={12} /> {t.legende}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:14 }}>
          {PARAMS.map(p => {
            const value   = (p.src === 'env' ? env : irr)[p.key]
            const optimal = OPTIMAL[p.key]
            const seuil   = getSeuil(p.key)
            const status  = paramStatus(value, optimal, seuil)
            return (
              <ParamGauge key={p.key} p={p} value={value} optimal={optimal} seuil={seuil}
                status={status} t={t} lang={lang} isDark={isDark} ink={ink} ink3={ink3} ink4={ink4}
                okC={okC} attC={attC} alC={alC} border={border} />
            )
          })}
        </div>
      </div>
    </>
  )
}

/* ── styles utilitaires ── */
const navBtn = (isDark, border, ink3) => ({
  width:32, height:32, borderRadius:8, cursor:'pointer',
  display:'flex', alignItems:'center', justifyContent:'center',
  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
  border:`1px solid ${border}`, color:ink3,
})

/* ── carte d'état actionneur ── */
function EtatCard({ t, isDark, ink, ink3, titre, actif, on, off, cOn, cOff, detail, plage, force, neutre }) {
  const c = actif ? cOn : (cOff || (isDark ? '#64748B' : '#94A3B8'))
  const enPlage = plage ? dansPlage(plage) : true
  return (
    <div style={{ borderRadius:12, padding:14, flex:1, border:`1px solid ${isDark?'rgba(255,255,255,0.06)':'var(--border)'}`,
      background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(16,48,36,0.015)', display:'flex', flexDirection:'column', justifyContent:'center' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <span style={{ fontSize:13, fontWeight:600, color:ink }}>{titre}</span>
        <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, fontWeight:600, padding:'4px 10px',
          borderRadius:999, color:c, background:`${c}1a`, border:`1px solid ${c}33` }}>
          {force && <AlertTriangle size={11} />}
          <span style={{ width:6, height:6, borderRadius:'50%', background:c }} />
          {actif ? on : off}
        </span>
      </div>
      <div style={{ fontSize:10.5, color:ink3, lineHeight:1.5, fontFamily:'var(--font-mono)' }}>{detail}</div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:7, fontSize:10 }}>
        {plage && (
          <span style={{ display:'inline-flex', alignItems:'center', gap:4, color: enPlage ? '#22C55E' : ink3 }}>
            <Clock size={10} /> {fmtPlage(plage)} · {enPlage ? t.active : t.horsPlage}
          </span>
        )}
        {neutre && <span style={{ color:'#F59E0B' }}>· {t.neutre}</span>}
      </div>
    </div>
  )
}

/* ── jauge paramètre : valeur vs optimal vs seuils admin ── */
function ParamGauge({ p, value, optimal, seuil, status, t, lang, isDark, ink, ink3, ink4, okC, attC, alC, border }) {
  const stColor = status==='ok' ? okC : status==='attention' ? attC : status==='alerte' ? alC : ink4
  const stLabel = status==='ok' ? t.statutOk : status==='attention' ? t.statutAtt : status==='alerte' ? t.statutAl : t.statutNa

  const dMin = optimal.min * 0.5
  const dMax = optimal.max * 1.5
  const pos  = (v) => Math.min(98, Math.max(2, ((v - dMin) / (dMax - dMin)) * 100))

  return (
    <div style={{ borderRadius:12, padding:16, border:`1px solid ${border}`,
      background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(16,48,36,0.015)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
        <span style={{ width:30, height:30, borderRadius:9, background:`${p.color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <p.Icon size={15} color={p.color} strokeWidth={1.9} />
        </span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:ink }}>{lang==='EN' ? p.en : p.fr}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:20, fontWeight:800, color:ink, fontFamily:'var(--font-mono)', lineHeight:1 }}>
            {value != null ? value : '—'}<span style={{ fontSize:11, color:ink4, marginLeft:2 }}>{p.unit}</span>
          </div>
        </div>
      </div>

      {/* piste */}
      <div style={{ position:'relative', height:8, borderRadius:4, marginBottom:8,
        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
        {/* zone optimale */}
        <div style={{ position:'absolute', top:0, height:'100%', borderRadius:4,
          left:`${pos(optimal.min)}%`, width:`${pos(optimal.max) - pos(optimal.min)}%`,
          background:`${p.color}55` }} />
        {/* repères seuils admin */}
        {seuil?.valeur_min != null && (
          <div style={{ position:'absolute', top:-3, height:14, width:0,
            left:`${pos(seuil.valeur_min)}%`, borderLeft:`2px dashed ${alC}` }} />
        )}
        {seuil?.valeur_max != null && (
          <div style={{ position:'absolute', top:-3, height:14, width:0,
            left:`${pos(seuil.valeur_max)}%`, borderLeft:`2px dashed ${alC}` }} />
        )}
        {/* valeur actuelle */}
        {value != null && (
          <div style={{ position:'absolute', top:'50%', transform:'translate(-50%,-50%)',
            left:`${pos(value)}%`, width:11, height:11, borderRadius:'50%',
            background:stColor, boxShadow:`0 0 8px ${stColor}`, border:'2px solid white' }} />
        )}
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:10.5, fontFamily:'var(--font-mono)', color:ink3 }}>
        <span>{t.optimal} {optimal.min}–{optimal.max}</span>
        <span>{t.seuils} {seuil?.valeur_min ?? '—'}–{seuil?.valeur_max ?? '—'}</span>
      </div>

      <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:6 }}>
        {status==='ok' ? <CheckCircle size={13} color={stColor} /> : status==='na' ? null : <AlertTriangle size={13} color={stColor} />}
        <span style={{ fontSize:11, fontWeight:600, color:stColor }}>{stLabel}</span>
        {seuil && seuil.actif === false && (
          <span style={{ fontSize:10, color:ink4, marginLeft:'auto' }}>seuil inactif</span>
        )}
      </div>
    </div>
  )
}

/* ── schéma jumeau numérique (SVG, theme-aware) ── */
function Scene({ isDark, serreColor, meteo, ext, int, fenetre }) {
  const extDep = ext === 'deploye'
  const intDep = int === 'deploye'
  const ouvert = fenetre === 'ouvert'
  const TR = '0.7s cubic-bezier(.4,0,.2,1)'
  const sol = Math.min(1, (meteo.solaire || 0) / 900)

  const lever   = parseH(meteo.sunrise) ?? 6.5
  const coucher = parseH(meteo.sunset)  ?? 19.5
  const now     = new Date(); const hNow = now.getHours() + now.getMinutes() / 60
  const vStart = lever - 1, vEnd = coucher + 1
  const X0 = 45, X1 = 435
  const xOf = (h) => X0 + ((Math.min(Math.max(h, vStart), vEnd) - vStart) / (vEnd - vStart)) * (X1 - X0)
  const horizon = 198, apex = 28
  const yArc = (h) => {
    const f = (h - lever) / (coucher - lever)
    return horizon - Math.sin(Math.max(0, Math.min(1, f)) * Math.PI) * (horizon - apex)
  }
  let arc = ''
  for (let h = lever; h <= coucher + 0.001; h += (coucher - lever) / 40)
    arc += `${arc ? 'L' : 'M'} ${xOf(h).toFixed(1)} ${yArc(h).toFixed(1)} `
  const jour  = hNow >= lever && hNow <= coucher
  const aX = xOf(hNow), aY = jour ? yArc(hNow) : horizon + 16

  const cVerre   = isDark ? '#5b86ad' : '#94a3b8'
  const cVerreF  = isDark ? 'rgba(127,182,232,0.10)' : 'rgba(148,197,232,0.18)'
  const cSol     = isDark ? '#2a4055' : '#cbd5e1'
  const cSkyTop  = jour ? (isDark ? '#16324f' : '#dbeafe') : (isDark ? '#0c1b2e' : '#475569')
  const cSkyBot  = isDark ? '#0a1626' : '#eff6ff'
  const cAxis    = isDark ? '#3b5775' : '#cbd5e1'

  return (
    <svg viewBox="0 0 480 320" style={{ width:'100%', height:'auto', display:'block' }}>
      <defs>
        <linearGradient id="es-ciel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cSkyTop} /><stop offset="100%" stopColor={cSkyBot} />
        </linearGradient>
        <radialGradient id="es-astre" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={jour ? '#fff3c4' : '#e2e8f0'} />
          <stop offset="100%" stopColor={jour ? '#f5a524' : '#94a3b8'} />
        </radialGradient>
        <pattern id="es-mesh" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" fill={isDark ? '#1f3d5c' : '#475569'} />
          <line x1="0" y1="0" x2="0" y2="6" stroke={isDark ? '#3a6b96' : '#94a3b8'} strokeWidth="2.4" />
        </pattern>
        <pattern id="es-meshInt" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill={isDark ? '#243a4d' : '#e2e8f0'} />
          <line x1="0" y1="3" x2="6" y2="3" stroke="#caa14a" strokeWidth="1.6" />
        </pattern>
        <clipPath id="es-roof"><polygon points="168,250 240,212 312,250 312,240 240,202 168,240" /></clipPath>
      </defs>

      <rect x="0" y="0" width="480" height="206" rx="12" fill="url(#es-ciel)" />
      <path d={arc} fill="none" stroke={cAxis} strokeWidth="1.4" strokeDasharray="3 5" opacity="0.85" />

      {/* fenêtres horaires automatisations */}
      <rect x={xOf(ACTIONNEURS.ombrage_ext.plage[0])} y="182" height="4" rx="2"
        width={xOf(ACTIONNEURS.ombrage_ext.plage[1]) - xOf(ACTIONNEURS.ombrage_ext.plage[0])} fill="#F59E0B" opacity="0.55" />
      <rect x={xOf(ACTIONNEURS.ombrage_int.plage[0])} y="189" height="4" rx="2"
        width={xOf(ACTIONNEURS.ombrage_int.plage[1]) - xOf(ACTIONNEURS.ombrage_int.plage[0])} fill="#FBBF24" opacity="0.55" />

      {/* ligne "maintenant" */}
      <line x1={aX} y1="12" x2={aX} y2="296" stroke={serreColor} strokeWidth="1" strokeDasharray="2 4" opacity="0.55" />
      <text x={aX} y="10" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8.5" fill={serreColor}>
        {String(Math.floor(hNow)).padStart(2,'0')}:{String(Math.round((hNow%1)*60)).padStart(2,'0')}
      </text>

      {/* astre */}
      <g>
        {jour && [...Array(8)].map((_, i) => {
          const a = (i/8)*Math.PI*2, r1 = 16, r2 = 16 + 8*sol + 3
          return <line key={i} x1={aX+Math.cos(a)*r1} y1={aY+Math.sin(a)*r1} x2={aX+Math.cos(a)*r2} y2={aY+Math.sin(a)*r2}
            stroke="#f5a524" strokeWidth="2" strokeLinecap="round" opacity={0.4+0.6*sol} />
        })}
        <circle cx={aX} cy={aY} r={jour ? 14 : 10} fill="url(#es-astre)" />
        {!jour && <circle cx={aX+4} cy={aY-3} r="8" fill={cSkyTop} />}
      </g>

      <rect x="30" y="296" width="420" height="4" rx="2" fill={cSol} />

      {/* serre */}
      <polygon points="168,296 168,248 240,212 312,248 312,296" fill={cVerreF} stroke={cVerre} strokeWidth="2" strokeLinejoin="round" />
      <line x1="168" y1="248" x2="168" y2="296" stroke={cVerre} strokeWidth="2" />
      <line x1="312" y1="248" x2="312" y2="296" stroke={cVerre} strokeWidth="2" />

      {[196,240,284].map((x,i) => (
        <g key={i} transform={`translate(${x},294)`}>
          <path d="M0,0 q-6,-10 -1,-18" fill="none" stroke="#3fae6a" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M0,0 q6,-10 1,-18" fill="none" stroke="#46c277" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M0,-1 q0,-11 0,-21" fill="none" stroke="#52d484" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      ))}

      {/* ombrage intérieur */}
      <rect x="170" y="242" width="140" height="6" rx="2" fill="url(#es-meshInt)" opacity="0.95"
        style={{ transformBox:'fill-box', transformOrigin:'left', transform:`scaleX(${intDep?1:0})`, transition:`transform ${TR}` }} />

      {/* ombrage extérieur */}
      <g clipPath="url(#es-roof)">
        <rect x="160" y="198" width="160" height="58" fill="url(#es-mesh)"
          style={{ transform: extDep ? 'translateX(0)' : 'translateX(-170px)', transition:`transform ${TR}` }} />
      </g>

      {/* fenêtre de faîtage */}
      <g style={{ transformBox:'fill-box', transformOrigin:'239px 213px', transform: ouvert ? 'rotate(-38deg)' : 'rotate(0deg)', transition:`transform ${TR}` }}>
        <polygon points="240,213 296,232 296,237 240,218" fill={isDark?'rgba(191,227,255,0.5)':'rgba(191,227,255,0.7)'} stroke="#9ec9ef" strokeWidth="2" strokeLinejoin="round" />
      </g>
      <circle cx="240" cy="212" r="3" fill={cVerre} />
    </svg>
  )
}
