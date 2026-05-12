// src/pages/Geoportail.jsx — Refonte complète avec sidebar
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { iotAPI } from '../api/client'
import 'leaflet/dist/leaflet.css'

// ─── Constants ───────────────────────────────────────────────
const LAT = 33.978659, LNG = -6.864096

const SERRES_META = [
  { code:'S01', nom:'Génétique & Amélioration', color:'#22c55e', bg:'rgba(34,197,94,0.12)',  unit:'Unité 1' },
  { code:'S02', nom:'Horticulture',             color:'#06b6d4', bg:'rgba(6,182,212,0.12)',  unit:'Unité 2' },
  { code:'S03', nom:'Agronomie',                color:'#a3e635', bg:'rgba(163,230,53,0.12)', unit:'Unité 3' },
  { code:'S04', nom:'Hydroponie',               color:'#f59e0b', bg:'rgba(245,158,11,0.12)', unit:'Unité 4' },
  { code:'S05', nom:'Protection des Plantes',   color:'#8b5cf6', bg:'rgba(139,92,246,0.12)', unit:'Unité 5' },
]

const SCANS_CAMPUS = [
  { id:'R1sCgCSGJMQ', fr:'Merge Complet',       en:'Full Merge' },
  { id:'XgEA1hS6oGD', fr:'Extérieur',           en:'Exterior' },
  { id:'geDWdk2gcB2', fr:'Couloir Principal',   en:'Main Corridor' },
  { id:'LVZFUX6t46N', fr:'Salle de Lavage',     en:'Washing Room' },
  { id:'op7eKJyN347', fr:'Local Technique',     en:'Equipment Room' },
  { id:'hy3jqT45C99', fr:'Salle de Commande',   en:'Control Room' },
  { id:'tg9epaXEhgK', fr:'Salle Préparation',   en:'Prep Room' },
  { id:'teWd9VjkgAA', fr:'Bloc Protection',     en:'Protection Block' },
  { id:'Sgqh5fQymzW', fr:'Salle Fertilisation', en:'Fertilization' },
]

const SERRES_VISITE = [
  { id:'vG3pzqGDsvE', fr:'Génétique',     en:'Genetics',    badge:'S01', color:'#22c55e', desc:'Sélection variétale · Culture in vitro',  code:'S01' },
  { id:'ewVdkig18XN', fr:'Horticulture',  en:'Horticulture',badge:'S02', color:'#06b6d4', desc:'Production florale · Maraîchage',          code:'S02' },
  { id:'ximB8o6Y7HL', fr:'Agronomie',     en:'Agronomy',    badge:'S03', color:'#a3e635', desc:'Essais culturaux · Recherche appliquée',   code:'S03' },
  { id:'PMVdAWZFaEn', fr:'Hydroponie',    en:'Hydroponics', badge:'S04', color:'#f59e0b', desc:'Culture hors-sol · Systèmes NFT & DWC',   code:'S04' },
  { id:'nkZ8GQuN2ep', fr:'Protection',   en:'Protection',  badge:'S05', color:'#8b5cf6', desc:'Phytopathologie · Entomologie',            code:'S05' },
]

const CAROUSEL_TEXTS = [
  { type:'fact',     icon:'🌿', title:'5 Serres Connectées',   text:'Le complexe AgroBioTech de l\'IAV Hassan II dispose de 5 serres de recherche entièrement équipées de capteurs IoT pour le monitoring en temps réel.' },
  { type:'fact',     icon:'📡', title:'10 Capteurs Actifs',    text:'Chaque serre est équipée de capteurs environnementaux (température, humidité, VPD, CO₂) et d\'irrigation (pH, EC, température eau, niveau eau).' },
  { type:'quote',    icon:'💬', title:'Vision du Projet',      text:'"Le jumeau numérique représente l\'avenir de la recherche agronomique — une interface entre le monde physique des serres et la puissance du numérique."' },
  { type:'fact',     icon:'🔬', title:'15 Scans Matterport',   text:'Le campus a été entièrement numérisé avec 15 scans Matterport Pro 2, permettant une visite virtuelle immersive de chaque espace.' },
  { type:'quote',    icon:'🎓', title:'Projet de Fin d\'Études', text:'"Ce géoportail est le fruit de mois de travail alliant géomatique, développement web et IoT — une fierté pour notre parcours d\'ingénieur topographe."' },
  { type:'fact',     icon:'📊', title:'Collecte Automatique',  text:'Les données sont collectées automatiquement toutes les 2 minutes, 24h/24, 7j/7, garantissant un historique complet pour l\'analyse agronomique.' },
]

const PARAM_INFO = {
  temperature: { label:'Température', unit:'°C', desc:'La température de l\'air influence directement la photosynthèse, la respiration et la croissance des plantes. Optimale entre 18-28°C selon les cultures.', color:'#f59e0b', min:10, max:40 },
  humidite:    { label:'Humidité',    unit:'%',  desc:'L\'humidité relative contrôle la transpiration foliaire. Trop élevée favorise les maladies fongiques ; trop basse provoque le stress hydrique.', color:'#06b6d4', min:30, max:100 },
  vpd:         { label:'VPD',         unit:'kPa',desc:'Le Déficit de Pression de Vapeur mesure la demande évaporative de l\'air. Idéalement entre 0.8-1.5 kPa pour une croissance optimale.', color:'#8b5cf6', min:0, max:3 },
  co2:         { label:'CO₂',         unit:'ppm',desc:'Le CO₂ est le substrat principal de la photosynthèse. Des concentrations élevées (800-1200 ppm) en serre augmentent significativement les rendements.', color:'#22c55e', min:300, max:1500 },
  ph:          { label:'pH',          unit:'',   desc:'Le pH du substrat ou de la solution nutritive contrôle la disponibilité des nutriments. Optimum entre 5.5-7.0 selon les cultures.', color:'#06b6d4', min:4, max:9 },
  ec:          { label:'EC',          unit:'mS/cm', desc:'La Conductivité Électrique mesure la concentration en sels minéraux de la solution nutritive. Entre 1.5-3.5 mS/cm pour la plupart des cultures.', color:'#a3e635', min:0, max:5 },
  temp_eau:    { label:'T° Eau',      unit:'°C', desc:'La température de l\'eau d\'irrigation influence l\'absorption racinaire et l\'activité microbienne. Idéalement entre 18-22°C.', color:'#f59e0b', min:5, max:35 },
  niveau_eau:  { label:'Niveau',      unit:'m',  desc:'Le niveau d\'eau dans les réservoirs d\'irrigation permet d\'anticiper les besoins en réalimentation et d\'assurer la continuité de l\'irrigation.', color:'#8b5cf6', min:0, max:1 },
}

// ─── Mini components ─────────────────────────────────────────

function Pulse({ color = '#22c55e' }) {
  return (
    <span style={{ display:'inline-block', width:'8px', height:'8px', borderRadius:'50%', background:color, boxShadow:`0 0 8px ${color}`, animation:'sdiPulse 2s ease-in-out infinite' }} />
  )
}

function ParamCard({ label, value, unit, color, info, floatAnim }) {
  const [showInfo, setShowInfo] = useState(false)
  const [hovered, setHovered] = useState(false)
  const hasVal = value != null

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowInfo(false) }}
      style={{
        position:'relative', background: hovered ? `${color}15` : 'rgba(255,255,255,0.04)',
        border:`1px solid ${hovered ? color+'40' : 'rgba(255,255,255,0.08)'}`,
        borderRadius:'14px', padding:'14px 12px', textAlign:'center',
        transition:'all 0.3s ease', cursor:'pointer',
        animation: floatAnim ? `sdiFloat${floatAnim} 3s ease-in-out infinite` : 'none',
        boxShadow: hovered ? `0 8px 24px ${color}20` : 'none'
      }}
      onClick={() => setShowInfo(s => !s)}
    >
      <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.4)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'6px' }}>{label}</div>
      <div style={{ fontSize:'1.3rem', fontWeight:800, color: hasVal ? color : 'rgba(255,255,255,0.2)', fontFamily:"'Outfit',sans-serif", lineHeight:1 }}>
        {hasVal ? `${value}` : '—'}
      </div>
      {unit && hasVal && <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.35)', marginTop:'3px' }}>{unit}</div>}

      {/* ? badge */}
      {hovered && !showInfo && (
        <div style={{ position:'absolute', top:'6px', right:'6px', width:'16px', height:'16px', borderRadius:'50%', background:color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color:'white' }}>?</div>
      )}

      {/* Info bubble */}
      {showInfo && (
        <div style={{
          position:'absolute', bottom:'calc(100% + 8px)', left:'50%', transform:'translateX(-50%)',
          background:'rgba(20,30,45,0.97)', border:'1px solid rgba(255,255,255,0.12)',
          borderRadius:'12px', padding:'12px 14px', width:'220px', zIndex:100,
          boxShadow:'0 20px 60px rgba(0,0,0,0.5)', backdropFilter:'blur(20px)',
          textAlign:'left'
        }}>
          <div style={{ fontSize:'11px', fontWeight:700, color, marginBottom:'6px' }}>{label}</div>
          <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)', lineHeight:1.6 }}>{info}</div>
          <div style={{ position:'absolute', bottom:'-6px', left:'50%', transform:'translateX(-50%)', width:'10px', height:'10px', background:'rgba(20,30,45,0.97)', border:'1px solid rgba(255,255,255,0.12)', borderTop:'none', borderLeft:'none', transform:'translateX(-50%) rotate(45deg)' }} />
        </div>
      )}
    </div>
  )
}

function MiniChart({ data, color, label }) {
  if (!data || data.length < 2) return null
  const w = 300, h = 60
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h * 0.8 - 5}`)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
      <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)', letterSpacing:'0.05em' }}>{label}</div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width:'100%', height:'40px' }}>
        <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      </svg>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────
export default function Geoportail() {
  const [lang, setLang]         = useState('fr')
  const [liveData, setLiveData] = useState([])
  const [stats, setStats]       = useState({})
  const [countdown, setCountdown] = useState(120)
  const [activeSection, setActiveSection] = useState('projet')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Carousel states
  const [carouselText, setCarouselText]   = useState(0)
  const [carouselPhoto, setCarouselPhoto] = useState(0)
  const [serreDataIdx, setSerreDataIdx]   = useState(0)
  const [activeScan, setActiveScan]       = useState('R1sCgCSGJMQ')
  const [activeSerre, setActiveSerre]     = useState(null)
  const [plan2dSerre, setPlan2dSerre]     = useState(null)
  const [plan2dTab, setPlan2dTab]         = useState('info') // 'info' | 'data'

  // Map
  const mapRef = useRef(null)
  const mapInstance = useRef(null)

  async function fetchAll() {
    try {
      const [live, st] = await Promise.all([iotAPI.getLive(), iotAPI.getStats()])
      setLiveData(live.serres || [])
      setStats(st)
      setCountdown(120)
    } catch(e) { console.error(e) }
  }

  useEffect(() => { fetchAll() }, [])
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => { if (c <= 1) { fetchAll(); return 120 } return c - 1 })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Map init
  useEffect(() => {
    if (activeSection !== 'campus' || mapInstance.current) return
    setTimeout(() => {
      if (!mapRef.current || mapInstance.current) return
      import('leaflet').then(L => {
        const map = L.default.map(mapRef.current, { zoomControl:false, attributionControl:false, dragging:true, scrollWheelZoom:false })
        L.default.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom:20 }).addTo(map)
        map.setView([LAT - 0.02, LNG], 13)
        setTimeout(() => map.flyTo([LAT, LNG], 18, { animate:true, duration:3.5 }), 600)
        const icon = L.default.divIcon({ className:'', html:`<div style="width:22px;height:22px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 0 0 8px rgba(34,197,94,0.25)"></div>`, iconSize:[22,22], iconAnchor:[11,11] })
        L.default.marker([LAT, LNG], { icon }).addTo(map).bindPopup('<b>AgroBioTech · IAV Hassan II</b><br><small>Rabat, Maroc</small>')
        mapInstance.current = map
      })
    }, 100)
  }, [activeSection])

  const countdownLabel = `${Math.floor(countdown/60)}:${String(countdown%60).padStart(2,'0')}`
  const currentSerre = liveData[serreDataIdx] || {}
  const env = currentSerre.env || {}
  const irr = currentSerre.irr || {}
  const meta = SERRES_META[serreDataIdx] || SERRES_META[0]

  const nav = [
    { id:'projet',  icon:'🌿', label:'Notre Projet' },
    { id:'apropos', icon:'ℹ️',  label:'À Propos' },
    { id:'campus',  icon:'🗺️',  label:'AgroBioTech' },
    { id:'plan2d',  icon:'📐',  label:'Plan 2D' },
    { id:'donnees', icon:'📊',  label:'Données' },
    { id:'visite',  icon:'🔬',  label:'Visite Virtuelle' },
  ]

  // ── Render sections ──────────────────────────────────────────

  function renderProjet() {
    return (
      <div style={{ padding:'2.5rem', display:'grid', gridTemplateColumns:'1fr 320px', gap:'2rem', alignItems:'start' }}>
        {/* Left — intro text */}
        <div style={{
          background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:'20px', padding:'2rem', backdropFilter:'blur(10px)'
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'1.5rem' }}>
            <Pulse />
            <span style={{ fontSize:'11px', fontWeight:700, color:'#22c55e', letterSpacing:'0.1em', textTransform:'uppercase' }}>Notre Projet · PFE 2024–2025</span>
          </div>
          <h1 style={{ fontSize:'clamp(1.6rem,3vw,2.4rem)', fontWeight:900, color:'white', fontFamily:"'Outfit',sans-serif", letterSpacing:'-0.03em', marginBottom:'1.25rem', lineHeight:1.1 }}>
            Serre Digitale<br /><span style={{ background:'linear-gradient(135deg,#22c55e,#06b6d4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Intelligente</span>
          </h1>
          <p style={{ fontSize:'14px', color:'rgba(255,255,255,0.55)', lineHeight:1.9, marginBottom:'1.5rem' }}>
            [Ici vous insérez le texte introductif de votre projet — décrivez l'objectif du géoportail, le contexte du jumeau numérique, la problématique et l'approche méthodologique adoptée pour le Projet de Fin d'Études.]
          </p>
          <p style={{ fontSize:'14px', color:'rgba(255,255,255,0.45)', lineHeight:1.9, marginBottom:'2rem' }}>
            [Deuxième paragraphe — présentez les technologies utilisées, l'architecture IoT, l'intégration des données capteurs et la valeur ajoutée pour la recherche agronomique à l'IAV Hassan II.]
          </p>
          {/* Slogan */}
          <div style={{
            background:'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(6,182,212,0.1))',
            border:'1px solid rgba(34,197,94,0.2)', borderRadius:'14px',
            padding:'16px 20px', display:'flex', alignItems:'center', gap:'12px'
          }}>
            <span style={{ fontSize:'24px' }}>🌱</span>
            <div>
              <div style={{ fontSize:'14px', fontWeight:700, color:'white', marginBottom:'3px' }}>
                "Du capteur au numérique, chaque donnée raconte la vie de la plante."
              </div>
              <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)' }}>Serre Digitale Intelligente · IAV Hassan II · 2025</div>
            </div>
          </div>
        </div>

        {/* Right — stats */}
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {[
            { val:'5',    lbl:'Serres connectées',    icon:'🏠', color:'#22c55e' },
            { val:'10',   lbl:'Capteurs actifs',      icon:'📡', color:'#06b6d4' },
            { val: stats?.mesures_24h ? (Math.round(stats.mesures_24h/100)*100).toLocaleString() : '—', lbl:"Mesures aujourd'hui", icon:'📊', color:'#a3e635' },
            { val:'15',   lbl:'Scans Matterport 3D',  icon:'🔬', color:'#f59e0b' },
            { val:'24/7', lbl:'Monitoring continu',   icon:'⏱️', color:'#8b5cf6' },
          ].map((s,i) => (
            <div key={i} style={{
              background:'rgba(255,255,255,0.03)', border:`1px solid ${s.color}25`,
              borderRadius:'16px', padding:'16px 18px',
              display:'flex', alignItems:'center', gap:'14px',
              backdropFilter:'blur(10px)',
              transition:'all 0.3s',
            }}>
              <div style={{ fontSize:'24px' }}>{s.icon}</div>
              <div>
                <div style={{ fontSize:'1.6rem', fontWeight:900, color:s.color, fontFamily:"'Outfit',sans-serif", lineHeight:1 }}>{s.val}</div>
                <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)', marginTop:'3px' }}>{s.lbl}</div>
              </div>
              <div style={{ marginLeft:'auto', width:'4px', height:'40px', borderRadius:'2px', background:`linear-gradient(to bottom, ${s.color}, transparent)` }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderApropos() {
    const photos = [
      { label:'Photo 1 — Vue extérieure du complexe', note:'📷 Insérer photo ici' },
      { label:'Photo 2 — Intérieur serre Génétique',  note:'📷 Insérer photo ici' },
      { label:'Photo 3 — Capteurs IoT installés',     note:'📷 Insérer photo ici' },
      { label:'Photo 4 — Campus AgroBioTech aérien',  note:'📷 Insérer photo ici' },
      { label:'Photo 5 — Équipe de recherche',        note:'📷 Insérer photo ici' },
    ]
    const item = CAROUSEL_TEXTS[carouselText]
    const photo = photos[carouselPhoto]
    return (
      <div style={{ padding:'2.5rem', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem' }}>
        {/* Left carousel — texts */}
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'20px', padding:'1.5rem', position:'relative', minHeight:'320px', display:'flex', flexDirection:'column', backdropFilter:'blur(10px)' }}>
          <div style={{ fontSize:'11px', fontWeight:700, color:'#22c55e', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'1.5rem' }}>Faits & Témoignages</div>
          <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'0 2rem' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>{item.icon}</div>
            <div style={{ fontSize:'16px', fontWeight:700, color:'white', marginBottom:'0.75rem' }}>{item.title}</div>
            <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.55)', lineHeight:1.8, fontStyle: item.type==='quote' ? 'italic' : 'normal' }}>{item.text}</div>
          </div>
          {/* Dots */}
          <div style={{ display:'flex', justifyContent:'center', gap:'6px', marginTop:'1.5rem' }}>
            {CAROUSEL_TEXTS.map((_,i) => (
              <div key={i} onClick={() => setCarouselText(i)} style={{ width: carouselText===i ? '20px' : '6px', height:'6px', borderRadius:'3px', background: carouselText===i ? '#22c55e' : 'rgba(255,255,255,0.2)', cursor:'pointer', transition:'all 0.3s' }} />
            ))}
          </div>
          {/* Arrows */}
          <button onClick={() => setCarouselText(i => (i-1+CAROUSEL_TEXTS.length)%CAROUSEL_TEXTS.length)} style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', width:'32px', height:'32px', borderRadius:'50%', cursor:'pointer', fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'center' }}>←</button>
          <button onClick={() => setCarouselText(i => (i+1)%CAROUSEL_TEXTS.length)} style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'rgba(34,197,94,0.15)', border:'1px solid rgba(34,197,94,0.3)', color:'#22c55e', width:'32px', height:'32px', borderRadius:'50%', cursor:'pointer', fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'center' }}>→</button>
        </div>

        {/* Right carousel — photos */}
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'20px', overflow:'hidden', position:'relative', minHeight:'320px', backdropFilter:'blur(10px)' }}>
          <div style={{ height:'100%', background:'linear-gradient(135deg,#060d14,#0a1628)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'12px', padding:'2rem', backgroundImage:'linear-gradient(rgba(34,197,94,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.04) 1px,transparent 1px)', backgroundSize:'30px 30px' }}>
            <div style={{ fontSize:'48px' }}>📷</div>
            <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', textAlign:'center' }}>{photo.label}</div>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.25)', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', padding:'6px 14px' }}>{photo.note}</div>
          </div>
          {/* Counter */}
          <div style={{ position:'absolute', top:'12px', right:'12px', background:'rgba(0,0,0,0.6)', backdropFilter:'blur(10px)', borderRadius:'8px', padding:'4px 10px', fontSize:'11px', color:'rgba(255,255,255,0.5)', fontFamily:"'Outfit',sans-serif" }}>{carouselPhoto+1}/{photos.length}</div>
          {/* Arrows */}
          <button onClick={() => setCarouselPhoto(i => (i-1+photos.length)%photos.length)} style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', width:'32px', height:'32px', borderRadius:'50%', cursor:'pointer', fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'center' }}>←</button>
          <button onClick={() => setCarouselPhoto(i => (i+1)%photos.length)} style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'rgba(34,197,94,0.15)', border:'1px solid rgba(34,197,94,0.3)', color:'#22c55e', width:'32px', height:'32px', borderRadius:'50%', cursor:'pointer', fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'center' }}>→</button>
          {/* Dots */}
          <div style={{ position:'absolute', bottom:'12px', left:'50%', transform:'translateX(-50%)', display:'flex', gap:'5px' }}>
            {photos.map((_,i) => (<div key={i} onClick={() => setCarouselPhoto(i)} style={{ width: carouselPhoto===i ? '16px' : '5px', height:'5px', borderRadius:'3px', background: carouselPhoto===i ? '#22c55e' : 'rgba(255,255,255,0.2)', cursor:'pointer', transition:'all 0.3s' }} />))}
          </div>
        </div>
      </div>
    )
  }

  function renderCampus() {
    return (
      <div style={{ padding:'2.5rem', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem', alignItems:'start' }}>
        {/* Left — map */}
        <div style={{ borderRadius:'20px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', position:'relative', height:'420px' }}>
          <div ref={mapRef} style={{ width:'100%', height:'100%' }} />
          <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent,rgba(0,0,0,0.7))', padding:'1rem 1.2rem', pointerEvents:'none' }}>
            <div style={{ color:'white', fontSize:'13px', fontWeight:600 }}>AgroBioTech · IAV Hassan II</div>
            <div style={{ color:'rgba(255,255,255,0.6)', fontSize:'11px' }}>Rabat, Maroc · 33.9787°N 6.8641°W</div>
          </div>
        </div>

        {/* Right — intro */}
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'20px', padding:'2rem', backdropFilter:'blur(10px)' }}>
          <div style={{ fontSize:'11px', fontWeight:700, color:'#22c55e', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'1rem' }}>Campus AgroBioTech · IAV Hassan II</div>
          <h2 style={{ fontSize:'1.6rem', fontWeight:800, color:'white', fontFamily:"'Outfit',sans-serif", marginBottom:'1rem', letterSpacing:'-0.02em' }}>
            Un campus de recherche<br /><span style={{ color:'#22c55e' }}>connecté</span>
          </h2>
          <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.9, marginBottom:'1.5rem' }}>
            [Ici vous insérez l'introduction du campus AgroBioTech et le contexte marocain de l'agriculture intelligente — présentation de l'IAV Hassan II, de la mission du complexe et de l'importance stratégique de ce projet pour l'agriculture au Maroc.]
          </p>
          {/* Unité badges */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'1.5rem' }}>
            {SERRES_META.map((s,i) => (
              <span key={i} style={{ background:`${s.color}12`, border:`1px solid ${s.color}30`, color:s.color, padding:'5px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:600 }}>{s.nom}</span>
            ))}
          </div>
          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
            {[
              { val:'5',   lbl:'Serres de recherche', color:'#22c55e' },
              { val:'15',  lbl:'Scans Matterport',    color:'#22c55e' },
              { val:'10',  lbl:'Capteurs IoT actifs', color:'#06b6d4' },
              { val:'24/7',lbl:'Monitoring continu',  color:'#0f766e' },
            ].map((s,i) => (
              <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${s.color}20`, borderRadius:'12px', padding:'12px', borderLeft:`3px solid ${s.color}` }}>
                <div style={{ fontSize:'1.4rem', fontWeight:800, color:s.color, fontFamily:"'Outfit',sans-serif" }}>{s.val}</div>
                <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', marginTop:'2px' }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  function renderPlan2D() {
    const serreInfo = {
      S01:{ nom:'Génétique & Amélioration', role:'Sélection variétale, culture in vitro et amélioration génétique des espèces végétales d\'intérêt agronomique.', surface:'280 m²', cultures:'Tomate, Piment, Melon', color:'#22c55e' },
      S02:{ nom:'Horticulture',             role:'Production florale, maraîchage sous abri et expérimentations horticoles en conditions contrôlées.',              surface:'320 m²', cultures:'Roses, Laitue, Fraise', color:'#06b6d4' },
      S03:{ nom:'Agronomie',                role:'Essais culturaux, comparaisons variétales et recherche appliquée en agronomie générale.',                        surface:'350 m²', cultures:'Blé, Orge, Légumineuses', color:'#a3e635' },
      S04:{ nom:'Hydroponie',               role:'Culture hors-sol en systèmes NFT, DWC et aéroponie pour la production intensive en milieu contrôlé.',            surface:'290 m²', cultures:'Basilic, Tomate, Laitue', color:'#f59e0b' },
      S05:{ nom:'Protection des Plantes',   role:'Phytopathologie, entomologie et étude des méthodes de lutte intégrée contre les ravageurs et maladies.',         surface:'260 m²', cultures:'Plants test, Cultures témoin', color:'#8b5cf6' },
    }
    const info = plan2dSerre ? serreInfo[plan2dSerre] : null
    const live = liveData.find(d => d.code === plan2dSerre)

    return (
      <div style={{ padding:'2.5rem', display:'grid', gridTemplateColumns:'1fr 340px', gap:'2rem', alignItems:'start' }}>
        {/* Left — Plan placeholder */}
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'20px', overflow:'hidden', minHeight:'450px', position:'relative', backdropFilter:'blur(10px)' }}>
          <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:'8px' }}>
            <Pulse color="#06b6d4" />
            <span style={{ fontSize:'12px', fontWeight:600, color:'rgba(255,255,255,0.6)', letterSpacing:'0.06em', textTransform:'uppercase' }}>Plan 2D Interactif · AgroBioTech</span>
          </div>

          {/* Plan schématique placeholder */}
          <div style={{ padding:'2rem', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'380px', gap:'20px' }}>
            {/* Placeholder serres cliquables */}
            <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.3)', marginBottom:'10px', textAlign:'center' }}>
              📐 Plan 2D à intégrer — cliquez sur une serre ci-dessous pour prévisualiser
            </div>
            <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', justifyContent:'center' }}>
              {SERRES_META.map(s => (
                <div key={s.code} onClick={() => setPlan2dSerre(s.code)} style={{
                  background: plan2dSerre===s.code ? `${s.color}20` : 'rgba(255,255,255,0.04)',
                  border:`2px solid ${plan2dSerre===s.code ? s.color : 'rgba(255,255,255,0.1)'}`,
                  borderRadius:'12px', padding:'16px 20px', cursor:'pointer',
                  transition:'all 0.3s', textAlign:'center', minWidth:'100px',
                  boxShadow: plan2dSerre===s.code ? `0 0 20px ${s.color}30` : 'none'
                }}>
                  <div style={{ fontSize:'20px', marginBottom:'6px' }}>🏠</div>
                  <div style={{ fontSize:'11px', fontWeight:700, color: plan2dSerre===s.code ? s.color : 'rgba(255,255,255,0.5)' }}>{s.code}</div>
                  <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)', marginTop:'2px' }}>{s.unit}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.2)', marginTop:'10px', textAlign:'center', maxWidth:'300px', lineHeight:1.6 }}>
              Le plan schématique SVG interactif sera intégré ici. Les clics sur les serres déclencheront l'affichage des informations à droite.
            </div>
          </div>
        </div>

        {/* Right — Info / Data panel */}
        <div style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${info ? info.color+'30' : 'rgba(255,255,255,0.08)'}`, borderRadius:'20px', overflow:'hidden', backdropFilter:'blur(10px)', transition:'all 0.4s' }}>
          {!plan2dSerre ? (
            <div style={{ padding:'2rem', textAlign:'center', color:'rgba(255,255,255,0.25)', fontSize:'13px', marginTop:'3rem' }}>
              <div style={{ fontSize:'40px', marginBottom:'12px' }}>👆</div>
              Sélectionnez une serre<br />pour afficher ses informations
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                {['info','data'].map(tab => (
                  <button key={tab} onClick={() => setPlan2dTab(tab)} style={{
                    flex:1, padding:'12px', fontSize:'12px', fontWeight:600,
                    background: plan2dTab===tab ? `${info?.color}15` : 'transparent',
                    color: plan2dTab===tab ? info?.color : 'rgba(255,255,255,0.35)',
                    border:'none', borderBottom: plan2dTab===tab ? `2px solid ${info?.color}` : '2px solid transparent',
                    cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.05em', textTransform:'uppercase', transition:'all 0.3s'
                  }}>
                    {tab === 'info' ? '📋 Infos' : '📊 Données live'}
                  </button>
                ))}
              </div>

              {plan2dTab === 'info' ? (
                <div style={{ padding:'1.5rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'1rem' }}>
                    <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:info?.color, boxShadow:`0 0 8px ${info?.color}` }} />
                    <span style={{ fontSize:'11px', fontWeight:700, color:info?.color, letterSpacing:'0.08em' }}>{plan2dSerre}</span>
                  </div>
                  <h3 style={{ fontSize:'16px', fontWeight:700, color:'white', marginBottom:'0.75rem', fontFamily:"'Outfit',sans-serif" }}>{info?.nom}</h3>
                  <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.8, marginBottom:'1.25rem' }}>{info?.role}</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 12px', background:'rgba(255,255,255,0.03)', borderRadius:'8px' }}>
                      <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)' }}>Surface</span>
                      <span style={{ fontSize:'12px', fontWeight:600, color:'white' }}>{info?.surface}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 12px', background:'rgba(255,255,255,0.03)', borderRadius:'8px' }}>
                      <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)' }}>Cultures principales</span>
                      <span style={{ fontSize:'12px', fontWeight:600, color:info?.color }}>{info?.cultures}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding:'1.5rem' }}>
                  {live ? (
                    <>
                      <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'6px' }}>
                        <Pulse color={info?.color} /> Données live · {plan2dSerre}
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                        {[
                          { k:'temperature', v:live.env?.temperature },
                          { k:'humidite',    v:live.env?.humidite },
                          { k:'vpd',         v:live.env?.vpd },
                          { k:'ph',          v:live.irr?.ph },
                          { k:'ec',          v:live.irr?.ec },
                          { k:'temp_eau',    v:live.irr?.temp_eau },
                        ].map(({k,v}) => {
                          const p = PARAM_INFO[k]
                          return (
                            <div key={k} style={{ background:`${p.color}10`, border:`1px solid ${p.color}25`, borderRadius:'10px', padding:'10px', textAlign:'center' }}>
                              <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.35)', marginBottom:'4px' }}>{p.label}</div>
                              <div style={{ fontSize:'1.1rem', fontWeight:800, color: v!=null ? p.color : 'rgba(255,255,255,0.2)', fontFamily:"'Outfit',sans-serif" }}>{v!=null ? `${v}${p.unit}` : '—'}</div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign:'center', color:'rgba(255,255,255,0.2)', fontSize:'12px', padding:'2rem' }}>Données non disponibles</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  function renderDonnees() {
    const fakeHistory = [22,22.5,23,22.8,23.2,23.5,23.1,22.9,23.4,23.6]
    const serre = liveData[serreDataIdx]
    const m = SERRES_META[serreDataIdx]

    return (
      <div style={{ padding:'2.5rem' }}>
        {/* Serre selector + refresh */}
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'2rem', flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', padding:'6px' }}>
            <button onClick={() => setSerreDataIdx(i => (i-1+5)%5)} style={{ width:'30px', height:'30px', borderRadius:'8px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>←</button>
            {SERRES_META.map((s,i) => (
              <button key={i} onClick={() => setSerreDataIdx(i)} style={{ padding:'6px 14px', borderRadius:'8px', fontSize:'12px', fontWeight:600, border:`1px solid ${serreDataIdx===i ? s.color+'50' : 'transparent'}`, background: serreDataIdx===i ? `${s.color}15` : 'transparent', color: serreDataIdx===i ? s.color : 'rgba(255,255,255,0.4)', cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}>{s.code}</button>
            ))}
            <button onClick={() => setSerreDataIdx(i => (i+1)%5)} style={{ width:'30px', height:'30px', borderRadius:'8px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>→</button>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'8px' }}>
            <Pulse color={m.color} />
            <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)' }}>{countdownLabel}</span>
            <button onClick={fetchAll} style={{ background:`${m.color}15`, color:m.color, border:`1px solid ${m.color}30`, padding:'6px 14px', borderRadius:'8px', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>↻ Actualiser</button>
          </div>
        </div>

        {serre ? (
          <>
            {/* Serre header */}
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'1.5rem', padding:'12px 16px', background:`${m.color}08`, border:`1px solid ${m.color}20`, borderRadius:'14px' }}>
              <div style={{ width:'12px', height:'12px', borderRadius:'50%', background:m.color, boxShadow:`0 0 10px ${m.color}` }} />
              <span style={{ fontSize:'14px', fontWeight:700, color:'white' }}>{serre.nom_fr}</span>
              <span style={{ fontSize:'10px', color:m.color, background:`${m.color}15`, border:`1px solid ${m.color}25`, padding:'3px 10px', borderRadius:'100px', fontWeight:600, marginLeft:'auto' }}>
                {serre.statut === 'ok' ? '● LIVE' : '◐ PARTIEL'}
              </span>
            </div>

            {/* ENV section */}
            <div style={{ marginBottom:'1.5rem' }}>
              <div style={{ fontSize:'11px', fontWeight:700, color:'rgba(255,255,255,0.35)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'10px', display:'flex', alignItems:'center', gap:'8px' }}>
                <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.06)' }} />
                Environnement
                <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.06)' }} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'16px' }}>
                {['temperature','humidite','vpd','co2'].map((k,i) => {
                  const p = PARAM_INFO[k]
                  const v = serre.env?.[k]
                  return <ParamCard key={k} label={p.label} value={v} unit={p.unit} color={p.color} info={p.desc} floatAnim={i+1} />
                })}
              </div>

              {/* Multi-line chart ENV */}
              <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'16px' }}>
                <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', marginBottom:'12px', letterSpacing:'0.06em', textTransform:'uppercase' }}>Tendances — Environnement</div>
                <svg viewBox="0 0 500 80" style={{ width:'100%', height:'60px' }}>
                  {/* Simulated lines */}
                  {[
                    { d:'M0,40 C50,35 100,38 150,33 C200,28 250,32 300,30 C350,28 400,25 500,22', color:'#f59e0b' },
                    { d:'M0,50 C50,55 100,48 150,52 C200,45 250,50 300,47 C350,43 400,48 500,44', color:'#06b6d4' },
                    { d:'M0,60 C50,58 100,62 150,57 C200,60 250,55 300,58 C350,52 400,56 500,50', color:'#8b5cf6' },
                    { d:'M0,30 C50,25 100,28 150,22 C200,18 250,24 300,20 C350,16 400,22 500,18', color:'#22c55e' },
                  ].map((l,i) => <path key={i} d={l.d} fill="none" stroke={l.color} strokeWidth="1.5" opacity="0.7" />)}
                </svg>
                <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', marginTop:'8px' }}>
                  {['temperature','humidite','vpd','co2'].map(k => {
                    const p = PARAM_INFO[k]
                    return <div key={k} style={{ display:'flex', alignItems:'center', gap:'5px' }}><div style={{ width:'12px', height:'3px', borderRadius:'2px', background:p.color }} /><span style={{ fontSize:'10px', color:'rgba(255,255,255,0.35)' }}>{p.label}</span></div>
                  })}
                </div>
              </div>
            </div>

            {/* IRR section */}
            <div>
              <div style={{ fontSize:'11px', fontWeight:700, color:'rgba(255,255,255,0.35)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'10px', display:'flex', alignItems:'center', gap:'8px' }}>
                <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.06)' }} />
                Irrigation
                <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.06)' }} />
              </div>

              {serre.irr ? (
                <>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'16px' }}>
                    {['ph','ec','temp_eau','niveau_eau'].map((k,i) => {
                      const p = PARAM_INFO[k]
                      const v = serre.irr?.[k]
                      return <ParamCard key={k} label={p.label} value={v} unit={p.unit} color={p.color} info={p.desc} floatAnim={i+1} />
                    })}
                  </div>
                  {/* Multi-line chart IRR */}
                  <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'16px' }}>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', marginBottom:'12px', letterSpacing:'0.06em', textTransform:'uppercase' }}>Tendances — Irrigation</div>
                    <svg viewBox="0 0 500 80" style={{ width:'100%', height:'60px' }}>
                      {[
                        { d:'M0,35 C80,32 160,37 240,33 C320,29 400,34 500,30', color:'#06b6d4' },
                        { d:'M0,50 C80,48 160,52 240,47 C320,44 400,49 500,45', color:'#a3e635' },
                        { d:'M0,45 C80,43 160,47 240,42 C320,39 400,44 500,40', color:'#f59e0b' },
                        { d:'M0,60 C80,58 160,62 240,57 C320,54 400,59 500,55', color:'#8b5cf6' },
                      ].map((l,i) => <path key={i} d={l.d} fill="none" stroke={l.color} strokeWidth="1.5" opacity="0.7" />)}
                    </svg>
                    <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', marginTop:'8px' }}>
                      {['ph','ec','temp_eau','niveau_eau'].map(k => {
                        const p = PARAM_INFO[k]
                        return <div key={k} style={{ display:'flex', alignItems:'center', gap:'5px' }}><div style={{ width:'12px', height:'3px', borderRadius:'2px', background:p.color }} /><span style={{ fontSize:'10px', color:'rgba(255,255,255,0.35)' }}>{p.label}</span></div>
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'20px', textAlign:'center', color:'rgba(255,255,255,0.2)', fontSize:'13px' }}>
                  Données d'irrigation non disponibles pour cette unité
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ textAlign:'center', color:'rgba(255,255,255,0.25)', padding:'3rem', fontSize:'13px' }}>Chargement des données...</div>
        )}
      </div>
    )
  }

  function renderVisite() {
    return (
      <div style={{ padding:'2.5rem' }}>
        {/* Campus tabs */}
        <div style={{ marginBottom:'2rem' }}>
          <div style={{ fontSize:'11px', fontWeight:700, color:'#06b6d4', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{ width:'4px', height:'18px', background:'#06b6d4', borderRadius:'2px' }} />
            Campus complet
          </div>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'1rem' }}>
            {SCANS_CAMPUS.map(s => (
              <button key={s.id} onClick={() => setActiveScan(s.id)} style={{
                padding:'7px 14px', borderRadius:'20px', fontSize:'12px', fontWeight:500,
                border:`1px solid ${activeScan===s.id ? '#06b6d4' : 'rgba(255,255,255,0.12)'}`,
                background: activeScan===s.id ? 'rgba(6,182,212,0.12)' : 'rgba(255,255,255,0.04)',
                color: activeScan===s.id ? '#06b6d4' : 'rgba(255,255,255,0.5)',
                cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s'
              }}>
                {lang==='fr' ? s.fr : s.en}
              </button>
            ))}
          </div>
          <div style={{ borderRadius:'16px', overflow:'hidden', position:'relative', paddingBottom:'52%', background:'#0a1628' }}>
            <iframe src={`https://my.matterport.com/show/?m=${activeScan}&play=1&qs=1&lang=${lang}`} style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:'none' }} allowFullScreen allow="xr-spatial-tracking" />
          </div>
        </div>

        <div style={{ height:'1px', background:'rgba(255,255,255,0.07)', margin:'0 0 2rem' }} />

        {/* Serres */}
        <div>
          <div style={{ fontSize:'11px', fontWeight:700, color:'#22c55e', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{ width:'4px', height:'18px', background:'#22c55e', borderRadius:'2px' }} />
            Les 5 serres de recherche
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'8px', marginBottom:'1rem' }}>
            {SERRES_VISITE.map(s => (
              <div key={s.id} onClick={() => setActiveSerre(activeSerre?.id===s.id ? null : s)} style={{
                background: activeSerre?.id===s.id ? `${s.color}15` : 'rgba(255,255,255,0.04)',
                border:`1.5px solid ${activeSerre?.id===s.id ? s.color : 'rgba(255,255,255,0.08)'}`,
                borderTop:`3px solid ${s.color}`,
                borderRadius:'12px', padding:'12px', cursor:'pointer', transition:'all 0.2s',
                boxShadow: activeSerre?.id===s.id ? `0 0 20px ${s.color}20` : 'none'
              }}>
                <div style={{ fontSize:'10px', fontWeight:700, color:s.color, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'5px' }}>{s.badge}</div>
                <div style={{ fontSize:'12px', fontWeight:600, color:'rgba(255,255,255,0.8)', lineHeight:1.3 }}>{lang==='fr' ? s.fr : s.en}</div>
                <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.35)', marginTop:'5px', lineHeight:1.4 }}>{s.desc}</div>
              </div>
            ))}
          </div>

          {activeSerre ? (
            <div style={{ borderRadius:'16px', overflow:'hidden', position:'relative', paddingBottom:'52%', background:'#0a1628' }}>
              <iframe src={`https://my.matterport.com/show/?m=${activeSerre.id}&play=1&qs=1&lang=${lang}`} style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:'none' }} allowFullScreen allow="xr-spatial-tracking" />
            </div>
          ) : (
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', padding:'3rem', textAlign:'center', color:'rgba(255,255,255,0.2)', fontSize:'13px' }}>
              Sélectionnez une serre pour lancer sa visite virtuelle 3D
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderFooter() {
    return (
      <footer style={{ background:'rgba(0,0,0,0.4)', borderTop:'1px solid rgba(255,255,255,0.07)', padding:'2rem 2.5rem' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:'2rem', alignItems:'center', marginBottom:'1.5rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:'linear-gradient(135deg,#16a34a,#06b6d4)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3C12 3 5 7 5 13c0 4 3 7 7 7s7-3 7-7c0-6-7-10-7-10z" stroke="white" strokeWidth="1.6"/><path d="M12 20V10M9 14l3-2 3 2" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/></svg>
            </div>
            <div>
              <div style={{ fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.8)' }}>IAV Hassan II</div>
              <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)' }}>Institut Agronomique · Rabat, Maroc</div>
            </div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'14px', fontWeight:700, color:'white', marginBottom:'4px' }}>Serre Digitale Intelligente</div>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)' }}>Campus AgroBioTech · Géoportail · Jumeau Numérique</div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.2)', color:'#22c55e', fontSize:'10px', fontWeight:600, padding:'4px 12px', borderRadius:'20px', marginTop:'8px' }}>
              PFE · Ingénieur Géomètre Topographe · 2024–2025
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Réalisé par</div>
            <div style={{ fontSize:'13px', fontWeight:600, color:'rgba(255,255,255,0.7)' }}>Lemghari Rania</div>
            <div style={{ fontSize:'13px', fontWeight:600, color:'rgba(255,255,255,0.7)' }}>Nafia Kaoutar</div>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', marginTop:'6px' }}>Encadrantes :</div>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.45)' }}>Pr. Ait el Kadi Kenza · Pr. Taimourya Houda</div>
          </div>
        </div>
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:'1rem', textAlign:'center', fontSize:'10px', color:'rgba(255,255,255,0.2)' }}>
          © 2025 IAV Hassan II · Campus AgroBioTech · Tous droits réservés
        </div>
      </footer>
    )
  }

  const sections = {
    projet:  renderProjet,
    apropos: renderApropos,
    campus:  renderCampus,
    plan2d:  renderPlan2D,
    donnees: renderDonnees,
    visite:  renderVisite,
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#060d14', fontFamily:"'Outfit','Inter',sans-serif" }}>

      {/* ── Sidebar ───────────────────────────────────── */}
      <aside style={{
        width: sidebarOpen ? '260px' : '60px',
        flexShrink:0, transition:'width 0.3s ease',
        background:'rgba(8,15,26,0.95)', borderRight:'1px solid rgba(255,255,255,0.07)',
        backdropFilter:'blur(20px)', display:'flex', flexDirection:'column',
        position:'fixed', top:0, left:0, bottom:0, zIndex:200, overflow:'hidden'
      }}>
        {/* Logo */}
        <div style={{ padding:'18px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:'10px', minHeight:'64px' }}>
          <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:'linear-gradient(135deg,#16a34a,#06b6d4)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3C12 3 5 7 5 13c0 4 3 7 7 7s7-3 7-7c0-6-7-10-7-10z" stroke="white" strokeWidth="1.8"/></svg>
          </div>
          {sidebarOpen && (
            <div style={{ overflow:'hidden' }}>
              <div style={{ fontSize:'12px', fontWeight:700, color:'white', whiteSpace:'nowrap' }}>Serre Digitale</div>
              <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.35)', whiteSpace:'nowrap' }}>IAV Hassan II</div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(o => !o)} style={{ marginLeft:'auto', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.5)', width:'24px', height:'24px', borderRadius:'6px', cursor:'pointer', fontSize:'12px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex:1, padding:'12px 8px', display:'flex', flexDirection:'column', gap:'4px', overflowY:'auto' }}>
          {nav.map(item => (
            <button key={item.id} onClick={() => setActiveSection(item.id)} style={{
              display:'flex', alignItems:'center', gap:'10px',
              padding: sidebarOpen ? '10px 12px' : '10px',
              borderRadius:'12px', cursor:'pointer', border:'none', fontFamily:'inherit',
              background: activeSection===item.id ? 'rgba(34,197,94,0.12)' : 'transparent',
              borderLeft: activeSection===item.id ? '3px solid #22c55e' : '3px solid transparent',
              transition:'all 0.2s', justifyContent: sidebarOpen ? 'flex-start' : 'center',
              boxShadow: activeSection===item.id ? '0 0 20px rgba(34,197,94,0.08)' : 'none'
            }}>
              <span style={{ fontSize:'16px', flexShrink:0 }}>{item.icon}</span>
              {sidebarOpen && <span style={{ fontSize:'13px', fontWeight: activeSection===item.id ? 600 : 400, color: activeSection===item.id ? '#22c55e' : 'rgba(255,255,255,0.5)', whiteSpace:'nowrap' }}>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding:'12px 8px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', gap:'4px' }}>
          {/* Lang toggle */}
          {sidebarOpen && (
            <div style={{ display:'flex', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', overflow:'hidden', marginBottom:'6px' }}>
              {['fr','en'].map(l => (
                <button key={l} onClick={() => setLang(l)} style={{ flex:1, padding:'6px', fontSize:'11px', fontWeight:600, background: lang===l ? 'rgba(34,197,94,0.2)' : 'transparent', color: lang===l ? '#22c55e' : 'rgba(255,255,255,0.35)', border:'none', cursor:'pointer', fontFamily:'inherit' }}>{l.toUpperCase()}</button>
              ))}
            </div>
          )}
          <Link to="/dashboard" style={{
            display:'flex', alignItems:'center', gap:'10px', justifyContent: sidebarOpen ? 'flex-start' : 'center',
            padding: sidebarOpen ? '10px 12px' : '10px',
            background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.2)',
            borderRadius:'10px', color:'#22c55e', textDecoration:'none', fontSize:'12px', fontWeight:600, transition:'all 0.2s'
          }}>
            <span>🔐</span>
            {sidebarOpen && <span>Admin</span>}
          </Link>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────── */}
      <main style={{ flex:1, marginLeft: sidebarOpen ? '260px' : '60px', transition:'margin-left 0.3s ease', display:'flex', flexDirection:'column', minHeight:'100vh' }}>
        {/* Top header */}
        <header style={{
          position:'sticky', top:0, zIndex:100,
          background:'rgba(6,13,20,0.9)', backdropFilter:'blur(20px)',
          borderBottom:'1px solid rgba(255,255,255,0.07)',
          padding:'0 2rem', height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between'
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
            <h1 style={{ fontSize:'15px', fontWeight:700, color:'white', fontFamily:"'Outfit',sans-serif" }}>Serre Digitale Intelligente</h1>
            <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)' }}>IAV Hassan II · AgroBioTech</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'rgba(255,255,255,0.4)' }}>
              <Pulse />
              <span>Live · {countdownLabel}</span>
            </div>
            <div style={{ fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.7)', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'5px 14px' }}>
              {nav.find(n => n.id===activeSection)?.icon} {nav.find(n => n.id===activeSection)?.label}
            </div>
          </div>
        </header>

        {/* Section content */}
        <div style={{ flex:1 }}>
          {sections[activeSection]?.()}
        </div>

        {/* Footer */}
        {renderFooter()}
      </main>

      <style>{`
        @keyframes sdiPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes sdiFloat1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes sdiFloat2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes sdiFloat3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
        @keyframes sdiFloat4 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(34,197,94,0.2); border-radius: 2px; }
      `}</style>
    </div>
  )
}
