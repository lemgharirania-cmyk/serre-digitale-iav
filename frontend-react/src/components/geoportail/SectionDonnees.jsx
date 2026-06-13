// src/components/geoportail/SectionDonnees.jsx
import { useState } from 'react'
import { Info, ChevronLeft, ChevronRight, RefreshCw, Thermometer, Droplets, Wind, Leaf, FlaskConical, Zap, Waves, BarChart2, CheckCircle, AlertTriangle } from 'lucide-react'

// ── Data ─────────────────────────────────────────────────────
const SERRES = [
  { code: 'S01', nameFr: 'Génétique & Amélioration des Plantes', nameEn: 'Plant Genetics & Improvement', color: '#22C55E' },
  { code: 'S02', nameFr: 'Horticulture',                         nameEn: 'Horticulture',                 color: '#06B6D4' },
  { code: 'S03', nameFr: 'Agronomie',                            nameEn: 'Agronomy',                    color: '#F59E0B' },
  { code: 'S04', nameFr: 'Hydroponie & Systèmes Innovants',      nameEn: 'Hydroponics & Innovative Sys.',color: '#8B5CF6' },
  { code: 'S05', nameFr: 'Protection des Plantes',               nameEn: 'Plant Protection',             color: '#EF4444' },
]

const PARAM_ICONS = {
  temperature: Thermometer, humidite: Droplets, vpd: Wind, co2: Leaf,
  ph: FlaskConical, ec: Zap, temp_eau: Waves, niveau_eau: BarChart2,
}

export const POPUP_INFO = {
  temperature: {
    labelFr: 'Température', labelEn: 'Temperature', unit: '°C',
    optimal: { min: 20, max: 25 },
    descFr: 'Paramètre climatique fondamental. Une température optimale favorise la photosynthèse et limite le stress hydrique.',
    descEn: 'Fundamental climate parameter. Optimal temperature promotes photosynthesis and limits water stress.',
    rangeFr: 'Optimal pour la majorité des cultures : 20–25 °C', rangeEn: 'Optimal for most crops: 20–25 °C',
  },
  humidite: {
    labelFr: 'Humidité relative', labelEn: 'Relative humidity', unit: '%',
    optimal: { min: 60, max: 80 },
    descFr: 'L\'humidité relative contrôle la transpiration des plantes et le risque de maladies fongiques.',
    descEn: 'Relative humidity controls plant transpiration and the risk of fungal diseases.',
    rangeFr: 'Zone optimale : 60–80 %', rangeEn: 'Optimal range: 60–80 %',
  },
  vpd: {
    labelFr: 'Déficit de pression de vapeur', labelEn: 'Vapor pressure deficit', unit: 'kPa',
    optimal: { min: 0.8, max: 1.5 },
    descFr: 'Le VPD mesure la force motrice de la transpiration. Un VPD bien maîtrisé optimise l\'absorption d\'eau et de nutriments.',
    descEn: 'VPD measures the driving force of transpiration. Well-controlled VPD optimizes water and nutrient uptake.',
    rangeFr: 'Zone optimale : 0.8–1.5 kPa', rangeEn: 'Optimal range: 0.8–1.5 kPa',
  },
  co2: {
    labelFr: 'CO₂', labelEn: 'CO₂', unit: 'ppm',
    optimal: { min: 500, max: 1000 },
    descFr: 'Le CO₂ est le substrat de la photosynthèse. Une concentration élevée améliore significativement la productivité.',
    descEn: 'CO₂ is the substrate of photosynthesis. A high concentration significantly improves productivity.',
    rangeFr: 'Atmosphère ambiante ~420 ppm · Enrichissement possible jusqu\'à 1500 ppm', rangeEn: 'Ambient atmosphere ~420 ppm · Enrichment possible up to 1500 ppm',
  },
  ph: {
    labelFr: 'pH de la solution', labelEn: 'Solution pH', unit: '',
    optimal: { min: 5.5, max: 7.0 },
    descFr: 'Le pH contrôle la disponibilité des éléments minéraux en solution nutritive. Un pH hors gamme bloque l\'absorption des nutriments.',
    descEn: 'pH controls the availability of mineral elements in nutrient solution. Out-of-range pH blocks nutrient uptake.',
    rangeFr: 'Optimal hydroponique : 5.5–6.5', rangeEn: 'Hydroponic optimal: 5.5–6.5',
  },
  ec: {
    labelFr: 'Conductivité électrique', labelEn: 'Electrical conductivity', unit: 'mS/cm',
    optimal: { min: 1.5, max: 3.5 },
    descFr: 'L\'EC reflète la concentration totale en sels minéraux de la solution de fertigation.',
    descEn: 'EC reflects the total mineral salt concentration of the fertigation solution.',
    rangeFr: 'Optimal : 1.5–3.5 mS/cm selon la culture', rangeEn: 'Optimal: 1.5–3.5 mS/cm depending on crop',
  },
  temp_eau: {
    labelFr: 'Température de l\'eau', labelEn: 'Water temperature', unit: '°C',
    optimal: { min: 18, max: 22 },
    descFr: 'La température de l\'eau d\'irrigation influence l\'activité racinaire et l\'absorption des nutriments.',
    descEn: 'Irrigation water temperature influences root activity and nutrient uptake.',
    rangeFr: 'Zone optimale : 18–22 °C', rangeEn: 'Optimal range: 18–22 °C',
  },
  niveau_eau: {
    labelFr: 'Niveau d\'eau', labelEn: 'Water level', unit: 'm',
    optimal: { min: 0.6, max: 1.0 },
    descFr: 'Le niveau d\'eau dans les réservoirs de fertigation assure la continuité de l\'irrigation.',
    descEn: 'Water level in fertigation tanks ensures irrigation continuity.',
    rangeFr: 'Niveau minimal recommandé : 0.6 m', rangeEn: 'Recommended minimum level: 0.6 m',
  },
}

// ── Sub-components ────────────────────────────────────────────
function StatusIcon({ status, color }) {
  if (status === 'ok')      return <CheckCircle  size={13} color={color} />
  if (status === 'warning') return <AlertTriangle size={13} color="#F59E0B" />
  return null
}

function SensorCard({ paramKey, value, serreCode, lang, darkMode }) {
  const [showPopup, setShowPopup] = useState(false)
  const info     = POPUP_INFO[paramKey]
  const hasVal   = value != null && value !== undefined
  const cardColor = (() => {
    const colors = { temperature:'#F59E0B', humidite:'#06B6D4', vpd:'#8B5CF6', co2:'#22C55E', ph:'#0891b2', ec:'#059669', temp_eau:'#F59E0B', niveau_eau:'#3773bd' }
    return colors[paramKey] || '#22C55E'
  })()
  const status = (() => {
    if (!hasVal) return 'unknown'
    const n = Number(value)
    return (n >= info.optimal.min && n <= info.optimal.max) ? 'ok' : 'warning'
  })()

  const cardBg      = darkMode ? 'rgba(16,27,46,0.85)' : '#FFFFFF'
  const cardBorder  = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setShowPopup(true)}
      onMouseLeave={() => setShowPopup(false)}
    >
      <div style={{
        background: cardBg, border: `1px solid ${status === 'warning' ? 'rgba(245,158,11,0.3)' : cardBorder}`,
        borderRadius: '16px', padding: '1.2rem 1rem',
        cursor: 'default', transition: 'border-color 0.2s',
        boxShadow: showPopup ? `0 8px 32px rgba(0,0,0,0.2)` : 'none',
      }}>
        {/* Icon */}
        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: `${cardColor}15`, border: `1px solid ${cardColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
          {(() => { const IconCmp = PARAM_ICONS[paramKey]; return IconCmp ? <IconCmp size={16} color={cardColor} /> : null })()}
        </div>

        {/* Label */}
        <div style={{ fontSize: '10px', color: darkMode ? '#64748B' : '#94A3B8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
          {lang === 'fr' ? info.labelFr : info.labelEn}
        </div>

        {/* Value */}
        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: hasVal ? cardColor : (darkMode ? '#64748B' : '#94A3B8'), fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>
          {hasVal ? value : '—'}
        </div>
        {hasVal && <div style={{ fontSize: '11px', color: darkMode ? '#64748B' : '#94A3B8', marginTop: '4px' }}>{info.unit}</div>}

        {/* Optimal */}
        <div style={{ marginTop: '8px', fontSize: '10px', color: status === 'warning' ? '#F59E0B' : (darkMode ? '#475569' : '#CBD5E1'), fontFamily: 'monospace' }}>
          {lang === 'fr' ? 'Opt.' : 'Opt.'} {info.optimal.min}–{info.optimal.max} {info.unit}
        </div>
      </div>

      {/* Popup */}
      {showPopup && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)',
          width: '280px', background: darkMode ? 'rgba(7,17,31,0.97)' : 'rgba(255,255,255,0.98)',
          border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          borderRadius: '16px', padding: '16px', zIndex: 200,
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)', backdropFilter: 'blur(20px)',
          animation: 'popupIn 0.2s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:8, background:`${cardColor}15` }}>
              {(() => { const IconCmp = PARAM_ICONS[paramKey]; return IconCmp ? <IconCmp size={15} color={cardColor} strokeWidth={1.8} /> : null })()}
            </span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: cardColor }}>{lang === 'fr' ? info.labelFr : info.labelEn}</div>
              <div style={{ fontSize: '10px', color: darkMode ? '#475569' : '#94A3B8', fontFamily: 'monospace' }}>
                {SERRES.find(s => s.code === serreCode)?.[lang === 'fr' ? 'nameFr' : 'nameEn']?.split('&')[0].trim()}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <StatusIcon status={status} color={cardColor} />
              <span style={{ fontSize: '10px', color: status === 'ok' ? cardColor : '#F59E0B', fontWeight: 600 }}>
                {status === 'ok' ? (lang === 'fr' ? 'Optimal' : 'Optimal') : (lang === 'fr' ? 'Attention' : 'Warning')}
              </span>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: darkMode ? '#CBD5E1' : '#475569', lineHeight: 1.65 }}>
            {lang === 'fr' ? info.descFr : info.descEn}
          </div>
          <div style={{ position: 'absolute', bottom: '-6px', left: '50%', width: 12, height: 12, background: darkMode ? 'rgba(7,17,31,0.97)' : 'rgba(255,255,255,0.98)', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderTop: 'none', borderLeft: 'none', transform: 'translateX(-50%) rotate(45deg)' }} />
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
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
    title:  lang === 'fr' ? 'Monitoring des Capteurs' : 'Sensor Monitoring',
    badge:  lang === 'fr' ? 'IoT · Temps Réel'        : 'IoT · Real Time',
    live:   lang === 'fr' ? 'Données en temps réel'   : 'Real-time data',
    env:    lang === 'fr' ? 'Environnement'            : 'Environment',
    irr:    lang === 'fr' ? 'Irrigation'               : 'Irrigation',
    noIrr:  lang === 'fr' ? "Données d'irrigation non disponibles pour cette unité" : 'Irrigation data unavailable for this unit',
    hover:  lang === 'fr' ? 'Survolez une carte pour plus d\'informations' : 'Hover a card for more information',
  }

  return (
    <section id="donnees" style={{ padding: '5rem 3rem', scrollMarginTop: '64px' }}>
      {/* ── MOBILE STYLES injected inline ── */}
      <style>{`
        @media (max-width: 768px) {
          .donnees-title-block {
            padding: 0 0.25rem;
          }
          .donnees-badge {
            /* force flex to wrap tightly, prevent overflow */
            max-width: 100% !important;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .donnees-h2 {
            font-size: clamp(1.45rem, 6vw, 2rem) !important;
            word-break: break-word;
          }
          .donnees-hover-hint {
            display: none !important;
          }
          .donnees-tabs {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            gap: 4px !important;
            padding: 4px !important;
          }
          .donnees-tabs::-webkit-scrollbar { display: none; }
          .donnees-tab-btn {
            padding: 6px 10px !important;
            font-size: 11px !important;
            white-space: nowrap;
            flex-shrink: 0;
          }
          .donnees-refresh-bar {
            flex-wrap: wrap;
            gap: 8px;
            padding: 10px 14px !important;
          }
          .donnees-refresh-label {
            font-size: 12px !important;
          }
        }
        @keyframes hdrPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
          50%       { opacity: 0.7; box-shadow: 0 0 0 4px rgba(34,197,94,0); }
        }
        @keyframes popupIn {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        {/* ── Title block — mobile-safe ── */}
        <div className="donnees-title-block" style={{ textAlign: 'center', marginBottom: '3rem' }}>

          {/* Badge — inline-block so it never stretches full width */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div
              className="donnees-badge"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: darkMode ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.06)',
                border: '1px solid rgba(34,197,94,0.2)', borderRadius: '100px',
                padding: '6px 18px',
              }}
            >
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E',
                animation: 'hdrPulse 2s ease-in-out infinite', display: 'inline-block', flexShrink: 0,
              }} />
              <span style={{
                fontSize: '11px', fontWeight: 700, color: '#22C55E',
                letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>
                {T.badge}
              </span>
            </div>
          </div>

          {/* Title */}
          <h2
            className="donnees-h2"
            style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
              fontWeight: 900, color: textColor,
              fontFamily: "'Outfit',sans-serif",
              letterSpacing: '-0.03em',
              margin: 0,
            }}
          >
            {T.title}
          </h2>

          {/* Hover hint — hidden on mobile (too small, irrelevant on touch) */}
          <p
            className="donnees-hover-hint"
            style={{
              fontSize: '13px', color: mutedColor, marginTop: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            <Info size={13} />
            {T.hover}
          </p>
        </div>

        {/* ── Serre selector — scrollable on mobile ── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <div
            className="donnees-tabs"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: cardBg, border: `1px solid ${cardBorder}`,
              borderRadius: '14px', padding: '6px',
              boxShadow: darkMode ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)',
              maxWidth: '100%',
            }}
          >
            <button
              onClick={() => setIdx(i => (i - 1 + 5) % 5)}
              style={{ width: '32px', height: '32px', borderRadius: '8px', background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', border: `1px solid ${cardBorder}`, color: mutedColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <ChevronLeft size={15} />
            </button>

            {SERRES.map((s, i) => (
              <button
                key={i}
                className="donnees-tab-btn"
                onClick={() => setIdx(i)}
                style={{
                  padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                  border: `1px solid ${idx === i ? s.color + '50' : 'transparent'}`,
                  background: idx === i ? `${s.color}15` : 'transparent',
                  color: idx === i ? s.color : mutedColor,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}
              >
                {lang === 'fr' ? s.nameFr.split('&')[0].trim() : s.nameEn.split('&')[0].trim()}
              </button>
            ))}

            <button
              onClick={() => setIdx(i => (i + 1) % 5)}
              style={{ width: '32px', height: '32px', borderRadius: '8px', background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', border: `1px solid ${cardBorder}`, color: mutedColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* ── Refresh bar ── */}
        <div
          className="donnees-refresh-bar"
          style={{
            display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem',
            background: cardBg, border: `1px solid ${cardBorder}`,
            borderRadius: '14px', padding: '12px 20px',
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E', animation: 'hdrPulse 2s ease-in-out infinite', display: 'inline-block', flexShrink: 0 }} />
          <span className="donnees-refresh-label" style={{ fontSize: '14px', color: mutedColor, flex: 1 }}>{T.live}</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#22C55E', fontFamily: "'Outfit',sans-serif" }}>{countdown}</span>
          <button
            onClick={onRefresh}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: darkMode ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.06)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)', padding: '7px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
          >
            <RefreshCw size={13} /> {lang === 'fr' ? 'Actualiser' : 'Refresh'}
          </button>
        </div>

        {/* ── Serre name bar ── */}
        <div style={{ textAlign: 'center', marginBottom: '2rem', padding: '14px 20px', background: `${meta.color}08`, border: `1px solid ${meta.color}20`, borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: meta.color, boxShadow: `0 0 10px ${meta.color}`, flexShrink: 0 }} />
            <span style={{ fontSize: '17px', fontWeight: 800, color: textColor, fontFamily: "'Outfit',sans-serif" }}>
              {lang === 'fr' ? meta.nameFr : meta.nameEn}
            </span>
            <span style={{ fontSize: '11px', color: meta.color, background: `${meta.color}15`, border: `1px solid ${meta.color}25`, padding: '3px 10px', borderRadius: '100px', fontWeight: 700 }}>
              {serre.statut === 'ok' ? (lang === 'fr' ? 'LIVE' : 'LIVE') : (lang === 'fr' ? 'Hors ligne' : 'Offline')}
            </span>
          </div>
        </div>

        {/* ── ENV cards ── */}
        <div style={{ marginBottom: '1rem', fontSize: '11px', fontWeight: 700, color: mutedColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {T.env}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '2rem' }}>
          {['temperature','humidite','vpd','co2'].map(key => (
            <SensorCard key={key} paramKey={key} value={env[key]} serreCode={meta.code} lang={lang} darkMode={darkMode} />
          ))}
        </div>

        {/* ── IRR cards ── */}
        <div style={{ marginBottom: '1rem', fontSize: '11px', fontWeight: 700, color: mutedColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {T.irr}
        </div>
        {irr && Object.keys(irr).length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {['ph','ec','temp_eau','niveau_eau'].map(key => (
              <SensorCard key={key} paramKey={key} value={irr[key]} serreCode={meta.code} lang={lang} darkMode={darkMode} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: mutedColor, fontSize: '13px', background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '16px' }}>
            {T.noIrr}
          </div>
        )}
      </div>
    </section>
  )
}
