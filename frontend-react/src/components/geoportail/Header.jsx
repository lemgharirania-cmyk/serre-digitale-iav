// src/components/geoportail/Header.jsx
import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function Header({ lang, setLang, darkMode, setDarkMode, isMobile = false }) {
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
      // ── FIX: simpler 2-word title for mobile — "Serre Digitale" fits cleanly
      title:      'Serre Digitale Intelligente',
      titleShort: 'Serre Digitale',
      sub:        'IAV Hassan II · AgroBioTech',
      tech:       'Jumeau Numérique · Monitoring IoT · Visualisation 3D',
      live:       'En direct', day: 'Mode Jour', night: 'Mode Nuit',
    },
    en: {
      title:      'Smart Digital Greenhouse',
      titleShort: 'Smart Greenhouse',
      sub:        'IAV Hassan II · AgroBioTech',
      tech:       'Digital Twin · IoT Monitoring · 3D Visualization',
      live:       'Live', day: 'Light Mode', night: 'Dark Mode',
    },
  }[lang]

  // Mobile: show short title with last word in green
  // "Serre Digitale" → first="Serre" last="Digitale"
  const displayTitle = isMobile ? T.titleShort : T.title
  const titleWords   = displayTitle.split(' ')
  const titleFirst   = titleWords.slice(0, -1).join(' ')
  const titleLast    = titleWords.slice(-1)[0]

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      zIndex: 500, height: '72px',
      background: bg,
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      borderBottom: `1px solid ${borderColor}`,
      boxShadow: shadow,
      display: 'flex', alignItems: 'center',
      padding: isMobile ? '0 14px' : '0 32px',
      gap: isMobile ? '10px' : '28px',
      transition: 'background 0.35s ease, box-shadow 0.35s ease',
      overflow: 'hidden',   // ← prevent any child from overflowing
    }}>

      {/* Logo + Title */}
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: isMobile ? '9px' : '16px',
        flexShrink: 0,
        minWidth: 0,        // ← allow truncation if needed
      }}>
        {/* Logo container */}
        <div style={{
          width: isMobile ? '36px' : '46px',
          height: isMobile ? '36px' : '46px',
          borderRadius: '12px',
          flexShrink: 0,
          overflow: 'hidden',
          // ── no background — logo adapts to dark/light mode naturally ──
          background: 'transparent',
          boxShadow: darkMode
            ? '0 0 20px rgba(34,197,94,0.2), 0 4px 12px rgba(0,0,0,0.4)'
            : '0 4px 12px rgba(0,0,0,0.12)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          cursor: 'pointer',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = '0 0 28px rgba(34,197,94,0.35), 0 6px 16px rgba(0,0,0,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = darkMode ? '0 0 20px rgba(34,197,94,0.2), 0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.12)' }}
        >
          {/* ── FIX: was /sdi_logo.png → /iav_logo.png ── */}
          <img
            src="/iav_logo.png"
            alt="IAV Hassan II"
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              // ── invert logo on dark mode so it stays visible without white bg ──
              filter: darkMode ? 'brightness(0) invert(1)' : 'none',
              transition: 'filter 0.3s ease',
            }}
          />
        </div>

        {/* Title text */}
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: "'Space Grotesk','Outfit',sans-serif",
            // ── FIX: smaller font on mobile so title doesn't get clipped ──
            fontSize: isMobile ? '13px' : '17px',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: darkMode ? '#F8FAFC' : '#0F172A',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {titleFirst}{' '}
            <span style={{
              background: 'linear-gradient(135deg, #22C55E, #06B6D4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {titleLast}
            </span>
          </div>

          {/* Subtitle — desktop only */}
          {!isMobile && (
            <div style={{
              fontFamily: "'Inter',sans-serif",
              fontSize: '11px',
              color: darkMode ? '#64748B' : '#94A3B8',
              letterSpacing: '0.01em',
              marginTop: '1px',
            }}>
              {T.sub}
            </div>
          )}
        </div>
      </div>

      {/* Tech tagline — desktop only */}
      {!isMobile && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 14px', borderRadius: '20px',
            background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', animation: 'hdrPulse 2s ease-in-out infinite', flexShrink: 0 }} />
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '11px', fontWeight: 500, color: darkMode ? '#64748B' : '#94A3B8', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
              {T.tech}
            </span>
          </div>
        </div>
      )}

      {/* Spacer on mobile */}
      {isMobile && <div style={{ flex: 1 }} />}

      {/* Controls — right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '12px', flexShrink: 0 }}>

        {/* Lang switcher */}
        <button
          onClick={() => setLang(l => l === 'fr' ? 'en' : 'fr')}
          style={{
            padding: isMobile ? '5px 9px' : '7px 14px',
            borderRadius: '20px',
            background: btnBg,
            border: `1px solid ${btnBorder}`,
            color: btnColor,
            fontFamily: "'Inter',sans-serif",
            fontSize: isMobile ? '11px' : '12px',
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '0.04em',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)'; e.currentTarget.style.boxShadow = '0 0 14px rgba(34,197,94,0.18)'; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.background = btnBg; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = btnBorder }}
        >
          {lang === 'fr' ? 'EN' : 'FR'}
        </button>

        {/* Dark/Light toggle — icon only on mobile */}
        <button
          onClick={() => setDarkMode(d => !d)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: isMobile ? '5px 9px' : '7px 14px',
            borderRadius: '20px',
            background: btnBg,
            border: `1px solid ${btnBorder}`,
            color: btnColor,
            fontFamily: "'Inter',sans-serif",
            fontSize: isMobile ? '11px' : '12px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)'; e.currentTarget.style.boxShadow = '0 0 14px rgba(34,197,94,0.18)'; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.background = btnBg; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = btnBorder }}
        >
          {darkMode
            ? <><Sun size={14} strokeWidth={2} />{!isMobile && <span>{T.day}</span>}</>
            : <><Moon size={14} strokeWidth={2} />{!isMobile && <span>{T.night}</span>}</>
          }
        </button>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&family=Inter:wght@400;500;600&display=swap');
        @keyframes hdrPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.82)} }
      `}</style>
    </header>
  )
}
