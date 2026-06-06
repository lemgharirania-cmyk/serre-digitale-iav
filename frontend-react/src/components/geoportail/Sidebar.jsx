// src/components/geoportail/Sidebar.jsx
import { ChevronLeft, ChevronRight, LayoutDashboard, Info, MapPin, Map, BarChart2, Scan, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'

const NAV = [
  { id: 'projet',  icon: LayoutDashboard, labelFr: 'Notre Projet',    labelEn: 'Our Project' },
  { id: 'apropos', icon: Info,            labelFr: 'À Propos',         labelEn: 'About' },
  { id: 'campus',  icon: MapPin,          labelFr: 'AgroBioTech',      labelEn: 'AgroBioTech' },
  { id: 'plan2d',  icon: Map,             labelFr: 'Plan 2D',          labelEn: '2D Plan' },
  { id: 'visite',  icon: Scan,            labelFr: 'Visite Virtuelle', labelEn: 'Virtual Tour' },
  { id: 'donnees', icon: BarChart2,       labelFr: 'Données',          labelEn: 'Data' },
]

export default function Sidebar({ open, setOpen, active, lang, darkMode }) {
  // Rich deep blue-green gradient for dark mode — much more elegant
  const bg = darkMode
    ? 'linear-gradient(180deg, #0A1628 0%, #0D1F35 30%, #091A2E 65%, #0B1E2F 100%)'
    : '#FFFFFF'

  const border     = darkMode ? 'rgba(34,197,94,0.08)' : 'rgba(0,0,0,0.08)'
  const textMuted  = darkMode ? '#4B6A8A' : '#94A3B8'
  const textNormal = darkMode ? '#8BA8C4' : '#475569'
  const activeText = '#22C55E'
  const activeBg   = darkMode ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.07)'
  const hoverBg    = darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'

  // Subtle shimmer line at top of sidebar in dark mode
  const topAccent = darkMode
    ? 'linear-gradient(90deg, transparent, rgba(34,197,94,0.35), transparent)'
    : 'transparent'

  function scrollTo(id) {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <aside style={{
      position: 'fixed',
      top: '72px',      // ← starts below header (header height)
      left: 0,
      bottom: 0,
      zIndex: 400,      // ← below header (500)
      width: open ? '240px' : '64px',
      background: bg,
      borderRight: `1px solid ${border}`,
      backdropFilter: 'blur(20px)',
      transition: 'width 0.3s ease',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      boxShadow: darkMode
        ? '4px 0 32px rgba(0,0,0,0.35), inset -1px 0 0 rgba(34,197,94,0.06)'
        : '4px 0 20px rgba(0,0,0,0.05)',
    }}>

      {/* Subtle top accent shimmer */}
      {darkMode && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '1px',
          background: topAccent,
          pointerEvents: 'none',
          zIndex: 1,
        }} />
      )}

      {/* Ambient glow orb in background (dark mode only) */}
      {darkMode && (
        <div style={{
          position: 'absolute', bottom: '20%', left: '50%',
          transform: 'translateX(-50%)',
          width: '160px', height: '160px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)',
          filter: 'blur(20px)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />
      )}

      {/* Toggle button row */}
      <div style={{
        height: '52px', flexShrink: 0,
        borderBottom: `1px solid ${border}`,
        display: 'flex', alignItems: 'center',
        justifyContent: open ? 'flex-end' : 'center',
        padding: open ? '0 12px' : '0',
        position: 'relative', zIndex: 2,
      }}>
        <button onClick={() => setOpen(o => !o)} style={{
          width: '30px', height: '30px', borderRadius: '9px',
          background: darkMode ? 'rgba(34,197,94,0.08)' : 'rgba(0,0,0,0.05)',
          border: `1px solid ${darkMode ? 'rgba(34,197,94,0.15)' : border}`,
          color: darkMode ? '#4ADE80' : textMuted, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => {
            e.currentTarget.style.background = darkMode ? 'rgba(34,197,94,0.14)' : 'rgba(0,0,0,0.08)'
            e.currentTarget.style.boxShadow = darkMode ? '0 0 10px rgba(34,197,94,0.2)' : 'none'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = darkMode ? 'rgba(34,197,94,0.08)' : 'rgba(0,0,0,0.05)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          {open ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Nav items */}
      <nav style={{
        flex: 1,
        display: 'flex', flexDirection: 'column',
        padding: '10px 8px',
        gap: '3px',
        position: 'relative', zIndex: 2,
      }}>
        {NAV.map((item) => {
          const Icon     = item.icon
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: open ? '0 12px' : '0',
                justifyContent: open ? 'flex-start' : 'center',
                borderRadius: '12px', border: 'none',
                cursor: 'pointer',
                background: isActive ? activeBg : 'transparent',
                borderLeft: `3px solid ${isActive ? '#22C55E' : 'transparent'}`,
                color: isActive ? activeText : textNormal,
                fontFamily: 'inherit',
                fontSize: '13.5px',
                fontWeight: isActive ? 700 : 400,
                transition: 'all 0.2s', textAlign: 'left',
                whiteSpace: 'nowrap', overflow: 'hidden',
                minHeight: '44px',
                // In dark mode, active item gets a subtle glow
                boxShadow: isActive && darkMode ? '0 0 20px rgba(34,197,94,0.08)' : 'none',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = hoverBg
                  if (darkMode) e.currentTarget.style.color = '#A8C5D8'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = textNormal
                }
              }}
            >
              <Icon
                size={17}
                style={{
                  flexShrink: 0,
                  color: isActive ? '#22C55E' : textMuted,
                  filter: isActive && darkMode ? 'drop-shadow(0 0 4px rgba(34,197,94,0.5))' : 'none',
                  transition: 'all 0.2s',
                }}
              />
              {open && (
                <span style={{ letterSpacing: '0.01em' }}>
                  {lang === 'fr' ? item.labelFr : item.labelEn}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Admin link */}
      <div style={{
        padding: '10px 8px',
        borderTop: `1px solid ${border}`,
        position: 'relative', zIndex: 2,
      }}>
        <Link to="/dashboard" style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: open ? '11px 12px' : '11px 0',
          justifyContent: open ? 'flex-start' : 'center',
          borderRadius: '12px', textDecoration: 'none',
          background: darkMode
            ? 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.06))'
            : 'rgba(34,197,94,0.06)',
          border: '1px solid rgba(34,197,94,0.22)',
          color: '#22C55E', fontSize: '13.5px', fontWeight: 600,
          transition: 'all 0.2s',
          minHeight: '44px',
          boxShadow: darkMode ? '0 0 20px rgba(34,197,94,0.08), inset 0 1px 0 rgba(34,197,94,0.12)' : 'none',
        }}
          onMouseEnter={e => {
            e.currentTarget.style.background = darkMode
              ? 'linear-gradient(135deg, rgba(34,197,94,0.16), rgba(34,197,94,0.1))'
              : 'rgba(34,197,94,0.1)'
            e.currentTarget.style.boxShadow = '0 0 24px rgba(34,197,94,0.18)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = darkMode
              ? 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.06))'
              : 'rgba(34,197,94,0.06)'
            e.currentTarget.style.boxShadow = darkMode ? '0 0 20px rgba(34,197,94,0.08), inset 0 1px 0 rgba(34,197,94,0.12)' : 'none'
          }}
        >
          <Lock size={16} style={{ flexShrink: 0 }} />
          {open && <span>{lang === 'fr' ? 'Espace Admin' : 'Admin'}</span>}
        </Link>
      </div>
    </aside>
  )
}
