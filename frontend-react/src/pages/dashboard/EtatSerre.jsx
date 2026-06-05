// src/pages/dashboard/EtatSerre.jsx
import { useState, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, Info, CheckCircle, AlertTriangle, Clock,
  Thermometer, Droplets, Wind, Leaf, FlaskConical, Zap, Waves, BarChart2,
} from 'lucide-react'
import { dashboardAPI } from '../../api/client'
import { POPUP_INFO } from '../../components/geoportail/SectionDonnees'

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

// Seuils de pilotage ombrage & fenêtre — réglés dans l'application locale du complexe.
// >>> vent_max provisoire (40) en attendant la valeur réelle de "Fermeture - vent".
const ACTIONNEURS = {
  ombrage_ext: { deploie:28, retracte:24, plage:[10,17.5] },
  ombrage_int: { deploie:34, retracte:27, plage:[11,18.5] },
  fenetre:     { ouvre:25, ferme:23, vent_max:40 },
}

const ENV_KEYS = ['temperature','humidite','vpd','co2']
const IRR_KEYS = ['ph','ec','temp_eau','niveau_eau']

const T = {
  FR:{
    title:'État de la serre',
    sub:'Comment chaque unité réagit en ce moment : ouverture des fenêtres, ombrage et conditions à l’intérieur.',
    twin:'La serre en direct', heure:'heure de Rabat',
    ombrageExt:'Ombrage extérieur', ombrageInt:'Ombrage intérieur', fenetres:'Fenêtres de toiture',
    deploye:'Déployé', retracte:'Rétracté', ouvert:'Ouvertes', ferme:'Fermées', fermeSec:'Fermées (sécurité)',
    active:'Active', horsPlage:'hors plage horaire', neutre:'en transition',
    note:'Les seuils d’ombrage et de ventilation sont réglés directement dans l’application locale du complexe ; le schéma ne fait que les refléter.',
    env:'Ambiance intérieure', irr:'Irrigation',
    noIrr:'Pas de données d’irrigation pour cette unité.',
    hover:'Survolez une carte pour voir ce que ce paramètre signifie dans cette serre.',
    optimal:'Zone optimale', seuils:'Seuils admin', actuelle:'Valeur actuelle',
    stOk:'Optimal', stAtt:'Hors zone optimale', stAl:'Seuil d’alerte dépassé', stNa:'Donnée indisponible',
    live:'LIVE', partiel:'PARTIEL',
  },
  EN:{
    title:'Greenhouse status',
    sub:'How each unit is reacting right now: window opening, shading and indoor conditions.',
    twin:'The greenhouse, live', heure:'Rabat time',
    ombrageExt:'Exterior shade', ombrageInt:'Interior shade', fenetres:'Roof windows',
    deploye:'Deployed', retracte:'Retracted', ouvert:'Open', ferme:'Closed', fermeSec:'Closed (safety)',
    active:'Active', horsPlage:'off-schedule', neutre:'in transition',
    note:'Shading and ventilation thresholds are set directly in the complex’s local application; the schematic only mirrors them.',
    env:'Indoor climate', irr:'Irrigation',
    noIrr:'No irrigation data for this unit.',
    hover:'Hover a card to see what this parameter means in this greenhouse.',
    optimal:'Optimal zone', seuils:'Admin thresholds', actuelle:'Current value',
    stOk:'Optimal', stAtt:'Outside optimal zone', stAl:'Alert threshold exceeded', stNa:'No data',
    live:'LIVE', partiel:'PARTIAL',
  },
}

/* ── logique d'état des actionneurs ── */
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
  if (seuil && seuil.actif !== false) {
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

export default function EtatSerre({ liveData = [], meteo = {}, theme, lang }) {
  const isDark = theme === 'dark'
  const t      = T[lang] || T.FR
  const [idx, setIdx]               = useState(0)
  const [thresholds, setThresholds] = useState([])

  const meta   = SERRES[idx]
  const serre  = liveData[idx] || {}
  const env    = serre.env || {}
  const irr    = serre.irr || {}
  const temp   = env.temperature
  const hasIrr = irr && Object.values(irr).some(v => v != null)

  useEffect(() => {
    let alive = true
    dashboardAPI.getThresholds(meta.id)
      .then(d => { if (alive) setThresholds(d || []) })
      .catch(() => { if (alive) setThresholds([]) })
    return () => { alive = false }
  }, [meta.id])

  const cardBg = isDark ? 'rgba(16,27,46,0.82)' : 'white'
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'var(--border)'
  const ink    = isDark ? '#F8FAFC' : '#0F172A'
  const ink3   = isDark ? '#94A3B8' : 'var(--ink-3)'
  const ink4   = isDark ? '#64748B' : 'var(--ink-4)'

  const ext = ecranEtat(temp, ACTIONNEURS.ombrage_ext)
  const int = ecranEtat(temp, ACTIONNEURS.ombrage_int)
  const fen = fenetreEtat(temp, meteo.vent, meteo.pluie, ACTIONNEURS.fenetre)
  const getSeuil = (key) => thresholds.find(s => s.capteur === key) || null

  const detExt = lang==='EN'
    ? `Deploys above ${ACTIONNEURS.ombrage_ext.deploie} °C, retracts below ${ACTIONNEURS.ombrage_ext.retracte} °C.`
    : `Se déploie au-dessus de ${ACTIONNEURS.ombrage_ext.deploie} °C et se rétracte sous ${ACTIONNEURS.ombrage_ext.retracte} °C.`
  const detInt = lang==='EN'
    ? `Deploys above ${ACTIONNEURS.ombrage_int.deploie} °C, retracts below ${ACTIONNEURS.ombrage_int.retracte} °C.`
    : `Se déploie au-dessus de ${ACTIONNEURS.ombrage_int.deploie} °C et se rétracte sous ${ACTIONNEURS.ombrage_int.retracte} °C.`
  const detFen = lang==='EN'
    ? `Open above ${ACTIONNEURS.fenetre.ouvre} °C, close below ${ACTIONNEURS.fenetre.ferme} °C, and shut immediately in strong wind or rain.`
    : `S’ouvrent au-dessus de ${ACTIONNEURS.fenetre.ouvre} °C, se ferment sous ${ACTIONNEURS.fenetre.ferme} °C, et se referment aussitôt en cas de vent fort ou de pluie.`

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>{t.title}</h1>
          <div className="admin-sub">{t.sub}</div>
        </div>
      </div>

      {/* Sélecteur de serre */}
      <div style={{ display:'flex', justifyContent:'center', marginBottom:18 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, background:cardBg, border:`1px solid ${border}`, borderRadius:14, padding:6 }}>
          <button onClick={() => setIdx(i => (i - 1 + 5) % 5)} style={navBtn(isDark, border, ink3)}><ChevronLeft size={15} /></button>
          {SERRES.map((s, i) => (
            <button key={s.id} onClick={() => setIdx(i)} style={{
              padding:'7px 16px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer',
              fontFamily:'inherit', whiteSpace:'nowrap', transition:'all 0.2s',
              border:`1px solid ${idx===i ? s.color+'50':'transparent'}`,
              background: idx===i ? `${s.color}15`:'transparent', color: idx===i ? s.color : ink3,
            }}>
              {lang==='EN' ? s.nomEN.split('&')[0].trim() : s.nomFR.split('&')[0].trim()}
            </button>
          ))}
          <button onClick={() => setIdx(i => (i + 1) % 5)} style={navBtn(isDark, border, ink3)}><ChevronRight size={15} /></button>
        </div>
      </div>

      {/* Bandeau nom de serre */}
      <div style={{ textAlign:'center', marginBottom:16, padding:'13px 20px', background:`${meta.color}0d`, border:`1px solid ${meta.color}22`, borderRadius:16 }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:10 }}>
          <span style={{ width:11, height:11, borderRadius:'50%', background:meta.color, boxShadow:`0 0 10px ${meta.color}` }} />
          <span style={{ fontSize:16, fontWeight:700, color:ink }}>{lang==='EN' ? meta.nomEN : meta.nomFR}</span>
          <span style={{ fontSize:11, color:meta.color, background:`${meta.color}15`, border:`1px solid ${meta.color}25`, padding:'3px 10px', borderRadius:999, fontWeight:700 }}>
            {serre.statut === 'ok' ? t.live : t.partiel}
          </span>
        </span>
      </div>

      {/* Schéma + état des actionneurs */}
      <div className="panel" style={{ background:cardBg, borderColor:border, marginBottom:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:18, alignItems:'stretch' }}>
          <div>
            <div style={{ fontSize:11, color:ink4, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>
              {t.twin} · {t.heure}
            </div>
            <Scene isDark={isDark} serreColor={meta.color} meteo={meteo} ext={ext.etat} int={int.etat} fenetre={fen.etat} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <EtatCard t={t} isDark={isDark} ink={ink} ink3={ink3} titre={t.ombrageExt}
              actif={ext.etat==='deploye'} on={t.deploye} off={t.retracte} cOn="#F59E0B"
              detail={detExt} plage={ACTIONNEURS.ombrage_ext.plage} neutre={ext.neutre} />
            <EtatCard t={t} isDark={isDark} ink={ink} ink3={ink3} titre={t.ombrageInt}
              actif={int.etat==='deploye'} on={t.deploye} off={t.retracte} cOn="#FBBF24"
              detail={detInt} plage={ACTIONNEURS.ombrage_int.plage} neutre={int.neutre} />
            <EtatCard t={t} isDark={isDark} ink={ink} ink3={ink3} titre={t.fenetres}
              actif={fen.etat==='ouvert'} on={t.ouvert} off={fen.force ? t.fermeSec : t.ferme}
              cOn="#22C55E" cOff={fen.force ? '#EF4444' : undefined}
              detail={detFen} force={fen.force} neutre={fen.neutre} />
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginTop:14, fontSize:11.5, color:ink3, lineHeight:1.6 }}>
          <Info size={13} style={{ flexShrink:0, marginTop:2 }} /> <span>{t.note}</span>
        </div>
      </div>

      {/* Ambiance intérieure (ENV) */}
      <div className="panel" style={{ background:cardBg, borderColor:border, marginBottom:16 }}>
        <div className="panel-head" style={{ marginBottom:6 }}>
          <h2>{t.env}</h2>
        </div>
        <div style={{ fontSize:11.5, color:ink3, marginBottom:18, display:'flex', alignItems:'center', gap:6 }}>
          <Info size={12} /> {t.hover}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16 }}>
          {ENV_KEYS.map(key => (
            <ParamCard key={key} paramKey={key} value={env[key]} meta={meta} seuil={getSeuil(key)}
              lang={lang} isDark={isDark} t={t} />
          ))}
        </div>
      </div>

      {/* Irrigation (IRR) */}
      <div className="panel" style={{ background:cardBg, borderColor:border }}>
        <div className="panel-head" style={{ marginBottom:18 }}>
          <h2>{t.irr}</h2>
        </div>
        {hasIrr ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16 }}>
            {IRR_KEYS.map(key => (
              <ParamCard key={key} paramKey={key} value={irr[key]} meta={meta} seuil={getSeuil(key)}
                lang={lang} isDark={isDark} t={t} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign:'center', padding:'2rem', color:ink3, fontSize:13 }}>{t.noIrr}</div>
        )}
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
    <div style={{ borderRadius:12, padding:14, flex:1, display:'flex', flexDirection:'column', justifyContent:'center',
      border:`1px solid ${isDark?'rgba(255,255,255,0.06)':'var(--border)'}`,
      background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(16,48,36,0.015)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <span style={{ fontSize:13, fontWeight:600, color:ink }}>{titre}</span>
        <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, fontWeight:600, padding:'4px 10px',
          borderRadius:999, color:c, background:`${c}1a`, border:`1px solid ${c}33` }}>
          {force && <AlertTriangle size={11} />}
          <span style={{ width:6, height:6, borderRadius:'50%', background:c }} />
          {actif ? on : off}
        </span>
      </div>
      <div style={{ fontSize:11, color:ink3, lineHeight:1.55 }}>{detail}</div>
      {plage && (
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:8, fontSize:10.5, color: enPlage ? '#22C55E' : ink3 }}>
          <Clock size={11} /> {t.active} {fmtPlage(plage)}{neutre ? ` · ${t.neutre}` : (enPlage ? '' : ` · ${t.horsPlage}`)}
        </div>
      )}
    </div>
  )
}

/* ── carte paramètre (style SectionDonnees + seuils admin) ── */
function ParamCard({ paramKey, value, meta, seuil, lang, isDark, t }) {
  const [hovered, setHovered] = useState(false)
  const info = POPUP_INFO[paramKey]
  if (!info) return null
  const Icon    = PARAM_ICONS[paramKey]
  const langKey = lang === 'EN' ? 'en' : 'fr'
  const hasVal  = value != null
  const status  = paramStatus(value, info.optimal, seuil)
  const cardColor = status==='alerte' ? '#EF4444' : status==='attention' ? '#F59E0B' : status==='ok' ? meta.color : '#64748B'
  const stLabel = status==='ok' ? t.stOk : status==='attention' ? t.stAtt : status==='alerte' ? t.stAl : t.stNa
  const desc    = info.serres[meta.code]?.[langKey] || ''

  const dMin = info.optimal.min * 0.5, dMax = info.optimal.max * 1.5
  const pos  = (v) => Math.min(96, Math.max(2, ((v - dMin) / (dMax - dMin)) * 100))

  return (
    <div style={{ position:'relative' }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div style={{
        borderRadius:16, padding:'20px 14px', textAlign:'center', cursor:'default', transition:'all 0.25s ease',
        background: hovered ? `${cardColor}12` : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
        border:`1px solid ${hovered ? cardColor+'40' : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)')}`,
        boxShadow: hovered ? `0 8px 24px ${cardColor}18` : 'none',
        transform: hovered ? 'translateY(-3px)' : 'none',
      }}>
        <div style={{ position:'absolute', top:8, right:8 }}>
          {status==='ok' ? <CheckCircle size={13} color={cardColor} />
            : status==='na' ? <Info size={13} color="#64748B" />
            : <AlertTriangle size={13} color={cardColor} />}
        </div>
        <div style={{ marginBottom:8, display:'flex', justifyContent:'center' }}>
          {Icon && <Icon size={20} color={hovered ? cardColor : (isDark ? '#64748B' : '#94A3B8')} strokeWidth={1.9} />}
        </div>
        <div style={{ fontSize:10, color:isDark?'#64748B':'#94A3B8', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:8 }}>
          {lang==='EN' ? info.labelEn : info.labelFr}
        </div>
        <div style={{ fontSize:'2rem', fontWeight:800, lineHeight:1, fontFamily:'var(--font-mono)',
          color: hasVal ? cardColor : (isDark?'#64748B':'#94A3B8') }}>
          {hasVal ? value : '—'}
        </div>
        {hasVal && <div style={{ fontSize:11, color:isDark?'#64748B':'#94A3B8', marginTop:4 }}>{info.unit}</div>}
        <div style={{ marginTop:10, fontSize:10, fontFamily:'var(--font-mono)',
          color: status==='attention'||status==='alerte' ? cardColor : (isDark?'#475569':'#CBD5E1') }}>
          Opt. {info.optimal.min}–{info.optimal.max} {info.unit}
        </div>
      </div>

      {hovered && (
        <div style={{
          position:'absolute', bottom:'calc(100% + 10px)', left:'50%', transform:'translateX(-50%)', width:290,
          background: isDark ? 'rgba(7,17,31,0.97)' : 'rgba(255,255,255,0.98)',
          border:`1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          borderRadius:16, padding:16, zIndex:200, boxShadow:'0 20px 60px rgba(0,0,0,0.35)', backdropFilter:'blur(20px)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:8, background:`${cardColor}15` }}>
              {Icon && <Icon size={15} color={cardColor} strokeWidth={1.8} />}
            </span>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:cardColor }}>{lang==='EN' ? info.labelEn : info.labelFr}</div>
              <div style={{ fontSize:10, color:isDark?'#475569':'#94A3B8', fontFamily:'var(--font-mono)' }}>
                {(lang==='EN' ? meta.nomEN : meta.nomFR).split('&')[0].trim()}
              </div>
            </div>
            <span style={{ marginLeft:'auto', fontSize:10, fontWeight:600, color:cardColor }}>{stLabel}</span>
          </div>

          {hasVal && (
            <div style={{ background:`${cardColor}12`, border:`1px solid ${cardColor}25`, borderRadius:10, padding:'8px 12px', marginBottom:10,
              display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:11, color:isDark?'#94A3B8':'#6b7280' }}>{t.actuelle}</span>
              <span style={{ fontSize:18, fontWeight:800, color:cardColor, fontFamily:'var(--font-mono)' }}>
                {value} <span style={{ fontSize:12 }}>{info.unit}</span>
              </span>
            </div>
          )}

          {/* barre : zone optimale + repères seuils admin + valeur */}
          <div style={{ marginBottom:6 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:isDark?'#475569':'#94A3B8', marginBottom:4 }}>
              <span>{t.optimal}</span>
              <span style={{ fontFamily:'var(--font-mono)' }}>{info.optimal.min}–{info.optimal.max} {info.unit}</span>
            </div>
            <div style={{ height:6, background:isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.06)', borderRadius:3, position:'relative' }}>
              <div style={{ position:'absolute', top:0, height:'100%', borderRadius:3,
                left:`${pos(info.optimal.min)}%`, width:`${pos(info.optimal.max)-pos(info.optimal.min)}%`, background:`${cardColor}60` }} />
              {seuil?.valeur_min != null && <div style={{ position:'absolute', top:-3, height:12, left:`${pos(seuil.valeur_min)}%`, borderLeft:'2px dashed #EF4444' }} />}
              {seuil?.valeur_max != null && <div style={{ position:'absolute', top:-3, height:12, left:`${pos(seuil.valeur_max)}%`, borderLeft:'2px dashed #EF4444' }} />}
              {hasVal && <div style={{ position:'absolute', top:'50%', transform:'translate(-50%,-50%)', left:`${pos(value)}%`,
                width:10, height:10, borderRadius:'50%', background:cardColor, boxShadow:`0 0 6px ${cardColor}`, border:'2px solid white' }} />}
            </div>
            <div style={{ fontSize:10, color:isDark?'#475569':'#94A3B8', fontFamily:'var(--font-mono)', marginTop:5 }}>
              {t.seuils} : {seuil?.valeur_min ?? '—'}–{seuil?.valeur_max ?? '—'} {info.unit}
            </div>
          </div>

          <div style={{ fontSize:12, color:isDark?'#CBD5E1':'#475569', lineHeight:1.65, marginTop:8 }}>{desc}</div>

          <div style={{ position:'absolute', bottom:-6, left:'50%', width:12, height:12,
            background:isDark ? 'rgba(7,17,31,0.97)' : 'rgba(255,255,255,0.98)',
            borderRight:`1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            borderBottom:`1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            transform:'translateX(-50%) rotate(45deg)' }} />
        </div>
      )}
    </div>
  )
}

/* ── schéma de la serre (SVG, theme-aware) ── */
function Scene({ isDark, serreColor, meteo, ext, int, fenetre }) {
  const extDep = ext === 'deploye', intDep = int === 'deploye', ouvert = fenetre === 'ouvert'
  const TR = '0.7s cubic-bezier(.4,0,.2,1)'
  const sol = Math.min(1, (meteo.solaire || 0) / 900)
  const lever = parseH(meteo.sunrise) ?? 6.5, coucher = parseH(meteo.sunset) ?? 19.5
  const now = new Date(); const hNow = now.getHours() + now.getMinutes() / 60
  const vStart = lever - 1, vEnd = coucher + 1, X0 = 45, X1 = 435
  const xOf = (h) => X0 + ((Math.min(Math.max(h, vStart), vEnd) - vStart) / (vEnd - vStart)) * (X1 - X0)
  const horizon = 198, apex = 28
  const yArc = (h) => { const f = (h - lever) / (coucher - lever); return horizon - Math.sin(Math.max(0, Math.min(1, f)) * Math.PI) * (horizon - apex) }
  let arc = ''
  for (let h = lever; h <= coucher + 0.001; h += (coucher - lever) / 40) arc += `${arc ? 'L' : 'M'} ${xOf(h).toFixed(1)} ${yArc(h).toFixed(1)} `
  const jour = hNow >= lever && hNow <= coucher
  const aX = xOf(hNow), aY = jour ? yArc(hNow) : horizon + 16

  const cVerre  = isDark ? '#5b86ad' : '#94a3b8'
  const cVerreF = isDark ? 'rgba(127,182,232,0.10)' : 'rgba(148,197,232,0.18)'
  const cSol    = isDark ? '#2a4055' : '#cbd5e1'
  const cSkyTop = jour ? (isDark ? '#16324f' : '#dbeafe') : (isDark ? '#0c1b2e' : '#475569')
  const cSkyBot = isDark ? '#0a1626' : '#eff6ff'
  const cAxis   = isDark ? '#3b5775' : '#cbd5e1'

  return (
    <svg viewBox="0 0 480 320" style={{ width:'100%', height:'auto', display:'block' }}>
      <defs>
        <linearGradient id="es-ciel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cSkyTop} /><stop offset="100%" stopColor={cSkyBot} />
        </linearGradient>
        <radialGradient id="es-astre" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={jour ? '#fff3c4' : '#e2e8f0'} /><stop offset="100%" stopColor={jour ? '#f5a524' : '#94a3b8'} />
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

      <rect x={xOf(ACTIONNEURS.ombrage_ext.plage[0])} y="182" height="4" rx="2"
        width={xOf(ACTIONNEURS.ombrage_ext.plage[1]) - xOf(ACTIONNEURS.ombrage_ext.plage[0])} fill="#F59E0B" opacity="0.55" />
      <rect x={xOf(ACTIONNEURS.ombrage_int.plage[0])} y="189" height="4" rx="2"
        width={xOf(ACTIONNEURS.ombrage_int.plage[1]) - xOf(ACTIONNEURS.ombrage_int.plage[0])} fill="#FBBF24" opacity="0.55" />

      <line x1={aX} y1="12" x2={aX} y2="296" stroke={serreColor} strokeWidth="1" strokeDasharray="2 4" opacity="0.55" />
      <text x={aX} y="10" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8.5" fill={serreColor}>
        {String(Math.floor(hNow)).padStart(2,'0')}:{String(Math.round((hNow%1)*60)).padStart(2,'0')}
      </text>

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

      <rect x="170" y="242" width="140" height="6" rx="2" fill="url(#es-meshInt)" opacity="0.95"
        style={{ transformBox:'fill-box', transformOrigin:'left', transform:`scaleX(${intDep?1:0})`, transition:`transform ${TR}` }} />

      <g clipPath="url(#es-roof)">
        <rect x="160" y="198" width="160" height="58" fill="url(#es-mesh)"
          style={{ transform: extDep ? 'translateX(0)' : 'translateX(-170px)', transition:`transform ${TR}` }} />
      </g>

      <g style={{ transformBox:'fill-box', transformOrigin:'239px 213px', transform: ouvert ? 'rotate(-38deg)' : 'rotate(0deg)', transition:`transform ${TR}` }}>
        <polygon points="240,213 296,232 296,237 240,218" fill={isDark?'rgba(191,227,255,0.5)':'rgba(191,227,255,0.7)'} stroke="#9ec9ef" strokeWidth="2" strokeLinejoin="round" />
      </g>
      <circle cx="240" cy="212" r="3" fill={cVerre} />
    </svg>
  )
}
