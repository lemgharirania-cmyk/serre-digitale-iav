import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const TEXTS = [
  {
    titleFr: "Inauguration officielle \u2014 Mars 2024",
    titleEn: "Official Inauguration \u2014 March 2024",
    textFr: "Le complexe de serres intelligentes de l\u2019IAV Hassan II a été officiellement inauguré en mars 2024 en présence des autorités académiques et institutionnelles. Cet événement marque une étape décisive dans la modernisation de l\u2019enseignement agricole au Maroc.",
    textEn: "The IAV Hassan II smart greenhouse complex was officially inaugurated in March 2024 in the presence of academic and institutional authorities. This event marks a decisive step in the modernisation of agricultural education in Morocco.",
    syncPhoto: 1,
  },
  {
    titleFr: "La Serre Agro-Biotech \u2014 Un fleuron de l\u2019innovation",
    titleEn: "The Agro-Biotech Greenhouse \u2014 A Flagship of Innovation",
    longText: true,
    textFr:
      "Parmi les temps forts de cette inauguration figurait la Serre Agro-Biotech, la nouvelle serre expérimentale automatisée de l\u2019Institut, qui incarne les ambitions de l\u2019IAV Hassan II en matière d\u2019innovation, de recherche appliquée et d\u2019agriculture de précision." +
      "\n\n" +
      "Construite avec un budget de 13 millions de dirhams, cette plateforme haute technologie est dédiée à l\u2019étude et au développement de systèmes de production agricole innovants. Composée de cinq compartiments indépendants à conditions environnementales contrôlées, elle permet de mener des essais scientifiques dans des contextes variés tout en assurant un suivi précis des paramètres climatiques et agronomiques. La Serre Agro-Biotech offre aux chercheurs, enseignants et étudiants un cadre privilégié pour concevoir des solutions aux défis de la durabilité et de l\u2019adaptation au changement climatique.",
    textEn:
      "Among the highlights was the Agro-Biotech Greenhouse, the Institute\u2019s new automated experimental greenhouse, which embodies IAV Hassan II\u2019s ambitions in innovation, applied research and precision agriculture." +
      "\n\n" +
      "Built with a budget of 13 million dirhams, this high-technology platform is dedicated to the study and development of innovative agricultural production systems. Comprising five independent compartments with controlled environmental conditions, it enables scientific trials in varied contexts while ensuring precise monitoring of climatic and agronomic parameters. The Agro-Biotech Greenhouse offers researchers, teachers and students a privileged framework for designing solutions to the challenges of sustainability and climate change adaptation.",
  },
  {
    titleFr: "Insaf, chercheuse \u2014 Stress salin sur la courgette",
    titleEn: "Insaf, Researcher \u2014 Salt Stress on Zucchini",
    longText: true,
    textFr:
      "\u00ab Dans le cadre de mes travaux de recherche menés au sein de la serre High-Tech de l\u2019Institut Agronomique et Vétérinaire Hassan II, j\u2019ai travaillé sur l\u2019impact du stress salin sur la croissance et le développement de la courgette (Cucurbita pepo L.), une culture maraîchère largement cultivée et particulièrement importante pour la production sous serre. Cette recherche s\u2019inscrit dans un contexte marqué par la raréfaction des ressources en eau et l\u2019augmentation de la salinité dans plusieurs régions agricoles, des défis qui affectent directement la productivité des cultures. Grâce aux conditions contrôlées offertes par la serre High-Tech, j\u2019ai pu suivre l\u2019évolution des plantes dans un environnement stable et adapté à l\u2019expérimentation. Cette infrastructure constitue un véritable atout pour les chercheurs, car elle permet de mieux comprendre les réactions des cultures face aux contraintes environnementales et de contribuer au développement de pratiques agricoles plus résilientes et durables. \u00bb" +
      "\n\n" +
      "\u2014 Insaf, chercheuse",
    textEn:
      "\u00ab As part of my research conducted within the High-Tech greenhouse of the Institut Agronomique et Vétérinaire Hassan II, I studied the impact of salt stress on the growth and development of zucchini (Cucurbita pepo L.), a vegetable crop widely cultivated and particularly important for greenhouse production. This research is set against a backdrop of growing water scarcity and rising salinity in several agricultural regions \u2014 challenges that directly affect crop productivity. Thanks to the controlled conditions offered by the High-Tech greenhouse, I was able to monitor plant development in a stable environment well suited to experimentation. This infrastructure is a genuine asset for researchers, as it helps to better understand how crops respond to environmental constraints and contributes to the development of more resilient and sustainable agricultural practices. \u00bb" +
      "\n\n" +
      "\u2014 Insaf, Researcher",
    syncPhoto: 3,
  },
  {
    titleFr: "David A. Dumbuya \u2014 Irrigation magnétique & horticulture durable",
    titleEn: "David A. Dumbuya \u2014 Magnetic Irrigation & Sustainable Horticulture",
    longText: true,
    textFr:
      "\u00ab Dans le cadre de mon Master en Eau et Horticulture Durable, mes recherches portent sur l\u2019utilisation de l\u2019eau d\u2019irrigation traitée magnétiquement et son influence sur la croissance des cultures, la qualité de l\u2019eau et la réponse des plantes aux différents stress environnementaux. Mes travaux sont menés sur plusieurs cultures maraîchères, notamment la laitue, le concombre et la tomate, cultivées sous serre. La serre High-Tech de l\u2019Institut Agronomique et Vétérinaire Hassan II constitue un outil essentiel pour la réalisation de ces recherches. Grâce à ses infrastructures modernes et à son environnement contrôlé, elle permet de conduire les expérimentations dans des conditions optimales et d\u2019assurer un suivi rigoureux du développement des cultures. Cette plateforme contribue ainsi à améliorer la qualité des données collectées et à renforcer la fiabilité des résultats obtenus, tout en favorisant l\u2019innovation dans le domaine de l\u2019agriculture durable. \u00bb" +
      "\n\n" +
      "\u2014 David Alimamy Dumbuya, étudiant-chercheur en Master Eau et Horticulture Durable",
    textEn:
      "\u00ab As part of my Master\u2019s degree in Water and Sustainable Horticulture, my research focuses on the use of magnetically treated irrigation water and its influence on crop growth, water quality, and plant response to various environmental stresses. My work is conducted on several vegetable crops, notably lettuce, cucumber and tomato, grown under greenhouse conditions. The High-Tech greenhouse of the Institut Agronomique et Vétérinaire Hassan II is an essential tool for carrying out this research. Thanks to its modern infrastructure and controlled environment, it allows experiments to be conducted under optimal conditions and ensures rigorous monitoring of crop development. This platform helps improve the quality of the data collected and strengthens the reliability of the results obtained, while fostering innovation in the field of sustainable agriculture. \u00bb" +
      "\n\n" +
      "\u2014 David Alimamy Dumbuya, Master\u2019s student-researcher in Water and Sustainable Horticulture",
  },
  { titleFr: "À venir \u2014 Slide 5", titleEn: "Coming Soon \u2014 Slide 5", textFr: "Contenu à ajouter prochainement.", textEn: "Content to be added soon." },
]

const PHOTOS = [
  { src: "/complexe-exterieur.jpg",  labelFr: "Vue extérieure du complexe",     labelEn: "Complex exterior view"          },
  { src: "/visite-officielle.jpg",   labelFr: "Visite officielle - intérieur",  labelEn: "Official visit - interior"      },
  { src: "/inspection-cultures.jpg", labelFr: "Inspection des cultures",        labelEn: "Research crop inspection"       },
  { src: "/INSAF.jpeg",              labelFr: "Insaf - travaux en serre High-Tech", labelEn: "Insaf - High-Tech greenhouse work" },
]

export default function SectionApropos({ lang, darkMode }) {
  const [txtIdx,   setTxtIdx]   = useState(0)
  const [imgIdx,   setImgIdx]   = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [paused,   setPaused]   = useState(false)
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )

  // Track viewport for phone-only stacking
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Keep a ref so intervals can read the latest value without re-creating
  const pausedRef = useRef(false)
  useEffect(() => { pausedRef.current = paused }, [paused])

  const cardBg     = darkMode ? 'rgba(16,27,46,0.8)' : '#FFFFFF'
  const cardBorder = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const textColor  = darkMode ? '#F8FAFC' : '#0F172A'
  const textSecond = darkMode ? '#CBD5E1' : '#475569'
  const mutedColor = darkMode ? '#64748B' : '#94A3B8'

  // Text carousel — skips advance while paused
  useEffect(() => {
    const t1 = setInterval(() => {
      if (pausedRef.current) return
      setTxtIdx(i => (i + 1) % TEXTS.length)
      setExpanded(false)
    }, 5000)
    const t2 = setInterval(() => {
      if (pausedRef.current) return
      setImgIdx(i => (i + 1) % PHOTOS.length)
    }, 4500)
    return () => { clearInterval(t1); clearInterval(t2) }
  }, [])

  // Sync photo when text slide changes (only when not expanded)
  useEffect(() => {
    const cur = TEXTS[txtIdx]
    if (cur && cur.syncPhoto !== undefined) setImgIdx(cur.syncPhoto)
    // Don't reset expanded here — we're controlling it via the button
  }, [txtIdx])

  // Handle "Read more" / "Collapse" toggle
  function handleToggleExpanded() {
    const next = !expanded
    setExpanded(next)
    setPaused(next)   // pause while expanded, resume on collapse
  }

  const item   = TEXTS[txtIdx]
  const photo  = PHOTOS[imgIdx]
  const isLong = !!(item && item.longText)

  const sectionLabel = lang === 'fr' ? 'À Propos · Faits & Témoignages' : 'About · Facts & Testimonials'

  return (
    <section id="apropos" style={{ padding: isMobile ? '3rem 1rem' : '5rem 3rem', scrollMarginTop: '64px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: darkMode ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '100px', padding: '6px 18px', marginBottom: '1rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#22C55E', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{sectionLabel}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem', alignItems: 'start' }}>

          {/* ── Left — text carousel ── */}
          <div style={{ background: cardBg, border: '1px solid ' + cardBorder, borderRadius: '24px', padding: '2rem', position: 'relative', display: 'flex', flexDirection: 'column', backdropFilter: 'blur(16px)', boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)', height: '420px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#22C55E', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
              {lang === 'fr' ? 'Faits & Témoignages' : 'Facts & Testimonials'}
              {paused && (
                <span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: 600, color: mutedColor, textTransform: 'none', letterSpacing: 0 }}>
                  ⏸ {lang === 'fr' ? 'En pause' : 'Paused'}
                </span>
              )}
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 2.5rem', overflow: 'hidden', minHeight: 0 }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: textColor, marginBottom: '1rem', flexShrink: 0 }}>
                {lang === 'fr' ? item.titleFr : item.titleEn}
              </div>

              {isLong ? (
                <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <div style={{ flex: 1, overflowY: expanded ? 'auto' : 'hidden', fontSize: '13.5px', color: textSecond, lineHeight: 1.85, whiteSpace: 'pre-line', minHeight: 0 }}>
                    {lang === 'fr' ? item.textFr : item.textEn}
                  </div>
                  {!expanded && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4em', background: darkMode ? 'linear-gradient(to bottom, rgba(16,27,46,0), rgba(16,27,46,0.97))' : 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.97))', pointerEvents: 'none' }} />
                  )}
                  <button onClick={handleToggleExpanded} style={{ marginTop: '10px', flexShrink: 0, background: 'none', border: '1px solid rgba(34,197,94,0.5)', borderRadius: '6px', color: '#22C55E', fontSize: '12px', fontWeight: 700, cursor: 'pointer', padding: '4px 14px', alignSelf: 'flex-start' }}>
                    {expanded ? (lang === 'fr' ? 'Réduire ↑' : 'Collapse ↑') : (lang === 'fr' ? 'Lire la suite →' : 'Read more →')}
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: '14px', color: textSecond, lineHeight: 1.85 }}>
                  {lang === 'fr' ? item.textFr : item.textEn}
                </div>
              )}
            </div>

            <div style={{ height: '2px', background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: '1px', margin: '1.5rem 0 1rem', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#22C55E', borderRadius: '1px', width: ((txtIdx + 1) / TEXTS.length * 100) + '%', transition: 'width 0.4s ease' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '0.5rem' }}>
              {TEXTS.map((_, i) => (
                <div key={i} onClick={() => { setTxtIdx(i); setExpanded(false); setPaused(false) }} style={{ width: txtIdx === i ? '20px' : '6px', height: '6px', borderRadius: '3px', background: txtIdx === i ? '#22C55E' : mutedColor, cursor: 'pointer', transition: 'all 0.3s' }} />
              ))}
            </div>

            <button onClick={() => { setTxtIdx(i => (i - 1 + TEXTS.length) % TEXTS.length); setExpanded(false); setPaused(false) }} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '50%', background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', border: '1px solid ' + cardBorder, color: mutedColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => { setTxtIdx(i => (i + 1) % TEXTS.length); setExpanded(false); setPaused(false) }} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* ── Right — photo carousel (fixed square, crops to fit) ── */}
          <div style={{ background: cardBg, border: '1px solid ' + cardBorder, borderRadius: '24px', overflow: 'hidden', position: 'relative', backdropFilter: 'blur(16px)', boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.5)' : '0 4px 24px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', height: '420px' }}>
            {/* Image area fills remaining height — all photos cropped to fit */}
            <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
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
                  }}
                />
              ))}
              <div style={{ position: 'absolute', top: '12px', right: '12px', background: darkMode ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderRadius: '8px', padding: '4px 10px', fontSize: '12px', fontWeight: 600, color: textSecond, border: '1px solid ' + cardBorder, zIndex: 2 }}>
                {imgIdx + 1} / {PHOTOS.length}
              </div>
              <button onClick={() => setImgIdx(i => (i - 1 + PHOTOS.length) % PHOTOS.length)} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '34px', height: '34px', borderRadius: '50%', background: darkMode ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.88)', border: '1px solid ' + cardBorder, color: textSecond, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => setImgIdx(i => (i + 1) % PHOTOS.length)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(34,197,94,0.18)', border: '1px solid rgba(34,197,94,0.35)', color: '#22C55E', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                <ChevronRight size={15} />
              </button>
            </div>
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
