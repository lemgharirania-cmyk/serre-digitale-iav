// src/components/geoportail/SectionPlan2D.jsx
import { useState } from 'react'
import { X, Info, Activity, Video, ExternalLink, Thermometer, Droplets, Wind, Leaf, FlaskConical, Zap, Waves, BarChart2 } from 'lucide-react'

// ── Image dimensions (px) at display: 1320×880 ───────────────
// All zones are expressed as percentages of the image dimensions
// Image: 1320px wide × 880px tall (approximate)

const ZONES = [
  // ── SERRES ───────────────────────────────────────────────
  {
    id: 'S01', type: 'serre', color: '#22C55E',
    left: '36.5%', top: '18%', width: '15.5%', height: '35%',
    nameFr: 'Unité — Génétique et Amélioration des Plantes', nameEn: 'Unit — Plant Genetics & Improvement',
    roleFr: 'Sélection variétale, culture in vitro et amélioration génétique des espèces végétales cultivées en conditions contrôlées.',
    roleEn: 'Varietal selection, in vitro culture and genetic improvement of plant species grown under controlled conditions.',
    culturesFr: 'Tomate · Piment · Melon', culturesEn: 'Tomato · Pepper · Melon',
    capteursFr: '2 capteurs ENV (T°, HR, VPD, CO₂) · 2 capteurs IRR (pH, EC, T°eau, Niveau)',
    capteursEn: '2 ENV sensors (T°, RH, VPD, CO₂) · 2 IRR sensors (pH, EC, Water T°, Level)',
    visitFile: '/walkthrough/serregenetique.html',
    visitBadge: 'S01',
  },
  {
    id: 'S02', type: 'serre', color: '#06B6D4',
    left: '52.5%', top: '18%', width: '15%', height: '35%',
    nameFr: 'Unité — Horticulture', nameEn: 'Unit — Horticulture',
    roleFr: 'Production florale, maraîchage sous abri et expérimentations horticoles sur espèces à haute valeur commerciale.',
    roleEn: 'Flower production, greenhouse vegetables and horticultural experiments on high commercial value species.',
    culturesFr: 'Roses · Laitue · Fraise', culturesEn: 'Roses · Lettuce · Strawberry',
    capteursFr: '2 capteurs ENV (T°, HR, VPD, CO₂) · 2 capteurs IRR (pH, EC, T°eau, Niveau)',
    capteursEn: '2 ENV sensors (T°, RH, VPD, CO₂) · 2 IRR sensors (pH, EC, Water T°, Level)',
    visitFile: '/walkthrough/serrehorticulture.html',
    visitBadge: 'S02',
  },
  {
    id: 'S03', type: 'serre', color: '#F59E0B',
    left: '68%', top: '18%', width: '14.5%', height: '35%',
    nameFr: 'Unité — Agronomie', nameEn: 'Unit — Agronomy',
    roleFr: 'Essais culturaux, comparaisons variétales et recherche appliquée en agronomie des grandes cultures.',
    roleEn: 'Crop trials, varietal comparisons and applied agronomy research on field crops.',
    culturesFr: 'Blé · Orge · Légumineuses', culturesEn: 'Wheat · Barley · Legumes',
    capteursFr: '2 capteurs ENV (T°, HR, VPD, CO₂) · 2 capteurs IRR (pH, EC, T°eau, Niveau)',
    capteursEn: '2 ENV sensors (T°, RH, VPD, CO₂) · 2 IRR sensors (pH, EC, Water T°, Level)',
    visitFile: '/walkthrough/serreagronomie.html',
    visitBadge: 'S03',
  },
  {
    id: 'S05', type: 'serre', color: '#EF4444',
    left: '52%', top: '62%', width: '15.5%', height: '32%',
    nameFr: 'Unité — Protection des Plantes', nameEn: 'Unit — Plant Protection',
    roleFr: 'Phytopathologie, entomologie et méthodes de lutte intégrée contre les ravageurs et maladies des cultures.',
    roleEn: 'Phytopathology, entomology and integrated pest management methods against crop pests and diseases.',
    culturesFr: 'Plants test · Cultures témoin · Zone quarantaine', culturesEn: 'Test plants · Control cultures · Quarantine zone',
    capteursFr: '2 capteurs ENV (T°, HR, VPD, CO₂) · 2 capteurs IRR (pH, EC, T°eau, Niveau)',
    capteursEn: '2 ENV sensors (T°, RH, VPD, CO₂) · 2 IRR sensors (pH, EC, Water T°, Level)',
    visitFile: '/walkthrough/serreprotection.html',
    visitBadge: 'S05',
  },
  {
    id: 'S04', type: 'serre', color: '#8B5CF6',
    left: '68%', top: '62%', width: '14.5%', height: '32%',
    nameFr: 'Unité — Hydroponie et Systèmes Innovants', nameEn: 'Unit — Hydroponics & Innovative Systems',
    roleFr: 'Culture hors-sol en systèmes NFT, DWC et aéroponie pour production intensive et recherche sur les solutions nutritives.',
    roleEn: 'Soilless cultivation in NFT, DWC and aeroponic systems for intensive production and nutrient solution research.',
    culturesFr: 'Basilic · Tomate · Laitue · Fraise', culturesEn: 'Basil · Tomato · Lettuce · Strawberry',
    capteursFr: '2 capteurs ENV (T°, HR, VPD, CO₂) · 2 capteurs IRR (pH, EC, T°eau, Niveau)',
    capteursEn: '2 ENV sensors (T°, RH, VPD, CO₂) · 2 IRR sensors (pH, EC, Water T°, Level)',
    visitFile: '/walkthrough/serrehydroponie.html',
    visitBadge: 'S04',
  },
  // ── SALLES TECHNIQUES ────────────────────────────────────
  { id: 'salle-reunion',       type: 'technique', color: '#64748B', left: '4%',    top: '18%', width: '10%',   height: '35%',
    nameFr: 'Salle de Réunion', nameEn: 'Meeting Room',
    descFr: 'Espace de réunion et de coordination pour les équipes de recherche et les formations du complexe AgroBioTech.',
    descEn: 'Meeting and coordination space for research teams and training sessions at the AgroBioTech complex.',
    visitFile: '/walkthrough/localtechnique.html', visitBadge: 'LT' },
  { id: 'local-technique',     type: 'technique', color: '#64748B', left: '14.5%', top: '18%', width: '10%',   height: '35%',
    nameFr: 'Local Technique et Équipements', nameEn: 'Technical Room & Equipment',
    descFr: 'Local abritant les équipements électriques, les systèmes de contrôle IoT et l\'infrastructure réseau du complexe.',
    descEn: 'Room housing electrical equipment, IoT control systems and network infrastructure of the complex.',
    visitFile: '/walkthrough/localtechnique.html', visitBadge: 'LT' },
  { id: 'salle-commande',      type: 'technique', color: '#64748B', left: '25%',   top: '18%', width: '10.5%', height: '35%',
    nameFr: 'Salle Technique de Commande', nameEn: 'Command & Control Room',
    descFr: 'Salle de commande et d\'automatisation centralisant le pilotage des équipements IoT et des systèmes de contrôle climatique.',
    descEn: 'Command and automation room centralizing IoT equipment control and climate control systems.',
    visitFile: '/walkthrough/salledecontrole.html', visitBadge: 'TC' },
  { id: 'salle-lavage',        type: 'technique', color: '#64748B', left: '4%',    top: '62%', width: '10%',   height: '32%',
    nameFr: 'Salle de Lavage', nameEn: 'Washing Room',
    descFr: 'Espace équipé pour le nettoyage et la décontamination du matériel végétal, des équipements et des contenants.',
    descEn: 'Space equipped for cleaning and decontaminating plant material, equipment and containers.',
    visitFile: '/walkthrough/salledelavage.html', visitBadge: 'TL' },
  { id: 'salle-fertilisation', type: 'technique', color: '#64748B', left: '14.5%', top: '62%', width: '10%',   height: '32%',
    nameFr: 'Salle de Fertilisation et Traitement d\'Eau', nameEn: 'Fertilisation & Water Treatment Room',
    descFr: 'Salle équipée de cuves de stockage, de systèmes de dosage et de traitement de l\'eau pour la fertigation.',
    descEn: 'Room equipped with storage tanks, dosing systems and water treatment for fertigation.',
    visitFile: '/walkthrough/salledefertigation.html', visitBadge: 'TF' },
  { id: 'salle-preparation',   type: 'technique', color: '#64748B', left: '25%',   top: '62%', width: '10.5%', height: '32%',
    nameFr: 'Salle de Préparation', nameEn: 'Preparation Room',
    descFr: 'Espace de préparation des substrats, des semences, des boutures et du matériel de culture avant mise en place.',
    descEn: 'Space for preparing substrates, seeds, cuttings and cultivation materials before deployment.',
    visitFile: '/walkthrough/salledepreparation.html', visitBadge: 'TP' },
  { id: 'zone-prep-protection', type: 'technique', color: '#64748B', left: '36.5%', top: '62%', width: '14.5%', height: '32%',
    nameFr: 'Zone Technique — Protection (SAS + Broyage + Stockage)', nameEn: 'Technical Zone — Protection',
    descFr: 'Zone comprenant le SAS d\'entrée, la salle de broyage et désinfection, le stockage produits et la salle de préparation.',
    descEn: 'Zone including the entry airlock, grinding and disinfection room, product storage and preparation room.',
    visitFile: '/walkthrough/salledepreparation.html', visitBadge: 'TP' },
]
// ── Live data icons ───────────────────────────────────────────
const PARAM_ICONS = {
  temperature: Thermometer,
  humidite:    Droplets,
  vpd:         Wind,
  co2:         Leaf,
  ph:          FlaskConical,
  ec:          Zap,
  temp_eau:    Waves,
  niveau_eau:  BarChart2,
}

const PARAM_LABELS = {
  fr: { temperature:'Température', humidite:'Humidité', vpd:'VPD', co2:'CO₂', ph:'pH', ec:'EC', temp_eau:'T° Eau', niveau_eau:'Niveau Eau' },
  en: { temperature:'Temperature', humidite:'Humidity', vpd:'VPD', co2:'CO₂', ph:'pH', ec:'EC', temp_eau:'Water T°', niveau_eau:'Water Level' },
}

const PARAM_UNITS = { temperature:'°C', humidite:'%', vpd:' kPa', co2:' ppm', ph:'', ec:' mS/cm', temp_eau:'°C', niveau_eau:' m' }
const PARAM_COLORS = { temperature:'#F59E0B', humidite:'#06B6D4', vpd:'#8B5CF6', co2:'#22C55E', ph:'#0891b2', ec:'#059669', temp_eau:'#F59E0B', niveau_eau:'#3773bd' }

export default function SectionPlan2D({ lang, liveData, darkMode }) {
  const [selected,    setSelected]    = useState(null)
  const [hovered,     setHovered]     = useState(null)
  const [tab,         setTab]         = useState('info') // 'info' | 'data' | 'visite'

  const cardBg     = darkMode ? 'rgba(16,27,46,0.95)' : '#FFFFFF'
  const cardBorder = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const textColor  = darkMode ? '#F8FAFC' : '#0F172A'
  const textSecond = darkMode ? '#CBD5E1' : '#475569'
  const mutedColor = darkMode ? '#64748B' : '#94A3B8'

  const zone    = selected ? ZONES.find(z => z.id === selected) : null
  const isSerre = zone?.type === 'serre'

  // Find live data for selected serre
  const serreCode = zone?.id?.startsWith('S') ? zone.id : null
  const live      = liveData?.find(d => d.code === serreCode)

  const T = {
    badge:    lang === 'fr' ? 'Coupe 2D · AgroBioTech IAV' : '2D Plan · AgroBioTech IAV',
    title:    lang === 'fr' ? 'Plan interactif' : 'Interactive plan',
    accent:   lang === 'fr' ? 'du complexe' : 'of the complex',
    hint:     lang === 'fr' ? 'Cliquez sur une zone pour afficher ses informations' : 'Click on a zone to display its information',
    tabInfo:  lang === 'fr' ? 'Informations' : 'Information',
    tabData:  lang === 'fr' ? 'Données live' : 'Live data',
    tabVisite:lang === 'fr' ? 'Visite 3D' : '3D Tour',
    select:   lang === 'fr' ? 'Sélectionnez une zone' : 'Select a zone',
    noData:   lang === 'fr' ? 'Données non disponibles' : 'Data unavailable',
    noVisite: lang === 'fr' ? 'Lien Matterport non configuré' : 'Matterport link not configured',
    cultures: lang === 'fr' ? 'Cultures principales' : 'Main crops',
    capteurs: lang === 'fr' ? 'Capteurs IoT' : 'IoT sensors',
    ouvrirVisite: lang === 'fr' ? 'Ouvrir la visite 3D' : 'Open 3D tour',
    env:      lang === 'fr' ? 'Environnement' : 'Environment',
    irr:      lang === 'fr' ? 'Irrigation' : 'Irrigation',
    tech:     lang === 'fr' ? 'Salle technique' : 'Technical room',
  }

  function handleZoneClick(id) {
    if (selected === id) { setSelected(null); return }
    setSelected(id)
    setTab('info')
  }

  return (
    <section id="plan2d" style={{ padding: '5rem 3rem', scrollMarginTop: '64px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* ── Title ── */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: darkMode ? 'rgba(6,182,212,0.08)' : 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '100px', padding: '6px 18px', marginBottom: '1rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06B6D4' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#06B6D4', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{T.badge}</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 900, color: textColor, fontFamily: "'Outfit',sans-serif", letterSpacing: '-0.03em' }}>
            {T.title} <span style={{ color: '#06B6D4' }}>{T.accent}</span>
          </h2>
          <p style={{ fontSize: '13px', color: mutedColor, marginTop: '10px' }}>{T.hint}</p>
        </div>

        {/* ── Main layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'start' }}>

          {/* ── Image + clickable zones ── */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '20px', overflow: 'hidden', boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.5)' : '0 4px 24px rgba(0,0,0,0.08)' }}>
            <div style={{ position: 'relative', width: '100%' }}>

              {/* Plan image */}
              <img
                src="/plan2d.png"
                alt="Plan du complexe AgroBioTech IAV Hassan II"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  filter: darkMode ? 'brightness(0.85) contrast(1.1)' : 'none',
                  transition: 'filter 0.4s ease',
                }}
              />

              {/* Clickable overlay zones */}
              {ZONES.map(z => {
                const isHov = hovered  === z.id
                const isSel = selected === z.id
                return (
                  <div
                    key={z.id}
                    title={lang === 'fr' ? z.nameFr : z.nameEn}
                    onClick={() => handleZoneClick(z.id)}
                    onMouseEnter={() => setHovered(z.id)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      position: 'absolute',
                      left:   z.left,
                      top:    z.top,
                      width:  z.width,
                      height: z.height,
                      cursor: 'pointer',
                      background: isSel
                        ? `${z.color}40`
                        : isHov ? `${z.color}22` : 'transparent',
                      border: isSel
                        ? `2.5px solid ${z.color}`
                        : isHov ? `2px solid ${z.color}aa` : `1px solid transparent`,
                      borderRadius: '4px',
                      transition: 'all 0.18s ease',
                      backdropFilter: (isHov || isSel) ? 'blur(1px)' : 'none',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-end',
                      padding: '4px',
                    }}
                  >
                    {/* Badge visible on hover/select */}
                    {(isHov || isSel) && (
                      <div style={{
                        background: z.color,
                        color: 'white',
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: '8px',
                        fontFamily: "'Outfit', sans-serif",
                        boxShadow: `0 2px 8px ${z.color}60`,
                        whiteSpace: 'nowrap',
                        maxWidth: '90%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {z.id.startsWith('S') ? z.id : (lang==='fr'?z.nameFr:z.nameEn).split(' ').slice(0,3).join(' ')}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Hint bar */}
            <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderTop: `1px solid ${cardBorder}`, background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
              <Info size={12} color={mutedColor} />
              <span style={{ fontSize: '11px', color: mutedColor }}>{T.hint}</span>
            </div>
          </div>

          {/* ── Info panel ── */}
          <div style={{
            background: cardBg,
            border: `1px solid ${zone ? zone.color+'40' : cardBorder}`,
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)',
            transition: 'border-color 0.3s',
            minHeight: '340px',
            position: 'sticky',
            top: '100px',
          }}>

            {/* No selection */}
            {!selected && (
              <div style={{ padding: '2rem 1.5rem', textAlign: 'center', color: mutedColor }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: darkMode ? 'rgba(6,182,212,0.08)' : 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Info size={22} color="#06B6D4" />
                </div>
                <p style={{ fontSize: '14px', marginBottom: '1.5rem', lineHeight: 1.6 }}>{T.select}</p>
                {/* Quick zone list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                  {ZONES.filter(z=>z.type==='serre').map(z => (
                    <button key={z.id} onClick={() => handleZoneClick(z.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', borderRadius: '10px', border: `1px solid ${z.color}25`, background: `${z.color}08`, color: z.color, cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 500, transition: 'all 0.15s' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: z.color, flexShrink: 0 }} />
                      {z.id} — {lang==='fr' ? z.nameFr.replace('Unité — ','') : z.nameEn.replace('Unit — ','')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Zone selected */}
            {zone && (
              <>
                {/* Color bar */}
                <div style={{ height: '4px', background: `linear-gradient(90deg, ${zone.color}, transparent)` }} />

                {/* Close + zone name */}
                <div style={{ padding: '14px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: zone.color, boxShadow: `0 0 8px ${zone.color}` }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: zone.color, letterSpacing: '0.04em' }}>{isSerre ? zone.id : T.tech}</span>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: mutedColor, display: 'flex', padding: '2px' }}>
                    <X size={15} />
                  </button>
                </div>
                <div style={{ padding: '4px 16px 0' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: textColor, lineHeight: 1.4 }}>
                    {lang === 'fr' ? zone.nameFr : zone.nameEn}
                  </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', margin: '12px 16px 0', borderBottom: `1px solid ${cardBorder}`, gap: '4px' }}>
                  {[
                    { key:'info', label:T.tabInfo, Icon:Info },
                    ...(isSerre ? [{ key:'data', label:T.tabData, Icon:Activity }] : []),
                    { key:'visite', label:T.tabVisite, Icon:Video },
                  ].map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '8px 10px', fontSize: '11px', fontWeight: 600,
                      background: 'transparent', border: 'none',
                      borderBottom: `2px solid ${tab===t.key ? zone.color : 'transparent'}`,
                      color: tab===t.key ? zone.color : mutedColor,
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                    }}>
                      <t.Icon size={11} />
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* ── TAB: INFO ── */}
                {tab === 'info' && (
                  <div style={{ padding: '14px 16px' }}>
                    <p style={{ fontSize: '12.5px', color: textSecond, lineHeight: 1.75, marginBottom: '14px' }}>
                      {lang === 'fr' ? (isSerre ? zone.roleFr : zone.descFr) : (isSerre ? zone.roleEn : zone.descEn)}
                    </p>
                    {isSerre && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                          { label: T.cultures, value: lang==='fr' ? zone.culturesFr : zone.culturesEn, color: zone.color },
                          { label: T.capteurs, value: lang==='fr' ? zone.capteursFr : zone.capteursEn, color: zone.color },
                        ].map(row => (
                          <div key={row.label} style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', border: `1px solid ${cardBorder}`, borderRadius: '10px', padding: '9px 12px' }}>
                            <div style={{ fontSize: '10px', color: mutedColor, marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{row.label}</div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: row.color }}>{row.value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB: LIVE DATA (serres only) ── */}
                {tab === 'data' && isSerre && (
                  <div style={{ padding: '14px 16px' }}>
                    {live ? (
                      <>
                        {/* ENV */}
                        <div style={{ fontSize: '10px', fontWeight: 700, color: mutedColor, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>{T.env}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
                          {(['temperature','humidite','vpd','co2']).map(key => {
                            const val = live.env?.[key]
                            const IconCmp = PARAM_ICONS[key]
                            const c = PARAM_COLORS[key]
                            return (
                              <div key={key} style={{ background: `${c}10`, border: `1px solid ${c}25`, borderRadius: '10px', padding: '9px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                                  <IconCmp size={13} color={c} strokeWidth={1.8} />
                                </div>
                                <div style={{ fontSize: '9px', color: mutedColor, marginBottom: '3px' }}>
                                  {PARAM_LABELS[lang==='fr'?'fr':'en'][key]}
                                </div>
                                <div style={{ fontSize: '1rem', fontWeight: 800, color: val!=null?c:mutedColor, fontFamily: "'Outfit',sans-serif" }}>
                                  {val!=null ? `${val}${PARAM_UNITS[key]}` : '—'}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        {/* IRR */}
                        {live.irr && (
                          <>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: mutedColor, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>{T.irr}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                              {(['ph','ec','temp_eau','niveau_eau']).map(key => {
                                const val = live.irr?.[key]
                                const IconCmp = PARAM_ICONS[key]
                                const c = PARAM_COLORS[key]
                                return (
                                  <div key={key} style={{ background: `${c}10`, border: `1px solid ${c}25`, borderRadius: '10px', padding: '9px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                                      <IconCmp size={13} color={c} strokeWidth={1.8} />
                                    </div>
                                    <div style={{ fontSize: '9px', color: mutedColor, marginBottom: '3px' }}>
                                      {PARAM_LABELS[lang==='fr'?'fr':'en'][key]}
                                    </div>
                                    <div style={{ fontSize: '1rem', fontWeight: 800, color: val!=null?c:mutedColor, fontFamily: "'Outfit',sans-serif" }}>
                                      {val!=null ? `${val}${PARAM_UNITS[key]}` : '—'}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', color: mutedColor, fontSize: '13px', padding: '2rem' }}>{T.noData}</div>
                    )}
                  </div>
                )}

                {/* ── TAB: VISITE 3D ── */}
                {tab === 'visite' && (
                  <div style={{ padding: '14px 16px' }}>
                    {zone.visitFile ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Preview iframe */}
                        <div style={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${zone.color}30`, aspectRatio: '16/9', position: 'relative' }}>
                          <iframe
                            src={zone.visitFile}
                            width="100%"
                            height="100%"
                            style={{ position: 'absolute', inset: 0, border: 'none', width: '100%', height: '100%' }}
                            allowFullScreen
                            title={lang === 'fr' ? zone.nameFr : zone.nameEn}
                          />
                        </div>
                        {/* Open full screen button */}
                        <a
                          href={zone.visitFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                            padding: '11px', borderRadius: '12px',
                            background: `linear-gradient(135deg, ${zone.color}, ${zone.color}cc)`,
                            color: 'white', fontSize: '13px', fontWeight: 600,
                            fontFamily: 'inherit', textDecoration: 'none',
                            boxShadow: `0 4px 16px ${zone.color}40`,
                            transition: 'transform 0.2s, box-shadow 0.2s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow=`0 8px 24px ${zone.color}50` }}
                          onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=`0 4px 16px ${zone.color}40` }}
                        >
                          <ExternalLink size={14} />
                          {lang === 'fr' ? 'Ouvrir en plein écran' : 'Open fullscreen'}
                        </a>
                        {/* Also scroll to visite section */}
                        <a
                          href="#visite"
                          onClick={e => { e.preventDefault(); document.getElementById('visite')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                            padding: '9px', borderRadius: '12px',
                            background: 'transparent',
                            border: `1px solid ${zone.color}40`,
                            color: zone.color, fontSize: '12px', fontWeight: 600,
                            fontFamily: 'inherit', textDecoration: 'none', cursor: 'pointer',
                            transition: 'background 0.2s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background=`${zone.color}10`}
                          onMouseLeave={e => e.currentTarget.style.background='transparent'}
                        >
                          <Video size={13} />
                          {lang === 'fr' ? 'Voir dans la section Visite Virtuelle' : 'View in Virtual Visit section'}
                        </a>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', border: `1px solid ${cardBorder}`, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Video size={20} color={mutedColor} />
                        </div>
                        <div style={{ fontSize: '13px', color: mutedColor }}>{T.noVisite}</div>
                      </div>
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
