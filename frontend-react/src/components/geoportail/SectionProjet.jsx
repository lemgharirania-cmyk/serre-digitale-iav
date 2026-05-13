// src/components/geoportail/SectionProjet.jsx
import { useState, useEffect } from 'react'
import { Wifi, Activity, Clock, X } from 'lucide-react'

const STAT_DETAILS = {
  serres: {
    titleFr: '5 Serres Connectées',
    titleEn: '5 Connected Greenhouses',
    itemsFr: [
      { label: 'S01 — Génétique & Amélioration', desc: 'Sélection variétale, culture in vitro, amélioration génétique' },
      { label: 'S02 — Horticulture', desc: 'Production florale, maraîchage sous abri' },
      { label: 'S03 — Agronomie', desc: 'Essais culturaux, comparaisons variétales' },
      { label: 'S04 — Hydroponie', desc: 'Culture hors-sol NFT, DWC et aéroponie' },
      { label: 'S05 — Protection des Plantes', desc: 'Phytopathologie, entomologie, lutte intégrée' },
    ],
    itemsEn: [
      { label: 'S01 — Genetics & Improvement', desc: 'Varietal selection, in vitro culture, genetic improvement' },
      { label: 'S02 — Horticulture', desc: 'Flower production, greenhouse vegetables' },
      { label: 'S03 — Agronomy', desc: 'Crop trials, varietal comparisons' },
      { label: 'S04 — Hydroponics', desc: 'Soilless NFT, DWC and aeroponic systems' },
      { label: 'S05 — Plant Protection', desc: 'Phytopathology, entomology, integrated pest management' },
    ],
  },
  capteurs: {
    titleFr: '10 Capteurs Actifs',
    titleEn: '10 Active Sensors',
    itemsFr: [
      { label: 'Capteurs ENV (×5)', desc: 'Température · Humidité · VPD · CO₂ · Luminosité — un par serre' },
      { label: 'Capteurs IRR (×5)', desc: 'pH · EC · Température eau · Niveau eau — un par serre' },
      { label: 'Protocole', desc: 'IoT Pro-Leaf via API HTTP · Collecte toutes les 2 minutes' },
      { label: 'Stockage', desc: 'Base de données PostgreSQL · Historique complet conservé' },
    ],
    itemsEn: [
      { label: 'ENV Sensors (×5)', desc: 'Temperature · Humidity · VPD · CO₂ · Light — one per greenhouse' },
      { label: 'IRR Sensors (×5)', desc: 'pH · EC · Water temperature · Water level — one per greenhouse' },
      { label: 'Protocol', desc: 'Pro-Leaf IoT via HTTP API · Collection every 2 minutes' },
      { label: 'Storage', desc: 'PostgreSQL database · Complete history preserved' },
    ],
  },
  mesures: {
    titleFr: 'Mesures Collectées Aujourd\'hui',
    titleEn: 'Measures Collected Today',
    itemsFr: [
      { label: 'Fréquence', desc: 'Une collecte toutes les 2 minutes par serre' },
      { label: 'Volume quotidien', desc: '~720 mesures / serre / jour · ~3 600 mesures totales / jour' },
      { label: 'Paramètres', desc: '8 paramètres par serre : temp, humid, vpd, co2, ph, ec, t°eau, niveau' },
      { label: 'Historique', desc: 'Données archivées depuis la mise en service · Accessibles via graphiques' },
    ],
    itemsEn: [
      { label: 'Frequency', desc: 'One collection every 2 minutes per greenhouse' },
      { label: 'Daily volume', desc: '~720 measures / greenhouse / day · ~3,600 total measures / day' },
      { label: 'Parameters', desc: '8 parameters per greenhouse: temp, humid, vpd, co2, ph, ec, water temp, level' },
      { label: 'History', desc: 'Data archived since commissioning · Accessible via charts' },
    ],
  },
  monitoring: {
    titleFr: 'Monitoring 24h/24 · 7j/7',
    titleEn: '24/7 Continuous Monitoring',
    itemsFr: [
      { label: 'Scheduler automatique', desc: 'Collecte toutes les 2 minutes sans intervention humaine' },
      { label: 'Alertes intelligentes', desc: 'Notification email si un paramètre dépasse les seuils agronomiques' },
      { label: 'Dashboard gérant', desc: 'Interface d\'administration avec graphiques, alertes et export CSV/Excel' },
      { label: 'Géoportail public', desc: 'Visualisation temps réel accessible depuis n\'importe quel navigateur' },
    ],
    itemsEn: [
      { label: 'Automatic scheduler', desc: 'Collection every 2 minutes without human intervention' },
      { label: 'Smart alerts', desc: 'Email notification if a parameter exceeds agronomic thresholds' },
      { label: 'Manager dashboard', desc: 'Admin interface with charts, alerts and CSV/Excel export' },
      { label: 'Public geoportal', desc: 'Real-time visualization accessible from any browser' },
    ],
  },
}

function StatModal({ statKey, lang, darkMode, onClose }) {
  const detail = STAT_DETAILS[statKey]
  if (!detail) return null
  const items = lang === 'fr' ? detail.itemsFr : detail.itemsEn
  const title = lang === 'fr' ? detail.titleFr : detail.titleEn

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
    }} onClick={onClose}>
      <div style={{
        background: darkMode ? '#101B2E' : '#FFFFFF',
        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        borderRadius: '24px', padding: '2rem', maxWidth: '520px', width: '100%',
        boxShadow: '0 40px 100px rgba(0,0,0,0.4)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: darkMode ? '#F8FAFC' : '#0F172A', fontFamily: "'Outfit',sans-serif" }}>{title}</h3>
          <button onClick={onClose} style={{ background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: darkMode ? '#CBD5E1' : '#475569' }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map((item, i) => (
            <div key={i} style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`, borderRadius: '12px', padding: '12px 14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#22C55E', marginBottom: '4px' }}>{item.label}</div>
              <div style={{ fontSize: '13px', color: darkMode ? '#94A3B8' : '#475569', lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatBubble({ statKey, icon: Icon, value, label, color, darkMode, index, onClick }) {
  const [hovered, setHovered] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), index * 150)
    return () => clearTimeout(timer)
  }, [index])

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        background: darkMode
          ? (hovered ? `${color}18` : '#101B2E')
          : (hovered ? `${color}10` : '#FFFFFF'),
        border: `1px solid ${hovered ? color + '50' : (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
        borderRadius: '20px', padding: '24px 22px',
        display: 'flex', alignItems: 'center', gap: '16px',
        boxShadow: hovered
          ? `0 16px 48px ${color}25, 0 0 0 1px ${color}20`
          : darkMode ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 16px rgba(0,0,0,0.07)',
        transition: 'all 0.6s cubic-bezier(0.4,0,0.2,1)',
        transform: mounted
          ? (hovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)')
          : 'translateY(20px)',
        opacity: mounted ? 1 : 0,
        cursor: 'pointer',
      }}
    >
      <div style={{
        width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
        background: `${color}15`, border: `1px solid ${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.6s ease',
        boxShadow: hovered ? `0 0 20px ${color}30` : 'none',
      }}>
        <Icon size={22} color={color} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '2rem', fontWeight: 900, color, fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: '13px', color: darkMode ? '#64748B' : '#94A3B8', marginTop: '4px', fontWeight: 500 }}>
          {label}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
        <div style={{ width: '3px', height: '44px', borderRadius: '2px', background: `linear-gradient(to bottom, ${color}, transparent)` }} />
        <div style={{ fontSize: '10px', color: hovered ? color : (darkMode ? '#64748B' : '#94A3B8'), fontWeight: 600, letterSpacing: '0.05em', transition: 'color 0.3s' }}>
          {hovered ? (darkMode ? 'VOIR ▸' : 'VIEW ▸') : 'INFO'}
        </div>
      </div>
    </div>
  )
}

export default function SectionProjet({ lang, stats, darkMode }) {
  const [openModal, setOpenModal] = useState(null)

  const T = {
    fr: {
      badge: 'Notre Projet · PFE 2024–2025',
      title1: 'Serre Digitale',
      title2: 'Intelligente',
      p1: "[Ici vous insérez le texte introductif de votre projet — décrivez l'objectif du géoportail, le contexte du jumeau numérique, la problématique et l'approche méthodologique adoptée pour le Projet de Fin d'Études.]",
      p2: "[Deuxième paragraphe — présentez les technologies utilisées, l'architecture IoT, l'intégration des données capteurs et la valeur ajoutée pour la recherche agronomique à l'IAV Hassan II.]",
      slogan: '"Du capteur au numérique, chaque donnée raconte la vie de la plante."',
      sloganSub: 'Serre Digitale Intelligente · IAV Hassan II · 2025',
    },
    en: {
      badge: 'Our Project · Final Year 2024–2025',
      title1: 'Smart Digital',
      title2: 'Greenhouse',
      p1: '[Insert your project introduction here — describe the geoportal objective, digital twin context, the research problem and the methodological approach adopted for the Final Year Project.]',
      p2: '[Second paragraph — present the technologies used, IoT architecture, sensor data integration and the added value for agronomic research at IAV Hassan II.]',
      slogan: '"From sensor to digital, every data point tells the story of a plant."',
      sloganSub: 'Smart Digital Greenhouse · IAV Hassan II · 2025',
    }
  }[lang]

  const mesures24h = stats?.mesures_24h
    ? (Math.round(stats.mesures_24h / 100) * 100).toLocaleString()
    : '—'

  const STATS_DATA = [
    { key: 'serres',    icon: Wifi,     value: '5',        label: lang === 'fr' ? 'Serres connectées'    : 'Connected greenhouses', color: '#22C55E' },
    { key: 'capteurs',  icon: Activity, value: '10',       label: lang === 'fr' ? 'Capteurs actifs'      : 'Active sensors',        color: '#06B6D4' },
    { key: 'mesures',   icon: Activity, value: mesures24h, label: lang === 'fr' ? "Mesures aujourd'hui"  : 'Measures today',         color: '#F59E0B' },
    { key: 'monitoring',icon: Clock,    value: '24/7',     label: lang === 'fr' ? 'Monitoring continu'   : 'Continuous monitoring',  color: '#8B5CF6' },
  ]

  const cardBg     = darkMode ? '#101B2E' : '#FFFFFF'
  const cardBorder = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const textColor  = darkMode ? '#F8FAFC' : '#0F172A'
  const textSecond = darkMode ? '#CBD5E1' : '#475569'

  return (
    <section id="projet" style={{ padding: '6rem 3rem', scrollMarginTop: '64px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2.5rem', alignItems: 'start' }}>

        {/* Left */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '24px', padding: '2.5rem', boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E', display: 'inline-block', animation: 'sdiPulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#22C55E', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{T.badge}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem,4vw,3.2rem)', fontWeight: 900, color: textColor, fontFamily: "'Outfit',sans-serif", letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '1.5rem' }}>
            {T.title1}<br />
            <span style={{ background: 'linear-gradient(135deg,#22C55E,#06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{T.title2}</span>
          </h1>
          <p style={{ fontSize: '15px', color: textSecond, lineHeight: 1.9, marginBottom: '1.25rem' }}>{T.p1}</p>
          <p style={{ fontSize: '15px', color: textSecond, lineHeight: 1.9, marginBottom: '2rem' }}>{T.p2}</p>
          <div style={{ background: darkMode ? 'rgba(34,197,94,0.07)' : 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '16px', padding: '18px 20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{ width: '3px', minHeight: '40px', background: 'linear-gradient(to bottom,#22C55E,#06B6D4)', borderRadius: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: textColor, marginBottom: '4px', fontStyle: 'italic' }}>{T.slogan}</div>
              <div style={{ fontSize: '12px', color: darkMode ? '#64748B' : '#94A3B8' }}>{T.sloganSub}</div>
            </div>
          </div>
        </div>

        {/* Right — stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {STATS_DATA.map((s, i) => (
            <StatBubble key={s.key} statKey={s.key} icon={s.icon} value={s.value} label={s.label} color={s.color} darkMode={darkMode} index={i} onClick={() => setOpenModal(s.key)} />
          ))}
          <div style={{ fontSize: '11px', color: darkMode ? '#64748B' : '#94A3B8', textAlign: 'center', marginTop: '4px' }}>
            {lang === 'fr' ? 'Cliquez sur une carte pour plus de détails' : 'Click a card for more details'}
          </div>
        </div>
      </div>

      {openModal && <StatModal statKey={openModal} lang={lang} darkMode={darkMode} onClose={() => setOpenModal(null)} />}

      <style>{`@keyframes sdiPulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </section>
  )
}
