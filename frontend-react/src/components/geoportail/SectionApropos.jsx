// src/components/geoportail/SectionApropos.jsx
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const TEXTS = [
  { titleFr:'5 Serres Connectées',    titleEn:'5 Connected Greenhouses',   textFr:"Le complexe AgroBioTech de l'IAV Hassan II dispose de 5 serres de recherche entièrement équipées de capteurs IoT pour le monitoring en temps réel.", textEn:'The AgroBioTech complex at IAV Hassan II has 5 research greenhouses fully equipped with IoT sensors for real-time monitoring.' },
  { titleFr:'10 Capteurs Actifs',     titleEn:'10 Active Sensors',          textFr:'Chaque serre est équipée de capteurs environnementaux (température, humidité, VPD, CO₂) et d\'irrigation (pH, EC, température eau, niveau eau).', textEn:'Each greenhouse has environmental sensors (temperature, humidity, VPD, CO₂) and irrigation sensors (pH, EC, water temperature, water level).' },
  { titleFr:'Vision du Projet',       titleEn:'Project Vision',             textFr:'"Le jumeau numérique représente l\'avenir de la recherche agronomique — une interface entre le monde physique des serres et la puissance du numérique."', textEn:'"The digital twin represents the future of agronomic research — an interface between the physical world of greenhouses and the power of digital technology."' },
  { titleFr:'15 Scans Matterport',    titleEn:'15 Matterport Scans',        textFr:'Le campus a été entièrement numérisé avec 15 scans Matterport Pro 2, permettant une visite virtuelle immersive de chaque espace.', textEn:'The campus was fully digitized with 15 Matterport Pro 2 scans, enabling an immersive virtual tour of every space.' },
  { titleFr:"Projet de Fin d'Études", titleEn:'Final Year Project',         textFr:'"Ce géoportail est le fruit de mois de travail alliant géomatique, développement web et IoT — une fierté pour notre parcours d\'ingénieur topographe."', textEn:'"This geoportal is the result of months of work combining geomatics, web development and IoT — a proud achievement in our topographic engineering journey."' },
  { titleFr:'Collecte Automatique',   titleEn:'Automatic Collection',       textFr:'Les données sont collectées automatiquement toutes les 2 minutes, 24h/24, 7j/7, garantissant un historique complet pour l\'analyse agronomique.', textEn:'Data is collected automatically every 2 minutes, 24/7, ensuring a complete history for agronomic analysis.' },
]

const PHOTOS = [
  { labelFr:'Vue extérieure du complexe',    labelEn:'Complex exterior view' },
  { labelFr:'Intérieur serre Génétique',     labelEn:'Genetics greenhouse interior' },
  { labelFr:'Capteurs IoT installés',        labelEn:'Installed IoT sensors' },
  { labelFr:'Campus AgroBioTech aérien',     labelEn:'AgroBioTech campus aerial view' },
  { labelFr:"Équipe de recherche",           labelEn:'Research team' },
]

export default function SectionApropos({ lang, darkMode }) {
  const [txtIdx, setTxtIdx] = useState(0)
  const [imgIdx, setImgIdx] = useState(0)

  const cardBg     = darkMode ? 'rgba(16,27,46,0.8)' : '#FFFFFF'
  const cardBorder = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const textColor  = darkMode ? '#F8FAFC' : '#0F172A'
  const textSecond = darkMode ? '#CBD5E1' : '#475569'
  const mutedColor = darkMode ? '#64748B' : '#94A3B8'

  const sectionLabel = lang === 'fr' ? 'À Propos · Faits & Témoignages' : 'About · Facts & Testimonials'

  // Auto-advance carousels
  useEffect(() => {
    const t1 = setInterval(() => setTxtIdx(i => (i + 1) % TEXTS.length), 5000)
    const t2 = setInterval(() => setImgIdx(i => (i + 1) % PHOTOS.length), 4000)
    return () => { clearInterval(t1); clearInterval(t2) }
  }, [])

  const item  = TEXTS[txtIdx]
  const photo = PHOTOS[imgIdx]

  return (
    <section id="apropos" style={{ padding: '5rem 3rem', scrollMarginTop: '64px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Section title */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: darkMode ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '100px', padding: '6px 18px', marginBottom: '1rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#22C55E', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{sectionLabel}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Left — text carousel */}
          <div style={{
            background: cardBg, border: `1px solid ${cardBorder}`,
            borderRadius: '24px', padding: '2rem', position: 'relative',
            minHeight: '340px', display: 'flex', flexDirection: 'column',
            backdropFilter: 'blur(16px)',
            boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#22C55E', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
              {lang === 'fr' ? 'Faits & Témoignages' : 'Facts & Testimonials'}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 2.5rem' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: textColor, marginBottom: '1rem', fontFamily: "'Outfit',sans-serif" }}>
                {lang === 'fr' ? item.titleFr : item.titleEn}
              </div>
              <div style={{ fontSize: '14px', color: textSecond, lineHeight: 1.85 }}>
                {lang === 'fr' ? item.textFr : item.textEn}
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ height: '2px', background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: '1px', margin: '1.5rem 0 1rem', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#22C55E', borderRadius: '1px', width: `${((txtIdx + 1) / TEXTS.length) * 100}%`, transition: 'width 0.4s ease' }} />
            </div>
            {/* Dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '0.5rem' }}>
              {TEXTS.map((_, i) => (
                <div key={i} onClick={() => setTxtIdx(i)} style={{ width: txtIdx === i ? '20px' : '6px', height: '6px', borderRadius: '3px', background: txtIdx === i ? '#22C55E' : mutedColor, cursor: 'pointer', transition: 'all 0.3s' }} />
              ))}
            </div>
            {/* Arrows */}
            <button onClick={() => setTxtIdx(i => (i - 1 + TEXTS.length) % TEXTS.length)} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '50%', background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', border: `1px solid ${cardBorder}`, color: mutedColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setTxtIdx(i => (i + 1) % TEXTS.length)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Right — photo carousel */}
          <div style={{
            background: cardBg, border: `1px solid ${cardBorder}`,
            borderRadius: '24px', overflow: 'hidden', position: 'relative',
            minHeight: '340px', backdropFilter: 'blur(16px)',
            boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)',
          }}>
            {/* Photo placeholder */}
            <div style={{
              height: '100%', minHeight: '340px',
              background: darkMode
                ? 'linear-gradient(135deg,#060d14,#0a1628)'
                : 'linear-gradient(135deg,#ECF3EE,#F4F7F5)',
              backgroundImage: `linear-gradient(${darkMode ? 'rgba(34,197,94,0.04)' : 'rgba(34,197,94,0.06)'} 1px,transparent 1px),linear-gradient(90deg,${darkMode ? 'rgba(34,197,94,0.04)' : 'rgba(34,197,94,0.06)'} 1px,transparent 1px)`,
              backgroundSize: '30px 30px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '2rem',
            }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: darkMode ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={mutedColor} strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
              </div>
              <div style={{ fontSize: '13px', color: textSecond, textAlign: 'center' }}>
                {lang === 'fr' ? photo.labelFr : photo.labelEn}
              </div>
              <div style={{ fontSize: '11px', color: mutedColor, background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: `1px solid ${cardBorder}`, borderRadius: '8px', padding: '5px 12px' }}>
                {lang === 'fr' ? 'Photo à insérer' : 'Insert photo here'}
              </div>
            </div>

            {/* Counter */}
            <div style={{ position: 'absolute', top: '12px', right: '12px', background: darkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderRadius: '8px', padding: '4px 10px', fontSize: '12px', color: textSecond, fontFamily: "'Outfit',sans-serif", border: `1px solid ${cardBorder}` }}>
              {imgIdx + 1} / {PHOTOS.length}
            </div>

            {/* Dots */}
            <div style={{ position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '5px' }}>
              {PHOTOS.map((_, i) => (<div key={i} onClick={() => setImgIdx(i)} style={{ width: imgIdx === i ? '16px' : '5px', height: '5px', borderRadius: '3px', background: imgIdx === i ? '#22C55E' : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.3s' }} />))}
            </div>

            {/* Arrows */}
            <button onClick={() => setImgIdx(i => (i - 1 + PHOTOS.length) % PHOTOS.length)} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '50%', background: darkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)', border: `1px solid ${cardBorder}`, color: textSecond, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setImgIdx(i => (i + 1) % PHOTOS.length)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22C55E', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
