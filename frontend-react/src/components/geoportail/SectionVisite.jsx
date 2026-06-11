import { useEffect, useState, useRef } from 'react'

/* ─────────────────────── DATA ─────────────────────── */
const VISITE_MODES = [
  {
    id: 'manual',
    title: { fr: 'Visite manuelle', en: 'Manual Tour' },
    desc:  { fr: "Explorez librement l'ensemble du campus à votre rythme", en: 'Explore the entire campus freely at your own pace' },
    sub:   { fr: 'Libre · Campus complet · 360°', en: 'Free · Full campus · 360°' },
    file:  '/walkthrough/visitemanuelle.html',
    color: '#06B6D4',
    tag:   { fr: 'Libre', en: 'Free' },
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
      </svg>
    ),
  },
]

const SERRES = [
  { title: { fr: 'Génétique',              en: 'Genetics'         }, badge: 'S01', file: '/walkthrough/serregenetique.html',    color: '#22C55E', desc: 'Sélection variétale · Culture in vitro' },
  { title: { fr: 'Horticulture',           en: 'Horticulture'     }, badge: 'S02', file: '/walkthrough/serrehorticulture.html', color: '#06B6D4', desc: 'Production florale · Maraîchage'       },
  { title: { fr: 'Agronomie',              en: 'Agronomy'         }, badge: 'S03', file: '/walkthrough/serreagronomie.html',    color: '#F59E0B', desc: 'Essais culturaux · Recherche'          },
  { title: { fr: 'Hydroponie',             en: 'Hydroponics'      }, badge: 'S04', file: '/walkthrough/serrehydroponie.html',   color: '#8B5CF6', desc: 'Culture hors-sol · NFT & DWC'          },
  { title: { fr: 'Protection des plantes', en: 'Plant Protection' }, badge: 'S05', file: '/walkthrough/serreprotection.html',   color: '#EF4444', desc: 'Phytopathologie · Entomologie'         },
]

const BLOC_TECHNIQUE = [
  { title: { fr: 'Salle de contrôle',    en: 'Control Room'   }, badge: 'TC', file: '/walkthrough/salledecontrole.html',    color: '#3B82F6', desc: 'Supervision & automatisation' },
  { title: { fr: 'Salle de fertigation', en: 'Fertigation'    }, badge: 'TF', file: '/walkthrough/salledefertigation.html', color: '#14B8A6', desc: 'Solutions nutritives'          },
  { title: { fr: 'Salle de lavage',      en: 'Washing Room'   }, badge: 'TL', file: '/walkthrough/salledelavage.html',      color: '#F97316', desc: 'Nettoyage du matériel'         },
  { title: { fr: 'Salle de préparation', en: 'Preparation'    }, badge: 'TP', file: '/walkthrough/salledepreparation.html', color: '#A855F7', desc: 'Préparation des cultures'      },
  { title: { fr: 'Local technique',      en: 'Equipment Room' }, badge: 'LT', file: '/walkthrough/localtechnique.html',     color: '#64748B', desc: 'Stockage équipements'          },
  { title: { fr: 'Extérieur',            en: 'Exterior'       }, badge: 'EX', file: '/walkthrough/exterieur.html',          color: '#22C55E', desc: 'Vue extérieure du campus'      },
]

const TIMELINE_NODES = [
  { id: 'globe',  color: '#8B5CF6', iconPath: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 0v20M2 12h20M4.93 4.93C7 9 7 15 12 17c5-2 5-8 7.07-12.07M4.93 19.07C7 15 7 9 12 7c5 2 5 8 7.07 12.07' },
  { id: 'tours',  color: '#22C55E', iconPath: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10' },
  { id: 'salles', color: '#F59E0B', iconPath: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z' },
]

/* ─────────────────────── MAIN ─────────────────────── */
export default function SectionVisite({ darkMode = true, lang = 'fr' }) {
  const [activeNode,   setActiveNode]  = useState('globe')
  const [hovNode,      setHovNode]     = useState(null)
  const [activeTour,   setActiveTour]  = useState(null)
  const [activeSerre,  setActiveSerre] = useState(null)
  const [activeBloc,   setActiveBloc]  = useState(null)
  const [hovered,      setHovered]     = useState(null)
  const [globeKey,     setGlobeKey]    = useState(0)
  const [globeEnded,   setGlobeEnded]  = useState(false)
  const [lineProgress, setLineProgress] = useState(0)
  const [particleTick, setParticleTick] = useState(0)    // drives particle animation
  const [vrSupported,  setVrSupported]  = useState(null) // null=checking, true, false

  const globeRef       = useRef(null)
  const toursRef       = useRef(null)
  const sallesRef      = useRef(null)
  const tourViewerRef  = useRef(null)
  const serreViewerRef = useRef(null)
  const blocViewerRef  = useRef(null)

  const isDark      = darkMode
  const ink         = isDark ? '#F1F5F9' : '#0F172A'
  const inkSub      = isDark ? '#94A3B8' : '#64748B'
  const glass       = isDark ? 'rgba(11,23,40,0.72)'    : 'rgba(255,255,255,0.78)'
  const glassBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'
  const trackBg     = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

  const T = {
    badge:        lang === 'fr' ? 'Visite 360° · Insta360 X4' : '360° Tour · Insta360 X4',
    h1:           lang === 'fr' ? 'Explorez'    : 'Explore',
    h2:           lang === 'fr' ? 'le Campus'  : 'the Campus',
    sub:          lang === 'fr'
      ? 'Naviguez librement dans les 5 serres de recherche et les espaces techniques du campus AgroBioTech IAV Hassan II.'
      : 'Navigate freely through the 5 research greenhouses and technical spaces of the AgroBioTech IAV Hassan II campus.',
    nodeGlobe:    lang === 'fr' ? 'Survol satellite' : 'Satellite',
    nodeTours:    lang === 'fr' ? 'Campus complet'  : 'Full campus',
    nodeSalles:   lang === 'fr' ? 'Par espace'      : 'By space',
    globeTitle:   lang === 'fr' ? 'Survol du campus' : 'Campus overview',
    globeSub:     lang === 'fr' ? 'Vue satellite interactive — campus IAV Hassan II, Rabat' : 'Interactive satellite view — IAV Hassan II campus, Rabat',
    tourTitle:    lang === 'fr' ? 'Campus complet' : 'Full campus tour',
    tourSub:      lang === 'fr' ? 'Explorer le campus complet' : 'Explore the whole campus',
    sallesTitle:  lang === 'fr' ? 'Explorer par espace' : 'Explore by space',
    sallesSub:    lang === 'fr' ? 'Sélectionnez une serre ou un local technique' : 'Select a greenhouse or technical space',
    serresLabel:  lang === 'fr' ? 'Serres de recherche' : 'Research Greenhouses',
    blocLabel:    lang === 'fr' ? 'Bloc technique'      : 'Technical Block',
    launch:       lang === 'fr' ? 'Lancer'              : 'Launch',
    full:         lang === 'fr' ? 'Plein écran'         : 'Fullscreen',
    exitFull:     lang === 'fr' ? 'Quitter le plein écran' : 'Exit fullscreen',
    live:         lang === 'fr' ? 'Visite 360°'         : '360° Tour',
    selectTour:   lang === 'fr' ? 'Sélectionnez un mode ci-dessus'       : 'Select a mode above',
    selectSalle:  lang === 'fr' ? 'Sélectionnez un espace pour commencer' : 'Select a space to begin',
    vrReady:      lang === 'fr' ? 'Compatible Meta Quest' : 'Meta Quest ready',
    vrReadySub:   lang === 'fr' ? 'Ouvrez ce site depuis votre casque — tous les viewers sont en VR immersif' : 'Open this site from your headset — all viewers support immersive VR',
    vrDesktop:    lang === 'fr' ? 'Expérience VR disponible' : 'VR experience available',
    vrDesktopSub: lang === 'fr' ? 'Visitez ce site depuis un Meta Quest pour une immersion 360° complète' : 'Visit this site from a Meta Quest headset for full 360° immersion',
    globeEndTitle:  lang === 'fr' ? 'Survol terminé'                          : 'Flyover complete',
    globeEndSub:    lang === 'fr' ? 'Que souhaitez-vous faire ensuite ?'       : 'What would you like to do next?',
    replayLabel:    lang === 'fr' ? 'Rejouer le survol'                        : 'Replay flyover',
    replayDesc:     lang === 'fr' ? 'Relancer le survol satellite du campus'   : 'Restart the campus satellite flyover',
    fullTourLabel:  lang === 'fr' ? 'Visite complète'                          : 'Full campus tour',
    fullTourDesc:   lang === 'fr' ? 'Explorer le campus complet en mode 360°'  : 'Explore the full campus in 360° mode',
    bySpaceLabel:   lang === 'fr' ? 'Explorer par espace'                      : 'Explore by space',
    bySpaceDesc:    lang === 'fr' ? 'Choisir une serre ou un local technique'  : 'Pick a greenhouse or technical space',
  }

  /* ── Listen for globe flyover end ── */
  useEffect(() => {
    function onMessage(e) {
      if (e.data === 'globeEnd') setGlobeEnded(true)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  /* ── Listen to selectSerre event from SectionPlan2D ── */
  useEffect(() => {
    function onSelectSerre(e) {
      const { id } = e.detail           // ex: 'S01', 'S02' …
      // Map zone id → serre file
      const serre = SERRES.find(s => s.badge === id)
      if (!serre) return
      // Activate "par espace" node in timeline
      setActiveNode('salles')
      setLineProgress(100)
      // Select the serre → triggers viewer
      setActiveSerre(serre.file)
      // Small delay to let React render the viewer before scrolling
      setTimeout(() => {
        serreViewerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 120)
    }
    window.addEventListener('selectSerre', onSelectSerre)
    return () => window.removeEventListener('selectSerre', onSelectSerre)
  }, [])

  /* ── WebXR VR detection ── */
  useEffect(() => {
    if (!navigator.xr) { setVrSupported(false); return }
    navigator.xr.isSessionSupported('immersive-vr')
      .then(supported => setVrSupported(supported))
      .catch(() => setVrSupported(false))
  }, [])

  /* ── scroll → active node ── */
  useEffect(() => {
    function onScroll() {
      const pairs = [
        { ref: globeRef,  id: 'globe',  prog: 0   },
        { ref: toursRef,  id: 'tours',  prog: 50  },
        { ref: sallesRef, id: 'salles', prog: 100 },
      ]
      const midY = window.innerHeight * 0.45
      let best = pairs[0]
      pairs.forEach(p => {
        if (!p.ref.current) return
        if (p.ref.current.getBoundingClientRect().top <= midY) best = p
      })
      setActiveNode(best.id)
      setLineProgress(best.prog)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ── particle ticker (drives moving particle on timeline) ── */
  useEffect(() => {
    const id = setInterval(() => setParticleTick(t => t + 1), 50)
    return () => clearInterval(id)
  }, [])

  function scrollSmooth(ref, delay = 0) {
    setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), delay)
  }

  function pickTour(mode)  { setActiveTour(mode.file);  scrollSmooth(tourViewerRef,  80) }
  function pickSerre(file) { setActiveSerre(file);       scrollSmooth(serreViewerRef, 80) }
  function pickBloc(file)  { setActiveBloc(file);        scrollSmooth(blocViewerRef,  80) }

  function replayGlobe() {
    setGlobeKey(k => k + 1)
    setGlobeEnded(false)
  }
  function goToFullTour() {
    setActiveNode('tours')
    setLineProgress(50)
    if (VISITE_MODES[0]) pickTour(VISITE_MODES[0])
    scrollSmooth(toursRef, 80)
  }
  function goToSpaces() {
    setActiveNode('salles')
    setLineProgress(100)
    scrollSmooth(sallesRef, 80)
  }

  const nodeRefs     = { globe: globeRef, tours: toursRef, salles: sallesRef }
  function jumpTo(id){ scrollSmooth(nodeRefs[id]) }

  const activeTourObj  = VISITE_MODES.find(m => m.file === activeTour)
  const activeSerreObj = SERRES.find(s => s.file === activeSerre)
  const activeBlocObj  = BLOC_TECHNIQUE.find(s => s.file === activeBloc)

  /* particle position along progress line (oscillates a bit ahead of progress) */
  const particleX = Math.min(lineProgress + 2, 100)

  return (
    <section id="visite" style={{ padding: '7rem 2rem 6rem', scrollMarginTop: '64px' }}>
      <div style={{ maxWidth: '1160px', margin: '0 auto' }}>

        {/* ══ HEADER ══ */}
        <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px',
            background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: '100px', padding: '5px 18px', marginBottom: '1.2rem',
          }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#8B5CF6', display: 'inline-block', animation: 'vPulse 2s infinite' }} />
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#8B5CF6', letterSpacing: '0.13em', textTransform: 'uppercase', fontFamily: "'Outfit',sans-serif" }}>
              {T.badge}
            </span>
          </div>
          <h2 style={{ fontSize: 'clamp(2.6rem,5vw,3.8rem)', fontWeight: 900, lineHeight: 1.0, fontFamily: "'Outfit',sans-serif", letterSpacing: '-0.05em', color: ink, margin: '0 0 1.1rem' }}>
            <span style={{ color: '#22C55E' }}>{T.h1}</span> {T.h2}
          </h2>
          <p style={{ fontSize: '15px', color: inkSub, maxWidth: '500px', margin: '0 auto', lineHeight: 1.9 }}>
            {T.sub}
          </p>
        </div>

        {/* ══ VR BANNER ══ */}
        {vrSupported !== null && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            marginBottom: '2.5rem',
            padding: '14px 20px',
            borderRadius: '16px',
            border: vrSupported
              ? '1px solid rgba(139,92,246,0.3)'
              : `1px solid ${glassBorder}`,
            background: vrSupported
              ? 'rgba(139,92,246,0.08)'
              : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
          }}>
            {/* VR headset icon */}
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
              background: vrSupported ? 'rgba(139,92,246,0.15)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
              border: `1px solid ${vrSupported ? 'rgba(139,92,246,0.3)' : glassBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke={vrSupported ? '#8B5CF6' : inkSub}
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8z"/>
                <circle cx="8.5" cy="12" r="1.5"/><circle cx="15.5" cy="12" r="1.5"/>
                <path d="M10 12h4"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '12px', fontWeight: 700,
                color: vrSupported ? '#8B5CF6' : ink,
                fontFamily: "'Outfit',sans-serif",
                marginBottom: '2px',
              }}>
                {vrSupported ? T.vrReady : T.vrDesktop}
              </div>
              <div style={{ fontSize: '11px', color: inkSub, lineHeight: 1.6 }}>
                {vrSupported ? T.vrReadySub : T.vrDesktopSub}
              </div>
            </div>
            {/* live dot if VR active */}
            {vrSupported && (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexShrink: 0
    }}
  >
    <span
      style={{
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        background: '#8B5CF6',
        boxShadow: '0 0 8px rgba(139,92,246,0.8)',
        display: 'inline-block',
        animation: 'vPulse 2s infinite'
      }}
    />

    <a
      href="/walkthrough/visitevr.html"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        fontWeight: 600,
        textDecoration: 'none',
        color: 'rgb(139,92,246)',
        background: 'rgba(139,92,246,0.1)',
        border: '1px solid rgba(139,92,246,0.3)',
        borderRadius: '8px',
        padding: '5px 12px',
        boxShadow: 'rgba(139,92,246,0.28) 0px 0px 16px',
      }}
    >
      Entrer en VR
    </a>
  </div>
)}
          </div>
        )}

        {/* ══ STICKY TIMELINE ══ */}
        <div style={{ position: 'sticky', top: '68px', zIndex: 40, marginBottom: '5rem' }}>
          <div style={{
            background: isDark ? 'rgba(5,12,26,0.88)' : 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(24px)',
            border: `1px solid ${glassBorder}`,
            borderRadius: '24px',
            padding: '0 40px',
            boxShadow: isDark
              ? `0 8px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)`
              : '0 4px 28px rgba(0,0,0,0.09)',
            overflow: 'hidden',
            position: 'relative',
          }}>

            {/* ambient glow behind active node */}
            <div style={{
              position: 'absolute', top: 0, bottom: 0, pointerEvents: 'none',
              left: activeNode === 'globe' ? '0%' : activeNode === 'tours' ? '33%' : '66%',
              width: '34%',
              background: activeNode === 'globe'
                ? 'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.12) 0%, transparent 70%)'
                : activeNode === 'tours'
                ? 'radial-gradient(ellipse at 50% 50%, rgba(34,197,94,0.1) 0%, transparent 70%)'
                : 'radial-gradient(ellipse at 50% 50%, rgba(245,158,11,0.1) 0%, transparent 70%)',
              transition: 'left 0.5s cubic-bezier(0.4,0,0.2,1)',
            }} />

            <div style={{ display: 'flex', alignItems: 'stretch', position: 'relative', zIndex: 2 }}>
              {TIMELINE_NODES.map((node, i) => {
                const isActive = activeNode === node.id
                const isPast   = TIMELINE_NODES.findIndex(n => n.id === activeNode) > i
                const isHov    = hovNode === node.id
                const lit      = isActive || isPast

                return (
                  <button
                    key={node.id}
                    onClick={() => jumpTo(node.id)}
                    onMouseEnter={() => setHovNode(node.id)}
                    onMouseLeave={() => setHovNode(null)}
                    style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', gap: '0',
                      padding: '22px 16px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      position: 'relative',
                      borderRight: i < 2 ? `1px solid ${glassBorder}` : 'none',
                      transition: 'background 0.2s',
                    }}
                  >
                    {/* hover bg */}
                    {isHov && !isActive && (
                      <div style={{ position: 'absolute', inset: 0, background: `${node.color}08`, pointerEvents: 'none' }} />
                    )}

                    {/* icon circle */}
                    <div style={{
                      width: isActive ? '46px' : '36px',
                      height: isActive ? '46px' : '36px',
                      borderRadius: '50%',
                      background: isActive
                        ? `radial-gradient(circle at 35% 35%, ${node.color}dd, ${node.color}88)`
                        : `${node.color}22`,
                      border: `2px solid ${node.color}`,
                      boxShadow: isActive
                        ? `0 0 0 6px ${node.color}20, 0 0 24px ${node.color}55, 0 4px 12px ${node.color}44`
                        : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                      marginBottom: '10px', flexShrink: 0,
                      animation: `nodeBreath_${node.id} 3s ease-in-out infinite`,
                    }}>
                      <svg
                        width={isActive ? '20' : '16'}
                        height={isActive ? '20' : '16'}
                        viewBox="0 0 24 24" fill="none"
                        stroke={isActive ? '#fff' : node.color}
                        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transition: 'all 0.3s', flexShrink: 0 }}
                      >
                        <path d={node.iconPath} />
                      </svg>
                    </div>

                    {/* label */}
                    <span style={{
                      fontSize: '12px',
                      fontWeight: isActive ? 700 : 500,
                      color: node.color,
                      fontFamily: "'Outfit',sans-serif",
                      letterSpacing: isActive ? '0.02em' : '0',
                      transition: 'all 0.25s',
                      whiteSpace: 'nowrap',
                    }}>
                      {node.id === 'globe'  && T.nodeGlobe}
                      {node.id === 'tours'  && T.nodeTours}
                      {node.id === 'salles' && T.nodeSalles}
                    </span>

                    {/* active underline bar */}
                    <div style={{
                      position: 'absolute', bottom: 0, left: '20%', right: '20%',
                      height: '2.5px',
                      background: isActive ? `linear-gradient(90deg, transparent, ${node.color}, transparent)` : 'transparent',
                      borderRadius: '2px',
                      transition: 'all 0.35s',
                      boxShadow: isActive ? `0 0 8px ${node.color}` : 'none',
                    }} />

                    {/* checkmark on past nodes */}
                    {isPast && (
                      <div style={{
                        position: 'absolute', top: '14px', right: '14px',
                        width: '16px', height: '16px', borderRadius: '50%',
                        background: node.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                      }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* PROGRESS TRACK — full width at the very bottom */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: trackBg }}>
              {/* filled portion */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${lineProgress}%`,
                background: 'linear-gradient(90deg, #8B5CF6, #22C55E, #F59E0B)',
                transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                borderRadius: '0 2px 2px 0',
              }} />
              {/* travelling particle */}
              {lineProgress > 0 && lineProgress < 100 && (
                <div style={{
                  position: 'absolute', top: '50%', transform: 'translate(-50%,-50%)',
                  left: `${particleX}%`,
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 0 6px 2px rgba(255,255,255,0.8), 0 0 12px 4px rgba(139,92,246,0.5)',
                  animation: 'particleGlow 1s ease-in-out infinite',
                  transition: 'left 0.6s cubic-bezier(0.4,0,0.2,1)',
                }} />
              )}
            </div>
          </div>
        </div>

        {/* ══ SECTION 1 — GLOBE ══ */}
        <div ref={globeRef} style={{ scrollMarginTop: '160px', marginBottom: '8rem' }}>
          <SectionHeader title={T.globeTitle} sub={T.globeSub} color="#8B5CF6" ink={ink} inkSub={inkSub} />

          <div style={{ position: 'relative' }}>
            {/* globe iframe */}
            <div style={{
              borderRadius: '24px', overflow: 'hidden',
              border: `1px solid ${glassBorder}`,
              boxShadow: isDark ? '0 32px 80px rgba(0,0,0,0.5)' : '0 16px 48px rgba(0,0,0,0.09)',
              position: 'relative', paddingBottom: '50%',
              background: isDark ? '#07111F' : '#ECF3EE',
            }}>
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '38%', height: '2px', background: 'linear-gradient(90deg,transparent,#8B5CF6,transparent)', zIndex: 3 }} />
              <iframe
                key={globeKey}
                src="/walkthrough/globe.html"
                allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              />

              {/* ── GLOBE END SCREEN ── */}
              {globeEnded && (
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 10,
                  background: isDark
                    ? 'linear-gradient(160deg, rgba(5,12,26,0.93) 0%, rgba(11,23,40,0.97) 100%)'
                    : 'linear-gradient(160deg, rgba(240,250,244,0.95) 0%, rgba(255,255,255,0.97) 100%)',
                  backdropFilter: 'blur(12px)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: '0',
                  borderRadius: '24px',
                  animation: 'fadeInOverlay 0.55s cubic-bezier(0.4,0,0.2,1) forwards',
                  padding: '2rem',
                }}>

                  {/* ── Completion badge ── */}
                  <div style={{ animation: 'popIn 0.55s 0.15s cubic-bezier(0.34,1.56,0.64,1) both', marginBottom: '1.2rem' }}>
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '50%',
                      background: 'radial-gradient(circle at 35% 35%, rgba(139,92,246,0.9), rgba(139,92,246,0.5))',
                      border: '2px solid rgba(139,92,246,0.6)',
                      boxShadow: '0 0 0 10px rgba(139,92,246,0.12), 0 0 40px rgba(139,92,246,0.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        style={{ animation: 'checkDraw 0.5s 0.4s ease forwards', strokeDasharray: 32, strokeDashoffset: 32 }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                  </div>

                  {/* ── Title ── */}
                  <div style={{ textAlign: 'center', marginBottom: '2rem', animation: 'slideUpFade 0.5s 0.2s ease both' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.28)',
                      borderRadius: '100px', padding: '4px 16px', marginBottom: '10px',
                    }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#8B5CF6', display: 'inline-block', animation: 'vPulse 2s infinite' }} />
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#8B5CF6', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Outfit',sans-serif" }}>
                        {T.globeEndTitle}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: inkSub, fontFamily: "'Outfit',sans-serif" }}>
                      {T.globeEndSub}
                    </div>
                  </div>

                  {/* ── Three action cards ── */}

                  <div className="visite-end-grid" style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px',
                    width: '100%', maxWidth: '680px',
                  }}>
                    {[
                      {
                        color: '#8B5CF6',
                        icon: (
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/>
                          </svg>
                        ),
                        labelFr: 'Rejouer',
                        labelEn: 'Replay',
                        descFr: 'Relancer le survol satellite',
                        descEn: 'Restart satellite flyover',
                        action: replayGlobe,
                        delay: '0.28s',
                      },
                      {
                        color: '#22C55E',
                        icon: (
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                          </svg>
                        ),
                        labelFr: 'Visite complète',
                        labelEn: 'Full tour',
                        descFr: 'Explorer le campus 360°',
                        descEn: 'Explore campus in 360°',
                        action: goToFullTour,
                        delay: '0.36s',
                      },
                      {
                        color: '#F59E0B',
                        icon: (
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                          </svg>
                        ),
                        labelFr: 'Par espace',
                        labelEn: 'By space',
                        descFr: 'Serre ou local technique',
                        descEn: 'Greenhouse or tech room',
                        action: goToSpaces,
                        delay: '0.44s',
                      },
                    ].map((card, ci) => (
                      <GlobeEndCard key={ci} card={card} lang={lang} ink={ink} inkSub={inkSub} isDark={isDark} glassBorder={glassBorder} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══ SECTION 2 — CAMPUS COMPLET ══ */}
        <div ref={toursRef} style={{ scrollMarginTop: '160px', marginBottom: '8rem' }}>
          <SectionHeader title={T.tourTitle} sub={T.tourSub} color="#22C55E" ink={ink} inkSub={inkSub} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            {VISITE_MODES.map(mode => (
              <TourCard
                key={mode.id} mode={mode}
                active={activeTour === mode.file} isHov={hovered === mode.id}
                lang={lang} ink={ink} inkSub={inkSub} isDark={isDark}
                glassBorder={glassBorder} glass={glass} launchLabel={T.launch}
                onHover={() => setHovered(mode.id)}
                onLeave={() => setHovered(null)}
                onClick={() => pickTour(mode)}
              />
            ))}
          </div>
          <div ref={tourViewerRef}>
            {activeTourObj
              ? <ViewerBox viewer={{ file: activeTourObj.file, title: activeTourObj.title[lang], color: activeTourObj.color }} isDark={isDark} ink={ink} inkSub={inkSub} glassBorder={glassBorder} T={T} vrSupported={vrSupported} />
              : <EmptyViewer text={T.selectTour} isDark={isDark} inkSub={inkSub} glassBorder={glassBorder} />
            }
          </div>
        </div>

        {/* ══ SECTION 3 — PAR ESPACE ══ */}
        <div ref={sallesRef} style={{ scrollMarginTop: '160px' }}>
          <SectionHeader title={T.sallesTitle} sub={T.sallesSub} color="#F59E0B" ink={ink} inkSub={inkSub} />

          <GroupLabel label={T.serresLabel} count={SERRES.length} gradient="linear-gradient(90deg,#22C55E,#06B6D4)" ink={ink} inkSub={inkSub} />
        
          <div className="visite-serres-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '10px', marginBottom: '14px' }}>
            {SERRES.map(s => (
              <SpaceCard key={s.file} item={s} active={activeSerre === s.file} isHov={hovered === s.file}
                lang={lang} ink={ink} isDark={isDark} glassBorder={glassBorder} liveLabel={T.live}
                onHover={() => setHovered(s.file)} onLeave={() => setHovered(null)} onClick={() => pickSerre(s.file)} />
            ))}
          </div>
          <div ref={serreViewerRef} style={{ marginBottom: '3.5rem' }}>
            {activeSerreObj
              ? <ViewerBox viewer={{ file: activeSerreObj.file, title: activeSerreObj.title[lang], color: activeSerreObj.color }} isDark={isDark} ink={ink} inkSub={inkSub} glassBorder={glassBorder} T={T} vrSupported={vrSupported} />
              : <EmptyViewer text={T.selectSalle} isDark={isDark} inkSub={inkSub} glassBorder={glassBorder} />
            }
          </div>

          <GroupLabel label={T.blocLabel} count={BLOC_TECHNIQUE.length} gradient="linear-gradient(90deg,#F59E0B,#EF4444)" ink={ink} inkSub={inkSub} />
          <div className="visite-bloc-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '10px', marginBottom: '14px' }}>
            {BLOC_TECHNIQUE.map(s => (
              <SpaceCard key={s.file} item={s} active={activeBloc === s.file} isHov={hovered === s.file}
                lang={lang} ink={ink} isDark={isDark} glassBorder={glassBorder} liveLabel={T.live}
                onHover={() => setHovered(s.file)} onLeave={() => setHovered(null)} onClick={() => pickBloc(s.file)} />
            ))}
          </div>
          <div ref={blocViewerRef}>
            {activeBlocObj
              ? <ViewerBox viewer={{ file: activeBlocObj.file, title: activeBlocObj.title[lang], color: activeBlocObj.color }} isDark={isDark} ink={ink} inkSub={inkSub} glassBorder={glassBorder} T={T} vrSupported={vrSupported} />
              : <EmptyViewer text={T.selectSalle} isDark={isDark} inkSub={inkSub} glassBorder={glassBorder} />
            }
          </div>
        </div>

      </div>

      <style>{`
        @keyframes vPulse          { 0%,100%{opacity:1;transform:scale(1)}   50%{opacity:.35;transform:scale(.75)} }
        @keyframes nodeBreath_globe { 0%,100%{box-shadow:0 0 0 4px rgba(139,92,246,0.18),0 0 16px rgba(139,92,246,0.35)} 50%{box-shadow:0 0 0 9px rgba(139,92,246,0.07),0 0 28px rgba(139,92,246,0.18)} }
        @keyframes nodeBreath_tours { 0%,100%{box-shadow:0 0 0 4px rgba(34,197,94,0.18),0 0 16px rgba(34,197,94,0.35)}   50%{box-shadow:0 0 0 9px rgba(34,197,94,0.07),0 0 28px rgba(34,197,94,0.18)} }
        @keyframes nodeBreath_salles{ 0%,100%{box-shadow:0 0 0 4px rgba(245,158,11,0.18),0 0 16px rgba(245,158,11,0.35)} 50%{box-shadow:0 0 0 9px rgba(245,158,11,0.07),0 0 28px rgba(245,158,11,0.18)} }
        @keyframes particleGlow    { 0%,100%{opacity:1;transform:translate(-50%,-50%) scale(1)} 50%{opacity:0.6;transform:translate(-50%,-50%) scale(0.7)} }
        @keyframes popIn           { 0%{transform:scale(0)} 100%{transform:scale(1)} }
        @keyframes fadeInOverlay   { from{opacity:0} to{opacity:1} }
        @keyframes slideUpFade     { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes checkDraw       { to{stroke-dashoffset:0} }
        @keyframes cardSlideUp     { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </section>
  )
}

/* ─────────────────────── SUB-COMPONENTS ─────────────────────── */

function SectionHeader({ title, sub, color, ink, inkSub }) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
        <div style={{ width: '4px', height: '28px', background: color, borderRadius: '2px', flexShrink: 0, boxShadow: `0 0 12px ${color}66` }} />
        <h3 style={{ fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 800, fontFamily: "'Outfit',sans-serif", letterSpacing: '-0.035em', color: ink, margin: 0, lineHeight: 1.1 }}>
          {title}
        </h3>
      </div>
      <p style={{ fontSize: '13px', color: inkSub, margin: '0 0 0 18px', lineHeight: 1.7 }}>{sub}</p>
    </div>
  )
}

function GroupLabel({ label, count, gradient, ink, inkSub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
      <div style={{ width: '3px', height: '34px', background: gradient, borderRadius: '2px', flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: '11px', fontWeight: 800, color: ink, fontFamily: "'Outfit',sans-serif", textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
        <div style={{ fontSize: '11px', color: inkSub, marginTop: '2px' }}>{count} espaces · Visite 360° individuelle</div>
      </div>
    </div>
  )
}

function TourCard({ mode, active, isHov, lang, ink, inkSub, isDark, glassBorder, glass, launchLabel, onHover, onLeave, onClick }) {
  return (
    <button onClick={onClick} onMouseEnter={onHover} onMouseLeave={onLeave} style={{
      position: 'relative', overflow: 'hidden', borderRadius: '20px', padding: '1.6rem 1.8rem',
      border: `1.5px solid ${active ? `${mode.color}55` : isHov ? `${mode.color}28` : glassBorder}`,
      background: active ? `${mode.color}10` : glass, backdropFilter: 'blur(16px)',
      textAlign: 'left', cursor: 'pointer', transition: 'all 0.22s',
      boxShadow: active ? `0 0 0 1px ${mode.color}20,0 16px 40px ${mode.color}22` : isHov ? '0 8px 24px rgba(0,0,0,0.1)' : 'none',
      transform: isHov && !active ? 'translateY(-3px)' : active ? 'translateY(-1px)' : 'none',
    }}>
      <div style={{ position: 'absolute', left: 0, top: '16px', bottom: '16px', width: '3px', background: `linear-gradient(180deg,${mode.color},${mode.color}44)`, borderRadius: '0 2px 2px 0' }} />
      {active && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg,transparent,${mode.color},transparent)` }} />}
      <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '110px', height: '110px', borderRadius: '50%', background: `${mode.color}08`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: active ? `${mode.color}22` : `${mode.color}12`, border: `1px solid ${mode.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: mode.color, flexShrink: 0, transition: 'all 0.2s' }}>
            {mode.icon}
          </div>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: mode.color, background: `${mode.color}15`, border: `1px solid ${mode.color}25`, borderRadius: '100px', padding: '2px 10px', fontFamily: "'Outfit',sans-serif" }}>
            {mode.tag[lang]}
          </span>
        </div>
        {active
          ? <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: mode.color, boxShadow: `0 0 10px ${mode.color}`, display: 'inline-block', animation: 'vPulse 2s infinite' }} />
          : <span style={{ fontSize: '12px', color: inkSub }}>{launchLabel} →</span>
        }
      </div>
      <div style={{ fontSize: '17px', fontWeight: 700, color: ink, fontFamily: "'Outfit',sans-serif", marginBottom: '6px', letterSpacing: '-0.02em' }}>{mode.title[lang]}</div>
      <div style={{ fontSize: '12px', color: inkSub, lineHeight: 1.65 }}>{mode.desc[lang]}</div>
      <div style={{ marginTop: '12px', fontSize: '10px', color: `${mode.color}bb`, fontFamily: "'Outfit',sans-serif", letterSpacing: '0.05em' }}>{mode.sub[lang]}</div>
    </button>
  )
}

function SpaceCard({ item, active, isHov, lang, ink, isDark, glassBorder, liveLabel, onHover, onLeave, onClick }) {
  return (
    <button onClick={onClick} onMouseEnter={onHover} onMouseLeave={onLeave} style={{
      position: 'relative', overflow: 'hidden', borderRadius: '16px', cursor: 'pointer', textAlign: 'left',
      border: `1.5px solid ${active ? `${item.color}60` : isHov ? `${item.color}35` : glassBorder}`,
      background: active ? `linear-gradient(160deg,${item.color}22,${item.color}0a)` : isHov ? `${item.color}0c` : isDark ? 'rgba(15,28,50,0.6)' : 'rgba(255,255,255,0.7)',
      backdropFilter: 'blur(16px)', transition: 'all 0.22s',
      boxShadow: active ? `0 10px 30px ${item.color}28,0 0 0 1px ${item.color}20` : isHov ? `0 6px 20px ${item.color}14` : 'none',
      transform: isHov && !active ? 'translateY(-4px)' : active ? 'translateY(-2px)' : 'none',
      minHeight: '88px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', fontFamily: "'Outfit',sans-serif", color: active ? '#fff' : item.color, background: active ? `${item.color}40` : `${item.color}15`, border: `1px solid ${active ? 'rgba(255,255,255,0.2)' : `${item.color}30`}`, borderRadius: '100px', padding: '2px 8px' }}>
          {item.badge}
        </span>
        {active && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color, boxShadow: `0 0 8px ${item.color}`, display: 'inline-block', animation: 'vPulse 2s infinite' }} />}
      </div>
      <div>
        <div style={{ fontSize: '12px', fontWeight: 700, lineHeight: 1.25, fontFamily: "'Outfit',sans-serif", color: active ? '#fff' : ink, marginBottom: '4px' }}>{item.title[lang]}</div>
        <div style={{ fontSize: '9px', lineHeight: 1.5, color: active ? 'rgba(255,255,255,0.55)' : 'rgba(148,163,184,0.8)' }}>{item.desc}</div>
      </div>
      {isHov && !active && <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 0%,${item.color}10,transparent 70%)`, pointerEvents: 'none' }} />}
    </button>
  )
}

function ViewerBox({ viewer, isDark, ink, inkSub, glassBorder, T, vrSupported }) {
  const containerRef = useRef(null)
  const iframeRef    = useRef(null)
  const [isFS, setIsFS] = useState(false)

  /* ── track fullscreen state (Échap / programmatic exit) ── */
 useEffect(() => {
    function onFSChange() {
      // Check both standard and webkit (iOS Safari)
      const entering = !!(document.fullscreenElement || document.webkitFullscreenElement)
      setIsFS(entering)
      try {
        iframeRef.current?.contentWindow?.postMessage(
          entering ? 'enterPanorama' : 'exitPanorama', '*'
        )
      } catch (_) {}
    }
    function onIframeExit(e) {
      if (e.data === 'iframeExitedFullscreen') setIsFS(false)
    }
    // Standard + webkit prefix for iOS Safari
    document.addEventListener('fullscreenchange', onFSChange)
    document.addEventListener('webkitfullscreenchange', onFSChange)
    window.addEventListener('message', onIframeExit)
    return () => {
      document.removeEventListener('fullscreenchange', onFSChange)
      document.removeEventListener('webkitfullscreenchange', onFSChange)
      window.removeEventListener('message', onIframeExit)
    }
  }, [])

  function toggleFullscreen() {
    if (!isFS) {
      // On mobile, requestFullscreen on a div is blocked by browsers.
      // The only reliable target on mobile is the iframe itself.
      // On desktop, we use the container div so the title bar is included.
      const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

      if (isMobileDevice) {
        // Mobile: fullscreen the iframe directly
        const iframe = iframeRef.current
        if (iframe) {
          const req = iframe.requestFullscreen
            || iframe.webkitRequestFullscreen   // iOS Safari
            || iframe.mozRequestFullScreen
            || iframe.msRequestFullscreen
          if (req) {
            req.call(iframe).catch(() => {
              // If iframe fullscreen also fails (e.g. sandboxed), fall back to container
              const c = containerRef.current
              const cr = c?.requestFullscreen || c?.webkitRequestFullscreen
              if (cr) cr.call(c).catch(() => {})
            })
          }
        }
      } else {
        // Desktop: fullscreen the container div (includes title bar)
        const c = containerRef.current
        if (c) {
          const req = c.requestFullscreen || c.webkitRequestFullscreen
          if (req) req.call(c).catch(() => {})
        }
      }
    } else {
      const exit = document.exitFullscreen
        || document.webkitExitFullscreen
        || document.mozCancelFullScreen
        || document.msExitFullscreen
      if (exit) exit.call(document).catch(() => {})
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        borderRadius: isFS ? '0' : '24px',
        overflow: 'hidden',
        border: isFS ? 'none' : `1px solid ${glassBorder}`,
        boxShadow: isFS ? 'none' : (isDark ? `0 32px 80px rgba(0,0,0,0.55),0 0 0 1px ${viewer.color}12` : '0 16px 48px rgba(0,0,0,0.09)'),
        ...(isFS ? { background: '#000', display: 'flex', flexDirection: 'column' } : {}),
      }}
    >
      {/* ── Title bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        background: isDark ? 'rgba(7,17,31,0.95)' : 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${glassBorder}`,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            {['#EF4444','#F59E0B','#22C55E'].map(c => <div key={c} style={{ width: '8px', height: '8px', borderRadius: '50%', background: c, opacity: 0.55 }} />)}
          </div>
          <div style={{ width: '1px', height: '14px', background: glassBorder }} />
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 7px rgba(34,197,94,0.9)', display: 'inline-block', animation: 'vPulse 2s infinite' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: isFS ? '#F1F5F9' : ink, fontFamily: "'Outfit',sans-serif" }}>{viewer.title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#22C55E', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.22)', borderRadius: '100px', padding: '2px 10px', letterSpacing: '0.08em', fontFamily: "'Outfit',sans-serif" }}>{T.live}</span>

          {/* ── Fullscreen toggle button ── */}
          <button
            onClick={toggleFullscreen}
            title={isFS ? (T.exitFull ?? 'Quitter le plein écran') : (T.full ?? 'Plein écran')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '30px', height: '30px', borderRadius: '8px',
              background: isFS ? 'rgba(255,255,255,0.1)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
              border: `1px solid ${isFS ? 'rgba(255,255,255,0.18)' : glassBorder}`,
              cursor: 'pointer', flexShrink: 0, transition: 'all 0.18s',
              color: isFS ? '#F1F5F9' : ink,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = isFS ? 'rgba(255,255,255,0.18)' : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.09)') }}
            onMouseLeave={e => { e.currentTarget.style.background = isFS ? 'rgba(255,255,255,0.1)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)') }}
          >
            {isFS ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
                <path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
                <path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Color accent line ── */}
      <div style={{ height: '2px', background: `linear-gradient(90deg,transparent,${viewer.color},transparent)`, flexShrink: 0 }} />

      {/* ── iframe wrapper ── */}
      <div style={
        isFS
          ? { flex: 1, position: 'relative', background: '#000' }
          : { position: 'relative', paddingBottom: '48%', background: isDark ? '#07111F' : '#F0FAF4' }
      }>
        {/* ← NOUVEAU : ref={iframeRef} ajouté */}
       <iframe
          ref={iframeRef}
          key={viewer.file}
          src={viewer.file}
          allowFullScreen
          allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
        />
      </div>
    </div>
  )
}
function EmptyViewer({ text, isDark, inkSub, glassBorder }) {
  return (
    <div style={{ borderRadius: '20px', border: `1px dashed ${glassBorder}`, background: isDark ? 'rgba(11,23,40,0.35)' : 'rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '120px', color: inkSub, fontSize: '13px', fontFamily: "'Outfit',sans-serif", gap: '8px' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={inkSub} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {text}
    </div>
  )
}

function GlobeEndCard({ card, lang, ink, inkSub, isDark, glassBorder }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={card.action}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative', overflow: 'hidden',
        borderRadius: '18px',
        padding: '1.2rem 1rem',
        border: `1.5px solid ${hov ? `${card.color}50` : `${card.color}22`}`,
        background: hov
          ? `${card.color}18`
          : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
        backdropFilter: 'blur(12px)',
        cursor: 'pointer', textAlign: 'center',
        transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
        transform: hov ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: hov ? `0 12px 32px ${card.color}28, 0 0 0 1px ${card.color}20` : 'none',
        animation: `cardSlideUp 0.45s ${card.delay} cubic-bezier(0.34,1.2,0.64,1) both`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
      }}
    >
      {/* Glow blob */}
      <div style={{
        position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)',
        width: '80px', height: '80px', borderRadius: '50%',
        background: `${card.color}12`, pointerEvents: 'none',
        transition: 'opacity 0.22s',
        opacity: hov ? 1 : 0,
      }} />

      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: '20%', right: '20%', height: '2px',
        background: `linear-gradient(90deg,transparent,${card.color},transparent)`,
        borderRadius: '2px',
        opacity: hov ? 1 : 0,
        transition: 'opacity 0.22s',
      }} />

      {/* Icon */}
      <div style={{
        width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0,
        background: hov ? `${card.color}28` : `${card.color}15`,
        border: `1.5px solid ${hov ? `${card.color}45` : `${card.color}22`}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: card.color,
        boxShadow: hov ? `0 0 16px ${card.color}40` : 'none',
        transition: 'all 0.22s',
      }}>
        {card.icon}
      </div>

      {/* Labels — always bilingual */}
      <div>
        <div style={{
          fontSize: '13px', fontWeight: 800,
          color: hov ? card.color : ink,
          fontFamily: "'Outfit',sans-serif",
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
          transition: 'color 0.2s',
          marginBottom: '2px',
        }}>
          {card.labelFr}
        </div>
        <div style={{
          fontSize: '10px', fontWeight: 500,
          color: hov ? `${card.color}bb` : inkSub,
          fontFamily: "'Outfit',sans-serif",
          letterSpacing: '0.02em',
          transition: 'color 0.2s',
          marginBottom: '6px',
        }}>
          {card.labelEn}
        </div>
        <div style={{
          fontSize: '10px',
          color: inkSub,
          lineHeight: 1.5,
        }}>
          {lang === 'fr' ? card.descFr : card.descEn}
        </div>
      </div>
    </button>
  )
}
