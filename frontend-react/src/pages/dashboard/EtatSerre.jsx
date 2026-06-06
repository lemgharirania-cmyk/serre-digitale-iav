// src/pages/dashboard/EtatSerre.jsx
// Remplace l'ancienne section "État de la serre"
// Contenu : bannière serre → ambiance intérieure (cards) → schéma SVG créatif par serre
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

const ENV_KEYS = ['temperature','humidite','vpd','co2']
const IRR_KEYS = ['ph','ec','temp_eau','niveau_eau']

const OPTIMAL = {
  temperature:{ min:18, max:28 }, humidite:{ min:60, max:80 },
  vpd:{ min:0.8, max:1.5 }, co2:{ min:400, max:1200 },
  ph:{ min:5.5, max:7.0 }, ec:{ min:1.5, max:3.5 },
  temp_eau:{ min:18, max:22 }, niveau_eau:{ min:0.6, max:1.0 },
}

const T = {
  FR:{
    env:'Ambiance intérieure', irr:'Irrigation',
    noIrr:'Pas de données d\'irrigation pour cette unité.',
    hover:'Survolez une carte pour voir ce que ce paramètre signifie dans cette serre.',
    optimal:'Zone optimale', seuils:'Seuils admin', actuelle:'Valeur actuelle',
    stOk:'Optimal', stAtt:'Hors zone optimale', stAl:'Seuil dépassé', stNa:'N/D',
    live:'LIVE', partiel:'PARTIEL',
    schema:'Schéma représentatif',
  },
  EN:{
    env:'Indoor climate', irr:'Irrigation',
    noIrr:'No irrigation data for this unit.',
    hover:'Hover a card to see what this parameter means in this greenhouse.',
    optimal:'Optimal zone', seuils:'Admin thresholds', actuelle:'Current value',
    stOk:'Optimal', stAtt:'Outside optimal', stAl:'Alert exceeded', stNa:'N/A',
    live:'LIVE', partiel:'PARTIAL',
    schema:'Representative diagram',
  },
}

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

export default function EtatSerre({ liveData = [], meteo = {}, theme, lang }) {
  const isDark = theme === 'dark'
  const t      = T[lang] || T.FR
  const [idx, setIdx]               = useState(0)
  const [thresholds, setThresholds] = useState([])

  const meta   = SERRES[idx]
  const serre  = liveData[idx] || {}
  const env    = serre.env || {}
  const irr    = serre.irr || {}
  const hasIrr = irr && Object.values(irr).some(v => v != null)

  useEffect(() => {
    let alive = true
    dashboardAPI.getThresholds(meta.id)
      .then(d => { if (alive) setThresholds(d || []) })
      .catch(() => { if (alive) setThresholds([]) })
    return () => { alive = false }
  }, [meta.id])

  const cardBg = isDark ? 'rgba(16,27,46,0.85)' : '#FFFFFF'
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'
  const ink    = isDark ? '#F1F5F9' : '#0F172A'
  const ink3   = isDark ? '#94A3B8' : '#64748B'
  const ink4   = isDark ? '#475569' : '#94A3B8'
  const getSeuil = (key) => thresholds.find(s => s.capteur === key) || null

  const navBtn = {
    width:32, height:32, borderRadius:8, cursor:'pointer',
    display:'flex', alignItems:'center', justifyContent:'center',
    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    border:'1px solid ' + border, color:ink3,
  }

  return (
    <>
      {/* ── Sélecteur de serre ── */}
      <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, background:cardBg, border:'1px solid ' + border, borderRadius:14, padding:6 }}>
          <button onClick={() => setIdx(i => (i - 1 + 5) % 5)} style={navBtn}><ChevronLeft size={15} /></button>
          {SERRES.map((s, i) => (
            <button key={s.id} onClick={() => setIdx(i)} style={{
              padding:'7px 14px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer',
              fontFamily:"'Manrope',system-ui,sans-serif", whiteSpace:'nowrap', transition:'all 0.2s',
              border:'1px solid ' + (idx===i ? s.color+'50':'transparent'),
              background: idx===i ? s.color+'15':'transparent', color: idx===i ? s.color : ink3,
            }}>
              {lang==='EN' ? s.nomEN.split('&')[0].trim() : s.nomFR.split('&')[0].trim()}
            </button>
          ))}
          <button onClick={() => setIdx(i => (i + 1) % 5)} style={navBtn}><ChevronRight size={15} /></button>
        </div>
      </div>

      {/* ── Bandeau serre ── */}
      <div style={{ marginBottom:16, padding:'13px 20px', textAlign:'center',
        background:meta.color+'0d', border:'1px solid ' + meta.color+'22', borderRadius:16 }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:10 }}>
          <span style={{ width:11, height:11, borderRadius:'50%', background:meta.color, boxShadow:'0 0 10px ' + meta.color }} />
          <span style={{ fontSize:16, fontWeight:700, color:ink }}>{lang==='EN' ? meta.nomEN : meta.nomFR}</span>
          <span style={{ fontSize:11, color:meta.color, background:meta.color+'15', border:'1px solid ' + meta.color+'25',
            padding:'3px 10px', borderRadius:999, fontWeight:700 }}>
            {serre.statut === 'ok' ? t.live : t.partiel}
          </span>
        </span>
      </div>

      {/* ── Ambiance intérieure (ENV) ── */}
      <div style={{ background:cardBg, border:'1px solid ' + border, borderRadius:18, padding:'20px 24px', marginBottom:16 }}>
        <h2 style={{ fontSize:14, fontWeight:700, color:ink, margin:'0 0 6px', fontFamily:"'Manrope',system-ui,sans-serif" }}>{t.env}</h2>
        <div style={{ fontSize:11.5, color:ink3, marginBottom:18, display:'flex', alignItems:'center', gap:6 }}>
          <Info size={12} /> {t.hover}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14 }}>
          {ENV_KEYS.map(key => (
            <ParamCard key={key} paramKey={key} value={env[key]} meta={meta}
              seuil={getSeuil(key)} lang={lang} isDark={isDark} t={t} />
          ))}
        </div>
      </div>

      {/* ── Irrigation (IRR) ── */}
      <div style={{ background:cardBg, border:'1px solid ' + border, borderRadius:18, padding:'20px 24px', marginBottom:16 }}>
        <h2 style={{ fontSize:14, fontWeight:700, color:ink, margin:'0 0 18px', fontFamily:"'Manrope',system-ui,sans-serif" }}>{t.irr}</h2>
        {hasIrr ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14 }}>
            {IRR_KEYS.map(key => (
              <ParamCard key={key} paramKey={key} value={irr[key]} meta={meta}
                seuil={getSeuil(key)} lang={lang} isDark={isDark} t={t} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign:'center', padding:'2rem', color:ink3, fontSize:13 }}>{t.noIrr}</div>
        )}
      </div>

      {/* ── Schéma SVG créatif par type de serre ── */}
      <div style={{ background:cardBg, border:'1px solid ' + border, borderRadius:18, overflow:'hidden' }}>
        <div style={{ padding:'14px 20px 8px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:12, fontWeight:700, color:ink4, letterSpacing:'0.08em', textTransform:'uppercase' }}>
            {t.schema} · {lang==='EN' ? meta.nomEN.split('&')[0].trim() : meta.nomFR.split('&')[0].trim()}
          </span>
          <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20,
            background:meta.color+'15', border:'1px solid ' + meta.color+'25', color:meta.color }}>
            {meta.code}
          </span>
        </div>
        <SerreScene serreIdx={idx} isDark={isDark} color={meta.color} meteo={meteo} env={env} />
      </div>
    </>
  )
}

/* ── Carte paramètre ── */
function ParamCard({ paramKey, value, meta, seuil, lang, isDark, t }) {
  const [hovered, setHovered] = useState(false)
  const info = POPUP_INFO?.[paramKey]
  const Icon = PARAM_ICONS[paramKey]
  const hasVal = value != null
  const status = paramStatus(value, paramKey, seuil)
  const cardColor = status==='alerte' ? '#EF4444' : status==='attention' ? '#F59E0B' : status==='ok' ? meta.color : '#64748B'
  const opt = OPTIMAL[paramKey]
  const desc = info?.serres?.[meta.code]?.[lang==='EN'?'en':'fr'] || ''
  const dMin = opt ? opt.min * 0.5 : 0, dMax = opt ? opt.max * 1.5 : 100
  const pos  = (v) => Math.min(96, Math.max(2, ((v - dMin) / (dMax - dMin)) * 100))
  const ink4 = isDark ? '#475569' : '#94A3B8'

  return (
    <div style={{ position:'relative' }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div style={{
        borderRadius:16, padding:'20px 14px', textAlign:'center', cursor:'default', transition:'all 0.25s',
        background: hovered ? cardColor+'12' : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
        border:'1px solid ' + (hovered ? cardColor+'40' : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)')),
        boxShadow: hovered ? '0 8px 24px ' + cardColor+'18' : 'none',
        transform: hovered ? 'translateY(-3px)' : 'none',
      }}>
        <div style={{ position:'absolute', top:8, right:8 }}>
          {status==='ok' ? <CheckCircle size={13} color={cardColor} />
            : status==='na' ? <Info size={13} color="#64748B" />
            : <AlertTriangle size={13} color={cardColor} />}
        </div>
        <div style={{ marginBottom:8, display:'flex', justifyContent:'center' }}>
          {Icon && <Icon size={22} color={hovered ? cardColor : ink4} strokeWidth={1.8} />}
        </div>
        <div style={{ fontSize:10, color:ink4, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:8,
          fontFamily:"'Manrope',system-ui,sans-serif" }}>
          {info ? (lang==='EN' ? info.labelEn : info.labelFr) : paramKey}
        </div>
        <div style={{ fontSize:'2rem', fontWeight:800, lineHeight:1, fontFamily:"'JetBrains Mono',monospace",
          color: hasVal ? cardColor : ink4 }}>
          {hasVal ? value : '—'}
        </div>
        {hasVal && info && <div style={{ fontSize:11, color:ink4, marginTop:4 }}>{info.unit}</div>}
        {opt && (
          <div style={{ marginTop:10, fontSize:10, fontFamily:"'JetBrains Mono',monospace",
            color: (status==='attention'||status==='alerte') ? cardColor : ink4 }}>
            Opt. {opt.min}–{opt.max} {info?.unit||''}
          </div>
        )}
      </div>

      {/* Tooltip hover */}
      {hovered && info && (
        <div style={{
          position:'absolute', bottom:'calc(100% + 10px)', left:'50%', transform:'translateX(-50%)', width:290,
          background: isDark ? 'rgba(7,17,31,0.97)' : 'rgba(255,255,255,0.98)',
          border:'1px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
          borderRadius:16, padding:16, zIndex:200, boxShadow:'0 20px 60px rgba(0,0,0,0.35)', backdropFilter:'blur(20px)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <span style={{ width:28, height:28, borderRadius:8, background:cardColor+'15', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {Icon && <Icon size={15} color={cardColor} />}
            </span>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:cardColor }}>{lang==='EN' ? info.labelEn : info.labelFr}</div>
              <div style={{ fontSize:10, color:ink4, fontFamily:'monospace' }}>
                {(lang==='EN' ? meta.nomEN : meta.nomFR).split('&')[0].trim()}
              </div>
            </div>
            <span style={{ marginLeft:'auto', fontSize:10, fontWeight:600, color:cardColor }}>
              {status==='ok'?t.stOk:status==='attention'?t.stAtt:status==='alerte'?t.stAl:t.stNa}
            </span>
          </div>
          {hasVal && (
            <div style={{ background:cardColor+'12', border:'1px solid ' + cardColor+'25', borderRadius:10, padding:'8px 12px', marginBottom:10,
              display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:11, color:ink4 }}>{t.actuelle}</span>
              <span style={{ fontSize:18, fontWeight:800, color:cardColor, fontFamily:'monospace' }}>
                {value} <span style={{ fontSize:12 }}>{info.unit}</span>
              </span>
            </div>
          )}
          {opt && (
            <div style={{ marginBottom:6 }}>
              <div style={{ height:6, background:isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.06)', borderRadius:3, position:'relative' }}>
                <div style={{ position:'absolute', top:0, height:'100%', borderRadius:3,
                  left:pos(opt.min)+'%', width:(pos(opt.max)-pos(opt.min))+'%', background:cardColor+'60' }} />
                {hasVal && (
                  <div style={{ position:'absolute', top:'50%', transform:'translate(-50%,-50%)', left:pos(value)+'%',
                    width:10, height:10, borderRadius:'50%', background:cardColor, boxShadow:'0 0 6px ' + cardColor, border:'2px solid white' }} />
                )}
              </div>
              <div style={{ fontSize:10, color:ink4, fontFamily:'monospace', marginTop:5 }}>
                {t.optimal} : {opt.min}–{opt.max} {info.unit}
              </div>
            </div>
          )}
          {desc && <div style={{ fontSize:12, color:isDark?'#CBD5E1':'#475569', lineHeight:1.65, marginTop:8 }}>{desc}</div>}
          <div style={{ position:'absolute', bottom:-6, left:'50%', width:12, height:12,
            background:isDark?'rgba(7,17,31,0.97)':'rgba(255,255,255,0.98)',
            borderRight:'1px solid ' + (isDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'),
            borderBottom:'1px solid ' + (isDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'),
            transform:'translateX(-50%) rotate(45deg)' }} />
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   SCHÉMA SVG CRÉATIF — différent par type de serre
   S01 Génétique : ADN/microscope + plantes simples
   S02 Horticulture : fleurs colorées (roses, tournesols)
   S03 Agronomie : blé / céréales
   S04 Hydroponie : systèmes de tubes + racines suspendues
   S05 Protection : plantes + bouclier / pulvérisateur
════════════════════════════════════════════════════════════════ */
function SerreScene({ serreIdx, isDark, color, meteo, env }) {
  const cVerre  = isDark ? '#5b86ad' : '#94a3b8'
  const cVerreF = isDark ? 'rgba(127,182,232,0.08)' : 'rgba(148,197,232,0.14)'
  const cSkyTop = isDark ? '#0d1f35' : '#dbeafe'
  const cSkyBot = isDark ? '#0a1626' : '#eff6ff'
  const cGround = isDark ? '#1e3a2f' : '#d1fae5'
  const temp    = env?.temperature

  // Heure solaire
  const now = new Date(); const hNow = now.getHours() + now.getMinutes() / 60
  const lever = 6.5, coucher = 19.5
  const jour  = hNow >= lever && hNow <= coucher
  const tSol  = Math.max(0, Math.min(1, (hNow - lever) / (coucher - lever)))
  const sunX  = 60 + tSol * 360
  const sunY  = 160 - Math.sin(tSol * Math.PI) * 120
  const skyAlpha = isDark ? 0 : (jour ? 0.6 : 0)

  return (
    <svg viewBox="0 0 480 300" style={{ width:'100%', height:'auto', display:'block' }}>
      <defs>
        <linearGradient id="sc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cSkyTop} />
          <stop offset="100%" stopColor={cSkyBot} />
        </linearGradient>
        <radialGradient id="sc-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff3c4" />
          <stop offset="100%" stopColor={jour ? '#f5a524' : '#94a3b8'} />
        </radialGradient>
        <linearGradient id="sc-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isDark ? '#163326' : '#bbf7d0'} />
          <stop offset="100%" stopColor={isDark ? '#0d2019' : '#86efac'} />
        </linearGradient>
      </defs>

      {/* Ciel */}
      <rect x="0" y="0" width="480" height="200" fill="url(#sc-sky)" />

      {/* Soleil / Lune */}
      {jour ? (
        <g>
          {[...Array(8)].map((_, i) => {
            const a = (i/8)*Math.PI*2, r1=16, r2=24
            return <line key={i} x1={sunX+Math.cos(a)*r1} y1={sunY+Math.sin(a)*r1}
              x2={sunX+Math.cos(a)*r2} y2={sunY+Math.sin(a)*r2}
              stroke="#f5a524" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          })}
          <circle cx={sunX} cy={sunY} r="14" fill="url(#sc-sun)" />
        </g>
      ) : (
        <g>
          <circle cx={sunX} cy={sunY} r="12" fill="#e2e8f0" opacity="0.8" />
          <circle cx={sunX+5} cy={sunY-4} r="9" fill={cSkyTop} />
        </g>
      )}

      {/* Sol */}
      <rect x="0" y="200" width="480" height="100" fill="url(#sc-ground)" />
      <rect x="0" y="200" width="480" height="6" rx="0" fill={isDark ? '#22C55E20' : '#4ade8040'} />

      {/* Structure serre */}
      <polygon points="100,290 100,195 240,140 380,195 380,290" fill={cVerreF} stroke={cVerre} strokeWidth="2" strokeLinejoin="round" />
      <line x1="100" y1="195" x2="100" y2="290" stroke={cVerre} strokeWidth="2.5" />
      <line x1="380" y1="195" x2="380" y2="290" stroke={cVerre} strokeWidth="2.5" />
      {/* Vitres */}
      <line x1="170" y1="166" x2="170" y2="290" stroke={cVerre} strokeWidth="1" opacity="0.5" />
      <line x1="240" y1="140" x2="240" y2="290" stroke={cVerre} strokeWidth="1" opacity="0.5" />
      <line x1="310" y1="166" x2="310" y2="290" stroke={cVerre} strokeWidth="1" opacity="0.5" />

      {/* Contenu selon le type de serre */}
      {serreIdx === 0 && <PlantesGenetique isDark={isDark} color={color} />}
      {serreIdx === 1 && <FleurHorticulture isDark={isDark} color={color} />}
      {serreIdx === 2 && <BleAgronomie isDark={isDark} color={color} />}
      {serreIdx === 3 && <HydroponieScene isDark={isDark} color={color} />}
      {serreIdx === 4 && <PlantesProtection isDark={isDark} color={color} />}

      {/* Indicateur température en overlay */}
      {temp != null && (
        <g>
          <rect x="16" y="220" width="72" height="32" rx="8"
            fill={isDark ? 'rgba(7,17,31,0.88)' : 'rgba(255,255,255,0.92)'} stroke={color + '40'} strokeWidth="1" />
          <text x="52" y="233" textAnchor="middle" fontFamily="monospace" fontSize="9" fill={isDark?'#94A3B8':'#64748B'}>T° INT.</text>
          <text x="52" y="246" textAnchor="middle" fontFamily="monospace" fontSize="12" fontWeight="700"
            fill={temp > 30 ? '#EF4444' : temp < 16 ? '#06B6D4' : color}>{temp}°C</text>
        </g>
      )}
    </svg>
  )
}

/* S01 — Génétique : petites plantes de recherche en godets, look laboratoire */
function PlantesGenetique({ isDark, color }) {
  const pots = [140, 190, 240, 290, 340]
  return (
    <g>
      {/* Étagère */}
      <rect x="120" y="255" width="240" height="5" rx="2" fill={isDark?'#2d4a5e':'#94a3b8'} />
      {pots.map((x, i) => (
        <g key={i} transform={'translate(' + x + ',260)'}>
          {/* Pot */}
          <path d="M-12,0 L-10,18 L10,18 L12,0 Z" fill={isDark?'#1e3a5f':'#bfdbfe'} stroke={isDark?'#3b5a7a':'#93c5fd'} strokeWidth="1" />
          {/* Plante simple — tige + 2 feuilles */}
          <line x1="0" y1="0" x2="0" y2={-22-i*3} stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <ellipse cx="-6" cy={-14-i*2} rx="5" ry="3" fill={color} opacity="0.85" transform={'rotate(-30,' + (-6) + ',' + (-14-i*2) + ')'} />
          <ellipse cx="6" cy={-18-i*2} rx="5" ry="3" fill={color} opacity="0.7" transform={'rotate(30,6,' + (-18-i*2) + ')'} />
          {/* Microscope stylisé sur le 3e godet */}
          {i === 2 && (
            <g transform="translate(20,-10)">
              <line x1="0" y1="0" x2="0" y2="-14" stroke={isDark?'#94a3b8':'#64748b'} strokeWidth="2" />
              <circle cx="0" cy="-16" r="4" fill="none" stroke={isDark?'#94a3b8':'#64748b'} strokeWidth="1.5" />
              <line x1="-6" y1="0" x2="6" y2="0" stroke={isDark?'#94a3b8':'#64748b'} strokeWidth="2" />
            </g>
          )}
        </g>
      ))}
      {/* Étiquettes */}
      {pots.map((x, i) => (
        <text key={i} x={x} y="285" textAnchor="middle" fontFamily="monospace" fontSize="7"
          fill={isDark?'#475569':'#94a3b8'}>G{i+1}</text>
      ))}
    </g>
  )
}

/* S02 — Horticulture : fleurs colorées variées (roses + tournesols) */
function FleurHorticulture({ isDark, color }) {
  const flowers = [
    { x:140, type:'rose',       h:55, c:'#f43f5e' },
    { x:180, type:'tulipe',     h:48, c:'#fb923c' },
    { x:220, type:'tournesol',  h:65, c:'#facc15' },
    { x:260, type:'lavande',    h:50, c:'#a78bfa' },
    { x:300, type:'rose',       h:52, c:'#ec4899' },
    { x:340, type:'tulipe',     h:44, c:'#f97316' },
  ]
  return (
    <g>
      {/* Sol / terre */}
      <rect x="110" y="272" width="260" height="18" rx="6" fill={isDark?'#1a2e1a':'#bbf7d0'} opacity="0.8" />
      {flowers.map((f, i) => (
        <g key={i}>
          {/* Tige */}
          <line x1={f.x} y1="272" x2={f.x} y2={272-f.h} stroke={isDark?'#22c55e':'#16a34a'} strokeWidth="2" strokeLinecap="round" />
          {/* Feuille */}
          <ellipse cx={f.x-8} cy={272-f.h*0.4} rx="8" ry="4" fill={isDark?'#22c55e':'#4ade80'} opacity="0.7"
            transform={'rotate(-35,' + (f.x-8) + ',' + (272-f.h*0.4) + ')'} />

          {f.type === 'tournesol' ? (
            // Tournesol : pétales + centre
            <g transform={'translate(' + f.x + ',' + (272-f.h) + ')'}>
              {[...Array(10)].map((_, j) => {
                const a = (j/10)*Math.PI*2
                return <ellipse key={j} cx={Math.cos(a)*11} cy={Math.sin(a)*11} rx="5" ry="3"
                  fill={f.c} opacity="0.9" transform={'rotate(' + (j/10*360) + ',' + Math.cos(a)*11 + ',' + Math.sin(a)*11 + ')'} />
              })}
              <circle cx="0" cy="0" r="7" fill={isDark?'#78350f':'#92400e'} />
            </g>
          ) : f.type === 'rose' ? (
            // Rose : spirale de pétales
            <g transform={'translate(' + f.x + ',' + (272-f.h) + ')'}>
              {[...Array(6)].map((_, j) => {
                const a = (j/6)*Math.PI*2
                return <ellipse key={j} cx={Math.cos(a)*7} cy={Math.sin(a)*7} rx="7" ry="5"
                  fill={f.c} opacity={0.7+j*0.05} />
              })}
              <circle cx="0" cy="0" r="4" fill={f.c} />
            </g>
          ) : f.type === 'lavande' ? (
            // Lavande : petites tiges florales
            <g transform={'translate(' + f.x + ',' + (272-f.h) + ')'}>
              {[-4, 0, 4].map((dx, j) => (
                <g key={j}>
                  <line x1={dx} y1="0" x2={dx} y2="-14" stroke={f.c} strokeWidth="2" />
                  {[...Array(4)].map((_, k) => (
                    <ellipse key={k} cx={dx} cy={-3-k*3} rx="3" ry="2" fill={f.c} opacity="0.8" />
                  ))}
                </g>
              ))}
            </g>
          ) : (
            // Tulipe
            <g transform={'translate(' + f.x + ',' + (272-f.h) + ')'}>
              <path d={'M0,0 q-10,-8 -6,-18 q6,4 6,8 q0,-4 6,-8 q4,10 -6,18'} fill={f.c} opacity="0.9" />
            </g>
          )}
        </g>
      ))}
      {/* Arrosoir stylisé */}
      <g transform="translate(390,245)">
        <rect x="-18" y="-10" width="28" height="18" rx="5" fill={isDark?'#164e63':'#0ea5e9'} opacity="0.8" />
        <path d="M-18,-2 q-12,-8 -22,-2" fill="none" stroke={isDark?'#0ea5e9':'#38bdf8'} strokeWidth="2" />
        <line x1="-22" y1="0" x2="-26" y2="8" stroke={isDark?'#7dd3fc':'#0ea5e9'} strokeWidth="1.5" opacity="0.7" />
        <line x1="-24" y1="-1" x2="-29" y2="7" stroke={isDark?'#7dd3fc':'#0ea5e9'} strokeWidth="1.5" opacity="0.7" />
      </g>
    </g>
  )
}

/* S03 — Agronomie : blé et céréales en rangs */
function BleAgronomie({ isDark, color }) {
  const cols = [130,160,190,220,250,280,310,340,370]
  return (
    <g>
      {/* Sol labouré */}
      {[130,170,210,250,290,330].map((x, i) => (
        <ellipse key={i} cx={x} cy="282" rx="20" ry="4" fill={isDark?'#1a1206':'#92400e'} opacity="0.5" />
      ))}
      {cols.map((x, i) => {
        const h = 44 + (i%3)*8
        return (
          <g key={i} transform={'translate(' + x + ',278)'}>
            {/* Tige principale */}
            <line x1="0" y1="0" x2="0" y2={-h} stroke={color} strokeWidth="1.8" />
            {/* Feuilles latérales */}
            <path d={'M0,' + (-h*0.4) + ' q-10,-4 -8,-12'} fill="none" stroke={color} strokeWidth="1.5" opacity="0.7" />
            <path d={'M0,' + (-h*0.6) + ' q10,-4 8,-12'} fill="none" stroke={color} strokeWidth="1.5" opacity="0.7" />
            {/* Épi de blé */}
            <g transform={'translate(0,' + (-h) + ')'}>
              {[-3,-1,1,3].map((dx, j) => (
                <ellipse key={j} cx={dx} cy={-j*5} rx="3" ry="2.5" fill={color} opacity="0.9" />
              ))}
              <line x1="0" y1="-20" x2="0" y2="-28" stroke={color} strokeWidth="1" />
            </g>
          </g>
        )
      })}
    </g>
  )
}

/* S04 — Hydroponie : tubes horizontaux + racines suspendues + bulles */
function HydroponieScene({ isDark, color }) {
  const tubes = [195, 225, 255]
  return (
    <g>
      {/* Cadre structure */}
      <rect x="115" y="195" width="250" height="8" rx="3" fill={isDark?'#1e3a5f':'#bfdbfe'} />
      <rect x="115" y="285" width="250" height="8" rx="3" fill={isDark?'#1e3a5f':'#bfdbfe'} />
      {/* Colonnes verticales */}
      {[115,240,365].map((x,i) => (
        <rect key={i} x={x} y="195" width="5" height="98" rx="2" fill={isDark?'#1e3a5f':'#bfdbfe'} />
      ))}

      {tubes.map((y, ti) => (
        <g key={ti}>
          {/* Tube horizontal */}
          <rect x="120" y={y} width="240" height="14" rx="7"
            fill={isDark?'rgba(6,182,212,0.2)':'rgba(6,182,212,0.12)'}
            stroke={isDark?'#0891b2':'#06b6d4'} strokeWidth="1.5" />
          {/* Eau en mouvement (ligne) */}
          <line x1="130" y1={y+7} x2="350" y2={y+7} stroke={isDark?'#22d3ee':'#67e8f9'} strokeWidth="1" opacity="0.6"
            strokeDasharray="8 6" />
          {/* Plantes dans les trous */}
          {[150, 200, 250, 300, 340].map((x, i) => (
            <g key={i} transform={'translate(' + x + ',' + y + ')'}>
              {/* Collerette mousse */}
              <circle cx="0" cy="0" r="7" fill={isDark?'#134e2e':'#bbf7d0'} stroke={color+'40'} strokeWidth="1" />
              {/* Tige */}
              <line x1="0" y1="-2" x2="0" y2="-18" stroke={color} strokeWidth="1.8" />
              {/* Feuilles */}
              <ellipse cx="-5" cy="-12" rx="5" ry="3" fill={color} opacity="0.85" transform={'rotate(-30,-5,-12)'} />
              <ellipse cx="5" cy="-15" rx="5" ry="3" fill={color} opacity="0.7" transform={'rotate(30,5,-15)'} />
              {/* Racines suspendues */}
              {[-4,-1,2,5].map((dx, ri) => (
                <path key={ri} d={'M' + dx + ',8 q' + (dx*0.5) + ',10 0,18'} fill="none"
                  stroke={isDark?'#a3e635':'#84cc16'} strokeWidth="1" opacity="0.7" />
              ))}
            </g>
          ))}
        </g>
      ))}
      {/* Bulles */}
      {[140,175,215,260,305,345].map((x,i) => (
        <circle key={i} cx={x} cy={260-i*5} r={2+i%2} fill="none"
          stroke={isDark?'#22d3ee':'#06b6d4'} strokeWidth="1" opacity="0.5" />
      ))}
      {/* Réservoir */}
      <rect x="410" y="220" width="30" height="60" rx="6" fill={isDark?'rgba(6,182,212,0.15)':'rgba(6,182,212,0.1)'}
        stroke={isDark?'#0891b2':'#06b6d4'} strokeWidth="1.5" />
      <rect x="410" y="260" width="30" height="20" rx="4" fill={isDark?'rgba(6,182,212,0.25)':'rgba(6,182,212,0.2)'} />
      <text x="425" y="215" textAnchor="middle" fontSize="8" fill={isDark?'#67e8f9':'#0891b2'} fontFamily="monospace">EC</text>
    </g>
  )
}

/* S05 — Protection : plantes + bouclier + pulvérisateur */
function PlantesProtection({ isDark, color }) {
  const plants = [145, 195, 245, 295, 345]
  return (
    <g>
      {/* Bande de sol */}
      <rect x="110" y="270" width="260" height="20" rx="6" fill={isDark?'#1a1a1a':'#e2e8f0'} opacity="0.5" />
      {plants.map((x, i) => {
        const h = 42 + (i%3)*10
        const healthy = i !== 2  // 3e plante légèrement affectée pour montrer la protection
        return (
          <g key={i} transform={'translate(' + x + ',270)'}>
            <line x1="0" y1="0" x2="0" y2={-h} stroke={healthy ? color : '#F59E0B'} strokeWidth="2" />
            <ellipse cx="-7" cy={-h*0.5} rx="7" ry="4" fill={healthy ? color : '#F59E0B'} opacity="0.8"
              transform={'rotate(-35,-7,' + (-h*0.5) + ')'} />
            <ellipse cx="7" cy={-h*0.65} rx="7" ry="4" fill={healthy ? color : '#F59E0B'} opacity="0.7"
              transform={'rotate(35,7,' + (-h*0.65) + ')'} />
            {/* Feuille principale */}
            <ellipse cx="0" cy={-h} rx="8" ry="5" fill={healthy ? color : '#F59E0B'} opacity="0.9" />
            {/* Bouclier sur les plantes saines */}
            {healthy && (
              <g transform={'translate(0,' + (-h-14) + ')'}>
                <path d="M0,-8 L-8,0 L-8,8 L0,12 L8,8 L8,0 Z"
                  fill={color+'20'} stroke={color} strokeWidth="1.2" opacity="0.6" />
                <text x="0" y="5" textAnchor="middle" fontSize="7" fill={color}>✓</text>
              </g>
            )}
          </g>
        )
      })}
      {/* Pulvérisateur */}
      <g transform="translate(385,235)">
        <rect x="-12" y="-20" width="24" height="32" rx="5" fill={isDark?'#1e3a5f':'#bfdbfe'}
          stroke={isDark?'#3b82f6':'#60a5fa'} strokeWidth="1.5" />
        {/* Buse */}
        <line x1="-12" y1="-5" x2="-26" y2="-5" stroke={isDark?'#60a5fa':'#3b82f6'} strokeWidth="2" />
        <path d="-26,-5" d="M-26,-5 L-32,-10 M-26,-5 L-32,-5 M-26,-5 L-32,0"
          fill="none" stroke={isDark?'#93c5fd':'#60a5fa'} strokeWidth="1.2" opacity="0.7" />
        {/* Gouttes pulvérisées */}
        {[[-34,-12],[-36,-6],[-34,0],[-38,-9],[-32,3]].map(([gx,gy],i) => (
          <circle key={i} cx={gx} cy={gy} r="2" fill={isDark?'#93c5fd':'#3b82f6'} opacity="0.6" />
        ))}
        <text x="0" y="20" textAnchor="middle" fontSize="7" fill={isDark?'#60a5fa':'#3b82f6'} fontFamily="monospace">PPM</text>
      </g>
    </g>
  )
}
