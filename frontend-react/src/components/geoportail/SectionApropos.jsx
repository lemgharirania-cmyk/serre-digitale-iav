// src/components/geoportail/SectionApropos.jsx
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const TEXTS = [
  {   titleFr:"5 Serres Connectées", titleEn:"5 Connected Greenhouses", textFr:"Le complexe AgroBioTech de l'IAV Hassan II dispose de 5 serres de recherche entièrement équipées de capteurs IoT pour le monitoring en temps réel.", textEn:"The AgroBioTech complex at IAV Hassan II has 5 research greenhouses fully equipped with IoT sensors for real-time monitoring." },
  {   titleFr:"10 Capteurs Actifs", titleEn:"10 Active Sensors", textFr:"Chaque serre est équipée de capteurs environnementaux (température, humidité, VPD, CO₂) et d'irrigation (pH, EC, température eau, niveau eau).", textEn:"Each greenhouse has environmental sensors (temperature, humidity, VPD, CO₂) and irrigation sensors (pH, EC, water temperature, water level)." },
  {   titleFr:"Vision du Projet", titleEn:"Project Vision", textFr:"Le jumeau numérique représente l'avenir de la recherche agronomique — une interface entre le monde physique des serres et la puissance du numérique.", textEn:"The digital twin represents the future of agronomic research — an interface between the physical world of greenhouses and the power of digital technology." },
  {   titleFr:"15 Scans Matterport", titleEn:"15 Matterport Scans", textFr:"Le campus a été entièrement numérisé avec 15 scans Matterport Pro 2, permettant une visite virtuelle immersive de chaque espace.", textEn:"The campus was fully digitized with 15 Matterport Pro 2 scans, enabling an immersive virtual tour of every space." },
  {   titleFr:"Projet de Fin d'Études", titleEn:"Final Year Project", textFr:"Ce géoportail est le fruit de mois de travail alliant géomatique, développement web et IoT — une fierté pour notre parcours d'ingénieur topographe.", textEn:"This geoportal is the result of months of work combining geomatics, web development and IoT — a proud achievement in our topographic engineering journey." },
  {   titleFr:"Collecte Automatique", titleEn:"Automatic Collection", textFr:"Les données sont collectées automatiquement toutes les 2 minutes, 24h/24, 7j/7, garantissant un historique complet pour l'analyse agronomique.", textEn:"Data is collected automatically every 2 minutes, 24/7, ensuring a complete history for agronomic analysis." },
  {   titleFr:"Témoignage Chercheur", titleEn:"Researcher Testimonial", longText:true, textFr:"Témoignage d'un chercheur utilisateur du complexe de serres

Dans le cadre des activités de recherche menées au sein du complexe de serres, plusieurs chercheurs bénéficient quotidiennement des infrastructures mises à disposition pour leurs expérimentations. Parmi eux, David Alimamy Dumbuya, étudiant en Master Water and Sustainable Horticulture, mène actuellement des travaux portant sur l'impact de l'eau d'irrigation traitée magnétiquement sur la croissance et le développement des cultures, la qualité de l'eau ainsi que les réponses des plantes aux différents stress environnementaux.

Ses expérimentations sont réalisées sous serre sur plusieurs cultures maraîchères, notamment la laitue, le concombre et la tomate. Selon lui, les infrastructures du complexe constituent un élément essentiel à la réussite de ses travaux :

Les installations de la serre jouent un rôle essentiel dans mes recherches en offrant un environnement contrôlé pour la conduite des expérimentations et le suivi de la croissance des plantes sous différents traitements et conditions de stress. Cette infrastructure permet une collecte de données précise et contribue à améliorer la fiabilité ainsi que la qualité des résultats obtenus.

Ce témoignage illustre l'importance des infrastructures de recherche du complexe, qui offrent aux étudiants, chercheurs et partenaires scientifiques un environnement adapté à la conduite d'expériences rigoureuses et à la production de résultats fiables dans le domaine de l'horticulture durable.", textEn:"Researcher Testimonial - Greenhouse Complex User

As part of research activities conducted within the greenhouse complex, several researchers benefit daily from the infrastructure made available for their experiments. Among them, David Alimamy Dumbuya, a Master's student in Water and Sustainable Horticulture, is currently conducting research on the impact of magnetically treated irrigation water on crop growth and development, water quality, and plant responses to various environmental stresses.

His experiments are carried out in greenhouses on several vegetable crops, including lettuce, cucumber, and tomato. According to him, the complex's infrastructure is an essential element for the success of his work:

The greenhouse facilities play an essential role in my research by providing a controlled environment for conducting experiments and monitoring plant growth under different treatments and stress conditions. This infrastructure enables precise data collection and contributes to improving the reliability and quality of the results obtained.

This testimonial illustrates the importance of the complex's research infrastructure, which offers students, researchers, and scientific partners an environment suited to rigorous experimentation and the production of reliable results in the field of sustainable horticulture." },
  {   titleFr:"Visite du Ministre - Mars 2026", titleEn:"Minister Visit - March 2026", longText:true, syncPhoto:2, textFr:"Le 17 mars 2026, lors de sa visite à l'Institut Agronomique et Vétérinaire Hassan II, Monsieur Ahmed El Bouari, ministre de l'Agriculture, de la Pêche maritime, du Développement rural et des Eaux et Forêts, a effectué une tournée des principales infrastructures pédagogiques et scientifiques récemment modernisées. Parmi les étapes marquantes figurait l'Agro-Biotech Greenhouse, la nouvelle serre expérimentale automatisée de l'Institut, qui incarne les ambitions de l'IAV Hassan II en matière d'innovation, de recherche appliquée et d'agriculture de précision.

Réalisée avec une enveloppe budgétaire de 13 millions de dirhams, cette infrastructure constitue une plateforme expérimentale de référence dédiée à l'étude et au développement de systèmes de production agricole innovants. Composée de cinq compartiments indépendants offrant des conditions environnementales contrôlées, elle permet de conduire des essais scientifiques dans des contextes variés tout en assurant un suivi précis des paramètres climatiques et agronomiques. L'Agro-Biotech Greenhouse offre aux chercheurs, enseignants et étudiants un cadre privilégié pour concevoir des solutions répondant aux enjeux de durabilité et d'adaptation aux changements climatiques.", textEn:"On March 17, 2026, during his visit to the Institut Agronomique et Veterinaire Hassan II, Mr. Ahmed El Bouari, Minister of Agriculture, Maritime Fisheries, Rural Development and Water and Forests, toured the main recently modernized educational and scientific infrastructure. Among the highlights was the Agro-Biotech Greenhouse, the Institute's new automated experimental greenhouse, which embodies IAV Hassan II's ambitions in innovation, applied research and precision agriculture.

Built with a budget of 13 million dirhams, this high-technology platform is dedicated to the study and development of innovative agricultural production systems. Comprising five independent compartments with controlled environmental conditions, it enables scientific trials in varied contexts while ensuring precise monitoring of climatic and agronomic parameters. The Agro-Biotech Greenhouse offers researchers, teachers and students a privileged framework for designing solutions to the challenges of sustainability and climate change adaptation." },
]

const PHOTOS = [
  {
    src: "/complexe-exterieur.jpg",
    labelFr: 'Vue extérieure du complexe',
    labelEn: 'Complex exterior view',
    ratio: '1/1',
  },
  {
    src: "/visite-officielle.jpg",
    labelFr: 'Visite officielle — intérieur serre',
    labelEn: 'Official visit — greenhouse interior',
    ratio: '3/2',
  },
  {
    src: "/inspection-cultures.jpg",
    labelFr: 'Inspection des cultures de recherche',
    labelEn: 'Research crop inspection',
    ratio: '14/9',
  },
]

export default function SectionApropos({ lang, darkMode }) {
  const [txtIdx, setTxtIdx] = useState(0)
  const [imgIdx, setImgIdx] = useState(0)
  const [expanded, setExpanded] = useState(false)

  const cardBg     = darkMode ? 'rgba(16,27,46,0.8)' : '#FFFFFF'
  const cardBorder = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const textColor  = darkMode ? '#F8FAFC' : '#0F172A'
  const textSecond = darkMode ? '#CBD5E1' : '#475569'
  const mutedColor = darkMode ? '#64748B' : '#94A3B8'

  const sectionLabel = lang === 'fr' ? 'À Propos · Faits & Témoignages' : 'About · Facts & Testimonials'

  useEffect(() => {
    const t1 = setInterval(() => { setTxtIdx(i => (i + 1) % TEXTS.length); setExpanded(false) }, 5000)
    const t2 = setInterval(() => setImgIdx(i => (i + 1) % PHOTOS.length), 4500)
    return () => { clearInterval(t1); clearInterval(t2) }
  }, [])

  useEffect(() => {
    const cur = TEXTS[txtIdx]
    if (cur && cur.syncPhoto !== undefined) setImgIdx(cur.syncPhoto)
    setExpanded(false)
  }, [txtIdx])

  const item  = TEXTS[txtIdx]
  const photo = PHOTOS[imgIdx]
  const isLong = !!(item && item.longText)

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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'stretch' }}>

          {/* ── Left — text carousel ── */}
          <div style={{
            background: cardBg,
            border: '1px solid ' + cardBorder,
            borderRadius: '24px', padding: '2rem', position: 'relative',
            display: 'flex', flexDirection: 'column',
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
              {isLong ? (
                <div style={{ position: 'relative' }}>
                  <div style={{
                    maxHeight: expanded ? '640px' : '9.5em',
                    overflow: 'hidden',
                    transition: 'max-height 0.45s ease',
                    fontSize: '13.5px', color: textSecond, lineHeight: 1.85,
                    whiteSpace: 'pre-line',
                  }}>
                    {lang === 'fr' ? item.textFr : item.textEn}
                  </div>
                  {!expanded && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, height: '4.5em',
                      background: darkMode
                        ? 'linear-gradient(to bottom, rgba(16,27,46,0), rgba(16,27,46,0.97))'
                        : 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.97))',
                      pointerEvents: 'none',
                    }} />
                  )}
                  <button
                    onClick={() => setExpanded(e => !e)}
                    style={{
                      marginTop: '10px', background: 'none',
                      border: '1px solid rgba(34,197,94,0.5)', borderRadius: '6px',
                      color: '#22C55E', fontSize: '12px', fontWeight: 700,
                      cursor: 'pointer', padding: '4px 14px', letterSpacing: '0.04em',
                    }}
                  >
                    {expanded
                      ? (lang === 'fr' ? 'Réduire ↑' : 'Collapse ↑')
                      : (lang === 'fr' ? 'Lire la suite →' : 'Read more →')}
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: '14px', color: textSecond, lineHeight: 1.85 }}>
                  {lang === 'fr' ? item.textFr : item.textEn}
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div style={{ height: '2px', background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: '1px', margin: '1.5rem 0 1rem', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#22C55E', borderRadius: '1px', width: ((txtIdx + 1) / TEXTS.length * 100) + '%', transition: 'width 0.4s ease' }} />
            </div>

            {/* Dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '0.5rem' }}>
              {TEXTS.map((_, i) => (
                <div key={i} onClick={() => setTxtIdx(i)} style={{ width: txtIdx === i ? '20px' : '6px', height: '6px', borderRadius: '3px', background: txtIdx === i ? '#22C55E' : mutedColor, cursor: 'pointer', transition: 'all 0.3s' }} />
              ))}
            </div>

            {/* Arrows */}
            <button onClick={() => { setTxtIdx(i => (i - 1 + TEXTS.length) % TEXTS.length); setExpanded(false) }} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '50%', background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', border: '1px solid ' + cardBorder, color: mutedColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => { setTxtIdx(i => (i + 1) % TEXTS.length); setExpanded(false) }} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* ── Right — real photo carousel ── */}
          <div style={{
            background: cardBg,
            border: '1px solid ' + cardBorder,
            borderRadius: '24px', overflow: 'hidden', position: 'relative',
            backdropFilter: 'blur(16px)',
            boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.5)' : '0 4px 24px rgba(0,0,0,0.08)',
            display: 'flex', flexDirection: 'column',
          }}>

            {/* Image container */}
            <div style={{
              position: 'relative',
              width: '100%',
              aspectRatio: photo.ratio,
              overflow: 'hidden',
            }}>
              {PHOTOS.map((p, i) => (
                <img
                  key={i}
                  src={p.src}
                  alt={lang === 'fr' ? p.labelFr : p.labelEn}
                  style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    objectFit: 'cover', objectPosition: 'center',
                    opacity: i === imgIdx ? 1 : 0,
                    transition: 'opacity 0.6s ease',
                    display: 'block',
                  }}
                />
              ))}

              {/* Counter badge */}
              <div style={{ position: 'absolute', top: '12px', right: '12px', background: darkMode ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderRadius: '8px', padding: '4px 10px', fontSize: '12px', fontWeight: 600, color: textSecond, fontFamily: "'Outfit',sans-serif", border: '1px solid ' + cardBorder, zIndex: 2 }}>
                {imgIdx + 1} / {PHOTOS.length}
              </div>

              {/* Arrows */}
              <button onClick={() => setImgIdx(i => (i - 1 + PHOTOS.length) % PHOTOS.length)} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '34px', height: '34px', borderRadius: '50%', background: darkMode ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.88)', border: '1px solid ' + cardBorder, color: textSecond, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, backdropFilter: 'blur(8px)' }}>
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => setImgIdx(i => (i + 1) % PHOTOS.length)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(34,197,94,0.18)', border: '1px solid rgba(34,197,94,0.35)', color: '#22C55E', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, backdropFilter: 'blur(8px)' }}>
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Caption + dots */}
            <div style={{ padding: '14px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', borderTop: '1px solid ' + cardBorder, background: darkMode ? 'rgba(7,17,31,0.6)' : 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)' }}>
              <span style={{ fontSize: '12px', color: textSecond, fontStyle: 'italic', lineHeight: 1.4, flex: 1 }}>
                {lang === 'fr' ? photo.labelFr : photo.labelEn}
              </span>
              <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                {PHOTOS.map((_, i) => (
                  <div key={i} onClick={() => setImgIdx(i)} style={{ width: imgIdx === i ? '18px' : '5px', height: '5px', borderRadius: '3px', background: imgIdx === i ? '#22C55E' : mutedColor, cursor: 'pointer', transition: 'all 0.3s' }} />
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
