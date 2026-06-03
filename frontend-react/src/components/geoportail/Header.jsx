// src/components/geoportail/Header.jsx
import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function Header({ lang, setLang, darkMode, setDarkMode }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const bg = darkMode
    ? scrolled ? 'rgba(7,17,31,0.95)' : 'rgba(7,17,31,0.80)'
    : scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.82)'

  const borderColor = darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)'
  const shadow = scrolled
    ? darkMode ? '0 8px 32px rgba(0,0,0,0.45)' : '0 8px 32px rgba(15,23,42,0.09)'
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
      position: 'fixed',
      top: 0,
      left: 0,       // ← full width, starts at left edge
      right: 0,
      zIndex: 500,   // ← above sidebar
      height: '72px',
      background: bg,
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: `1px solid ${borderColor}`,
      boxShadow: shadow,
      display: 'flex', alignItems: 'center',
      padding: '0 32px',
      gap: '28px',
      transition: 'background 0.35s ease, box-shadow 0.35s ease',
    }}>

      {/* Logo + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
        <div
          style={{
            width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0,
            overflow: 'hidden',
            boxShadow: darkMode
              ? '0 0 18px rgba(34,197,94,0.22), 0 3px 10px rgba(0,0,0,0.3)'
              : '0 0 14px rgba(34,197,94,0.18), 0 3px 10px rgba(0,0,0,0.09)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            cursor: 'pointer',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.07) rotate(-3deg)'
            e.currentTarget.style.boxShadow = '0 0 28px rgba(34,197,94,0.42), 0 6px 18px rgba(0,0,0,0.18)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
            e.currentTarget.style.boxShadow = darkMode
              ? '0 0 18px rgba(34,197,94,0.22), 0 3px 10px rgba(0,0,0,0.3)'
              : '0 0 14px rgba(34,197,94,0.18), 0 3px 10px rgba(0,0,0,0.09)'
          }}
        >
          <img
            src="/iav_logo.png"
            alt="IAV Logo"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{
            fontSize: '18px', fontWeight: 800,
            fontFamily: "'Space Grotesk','Outfit',sans-serif",
            letterSpacing: '-0.5px', lineHeight: 1,
            display: 'flex', alignItems: 'baseline', gap: '5px',
          }}>
            <span style={{ color: darkMode ? '#F8FAFC' : '#0F172A' }}>{titleFirst}</span>
            <span style={{ color: '#22C55E' }}>{titleLast}</span>
          </div>
          <div style={{
            fontSize: '10.5px', fontWeight: 500,
            color: darkMode ? '#64748B' : '#94A3B8',
            fontFamily: "'Inter','Outfit',sans-serif", lineHeight: 1,
          }}>{T.sub}</div>
          <div style={{
            fontSize: '8.5px', fontWeight: 600,
            color: darkMode ? '#475569' : '#CBD5E1',
            letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1,
          }}>{T.tech}</div>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Live badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '7px',
        background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.22)',
        borderRadius: '999px', padding: '6px 13px',
        fontSize: '11.5px', fontWeight: 600, color: '#22C55E', flexShrink: 0,
      }}>
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: '#22C55E', boxShadow: '0 0 7px rgba(34,197,94,0.8)',
          display: 'inline-block', animation: 'hdrPulse 2s ease-in-out infinite',
        }} />
        {T.live}
      </div>

      {/* Lang toggle */}
      <div style={{
        display: 'flex', border: `1px solid ${btnBorder}`,
        borderRadius: '12px', overflow: 'hidden', height: '40px', flexShrink: 0,
      }}>
        {['fr', 'en'].map(l => (
          <button key={l} onClick={() => setLang(l)} style={{
            padding: '0 16px', height: '40px', fontSize: '12.5px', fontWeight: 700,
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
        display: 'flex', alignItems: 'center', gap: '8px',
        height: '40px', padding: '0 18px', borderRadius: '12px',
        cursor: 'pointer', background: btnBg, border: `1px solid ${btnBorder}`,
        color: btnColor, fontSize: '12.5px', fontWeight: 600,
        fontFamily: "'Outfit',sans-serif", transition: 'all 0.3s ease', flexShrink: 0,
      }}
        onMouseEnter={e => {
          e.currentTarget.style.background  = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)'
          e.currentTarget.style.boxShadow   = '0 0 14px rgba(34,197,94,0.18)'
          e.currentTarget.style.borderColor = 'rgba(34,197,94,0.3)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background  = btnBg
          e.currentTarget.style.boxShadow   = 'none'
          e.currentTarget.style.borderColor = btnBorder
        }}
      >
        {darkMode
          ? <><Sun size={14} strokeWidth={2} /><span>{T.day}</span></>
          : <><Moon size={14} strokeWidth={2} /><span>{T.night}</span></>
        }
      </button>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&family=Inter:wght@400;500;600&display=swap');
        @keyframes hdrPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.82)} }
      `}</style>
    </header>
  )
}
