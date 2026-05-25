// src/components/geoportail/Header.jsx
import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function Header({ lang, setLang, darkMode, setDarkMode, sidebarWidth = 240 }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const bg = darkMode
    ? scrolled ? 'rgba(7,17,31,0.92)' : 'rgba(7,17,31,0.72)'
    : scrolled ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)'

  const borderColor = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'
  const shadow = scrolled
    ? darkMode ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(15,23,42,0.08)'
    : 'none'

  const btnBorder = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)'
  const btnBg     = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)'
  const btnColor  = darkMode ? '#CBD5E1' : '#475569'

  const T = {
    fr: {
      title: 'Serre Digitale Intelligente',
      sub:   'IAV Hassan II · AgroBioTech',
      tech:  'Jumeau Numérique · Monitoring IoT · Visualisation 3D',
      live:  'En direct', day: 'Mode Jour', night: 'Mode Nuit',
    },
    en: {
      title: 'Smart Digital Greenhouse',
      sub:   'IAV Hassan II · AgroBioTech',
      tech:  'Digital Twin · IoT Monitoring · 3D Visualization',
      live:  'Live', day: 'Light Mode', night: 'Dark Mode',
    },
  }[lang]

  const titleWords = T.title.split(' ')
  const titleFirst = titleWords.slice(0, -1).join(' ')
  const titleLast  = titleWords.slice(-1)[0]

  return (
    <header style={{
      position: 'fixed', top: 0, left: `${sidebarWidth}px`, right: 0, zIndex: 300,
      height: '80px',
      background: bg,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${borderColor}`,
      borderRadius: scrolled ? '0 0 18px 18px' : '0',
      boxShadow: shadow,
      display: 'flex', alignItems: 'center',
      padding: '0 48px', gap: '32px',
      transition: 'background 0.35s ease, box-shadow 0.35s ease, border-radius 0.35s ease, left 0.3s ease',
    }}>

      {/* Logo + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexShrink: 0 }}>
      <div
  style={{
    width: '52px', height: '52px', borderRadius: '16px', flexShrink: 0,
    overflow: 'hidden',
    boxShadow: darkMode
      ? '0 0 20px rgba(34,197,94,0.25), 0 4px 12px rgba(0,0,0,0.3)'
      : '0 0 16px rgba(34,197,94,0.2), 0 4px 12px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer',
  }}
  onMouseEnter={e => {
    e.currentTarget.style.transform = 'scale(1.07) rotate(-3deg)'
    e.currentTarget.style.boxShadow = '0 0 30px rgba(34,197,94,0.45), 0 8px 20px rgba(0,0,0,0.2)'
  }}
  onMouseLeave={e => {
    e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
    e.currentTarget.style.boxShadow = darkMode
      ? '0 0 20px rgba(34,197,94,0.25), 0 4px 12px rgba(0,0,0,0.3)'
      : '0 0 16px rgba(34,197,94,0.2), 0 4px 12px rgba(0,0,0,0.1)'
  }}
>
  <img
    src="/iav_logo.png"
    alt="IAV Logo"
    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
  />
</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{
            fontSize: '19px', fontWeight: 800,
            fontFamily: "'Space Grotesk','Outfit',sans-serif",
            letterSpacing: '-0.5px', lineHeight: 1,
            display: 'flex', alignItems: 'baseline', gap: '5px',
          }}>
            <span style={{ color: darkMode ? '#F8FAFC' : '#0F172A' }}>{titleFirst}</span>
            <span style={{ color: '#22C55E' }}>{titleLast}</span>
          </div>
          <div style={{
            fontSize: '11px', fontWeight: 500,
            color: darkMode ? '#64748B' : '#94A3B8',
            fontFamily: "'Inter','Outfit',sans-serif", lineHeight: 1,
          }}>{T.sub}</div>
          <div style={{
            fontSize: '9px', fontWeight: 600,
            color: darkMode ? '#475569' : '#CBD5E1',
            letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1,
          }}>{T.tech}</div>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Live badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '7px',
        background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
        borderRadius: '999px', padding: '7px 14px',
        fontSize: '12px', fontWeight: 600, color: '#22C55E', flexShrink: 0,
      }}>
        <span style={{
          width: '7px', height: '7px', borderRadius: '50%',
          background: '#22C55E', boxShadow: '0 0 8px rgba(34,197,94,0.8)',
          display: 'inline-block', animation: 'hdrPulse 2s ease-in-out infinite',
        }} />
        {T.live}
      </div>

      {/* Lang toggle */}
      <div style={{
        display: 'flex', border: `1px solid ${btnBorder}`,
        borderRadius: '14px', overflow: 'hidden', height: '44px', flexShrink: 0,
      }}>
        {['fr', 'en'].map(l => (
          <button key={l} onClick={() => setLang(l)} style={{
            padding: '0 18px', height: '44px', fontSize: '13px', fontWeight: 700,
            background: lang === l
              ? (darkMode ? 'rgba(34,197,94,0.18)' : 'rgba(34,197,94,0.12)') : btnBg,
            color: lang === l ? '#22C55E' : btnColor,
            border: 'none', cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
            letterSpacing: '0.06em', transition: 'all 0.3s ease',
          }}>{l.toUpperCase()}</button>
        ))}
      </div>

      {/* Dark/Light toggle */}
      <button onClick={() => setDarkMode(d => !d)} style={{
        display: 'flex', alignItems: 'center', gap: '9px',
        height: '44px', padding: '0 20px', borderRadius: '14px',
        cursor: 'pointer', background: btnBg, border: `1px solid ${btnBorder}`,
        color: btnColor, fontSize: '13px', fontWeight: 600,
        fontFamily: "'Outfit',sans-serif", transition: 'all 0.3s ease', flexShrink: 0,
      }}
        onMouseEnter={e => {
          e.currentTarget.style.background  = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)'
          e.currentTarget.style.boxShadow   = '0 0 16px rgba(34,197,94,0.18)'
          e.currentTarget.style.borderColor = 'rgba(34,197,94,0.3)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background  = btnBg
          e.currentTarget.style.boxShadow   = 'none'
          e.currentTarget.style.borderColor = btnBorder
        }}
      >
        {darkMode
          ? <><Sun size={15} strokeWidth={2} /><span>{T.day}</span></>
          : <><Moon size={15} strokeWidth={2} /><span>{T.night}</span></>
        }
      </button>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&family=Inter:wght@400;500;600&display=swap');
        @keyframes hdrPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.82)} }
      `}</style>
    </header>
  )
}
