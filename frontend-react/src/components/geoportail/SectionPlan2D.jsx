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
    // Coordonnées exactes dans le SVG original (viewBox 620 155 440 355)
    rx: 642, ry: 173, rw: 130, rh: 130,
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
    rx: 772, ry: 173, rw: 130, rh: 130,
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
    rx: 901, ry: 173, rw: 129, rh: 130,
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
    rx: 901, ry: 363, rw: 129, rh: 129,
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
    rx: 642, ry: 363, rw: 259, rh: 129,
  },
]

// ViewBox cadré exactement sur les 5 serres avec petite marge
const VB = { x: 628, y: 158, w: 415, h: 350 }

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

        {/* ── Legend ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '1.5rem' }}>
          {SERRES.map(s => (
            <button key={s.code} onClick={() => { setSelected(selected === s.code ? null : s.code); setTab('info') }} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '12px', fontWeight: 600,
              border: `1.5px solid ${s.color}50`,
              background: selected === s.code ? `${s.color}20` : (darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
              color: selected === s.code ? s.color : mutedColor,
              transition: 'all 0.2s',
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              {s.code} — {lang === 'fr' ? s.nameFr.split('&')[0].trim() : s.nameEn.split('&')[0].trim()}
            </button>
          ))}
        </div>

        {/* ── Main grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>

          {/* ── SVG inline avec viewBox cadré ── */}
          <div style={{
            background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)',
          }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
              style={{
                width: '100%', height: 'auto', display: 'block',
                filter: darkMode ? 'invert(1) hue-rotate(180deg) saturate(1.1) brightness(0.85)' : 'none',
                transition: 'filter 0.4s ease',
              }}
            >
              {/* ── Fond blanc ── */}
              <rect x={VB.x} y={VB.y} width={VB.w} height={VB.h} fill="white" />

              {/* ── Contenu SVG original — tous les paths/clips du plan ── */}
              {/* Bâtiment droit (les 5 serres) */}
              <path strokeLinecap="butt" transform="matrix(0.75, 0, 0, 0.75, 621.233519, 163.155101)" fill="none" strokeLinejoin="miter" d="M 0.00114137 0.00153254 L 574.360545 0.00153254 L 574.360545 456.277597 L 0.00114137 456.277597 Z" stroke="#48392e" strokeWidth="8" strokeOpacity="1" strokeMiterlimit="4"/>

              {/* S01 — vert */}
              <path strokeLinecap="butt" transform="matrix(0.75, 0, 0, 0.75, 642.895582, 173.623355)" fill="none" strokeLinejoin="miter" d="M -0.00140084 0.00219298 L -0.00140084 172.189713 L 172.186119 172.189713 L 172.186119 0.00219298 L -0.00140084 0.00219298" stroke="#22c55e" strokeWidth="4" strokeOpacity="1" strokeMiterlimit="4"/>
              <path fill="#22c55e" d="M 642.894531 185.457031 L 646.753906 185.457031 L 646.753906 290.929688 L 642.894531 290.929688 Z" fillOpacity="1" fillRule="nonzero"/>
              <path fill="#22c55e" d="M 768.175781 185.457031 L 772.035156 185.457031 L 772.035156 290.929688 L 768.175781 290.929688 Z" fillOpacity="1" fillRule="nonzero"/>
              <path fill="#22c55e" d="M 654.730469 173.625 L 760.203125 173.625 L 760.203125 177.480469 L 654.730469 177.480469 Z" fillOpacity="1" fillRule="nonzero"/>
              <path fill="#22c55e" d="M 654.730469 298.90625 L 760.203125 298.90625 L 760.203125 302.765625 L 654.730469 302.765625 Z" fillOpacity="1" fillRule="nonzero"/>

              {/* S02 — cyan */}
              <path strokeLinecap="butt" transform="matrix(0.75, 0, 0, 0.75, 772.045575, 173.623355)" fill="none" strokeLinejoin="miter" d="M 0.00173282 0.00219298 L 0.00173282 172.189713 L 172.189253 172.189713 L 172.189253 0.00219298 L 0.00173282 0.00219298" stroke="#06b6d4" strokeWidth="4" strokeOpacity="1" strokeMiterlimit="4"/>
              <path fill="#06b6d4" d="M 772.046875 185.457031 L 775.90625 185.457031 L 775.90625 290.929688 L 772.046875 290.929688 Z" fillOpacity="1" fillRule="nonzero"/>
              <path fill="#06b6d4" d="M 897.328125 185.457031 L 901.1875 185.457031 L 901.1875 290.929688 L 897.328125 290.929688 Z" fillOpacity="1" fillRule="nonzero"/>
              <path fill="#06b6d4" d="M 783.878906 173.625 L 889.351562 173.625 L 889.351562 177.480469 L 783.878906 177.480469 Z" fillOpacity="1" fillRule="nonzero"/>
              <path fill="#06b6d4" d="M 783.878906 298.90625 L 889.351562 298.90625 L 889.351562 302.765625 L 783.878906 302.765625 Z" fillOpacity="1" fillRule="nonzero"/>

              {/* S03 — amber */}
              <path strokeLinecap="butt" transform="matrix(0.75, 0, 0, 0.75, 901.195569, 173.623355)" fill="none" strokeLinejoin="miter" d="M -0.000341846 0.00219298 L -0.000341846 172.189713 L 172.187178 172.189713 L 172.187178 0.00219298 L -0.000341846 0.00219298" stroke="#f59e0b" strokeWidth="4" strokeOpacity="1" strokeMiterlimit="4"/>
              <path fill="#f59e0b" d="M 901.195312 185.457031 L 905.054688 185.457031 L 905.054688 290.929688 L 901.195312 290.929688 Z" fillOpacity="1" fillRule="nonzero"/>
              <path fill="#f59e0b" d="M 1026.476562 185.457031 L 1030.335938 185.457031 L 1030.335938 290.929688 L 1026.476562 290.929688 Z" fillOpacity="1" fillRule="nonzero"/>
              <path fill="#f59e0b" d="M 913.027344 173.625 L 1018.503906 173.625 L 1018.503906 177.480469 L 913.027344 177.480469 Z" fillOpacity="1" fillRule="nonzero"/>
              <path fill="#f59e0b" d="M 913.027344 298.90625 L 1018.503906 298.90625 L 1018.503906 302.765625 L 913.027344 302.765625 Z" fillOpacity="1" fillRule="nonzero"/>

              {/* S05 — rouge */}
              <path strokeLinecap="butt" transform="matrix(0.75, 0, 0, 0.75, 642.895582, 363.148331)" fill="none" strokeLinejoin="miter" d="M -0.00140084 0.000141559 L -0.00140084 172.187661 L 172.186119 172.187661 L 172.186119 0.000141559 L -0.00140084 0.000141559" stroke="#ef4444" strokeWidth="4" strokeOpacity="1" strokeMiterlimit="4"/>
              <path strokeLinecap="butt" transform="matrix(0.75, 0, 0, 0.75, 772.045575, 363.148331)" fill="none" strokeLinejoin="miter" d="M 0.00173282 0.000141559 L 0.00173282 172.187661 L 172.189253 172.187661 L 172.189253 0.000141559 L 0.00173282 0.000141559" stroke="#ef4444" strokeWidth="10" strokeOpacity="1" strokeMiterlimit="4"/>
              <path fill="#ef4444" d="M 642.894531 374.980469 L 646.753906 374.980469 L 646.753906 480.457031 L 642.894531 480.457031 Z" fillOpacity="1" fillRule="nonzero"/>
              <path fill="#ef4444" d="M 897.328125 374.980469 L 901.1875 374.980469 L 901.1875 480.457031 L 897.328125 480.457031 Z" fillOpacity="1" fillRule="nonzero"/>
              <path fill="#ef4444" d="M 654.730469 363.148438 L 889.351562 363.148438 L 889.351562 367.007812 L 654.730469 367.007812 Z" fillOpacity="1" fillRule="nonzero"/>
              <path fill="#ef4444" d="M 654.730469 488.429688 L 889.351562 488.429688 L 889.351562 492.289062 L 654.730469 492.289062 Z" fillOpacity="1" fillRule="nonzero"/>

              {/* S04 — violet */}
              <path strokeLinecap="butt" transform="matrix(0.75, 0, 0, 0.75, 901.195569, 363.148331)" fill="none" strokeLinejoin="miter" d="M -0.000341846 0.000141559 L -0.000341846 172.187661 L 172.187178 172.187661 L 172.187178 0.000141559 L -0.000341846 0.000141559" stroke="#8b5cf6" strokeWidth="4" strokeOpacity="1" strokeMiterlimit="4"/>
              <path fill="#8b5cf6" d="M 901.195312 374.980469 L 905.054688 374.980469 L 905.054688 480.457031 L 901.195312 480.457031 Z" fillOpacity="1" fillRule="nonzero"/>
              <path fill="#8b5cf6" d="M 1026.476562 374.980469 L 1030.335938 374.980469 L 1030.335938 480.457031 L 1026.476562 480.457031 Z" fillOpacity="1" fillRule="nonzero"/>
              <path fill="#8b5cf6" d="M 913.027344 363.148438 L 1018.503906 363.148438 L 1018.503906 367.007812 L 913.027344 367.007812 Z" fillOpacity="1" fillRule="nonzero"/>
              <path fill="#8b5cf6" d="M 913.027344 488.429688 L 1018.503906 488.429688 L 1018.503906 492.289062 L 913.027344 492.289062 Z" fillOpacity="1" fillRule="nonzero"/>

              {/* ── Textes des serres (en SVG natif — parfaitement positionnés) ── */}
              {/* S01 */}
              <text x="707" y="228" textAnchor="middle" fontSize="10" fill="#22c55e" fontFamily="Arial, sans-serif" fontWeight="700">Unité - Génétique</text>
              <text x="707" y="243" textAnchor="middle" fontSize="9"  fill="#22c55e" fontFamily="Arial, sans-serif">&amp; Amélioration</text>
              {/* S02 */}
              <text x="836" y="228" textAnchor="middle" fontSize="10" fill="#06b6d4" fontFamily="Arial, sans-serif" fontWeight="700">Unité</text>
              <text x="836" y="243" textAnchor="middle" fontSize="9"  fill="#06b6d4" fontFamily="Arial, sans-serif">Horticulture</text>
              {/* S03 */}
              <text x="965" y="228" textAnchor="middle" fontSize="10" fill="#f59e0b" fontFamily="Arial, sans-serif" fontWeight="700">Unité</text>
              <text x="965" y="243" textAnchor="middle" fontSize="9"  fill="#f59e0b" fontFamily="Arial, sans-serif">Agronomie</text>
              {/* S04 */}
              <text x="965" y="418" textAnchor="middle" fontSize="10" fill="#8b5cf6" fontFamily="Arial, sans-serif" fontWeight="700">Unité</text>
              <text x="965" y="433" textAnchor="middle" fontSize="9"  fill="#8b5cf6" fontFamily="Arial, sans-serif">Hydroponie</text>
              {/* S05 */}
              <text x="772" y="418" textAnchor="middle" fontSize="10" fill="#ef4444" fontFamily="Arial, sans-serif" fontWeight="700">Unité - Protection</text>
              <text x="772" y="433" textAnchor="middle" fontSize="9"  fill="#ef4444" fontFamily="Arial, sans-serif">des Plantes</text>

              {/* ── Zones interactives — MÊMES coordonnées que les serres ── */}
              {SERRES.map(s => {
                const isHov = hovered  === s.code
                const isSel = selected === s.code
                return (
                  <g key={s.code}>
                    <rect
                      x={s.rx} y={s.ry} width={s.rw} height={s.rh}
                      fill={isSel ? `${s.color}35` : isHov ? `${s.color}20` : 'transparent'}
                      stroke={isSel || isHov ? s.color : 'transparent'}
                      strokeWidth={isSel ? 3 : 2}
                      rx="3"
                      style={{ cursor: 'pointer', transition: 'fill 0.2s, stroke 0.2s' }}
                      onMouseEnter={() => setHovered(s.code)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => { setSelected(selected === s.code ? null : s.code); setTab('info') }}
                    />
                    {/* Badge code sur hover/sélection */}
                    {(isHov || isSel) && (
                      <g>
                        <rect
                          x={s.rx + s.rw / 2 - 18} y={s.ry + 6}
                          width="36" height="16" rx="8"
                          fill={s.color}
                          style={{ pointerEvents: 'none' }}
                        />
                        <text
                          x={s.rx + s.rw / 2} y={s.ry + 18}
                          textAnchor="middle" fontSize="9"
                          fill="white" fontFamily="Arial, sans-serif" fontWeight="700"
                          style={{ pointerEvents: 'none' }}
                        >
                          {s.code}
                        </text>
                      </g>
                    )}
                  </g>
                )
              })}
            </svg>

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
              <div style={{ padding: '2rem 1.5rem', textAlign: 'center', color: mutedColor }}>
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
                <p style={{ fontSize: '14px', marginBottom: '1.5rem', lineHeight: 1.6 }}>{T.select}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {SERRES.map(s => (
                    <button key={s.code} onClick={() => { setSelected(s.code); setTab('info') }} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '8px 12px', borderRadius: '10px', cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: '12px', fontWeight: 500,
                      border: `1px solid ${s.color}25`,
                      background: `${s.color}08`, color: s.color,
                      transition: 'all 0.2s', textAlign: 'left',
                    }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>{s.code} — {lang === 'fr' ? s.nameFr : s.nameEn}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div style={{ height: '4px', background: `linear-gradient(90deg, ${info.color}, transparent)` }} />
                <div style={{ display: 'flex', borderBottom: `1px solid ${cardBorder}` }}>
                  {['info','data'].map(t => (
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
                                { label: 'pH',   unit: '',        color: '#06B6D4', val: live.irr?.ph },
                                { label: 'EC',   unit: ' mS/cm', color: '#22C55E', val: live.irr?.ec },
                                { label: T.tEau, unit: '°C',     color: '#F59E0B', val: live.irr?.temp_eau },
                                { label: T.nEau, unit: ' m',     color: '#8B5CF6', val: live.irr?.niveau_eau },
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
    </section>
  )
}
