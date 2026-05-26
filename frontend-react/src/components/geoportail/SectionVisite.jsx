import { useEffect, useState, useRef } from 'react'

const VISITE_MODES = [
  { id:'auto',   title:{fr:'Visite automatique',en:'Auto Tour'},   desc:{fr:'Parcours guidé animé du campus complet',en:'Animated guided campus walkthrough'}, file:'/walkthrough/visiteauto.html',    color:'#22C55E', tag:{fr:'Guidé',en:'Guided'} },
  { id:'manual', title:{fr:'Visite manuelle',   en:'Manual Tour'},  desc:{fr:'Navigation libre dans toutes les zones',en:'Free navigation across all zones'},   file:'/walkthrough/visitemanuelle.html', color:'#06B6D4', tag:{fr:'Libre',en:'Free'}  },
]

const SERRES = [
  { title:{fr:'Génétique',             en:'Genetics'        }, badge:'S01', file:'/walkthrough/serregenetique.html',    color:'#22C55E', gradient:'linear-gradient(160deg,#052e16 0%,#166534 60%,#14532d 100%)', desc:'Sélection variétale · Culture in vitro' },
  { title:{fr:'Horticulture',          en:'Horticulture'    }, badge:'S02', file:'/walkthrough/serrehorticulture.html', color:'#06B6D4', gradient:'linear-gradient(160deg,#082f49 0%,#0e7490 60%,#0c4a6e 100%)', desc:'Production florale · Maraîchage'       },
  { title:{fr:'Agronomie',             en:'Agronomy'        }, badge:'S03', file:'/walkthrough/serreagronomie.html',    color:'#F59E0B', gradient:'linear-gradient(160deg,#431407 0%,#92400e 60%,#78350f 100%)', desc:'Essais culturaux · Recherche'          },
  { title:{fr:'Hydroponie',            en:'Hydroponics'     }, badge:'S04', file:'/walkthrough/serrehydroponie.html',   color:'#8B5CF6', gradient:'linear-gradient(160deg,#2e1065 0%,#5b21b6 60%,#4c1d95 100%)', desc:'Culture hors-sol · NFT & DWC'          },
  { title:{fr:'Protection des plantes',en:'Plant Protection'}, badge:'S05', file:'/walkthrough/serreprotection.html',   color:'#EF4444', gradient:'linear-gradient(160deg,#450a0a 0%,#991b1b 60%,#7f1d1d 100%)', desc:'Phytopathologie · Entomologie'         },
]

const BLOC_TECHNIQUE = [
  { title:{fr:'Salle de contrôle',   en:'Control Room'   }, badge:'TC', file:'/walkthrough/salledecontrole.html',    color:'#3B82F6', gradient:'linear-gradient(160deg,#1e3a5f 0%,#1d4ed8 60%,#1e40af 100%)', desc:'Supervision & automatisation' },
  { title:{fr:'Salle de fertigation',en:'Fertigation'    }, badge:'TF', file:'/walkthrough/salledefertigation.html', color:'#14B8A6', gradient:'linear-gradient(160deg,#134e4a 0%,#0d9488 60%,#0f766e 100%)', desc:'Solutions nutritives'          },
  { title:{fr:'Salle de lavage',     en:'Washing Room'   }, badge:'TL', file:'/walkthrough/salledelavage.html',      color:'#F97316', gradient:'linear-gradient(160deg,#431407 0%,#c2410c 60%,#9a3412 100%)', desc:'Nettoyage du matériel'         },
  { title:{fr:'Salle de préparation',en:'Preparation'    }, badge:'TP', file:'/walkthrough/salledepreparation.html', color:'#A855F7', gradient:'linear-gradient(160deg,#3b0764 0%,#7c3aed 60%,#6d28d9 100%)', desc:'Préparation des cultures'      },
  { title:{fr:'Local technique',     en:'Equipment Room' }, badge:'LT', file:'/walkthrough/localtechnique.html',     color:'#64748B', gradient:'linear-gradient(160deg,#1e293b 0%,#475569 60%,#334155 100%)', desc:'Stockage équipements'          },
  { title:{fr:'Extérieur',           en:'Exterior'       }, badge:'EX', file:'/walkthrough/exterieur.html',          color:'#22C55E', gradient:'linear-gradient(160deg,#052e16 0%,#15803d 60%,#166534 100%)', desc:'Vue extérieure du campus'      },
]

export default function SectionVisite({ darkMode = true, lang = 'fr' }) {
  const [view,        setView]       = useState('globe')   // 'globe'|'choices'|'salles'
  const [activeTour,  setActiveTour] = useState(null)
  const [activeSerre, setActiveSerre] = useState(null)
  const [activeBloc,  setActiveBloc]  = useState(null)
  const [globeKey,    setGlobeKey]   = useState(0)
  const [hovered,     setHovered]    = useState(null)
  const tourRef  = useRef(null)
  const serreRef = useRef(null)
  const blocRef  = useRef(null)

  const isDark = darkMode
  const ink        = isDark ? '#F1F5F9' : '#0F172A'
  const inkSub     = isDark ? '#94A3B8' : '#64748B'
  const glass      = isDark ? 'rgba(15,28,50,0.65)'    : 'rgba(255,255,255,0.7)'
  const glassBorder= isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  const T = {
    badge:       lang==='fr' ? 'Visite 360° · Insta360 X4'  : 'Virtual Tour · Insta360 X4',
    navGlobe:    lang==='fr' ? 'Vue Globe'                   : 'Globe View',
    navTours:    lang==='fr' ? 'Visites guidées'             : 'Guided Tours',
    navSalles:   lang==='fr' ? 'Par espace'                  : 'By Space',
    serresLabel: lang==='fr' ? 'Serres de recherche'         : 'Research Greenhouses',
    serresSub:   lang==='fr' ? '5 unités · Visite 360° individuelle' : '5 units · Individual 360° tour',
    blocLabel:   lang==='fr' ? 'Bloc technique'              : 'Technical Block',
    blocSub:     lang==='fr' ? 'Espaces techniques et de service' : 'Technical and service spaces',
    full:        lang==='fr' ? 'Plein écran'                 : 'Fullscreen',
    live:        lang==='fr' ? 'En direct'                   : 'Live',
    launch:      lang==='fr' ? 'Lancer'                      : 'Launch',
    selectTour:  lang==='fr' ? 'Sélectionnez une visite pour la démarrer' : 'Select a tour to start',
    selectSalle: lang==='fr' ? 'Sélectionnez un espace pour commencer'    : 'Select a space to begin',
  }

  useEffect(() => {
    function handle(e) {
      if (e.data?.type !== 'agro-globe-done') return
      if (e.data.choice === 'tour')   { setView('choices') }
      if (e.data.choice === 'salles') { setView('salles')  }
    }
    window.addEventListener('message', handle)
    return () => window.removeEventListener('message', handle)
  }, [])

  function goGlobe()  { setGlobeKey(k=>k+1); setView('globe'); setActiveTour(null) }
  function goTours()  { setView('choices') }
  function goSalles() { setView('salles')  }

  function pickTour(mode) {
    setActiveTour(mode.file)
    setTimeout(() => tourRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }), 80)
  }

  const activeTourObj  = VISITE_MODES.find(m => m.file === activeTour)

  function pillStyle(active) {
    return {
      padding:'8px 22px', borderRadius:'100px',
      border: active ? '1.5px solid rgba(34,197,94,0.45)' : `1.5px solid ${glassBorder}`,
      background: active ? 'rgba(34,197,94,0.13)' : glass,
      backdropFilter:'blur(12px)',
      color: active ? '#22C55E' : inkSub,
      fontSize:'13px', fontWeight: active ? 700 : 500,
      cursor:'pointer', transition:'all 0.2s',
      fontFamily:"'Outfit',sans-serif",
      boxShadow: active ? '0 0 20px rgba(34,197,94,0.15)' : 'none',
    }
  }

  return (
    <section id="visite" style={{ padding:'6rem 2.5rem', scrollMarginTop:'64px' }}>
      <div style={{ maxWidth:'1260px', margin:'0 auto' }}>

        {/* HEADER */}
        <div style={{ textAlign:'center', marginBottom:'3.5rem' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'7px', background: isDark?'rgba(139,92,246,0.1)':'rgba(139,92,246,0.07)', border:'1px solid rgba(139,92,246,0.25)', borderRadius:'100px', padding:'5px 18px', marginBottom:'1.2rem' }}>
            <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#8B5CF6', display:'inline-block' }} />
            <span style={{ fontSize:'10px', fontWeight:700, color:'#8B5CF6', letterSpacing:'0.13em', textTransform:'uppercase', fontFamily:"'Outfit',sans-serif" }}>{T.badge}</span>
          </div>
          <h2 style={{ fontSize:'clamp(2.2rem,4.5vw,3.2rem)', fontWeight:900, lineHeight:1.05, fontFamily:"'Outfit',sans-serif", letterSpacing:'-0.04em', color:ink, margin:'0 0 0.9rem' }}>
            {lang==='fr' ? <><span style={{color:'#22C55E'}}>Explorez</span> le Campus</> : <><span style={{color:'#22C55E'}}>Explore</span> the Campus</>}
          </h2>
          <p style={{ fontSize:'14px', color:inkSub, maxWidth:'480px', margin:'0 auto', lineHeight:1.8 }}>
            {lang==='fr' ? 'Naviguez librement dans les 5 serres de recherche et les espaces techniques du campus AgroBioTech IAV Hassan II.' : 'Navigate freely through the 5 research greenhouses and technical spaces of the AgroBioTech IAV Hassan II campus.'}
          </p>
        </div>

        {/* NAV */}
        <div style={{ display:'flex', justifyContent:'center', gap:'8px', marginBottom:'2.5rem' }}>
          <button onClick={goGlobe}  style={pillStyle(view==='globe')}>   {T.navGlobe}  </button>
          <button onClick={goTours}  style={pillStyle(view==='choices')}> {T.navTours}  </button>
          <button onClick={goSalles} style={pillStyle(view==='salles')}>  {T.navSalles} </button>
        </div>

        {/* ── GLOBE ── */}
        {view==='globe' && (
          <div style={{ borderRadius:'28px', overflow:'hidden', position:'relative', paddingBottom:'52%', background: isDark?'#07111F':'#ECF3EE', border:`1px solid ${glassBorder}`, boxShadow: isDark?'0 32px 80px rgba(0,0,0,0.6)':'0 16px 48px rgba(0,0,0,0.1)' }}>
            <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'45%', height:'2px', background:'linear-gradient(90deg,transparent,#8B5CF6,transparent)', zIndex:3 }} />
            <iframe key={globeKey} src="/walkthrough/globe.html" allowFullScreen style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:'none' }} />
          </div>
        )}

        {/* ── VISITES GUIDÉES ── */}
        {view==='choices' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
              {VISITE_MODES.map(mode => {
                const active = activeTour===mode.file
                const isHov  = hovered===mode.id
                return (
                  <button key={mode.id} onClick={()=>pickTour(mode)} onMouseEnter={()=>setHovered(mode.id)} onMouseLeave={()=>setHovered(null)} style={{
                    position:'relative', overflow:'hidden', borderRadius:'20px',
                    border:`1.5px solid ${active?`${mode.color}55`:isHov?`${mode.color}28`:glassBorder}`,
                    background: active?`${mode.color}0e`:glass,
                    backdropFilter:'blur(16px)', padding:'1.5rem 1.6rem',
                    textAlign:'left', cursor:'pointer', transition:'all 0.2s',
                    boxShadow: active?`0 0 0 1px ${mode.color}20,0 12px 32px ${mode.color}20`:isHov?'0 6px 20px rgba(0,0,0,0.1)':'none',
                    transform: isHov&&!active?'translateY(-2px)':'none',
                  }}>
                    <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'3px', background:`linear-gradient(180deg,${mode.color},${mode.color}44)` }} />
                    {active && <div style={{ position:'absolute', top:0, left:0, right:0, height:'1.5px', background:`linear-gradient(90deg,transparent,${mode.color},transparent)` }} />}
                    <div style={{ position:'absolute', right:'-30px', top:'-30px', width:'120px', height:'120px', borderRadius:'50%', background:`${mode.color}08`, pointerEvents:'none' }} />
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                      <span style={{ fontSize:'10px', fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', color:mode.color, background:`${mode.color}18`, border:`1px solid ${mode.color}25`, borderRadius:'100px', padding:'2px 10px', fontFamily:"'Outfit',sans-serif" }}>{mode.tag[lang]}</span>
                      {active ? <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:mode.color, boxShadow:`0 0 10px ${mode.color}`, display:'inline-block' }} /> : <span style={{ fontSize:'12px', color:inkSub }}>{T.launch} →</span>}
                    </div>
                    <div style={{ fontSize:'16px', fontWeight:700, color:ink, fontFamily:"'Outfit',sans-serif", marginBottom:'5px' }}>{mode.title[lang]}</div>
                    <div style={{ fontSize:'12px', color:inkSub, lineHeight:1.6 }}>{mode.desc[lang]}</div>
                  </button>
                )
              })}
            </div>
            <div ref={tourRef}>
              {activeTourObj
                ? <ViewerBox viewer={{file:activeTourObj.file,title:activeTourObj.title[lang],color:activeTourObj.color}} isDark={isDark} ink={ink} inkSub={inkSub} glassBorder={glassBorder} T={T} />
                : <EmptyViewer text={T.selectTour} isDark={isDark} inkSub={inkSub} glassBorder={glassBorder} />}
            </div>
          </div>
        )}

        {/* ── PAR ESPACE ── */}
        {view==='salles' && (
          <div>
            {/* SERRES — 5-col card grid + viewer directly below */}
            <SectionLabel label={T.serresLabel} sub={T.serresSub} gradient="linear-gradient(90deg,#22C55E,#06B6D4)" ink={ink} inkSub={inkSub} />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'10px', marginBottom:'12px' }}>
              {SERRES.map(s => {
                const active = activeSerre===s.file
                const isHov  = hovered===s.file
                return (
                  <SpaceCard key={s.file} item={s} active={active} isHov={isHov} lang={lang} ink={ink} isDark={isDark} glassBorder={glassBorder}
                    onHover={()=>setHovered(s.file)} onLeave={()=>setHovered(null)}
                    onClick={()=>{ setActiveSerre(s.file); setTimeout(()=>serreRef.current?.scrollIntoView({behavior:'smooth',block:'start'}),80) }}
                    liveLabel={T.live} />
                )
              })}
            </div>
            {/* Serre viewer */}
            <div ref={serreRef} style={{ marginBottom:'2.5rem' }}>
              {activeSerre
                ? <ViewerBox viewer={{file:SERRES.find(s=>s.file===activeSerre)?.file, title:SERRES.find(s=>s.file===activeSerre)?.title[lang], color:SERRES.find(s=>s.file===activeSerre)?.color}} isDark={isDark} ink={ink} inkSub={inkSub} glassBorder={glassBorder} T={T} />
                : <EmptyViewer text={T.selectSalle} isDark={isDark} inkSub={inkSub} glassBorder={glassBorder} />}
            </div>

            {/* BLOC TECHNIQUE — 5-col grid + viewer directly below */}
            <SectionLabel label={T.blocLabel} sub={T.blocSub} gradient="linear-gradient(90deg,#F59E0B,#EF4444)" ink={ink} inkSub={inkSub} />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'10px', marginBottom:'12px' }}>
              {BLOC_TECHNIQUE.map(s => {
                const active = activeBloc===s.file
                const isHov  = hovered===s.file
                return (
                  <SpaceCard key={s.file} item={s} active={active} isHov={isHov} lang={lang} ink={ink} isDark={isDark} glassBorder={glassBorder}
                    onHover={()=>setHovered(s.file)} onLeave={()=>setHovered(null)}
                    onClick={()=>{ setActiveBloc(s.file); setTimeout(()=>blocRef.current?.scrollIntoView({behavior:'smooth',block:'start'}),80) }}
                    liveLabel={T.live} />
                )
              })}
            </div>
            {/* Bloc viewer */}
            <div ref={blocRef}>
              {activeBloc
                ? <ViewerBox viewer={{file:BLOC_TECHNIQUE.find(s=>s.file===activeBloc)?.file, title:BLOC_TECHNIQUE.find(s=>s.file===activeBloc)?.title[lang], color:BLOC_TECHNIQUE.find(s=>s.file===activeBloc)?.color}} isDark={isDark} ink={ink} inkSub={inkSub} glassBorder={glassBorder} T={T} />
                : <EmptyViewer text={T.selectSalle} isDark={isDark} inkSub={inkSub} glassBorder={glassBorder} />}
            </div>
          </div>
        )}

      </div>
      <style>{`@keyframes vPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.75)}}`}</style>
    </section>
  )
}

// ── Space Card (vertical, color background) ───────────────────────────────────
function SpaceCard({ item, active, isHov, lang, ink, isDark, glassBorder, onHover, onLeave, onClick, liveLabel }) {
  return (
    <button onClick={onClick} onMouseEnter={onHover} onMouseLeave={onLeave} style={{
      position:'relative', overflow:'hidden',
      borderRadius:'18px', cursor:'pointer', textAlign:'left',
      border:`1.5px solid ${active?`${item.color}60`:isHov?`${item.color}35`:glassBorder}`,
      background: active?item.gradient:isHov?`${item.color}10`:(isDark?'rgba(15,28,50,0.6)':'rgba(255,255,255,0.65)'),
      backdropFilter:'blur(16px)',
      transition:'all 0.22s',
      boxShadow: active?`0 12px 32px ${item.color}30,0 0 0 1px ${item.color}25`:isHov?`0 8px 24px ${item.color}18`:'none',
      transform: isHov&&!active?'translateY(-4px)':active?'translateY(-2px)':'none',
      height:'110px',
    }}>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'14px' }}>
        {/* Top: badge */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{
            fontSize:'11px', fontWeight:800, letterSpacing:'0.1em',
            fontFamily:"'Outfit',sans-serif",
            color: active?'rgba(255,255,255,0.95)':item.color,
            background: active?'rgba(255,255,255,0.15)':'transparent',
            border: `1px solid ${active?'rgba(255,255,255,0.25)':`${item.color}35`}`,
            borderRadius:'100px', padding:'2px 8px',
          }}>{item.badge}</span>
          {active && (
            <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#fff', boxShadow:'0 0 8px rgba(255,255,255,0.8)', display:'inline-block' }} />
          )}
        </div>

        {/* Bottom: title + desc */}
        <div>
          <div style={{
            fontSize:'13px', fontWeight:700, lineHeight:1.25, marginBottom:'4px',
            fontFamily:"'Outfit',sans-serif",
            color: active?'white':ink,
          }}>
            {item.title[lang]}
          </div>
          <div style={{ fontSize:'10px', lineHeight:1.5, color: active?'rgba(255,255,255,0.6)':'rgba(148,163,184,0.9)' }}>
            {item.desc}
          </div>
          {active && (
            <div style={{ marginTop:'8px', display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'9px', fontWeight:700, letterSpacing:'0.1em', color:'rgba(255,255,255,0.8)', background:'rgba(255,255,255,0.12)', borderRadius:'100px', padding:'2px 8px', fontFamily:"'Outfit',sans-serif" }}>
              <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#fff', display:'inline-block' }} />
              {liveLabel}
            </div>
          )}
        </div>
      </div>

      {/* Subtle inner glow on hover */}
      {isHov && !active && (
        <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 50% 0%,${item.color}12,transparent 70%)`, pointerEvents:'none' }} />
      )}
    </button>
  )
}

function SectionLabel({ label, sub, gradient, ink, inkSub }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px' }}>
      <div style={{ width:'3px', height:'38px', background:gradient, borderRadius:'2px', flexShrink:0 }} />
      <div>
        <div style={{ fontSize:'12px', fontWeight:800, color:ink, fontFamily:"'Outfit',sans-serif", textTransform:'uppercase', letterSpacing:'0.1em' }}>{label}</div>
        <div style={{ fontSize:'11px', color:inkSub, marginTop:'2px' }}>{sub}</div>
      </div>
    </div>
  )
}

function EmptyViewer({ text, isDark, inkSub, glassBorder }) {
  return (
    <div style={{ borderRadius:'20px', border:`1px solid ${glassBorder}`, background: isDark?'rgba(11,23,40,0.4)':'rgba(255,255,255,0.5)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', minHeight:'180px', color:inkSub, fontSize:'13px', fontFamily:"'Outfit',sans-serif" }}>
      {text}
    </div>
  )
}

function ViewerBox({ viewer, isDark, ink, inkSub, glassBorder, T }) {
  return (
    <div style={{ borderRadius:'24px', overflow:'hidden', border:`1px solid ${glassBorder}`, boxShadow: isDark?`0 32px 80px rgba(0,0,0,0.55),0 0 0 1px ${viewer.color}12`:'0 16px 48px rgba(0,0,0,0.09)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', background: isDark?'rgba(7,17,31,0.93)':'rgba(255,255,255,0.97)', backdropFilter:'blur(16px)', borderBottom:`1px solid ${glassBorder}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ display:'flex', gap:'5px' }}>
            {['#EF4444','#F59E0B','#22C55E'].map(c=><div key={c} style={{ width:'8px', height:'8px', borderRadius:'50%', background:c, opacity:0.55 }} />)}
          </div>
          <div style={{ width:'1px', height:'14px', background:glassBorder }} />
          <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#22C55E', boxShadow:'0 0 7px rgba(34,197,94,0.9)', display:'inline-block' }} />
          <span style={{ fontSize:'13px', fontWeight:600, color:ink, fontFamily:"'Outfit',sans-serif" }}>{viewer.title}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ fontSize:'10px', fontWeight:700, color:'#22C55E', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.22)', borderRadius:'100px', padding:'2px 9px', letterSpacing:'0.08em', fontFamily:"'Outfit',sans-serif" }}>{T.live}</span>
          <a href={viewer.file} target="_blank" rel="noopener noreferrer" style={{ fontSize:'11px', fontWeight:600, color:inkSub, textDecoration:'none', background: isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', border:`1px solid ${glassBorder}`, borderRadius:'8px', padding:'5px 11px' }}>{T.full}</a>
        </div>
      </div>
      <div style={{ height:'2px', background:`linear-gradient(90deg,transparent,${viewer.color},transparent)` }} />
      <div style={{ position:'relative', paddingBottom:'56%', background: isDark?'#07111F':'#F0FAF4' }}>
        <iframe key={viewer.file} src={viewer.file} allowFullScreen style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:'none' }} />
      </div>
    </div>
  )
}
