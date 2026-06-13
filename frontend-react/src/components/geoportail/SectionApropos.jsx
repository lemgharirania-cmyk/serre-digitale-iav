import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const TEXTS = [
  {
    titleFr: "Inauguration officielle — Mars 2024",
    titleEn: "Official Inauguration — March 2024",
    textFr: "Le complexe de serres intelligentes de l'IAV Hassan II a été officiellement inauguré en mars 2024 en présence des autorités académiques et institutionnelles. Cet événement marque une étape décisive dans la modernisation de l'enseignement agricole au Maroc.",
    textEn: "The IAV Hassan II smart greenhouse complex was officially inaugurated in March 2024 in the presence of academic and institutional authorities. This event marks a decisive step in the modernisation of agricultural education in Morocco.",
    syncPhoto: 1,
  },
  {
    titleFr: "La Serre Agro-Biotech — Un fleuron de l'innovation",
    titleEn: "The Agro-Biotech Greenhouse — A Flagship of Innovation",
    longText: true,
    textFr: `Parmi les temps forts de cette inauguration figurait la Serre Agro-Biotech, la nouvelle serre expérimentale automatisée de l'Institut, qui incarne les ambitions de l'IAV Hassan II en matière d'innovation, de recherche appliquée et d'agriculture de précision.

Construite avec un budget de 13 millions de dirhams, cette plateforme haute technologie est dédiée à l'étude et au développement de systèmes de production agricole innovants. Composée de cinq compartiments indépendants à conditions environnementales contrôlées, elle permet de mener des essais scientifiques dans des contextes variés tout en assurant un suivi précis des paramètres climatiques et agronomiques. La Serre Agro-Biotech offre aux chercheurs, enseignants et étudiants un cadre privilégié pour concevoir des solutions aux défis de la durabilité et de l'adaptation au changement climatique.`,
    textEn: `Among the highlights was the Agro-Biotech Greenhouse, the Institute's new automated experimental greenhouse, which embodies IAV Hassan II's ambitions in innovation, applied research and precision agriculture.

Built with a budget of 13 million dirhams, this high-technology platform is dedicated to the study and development of innovative agricultural production systems. Comprising five independent compartments with controlled environmental conditions, it enables scientific trials in varied contexts while ensuring precise monitoring of climatic and agronomic parameters. The Agro-Biotech Greenhouse offers researchers, teachers and students a privileged framework for designing solutions to the challenges of sustainability and climate change adaptation.`,
  },
  { titleFr: "À venir — Slide 3", titleEn: "Coming Soon — Slide 3", textFr: "Contenu à ajouter prochainement.", textEn: "Content to be added soon." },
  { titleFr: "À venir — Slide 4", titleEn: "Coming Soon — Slide 4", textFr: "Contenu à ajouter prochainement.", textEn: "Content to be added soon." },
  { titleFr: "À venir — Slide 5", titleEn: "Coming Soon — Slide 5", textFr: "Contenu à ajouter prochainement.", textEn: "Content to be added soon." },
]

const PHOTOS = [
  { src: "/complexe-exterieur.jpg",  labelFr: "Vue extérieure du complexe",    labelEn: "Complex exterior view"     },
  { src: "/visite-officielle.jpg",   labelFr: "Visite officielle - intérieur", labelEn: "Official visit - interior" },
  { src: "/inspection-cultures.jpg", labelFr: "Inspection des cultures",       labelEn: "Research crop inspection"  },
]

export default function SectionApropos({ lang, darkMode }) {
  const [txtIdx,   setTxtIdx]   = useState(0)
  const [imgIdx,   setImgIdx]   = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [paused,   setPaused]   = useState(false)

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
    <section id="apropos" style={{ padding: '5rem 3rem', scrollMarginTop: '64px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: darkMode ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '100px', padding: '6px 18px', marginBottom: '1rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#22C55E', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{sectionLabel}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>

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
