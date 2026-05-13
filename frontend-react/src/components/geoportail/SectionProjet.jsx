// src/components/geoportail/SectionProjet.jsx
import { useState, useEffect } from 'react'
import { Wifi, Activity, Clock } from 'lucide-react'

const STATS = [
  { key: 'serres',   valueFr: '5',    labelFr: 'Serres connectées',   labelEn: 'Connected greenhouses', icon: Wifi },
  { key: 'capteurs', valueFr: '10',   labelFr: 'Capteurs actifs',     labelEn: 'Active sensors',        icon: Activity },
  { key: 'mesures',  valueFr: null,   labelFr: "Mesures aujourd'hui", labelEn: 'Measures today',         icon: Activity },
  { key: 'monitoring',valueFr:'24/7', labelFr: 'Monitoring continu',  labelEn: 'Continuous monitoring', icon: Clock },
]

function StatBubble({ icon: Icon, value, label, color, darkMode, index }) {
  const [hover, setHover] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), index * 120)
    return () => clearTimeout(timer)
  }, [index])

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: darkMode
          ? (hover ? `${color}18` : 'rgba(16,27,46,0.8)')
          : (hover ? `${color}10` : '#FFFFFF'),
        border: `1px solid ${hover ? color + '40' : (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
        borderRadius: '18px', padding: '20px 18px',
        display: 'flex', alignItems: 'center', gap: '14px',
        backdropFilter: 'blur(10px)',
        boxShadow: hover
          ? `0 12px 36px ${color}20, 0 0 0 1px ${color}20`
          : darkMode ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)',
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        transform: mounted
          ? (hover ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)')
          : 'translateY(16px)',
        opacity: mounted ? 1 : 0,
        animation: `statFloat${(index % 3) + 1} ${3 + index * 0.4}s ease-in-out infinite`,
        cursor: 'default',
      }}
    >
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
        background: `${color}15`, border: `1px solid ${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: '1.8rem', fontWeight: 900, color, fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: '12px', color: darkMode ? '#64748B' : '#94A3B8', marginTop: '3px', fontWeight: 500 }}>
          {label}
        </div>
      </div>
      <div style={{ marginLeft: 'auto', width: '3px', height: '36px', borderRadius: '2px', background: `linear-gradient(to bottom, ${color}, transparent)` }} />
    </div>
  )
}

export default function SectionProjet({ lang, stats, darkMode }) {
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

  const statValues = ['5', '10', mesures24h, '24/7']
  const statLabels = lang === 'fr'
    ? ["Serres connectées", "Capteurs actifs", "Mesures aujourd'hui", "Monitoring continu"]
    : ["Connected greenhouses", "Active sensors", "Measures today", "Continuous monitoring"]
  const statColors = ['#22C55E', '#06B6D4', '#F59E0B', '#8B5CF6']
  const statIcons  = [Wifi, Activity, Activity, Clock]

  const textColor   = darkMode ? '#F8FAFC' : '#0F172A'
  const textSecond  = darkMode ? '#CBD5E1' : '#475569'
  const cardBg      = darkMode ? 'rgba(16,27,46,0.8)' : '#FFFFFF'
  const cardBorder  = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  return (
    <section id="projet" style={{ padding: '5rem 3rem', scrollMarginTop: '64px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2.5rem', alignItems: 'start' }}>

        {/* Left — intro */}
        <div style={{
          background: cardBg, border: `1px solid ${cardBorder}`,
          borderRadius: '24px', padding: '2.5rem',
          backdropFilter: 'blur(16px)',
          boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E', display: 'inline-block', animation: 'hdrPulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#22C55E', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{T.badge}</span>
          </div>

          <h1 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, color: textColor, fontFamily: "'Outfit',sans-serif", letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '1.5rem' }}>
            {T.title1}<br />
            <span style={{ background: 'linear-gradient(135deg,#22C55E,#06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{T.title2}</span>
          </h1>

          <p style={{ fontSize: '15px', color: textSecond, lineHeight: 1.9, marginBottom: '1.25rem' }}>{T.p1}</p>
          <p style={{ fontSize: '15px', color: textSecond, lineHeight: 1.9, marginBottom: '2rem' }}>{T.p2}</p>

          {/* Slogan */}
          <div style={{
            background: darkMode ? 'rgba(34,197,94,0.07)' : 'rgba(34,197,94,0.06)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: '16px', padding: '18px 20px',
            display: 'flex', gap: '14px', alignItems: 'flex-start',
          }}>
            <div style={{ width: '3px', height: '100%', minHeight: '36px', background: 'linear-gradient(to bottom,#22C55E,#06B6D4)', borderRadius: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: textColor, marginBottom: '4px', fontStyle: 'italic' }}>{T.slogan}</div>
              <div style={{ fontSize: '11px', color: darkMode ? '#64748B' : '#94A3B8' }}>{T.sloganSub}</div>
            </div>
          </div>
        </div>

        {/* Right — stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {statValues.map((val, i) => (
            <StatBubble key={i} icon={statIcons[i]} value={val} label={statLabels[i]} color={statColors[i]} darkMode={darkMode} index={i} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes statFloat1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes statFloat2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes statFloat3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes hdrPulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </section>
  )
}
