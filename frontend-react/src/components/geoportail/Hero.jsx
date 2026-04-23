// src/components/geoportail/Hero.jsx
import { useEffect, useRef } from 'react'

export default function Hero({ lang, stats }) {
  const particlesRef = useRef(null)

  useEffect(() => {
    if (!particlesRef.current) return
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div')
      const size = Math.random() * 60 + 20
      p.style.cssText = `
        position:absolute; border-radius:50%;
        background:rgba(74,222,128,0.1);
        width:${size}px; height:${size}px;
        left:${Math.random() * 100}%;
        animation:floatUp ${Math.random() * 20 + 15}s linear ${Math.random() * 15}s infinite;
        opacity:${Math.random() * 0.15 + 0.05};
      `
      particlesRef.current.appendChild(p)
    }
  }, [])

  const t = {
    fr: {
      badge: 'Données IoT en temps réel',
      title1: 'Serre Digitale', title2: 'Intelligente',
      sub: "Géoportail interactif du campus AgroBioTech — visualisation 3D, données capteurs live et jumeau numérique des 5 serres connectées de l'IAV Hassan II.",
      btn1: 'Explorer la carte', btn2: 'Visite virtuelle 3D',
      scroll: 'Défiler',
      serres: 'Serres connectées', capteurs: 'Capteurs actifs',
      mesures: "Mesures aujourd'hui", scans: 'Scans Matterport',
    },
    en: {
      badge: 'Real-time IoT Data',
      title1: 'Smart Digital', title2: 'Greenhouse',
      sub: 'Interactive geoportal of the AgroBioTech campus — 3D visualization, live sensor data and digital twin of the 5 connected greenhouses of IAV Hassan II.',
      btn1: 'Explore the map', btn2: '3D Virtual tour',
      scroll: 'Scroll',
      serres: 'Connected greenhouses', capteurs: 'Active sensors',
      mesures: 'Measures today', scans: 'Matterport scans',
    }
  }[lang]

  return (
    <section id="hero" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#0a2e1a 0%,#0d4a2a 40%,#064e3b 70%,#0f3460 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', paddingTop: '68px'
    }}>
      {/* Particles */}
      <div ref={particlesRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }} />

      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(74,222,128,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(74,222,128,0.06) 1px,transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '860px', padding: '2rem' }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)',
          color: '#86efac', fontSize: '12px', fontWeight: 500,
          padding: '5px 16px', borderRadius: '100px', marginBottom: '1.5rem'
        }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }}></span>
          {t.badge}
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(2.8rem,6vw,5rem)',
          fontWeight: 800, color: 'white', lineHeight: 1.05,
          marginBottom: '1rem', letterSpacing: '-0.03em'
        }}>
          {t.title1}<br />
          <span style={{ color: '#4ade80' }}>{t.title2}</span>
        </h1>

        {/* Sub */}
        <p style={{
          fontSize: '1.05rem', color: 'rgba(255,255,255,0.6)', fontWeight: 300,
          marginBottom: '2.5rem', maxWidth: '560px', margin: '0 auto 2.5rem',
          lineHeight: 1.7
        }}>
          {t.sub}
        </p>

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
          {[
            { val: 5, lbl: t.serres },
            { val: stats?.capteurs_actifs ?? 10, lbl: t.capteurs },
            { val: stats?.mesures_24h ? Math.round(stats.mesures_24h / 1000) + 'k' : '—', lbl: t.mesures },
            { val: 15, lbl: t.scans },
          ].map((s, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '14px', padding: '1rem 1.4rem', minWidth: '120px', textAlign: 'center'
            }}>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '2rem', fontWeight: 800, color: '#4ade80', lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#agrobiotech" style={{
            background: '#22c55e', color: 'white', padding: '13px 28px',
            borderRadius: '12px', fontSize: '14px', fontWeight: 600,
            textDecoration: 'none', transition: 'all 0.3s'
          }}>{t.btn1} →</a>
          <a href="#visite" style={{
            background: 'rgba(255,255,255,0.08)', color: 'white',
            border: '1px solid rgba(255,255,255,0.22)', padding: '13px 28px',
            borderRadius: '12px', fontSize: '14px', fontWeight: 500, textDecoration: 'none'
          }}>{t.btn2}</a>
        </div>
      </div>

      {/* Scroll arrow */}
      <div style={{
        position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
        color: 'rgba(255,255,255,0.35)', fontSize: '11px', cursor: 'pointer'
      }} onClick={() => document.getElementById('agrobiotech')?.scrollIntoView({ behavior: 'smooth' })}>
        <span>{t.scroll}</span>
        <div style={{
          width: '18px', height: '18px',
          borderRight: '2px solid rgba(255,255,255,0.3)', borderBottom: '2px solid rgba(255,255,255,0.3)',
          transform: 'rotate(45deg)'
        }} />
      </div>

      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100px) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </section>
  )
}