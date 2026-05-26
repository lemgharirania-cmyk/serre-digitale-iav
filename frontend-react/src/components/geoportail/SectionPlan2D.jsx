// src/components/geoportail/SectionPlan2D.jsx
import { useState } from 'react'

const SERRES = [
  {
    code: 'S01', color: '#22C55E',
    nameFr: 'Génétique & Amélioration', nameEn: 'Genetics & Improvement',
    roleFr: 'Sélection variétale, culture in vitro et amélioration génétique des espèces végétales.',
    roleEn: 'Varietal selection, in vitro culture and genetic improvement of plant species.',
    culturesFr: 'Tomate, Piment, Melon',
    culturesEn: 'Tomato, Pepper, Melon',
    capteursFr: '2 capteurs ENV · 2 capteurs IRR',
    capteursEn: '2 ENV sensors · 2 IRR sensors',
  },
  {
    code: 'S02', color: '#06B6D4',
    nameFr: 'Horticulture', nameEn: 'Horticulture',
    roleFr: 'Production florale, maraîchage sous abri et expérimentations horticoles.',
    roleEn: 'Flower production, greenhouse vegetables and horticultural experiments.',
    culturesFr: 'Roses, Laitue, Fraise',
    culturesEn: 'Roses, Lettuce, Strawberry',
    capteursFr: '2 capteurs ENV · 2 capteurs IRR',
    capteursEn: '2 ENV sensors · 2 IRR sensors',
  },
  {
    code: 'S03', color: '#F59E0B',
    nameFr: 'Agronomie', nameEn: 'Agronomy',
    roleFr: 'Essais culturaux, comparaisons variétales et recherche appliquée en agronomie.',
    roleEn: 'Crop trials, varietal comparisons and applied agronomy research.',
    culturesFr: 'Blé, Orge, Légumineuses',
    culturesEn: 'Wheat, Barley, Legumes',
    capteursFr: '2 capteurs ENV · 2 capteurs IRR',
    capteursEn: '2 ENV sensors · 2 IRR sensors',
  },
  {
    code: 'S04', color: '#8B5CF6',
    nameFr: 'Hydroponie', nameEn: 'Hydroponics',
    roleFr: 'Culture hors-sol en systèmes NFT, DWC et aéroponie pour production intensive.',
    roleEn: 'Soilless cultivation in NFT, DWC and aeroponic systems for intensive production.',
    culturesFr: 'Basilic, Tomate, Laitue, Fraise',
    culturesEn: 'Basil, Tomato, Lettuce, Strawberry',
    capteursFr: '2 capteurs ENV · 2 capteurs IRR',
    capteursEn: '2 ENV sensors · 2 IRR sensors',
  },
  {
    code: 'S05', color: '#EF4444',
    nameFr: 'Protection des Plantes', nameEn: 'Plant Protection',
    roleFr: 'Phytopathologie, entomologie et méthodes de lutte intégrée contre les ravageurs.',
    roleEn: 'Phytopathology, entomology and integrated pest management methods.',
    culturesFr: 'Plants test, Cultures témoin',
    culturesEn: 'Test plants, Control cultures',
    capteursFr: '2 capteurs ENV · 2 capteurs IRR',
    capteursEn: '2 ENV sensors · 2 IRR sensors',
  },
]

// Zones cliquables en % de la largeur/hauteur du conteneur SVG
// Le SVG original a un viewBox centré autour des serres (~620–1050 en x, ~163–510 en y)
// On mappe ces coordonnées en pourcentages relatifs au conteneur affiché
const ZONES = [
  { code: 'S01', left: '14%',  top: '2%',  width: '20%', height: '47%' },
  { code: 'S02', left: '34%',  top: '2%',  width: '20%', height: '47%' },
  { code: 'S03', left: '54%',  top: '2%',  width: '20%', height: '47%' },
  { code: 'S04', left: '54%',  top: '51%', width: '20%', height: '47%' },
  { code: 'S05', left: '14%',  top: '51%', width: '40%', height: '47%' },
]

export default function SectionPlan2D({ lang, liveData, darkMode }) {
  const [selected, setSelected] = useState(null)
  const [hovered,  setHovered]  = useState(null)
  const [tab,      setTab]      = useState('info')

  const cardBg     = darkMode ? 'rgba(16,27,46,0.9)' : '#FFFFFF'
  const cardBorder = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const textColor  = darkMode ? '#F8FAFC' : '#0F172A'
  const textSecond = darkMode ? '#CBD5E1' : '#475569'
  const mutedColor = darkMode ? '#64748B' : '#94A3B8'

  const info = selected ? SERRES.find(s => s.code === selected) : null
  const live = liveData?.find(d => d.code === selected)

  const T = {
    badge:   lang === 'fr' ? 'Coupe 2D · AgroBioTech IAV' : '2D Cross-Section · AgroBioTech IAV',
    title:   lang === 'fr' ? 'Coupe 2D Interactive' : 'Interactive 2D Cross-Section',
    accent:  lang === 'fr' ? 'des Serres' : 'of Greenhouses',
    hint:    lang === 'fr' ? 'Cliquez sur une serre pour afficher ses informations' : 'Click on a greenhouse to display its information',
    tabInfo: lang === 'fr' ? 'Informations' : 'Information',
    tabData: lang === 'fr' ? 'Données live' : 'Live data',
    crops:   lang === 'fr' ? 'Cultures principales' : 'Main crops',
    sensors: lang === 'fr' ? 'Capteurs' : 'Sensors',
    noData:  lang === 'fr' ? 'Données non disponibles' : 'Data unavailable',
    select:  lang === 'fr' ? 'Sélectionnez une serre' : 'Select a greenhouse',
    env:     lang === 'fr' ? 'Environnement' : 'Environment',
    irr:     lang === 'fr' ? 'Irrigation' : 'Irrigation',
    temp:    lang === 'fr' ? 'Température' : 'Temperature',
    hum:     lang === 'fr' ? 'Humidité' : 'Humidity',
    tEau:    lang === 'fr' ? 'T° Eau' : 'Water Temp',
    nEau:    lang === 'fr' ? 'Niveau Eau' : 'Water Level',
  }

  return (
    <section id="plan2d" style={{ padding: '5rem 3rem', scrollMarginTop: '64px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        {/* ── Title ── */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: darkMode ? 'rgba(6,182,212,0.08)' : 'rgba(6,182,212,0.06)',
            border: '1px solid rgba(6,182,212,0.2)',
            borderRadius: '100px', padding: '6px 18px', marginBottom: '1rem',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06B6D4' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#06B6D4', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {T.badge}
            </span>
          </div>
          <h2 style={{
            fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 900,
            color: textColor, fontFamily: "'Outfit',sans-serif", letterSpacing: '-0.03em',
          }}>
            {T.title} <span style={{ color: '#06B6D4' }}>{T.accent}</span>
          </h2>
          <p style={{ fontSize: '13px', color: mutedColor, marginTop: '10px' }}>{T.hint}</p>
        </div>

        {/* ── Legend buttons ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '1.5rem' }}>
          {SERRES.map(s => (
            <button
              key={s.code}
              onClick={() => { setSelected(selected === s.code ? null : s.code); setTab('info') }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: '12px', fontWeight: 600,
                border: `1.5px solid ${s.color}50`,
                background: selected === s.code ? `${s.color}20` : (darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
                color: selected === s.code ? s.color : mutedColor,
                transition: 'all 0.2s',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              {s.code} — {lang === 'fr' ? s.nameFr.split('&')[0].trim() : s.nameEn.split('&')[0].trim()}
            </button>
          ))}
        </div>

        {/* ── Main grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>

          {/* ── SVG Plan with overlay zones ── */}
          <div style={{
            background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)',
          }}>
            {/* Image container */}
            <div style={{ position: 'relative', width: '100%' }}>

              {/* SVG image */}
              <img
                src="/plan_2d.svg"
                alt="Coupe 2D des serres AgroBioTech"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  filter: darkMode
                    ? 'invert(1) hue-rotate(180deg) saturate(1.1) brightness(0.8)'
                    : 'none',
                  transition: 'filter 0.4s ease',
                }}
              />

              {/* Clickable zones overlay */}
              {ZONES.map(zone => {
                const serre = SERRES.find(s => s.code === zone.code)
                const isHov = hovered  === zone.code
                const isSel = selected === zone.code
                return (
                  <div
                    key={zone.code}
                    onMouseEnter={() => setHovered(zone.code)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => { setSelected(selected === zone.code ? null : zone.code); setTab('info') }}
                    style={{
                      position: 'absolute',
                      left: zone.left, top: zone.top,
                      width: zone.width, height: zone.height,
                      cursor: 'pointer',
                      background: isSel
                        ? `${serre.color}30`
                        : isHov ? `${serre.color}18` : 'transparent',
                      border: isSel
                        ? `2px solid ${serre.color}`
                        : isHov ? `2px solid ${serre.color}80` : '2px solid transparent',
                      borderRadius: '6px',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-end',
                      padding: '6px',
                    }}
                  >
                    {/* Code badge on hover/select */}
                    {(isHov || isSel) && (
                      <div style={{
                        background: serre.color,
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontFamily: 'inherit',
                        boxShadow: `0 2px 8px ${serre.color}60`,
                        animation: 'fadeInBadge 0.15s ease',
                      }}>
                        {zone.code}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Hint bar */}
            <div style={{
              padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px',
              borderTop: `1px solid ${cardBorder}`,
              background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={mutedColor} strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
              </svg>
              <span style={{ fontSize: '11px', color: mutedColor }}>{T.hint}</span>
            </div>
          </div>

          {/* ── Info panel ── */}
          <div style={{
            background: cardBg,
            border: `1px solid ${info ? info.color + '30' : cardBorder}`,
            borderRadius: '24px', overflow: 'hidden',
            boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)',
            transition: 'border-color 0.3s',
            minHeight: '320px',
          }}>
            {!selected ? (
              <div style={{ padding: '2rem 1.5rem', textAlign: 'center', color: mutedColor, fontSize: '14px' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '14px',
                  background: darkMode ? 'rgba(6,182,212,0.08)' : 'rgba(6,182,212,0.06)',
                  border: '1px solid rgba(6,182,212,0.2)',
                  margin: '0 auto 1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="1.5">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <p style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>{T.select}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {SERRES.map(s => (
                    <button
                      key={s.code}
                      onClick={() => { setSelected(s.code); setTab('info') }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 12px', borderRadius: '10px', cursor: 'pointer',
                        fontFamily: 'inherit', fontSize: '12px', fontWeight: 500,
                        border: `1px solid ${s.color}25`,
                        background: `${s.color}08`, color: s.color,
                        transition: 'all 0.2s', textAlign: 'left',
                      }}
                    >
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>{s.code} — {lang === 'fr' ? s.nameFr : s.nameEn}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Color bar */}
                <div style={{ height: '4px', background: `linear-gradient(90deg, ${info.color}, transparent)` }} />

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: `1px solid ${cardBorder}` }}>
                  {['info', 'data'].map(t => (
                    <button key={t} onClick={() => setTab(t)} style={{
                      flex: 1, padding: '13px 10px', fontSize: '13px', fontWeight: 600,
                      background: tab === t ? `${info.color}10` : 'transparent',
                      color: tab === t ? info.color : mutedColor,
                      border: 'none', borderBottom: `2px solid ${tab === t ? info.color : 'transparent'}`,
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                    }}>
                      {t === 'info' ? T.tabInfo : T.tabData}
                    </button>
                  ))}
                </div>

                {/* ── INFO tab ── */}
                {tab === 'info' && (
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: info.color, boxShadow: `0 0 8px ${info.color}` }} />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: info.color, letterSpacing: '0.06em' }}>{info.code}</span>
                    </div>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: textColor, marginBottom: '0.75rem', fontFamily: "'Outfit',sans-serif" }}>
                      {lang === 'fr' ? info.nameFr : info.nameEn}
                    </h3>
                    <p style={{ fontSize: '13px', color: textSecond, lineHeight: 1.8, marginBottom: '1.25rem' }}>
                      {lang === 'fr' ? info.roleFr : info.roleEn}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { label: T.crops,   value: lang === 'fr' ? info.culturesFr : info.culturesEn },
                        { label: T.sensors, value: lang === 'fr' ? info.capteursFr : info.capteursEn },
                      ].map(row => (
                        <div key={row.label} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                          background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                          border: `1px solid ${cardBorder}`, borderRadius: '10px', padding: '10px 14px', gap: '12px',
                        }}>
                          <span style={{ fontSize: '12px', color: mutedColor, flexShrink: 0 }}>{row.label}</span>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: info.color, textAlign: 'right' }}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── LIVE DATA tab ── */}
                {tab === 'data' && (
                  <div style={{ padding: '1.5rem' }}>
                    {live ? (
                      <>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: mutedColor, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>{T.env}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '14px' }}>
                          {[
                            { label: T.temp, unit: '°C',   color: '#F59E0B', val: live.env?.temperature },
                            { label: T.hum,  unit: '%',    color: '#06B6D4', val: live.env?.humidite },
                            { label: 'VPD',  unit: ' kPa', color: '#8B5CF6', val: live.env?.vpd },
                            { label: 'CO₂',  unit: ' ppm', color: '#22C55E', val: live.env?.co2 },
                          ].map(p => (
                            <div key={p.label} style={{ background: `${p.color}10`, border: `1px solid ${p.color}25`, borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                              <div style={{ fontSize: '10px', color: mutedColor, marginBottom: '4px' }}>{p.label}</div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: p.val != null ? p.color : mutedColor, fontFamily: "'Outfit',sans-serif" }}>
                                {p.val != null ? `${p.val}${p.unit}` : '—'}
                              </div>
                            </div>
                          ))}
                        </div>
                        {live.irr && (
                          <>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: mutedColor, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>{T.irr}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                              {[
                                { label: 'pH',    unit: '',        color: '#06B6D4', val: live.irr?.ph },
                                { label: 'EC',    unit: ' mS/cm', color: '#22C55E', val: live.irr?.ec },
                                { label: T.tEau,  unit: '°C',     color: '#F59E0B', val: live.irr?.temp_eau },
                                { label: T.nEau,  unit: ' m',     color: '#8B5CF6', val: live.irr?.niveau_eau },
                              ].map(p => (
                                <div key={p.label} style={{ background: `${p.color}10`, border: `1px solid ${p.color}25`, borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                                  <div style={{ fontSize: '10px', color: mutedColor, marginBottom: '4px' }}>{p.label}</div>
                                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: p.val != null ? p.color : mutedColor, fontFamily: "'Outfit',sans-serif" }}>
                                    {p.val != null ? `${p.val}${p.unit}` : '—'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', color: mutedColor, fontSize: '13px', padding: '2rem' }}>{T.noData}</div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInBadge { from{opacity:0;transform:scale(0.8)} to{opacity:1;transform:scale(1)} }
      `}</style>
    </section>
  )
}
