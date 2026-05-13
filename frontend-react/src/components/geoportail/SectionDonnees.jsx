// src/components/geoportail/SectionDonnees.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw, HelpCircle } from 'lucide-react'
import { iotAPI } from '../../api/client'

const SERRES = [
  { code:'S01', color:'#22C55E', nameFr:'Génétique & Amélioration des Plantes', nameEn:'Plant Genetics & Improvement' },
  { code:'S02', color:'#06B6D4', nameFr:'Horticulture',                          nameEn:'Horticulture' },
  { code:'S03', color:'#F59E0B', nameFr:'Agronomie',                             nameEn:'Agronomy' },
  { code:'S04', color:'#8B5CF6', nameFr:'Hydroponie & Systèmes Innovants',       nameEn:'Hydroponics & Innovative Systems' },
  { code:'S05', color:'#EF4444', nameFr:'Protection des Plantes',                nameEn:'Plant Protection' },
]

const PARAMS = {
  env: [
    { key:'temperature', labelFr:'Température', labelEn:'Temperature', unit:'°C',    color:'#F59E0B', descFr:"La température de l'air influence directement la photosynthèse et la croissance. Optimale entre 18–28°C.", descEn:'Air temperature directly influences photosynthesis and growth. Optimal between 18–28°C.', min:10, max:40 },
    { key:'humidite',    labelFr:'Humidité',    labelEn:'Humidity',    unit:'%',     color:'#06B6D4', descFr:"L'humidité relative contrôle la transpiration. Trop élevée favorise les maladies fongiques.", descEn:'Relative humidity controls transpiration. Too high promotes fungal diseases.', min:30, max:100 },
    { key:'vpd',         labelFr:'VPD',         labelEn:'VPD',         unit:' kPa',  color:'#8B5CF6', descFr:"Le Déficit de Pression de Vapeur mesure la demande évaporative. Idéal entre 0.8–1.5 kPa.", descEn:'Vapour Pressure Deficit measures evaporative demand. Ideal between 0.8–1.5 kPa.', min:0, max:3 },
    { key:'co2',         labelFr:'CO₂',         labelEn:'CO₂',         unit:' ppm',  color:'#22C55E', descFr:"Le CO₂ est le substrat de la photosynthèse. Des taux élevés (800–1200 ppm) augmentent les rendements.", descEn:'CO₂ is the photosynthesis substrate. High levels (800–1200 ppm) increase yields.', min:300, max:1500 },
  ],
  irr: [
    { key:'ph',         labelFr:'pH',         labelEn:'pH',         unit:'',        color:'#06B6D4', descFr:"Le pH contrôle la disponibilité des nutriments. Optimum entre 5.5–7.0 selon les cultures.", descEn:'pH controls nutrient availability. Optimum between 5.5–7.0 depending on crops.', min:4, max:9 },
    { key:'ec',         labelFr:'EC',         labelEn:'EC',         unit:' mS/cm',  color:'#22C55E', descFr:"La Conductivité Électrique mesure la concentration en sels minéraux. Entre 1.5–3.5 mS/cm.", descEn:'Electrical Conductivity measures mineral salt concentration. Between 1.5–3.5 mS/cm.', min:0, max:5 },
    { key:'temp_eau',   labelFr:'T° Eau',     labelEn:'Water Temp', unit:'°C',      color:'#F59E0B', descFr:"La température de l'eau influence l'absorption racinaire. Idéalement entre 18–22°C.", descEn:'Water temperature influences root absorption. Ideally between 18–22°C.', min:5, max:35 },
    { key:'niveau_eau', labelFr:'Niveau Eau', labelEn:'Water Level',unit:' m',      color:'#8B5CF6', descFr:"Le niveau d'eau dans les réservoirs permet d'anticiper les besoins en réalimentation.", descEn:'Tank water level allows anticipating refill needs.', min:0, max:1 },
  ],
}

// ── Zoom levels for chart
const ZOOM_LEVELS = [
  { key:'7j',  labelFr:'7 jours',   labelEn:'7 days',   heures:168 },
  { key:'48h', labelFr:'48 heures', labelEn:'48 hours',  heures:48  },
  { key:'24h', labelFr:'24 heures', labelEn:'24 hours',  heures:24  },
  { key:'6h',  labelFr:'6 heures',  labelEn:'6 hours',   heures:6   },
]

function ParamCard({ param, value, lang, darkMode }) {
  const [showInfo, setShowInfo] = useState(false)
  const [hovered, setHovered] = useState(false)
  const hasVal = value != null

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowInfo(false) }}
      onClick={() => setShowInfo(s => !s)}
      style={{
        position: 'relative', borderRadius: '14px', padding: '16px 12px', textAlign: 'center',
        background: hovered ? `${param.color}15` : (darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
        border: `1px solid ${hovered ? param.color + '40' : (darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)')}`,
        cursor: 'pointer', transition: 'all 0.3s ease',
        boxShadow: hovered ? `0 8px 24px ${param.color}18` : 'none',
        animation: `paramFloat${Math.floor(Math.random() * 3) + 1} ${3 + Math.random() * 2}s ease-in-out infinite`,
      }}
    >
      <div style={{ fontSize: '11px', color: darkMode ? '#64748B' : '#94A3B8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
        {lang === 'fr' ? param.labelFr : param.labelEn}
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: hasVal ? param.color : (darkMode ? '#64748B' : '#94A3B8'), fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>
        {hasVal ? `${value}` : '—'}
      </div>
      {hasVal && <div style={{ fontSize: '11px', color: darkMode ? '#64748B' : '#94A3B8', marginTop: '4px' }}>{param.unit}</div>}

      {hovered && !showInfo && (
        <div style={{ position: 'absolute', top: '6px', right: '6px' }}>
          <HelpCircle size={14} color={param.color} />
        </div>
      )}

      {showInfo && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
          background: darkMode ? 'rgba(11,23,40,0.97)' : 'rgba(255,255,255,0.97)',
          border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          borderRadius: '12px', padding: '12px 14px', width: '230px', zIndex: 100,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)', textAlign: 'left',
        }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: param.color, marginBottom: '6px' }}>
            {lang === 'fr' ? param.labelFr : param.labelEn}
          </div>
          <div style={{ fontSize: '12px', color: darkMode ? '#CBD5E1' : '#475569', lineHeight: 1.7 }}>
            {lang === 'fr' ? param.descFr : param.descEn}
          </div>
        </div>
      )}
    </div>
  )
}

function ZoomableChart({ serreIdx, type, params, lang, darkMode }) {
  const [zoomIdx, setZoomIdx] = useState(2) // default 24h
  const [chartData, setChartData] = useState({})
  const [loading, setLoading] = useState(false)
  const svgRef = useRef(null)

  const zoom = ZOOM_LEVELS[zoomIdx]
  const serreId = serreIdx + 1

  useEffect(() => {
    setLoading(true)
    const keys = params.map(p => p.key)
    Promise.all(keys.map(k => iotAPI.getHistorique(serreId, k, zoom.heures).catch(() => ({ data: [] }))))
      .then(results => {
        const data = {}
        keys.forEach((k, i) => { data[k] = results[i].data || [] })
        setChartData(data)
        setLoading(false)
      })
  }, [serreIdx, zoomIdx, type])

  const W = 600, H = 100
  const lines = params.map(p => {
    const pts = chartData[p.key] || []
    if (pts.length < 2) return null
    const vals = pts.map(d => d.value)
    const mn = Math.min(...vals), mx = Math.max(...vals), rng = mx - mn || 1
    const points = pts.map((d, i) => `${(i / (pts.length - 1)) * W},${H - ((d.value - mn) / rng) * H * 0.8 - 8}`)
    return { key: p.key, color: p.color, points, count: pts.length, label: lang === 'fr' ? p.labelFr : p.labelEn }
  }).filter(Boolean)

  return (
    <div style={{ background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, borderRadius: '16px', padding: '1.5rem' }}>
      {/* Zoom controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ fontSize: '12px', color: darkMode ? '#64748B' : '#94A3B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {type === 'env' ? (lang === 'fr' ? 'Tendances environnementales' : 'Environmental trends') : (lang === 'fr' ? "Tendances d'irrigation" : 'Irrigation trends')}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {ZOOM_LEVELS.map((z, i) => (
            <button key={z.key} onClick={() => setZoomIdx(i)} style={{
              padding: '4px 10px', fontSize: '11px', fontWeight: 600, borderRadius: '8px',
              background: zoomIdx === i ? 'rgba(34,197,94,0.15)' : 'transparent',
              border: `1px solid ${zoomIdx === i ? 'rgba(34,197,94,0.35)' : (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
              color: zoomIdx === i ? '#22C55E' : (darkMode ? '#64748B' : '#94A3B8'),
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
            }}>{lang === 'fr' ? z.labelFr : z.labelEn}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: darkMode ? '#64748B' : '#94A3B8', fontSize: '13px' }}>
          {lang === 'fr' ? 'Chargement...' : 'Loading...'}
        </div>
      ) : lines.length > 0 ? (
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '80px' }}>
          {lines.map(l => (
            <polyline key={l.key} points={l.points.join(' ')} fill="none" stroke={l.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
          ))}
        </svg>
      ) : (
        <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: darkMode ? '#64748B' : '#94A3B8', fontSize: '13px' }}>
          {lang === 'fr' ? 'Aucune donnée disponible' : 'No data available'}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '10px' }}>
        {params.map(p => (
          <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '14px', height: '3px', borderRadius: '2px', background: p.color }} />
            <span style={{ fontSize: '11px', color: darkMode ? '#64748B' : '#94A3B8' }}>
              {lang === 'fr' ? p.labelFr : p.labelEn}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SectionDonnees({ lang, liveData, countdown, onRefresh, darkMode }) {
  const [idx, setIdx] = useState(0)
  const serre = liveData?.[idx] || {}
  const meta  = SERRES[idx]
  const env   = serre.env || {}
  const irr   = serre.irr || {}

  const cardBg     = darkMode ? 'rgba(16,27,46,0.8)' : '#FFFFFF'
  const cardBorder = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const textColor  = darkMode ? '#F8FAFC' : '#0F172A'
  const mutedColor = darkMode ? '#64748B' : '#94A3B8'

  const T = {
    title:   lang === 'fr' ? 'Monitoring des Capteurs' : 'Sensor Monitoring',
    badge:   lang === 'fr' ? 'IoT · Temps Réel'        : 'IoT · Real Time',
    live:    lang === 'fr' ? 'Données en temps réel'   : 'Real-time data',
    env:     lang === 'fr' ? 'Environnement'            : 'Environment',
    irr:     lang === 'fr' ? 'Irrigation'               : 'Irrigation',
    noIrr:   lang === 'fr' ? 'Données d\'irrigation non disponibles pour cette unité' : 'Irrigation data unavailable for this unit',
  }

  return (
    <section id="donnees" style={{ padding: '5rem 3rem', scrollMarginTop: '64px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: darkMode ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '100px', padding: '6px 18px', marginBottom: '1rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', animation: 'hdrPulse 2s ease-in-out infinite', display: 'inline-block' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#22C55E', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{T.badge}</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 900, color: textColor, fontFamily: "'Outfit',sans-serif", letterSpacing: '-0.03em' }}>{T.title}</h2>
        </div>

        {/* Serre selector — centered */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '14px', padding: '6px', boxShadow: darkMode ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)' }}>
            <button onClick={() => setIdx(i => (i - 1 + 5) % 5)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', border: `1px solid ${cardBorder}`, color: mutedColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={15} />
            </button>
            {SERRES.map((s, i) => (
              <button key={i} onClick={() => setIdx(i)} style={{
                padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                border: `1px solid ${idx === i ? s.color + '50' : 'transparent'}`,
                background: idx === i ? `${s.color}15` : 'transparent',
                color: idx === i ? s.color : mutedColor,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}>
                {lang === 'fr' ? s.nameFr.split('&')[0].trim() : s.nameEn.split('&')[0].trim()}
              </button>
            ))}
            <button onClick={() => setIdx(i => (i + 1) % 5)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', border: `1px solid ${cardBorder}`, color: mutedColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* Refresh + status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem', background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '14px', padding: '12px 20px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E', animation: 'hdrPulse 2s ease-in-out infinite', display: 'inline-block' }} />
          <span style={{ fontSize: '14px', color: mutedColor, flex: 1 }}>{T.live}</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#22C55E', fontFamily: "'Outfit',sans-serif" }}>{countdown}</span>
          <button onClick={onRefresh} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: darkMode ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.06)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)', padding: '7px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <RefreshCw size={13} /> {lang === 'fr' ? 'Actualiser' : 'Refresh'}
          </button>
        </div>

        {/* Serre name centered */}
        <div style={{ textAlign: 'center', marginBottom: '2rem', padding: '14px 20px', background: `${meta.color}08`, border: `1px solid ${meta.color}20`, borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: meta.color, boxShadow: `0 0 10px ${meta.color}` }} />
            <span style={{ fontSize: '17px', fontWeight: 800, color: textColor, fontFamily: "'Outfit',sans-serif" }}>
              {lang === 'fr' ? meta.nameFr : meta.nameEn}
            </span>
            <span style={{ fontSize: '11px', color: meta.color, background: `${meta.color}15`, border: `1px solid ${meta.color}25`, padding: '3px 10px', borderRadius: '100px', fontWeight: 700 }}>
              {serre.statut === 'ok' ? 'LIVE' : 'PARTIEL'}
            </span>
          </div>
        </div>

        {/* ENV section */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: mutedColor, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem', textAlign: 'center' }}>{T.env}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '1.5rem' }}>
            {PARAMS.env.map(p => (
              <ParamCard key={p.key} param={p} value={env[p.key]} lang={lang} darkMode={darkMode} />
            ))}
          </div>
          <ZoomableChart serreIdx={idx} type="env" params={PARAMS.env} lang={lang} darkMode={darkMode} />
        </div>

        {/* IRR section */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: mutedColor, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem', textAlign: 'center' }}>{T.irr}</div>
          {serre.irr ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '1.5rem' }}>
                {PARAMS.irr.map(p => (
                  <ParamCard key={p.key} param={p} value={irr[p.key]} lang={lang} darkMode={darkMode} />
                ))}
              </div>
              <ZoomableChart serreIdx={idx} type="irr" params={PARAMS.irr} lang={lang} darkMode={darkMode} />
            </>
          ) : (
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '14px', padding: '2rem', textAlign: 'center', color: mutedColor, fontSize: '14px' }}>{T.noIrr}</div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes paramFloat1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes paramFloat2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes paramFloat3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes hdrPulse    { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </section>
  )
}
