// src/components/geoportail/Sidebar.jsx
import { ChevronLeft, ChevronRight, LayoutDashboard, Info, MapPin, Map, BarChart2, Scan, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'

const NAV = [
  { id: 'projet',  icon: LayoutDashboard, labelFr: 'Notre Projet',    labelEn: 'Our Project' },
  { id: 'apropos', icon: Info,            labelFr: 'À Propos',         labelEn: 'About' },
  { id: 'campus',  icon: MapPin,          labelFr: 'AgroBioTech',      labelEn: 'AgroBioTech' },
  { id: 'plan2d',  icon: Map,             labelFr: 'Schéma 2D',          labelEn: '2D Floor Plan' },
  { id: 'visite',  icon: Scan,            labelFr: 'Visite Virtuelle', labelEn: 'Virtual Tour' },
  { id: 'donnees', icon: BarChart2,       labelFr: 'Données',          labelEn: 'Data' },
]

export default function Sidebar({ open, setOpen, active, lang, darkMode }) {
  const bg = darkMode
    ? 'linear-gradient(180deg, #0A1628 0%, #0D1F35 30%, #091A2E 65%, #0B1E2F 100%)'
    : '#FFFFFF'

  const border     = darkMode ? 'rgba(34,197,94,0.08)' : 'rgba(0,0,0,0.08)'
  const textMuted  = darkMode ? '#4B6A8A' : '#94A3B8'
  const textNormal = darkMode ? '#8BA8C4' : '#475569'
  const activeText = '#22C55E'
  const activeBg   = darkMode ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.07)'
  const hoverBg    = darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'

  const topAccent = darkMode
    ? 'linear-gradient(90deg, transparent, rgba(34,197,94,0.35), transparent)'
    : 'transparent'

  function scrollTo(id) {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      {/* Hide sidebar completely on mobile — BottomNav takes over */}
      <style>{`
        @media (max-width: 768px) {
          .geo-sidebar { display: none !important; }
        }
      `}</style>

      <aside
        className="geo-sidebar"
        style={{
          position: 'fixed',
          top: '72px',
          left: 0,
          bottom: 0,
          zIndex: 400,
          width: open ? '240px' : '64px',
          background: bg,
          borderRight: `1px solid ${border}`,
          backdropFilter: 'blur(20px)',
          transition: 'width 0.3s ease',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: darkMode
            ? '4px 0 32px rgba(0,0,0,0.4), 1px 0 0 rgba(34,197,94,0.05)'
            : '4px 0 24px rgba(0,0,0,0.06)',
        }}
      >
        {/* Top shimmer */}
        <div style={{ height: '1px', background: topAccent, flexShrink: 0 }} />

        {/* Toggle button */}
        <div style={{
          display: 'flex', justifyContent: open ? 'flex-end' : 'center',
          padding: open ? '14px 12px 8px' : '14px 0 8px',
          flexShrink: 0,
        }}>
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              width: '28px', height: '28px', borderRadius: '8px',
              border: `1px solid ${border}`,
              background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              color: textMuted, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.1)'; e.currentTarget.style.color = '#22C55E' }}
            onMouseLeave={e => { e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'; e.currentTarget.style.color = textMuted }}
          >
            {open ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
          </button>
        </div>

        {/* Nav items — flex-1 so it fills all space between toggle and admin */}
        <nav style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-evenly',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '4px 8px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          {NAV.map(item => {
            const Icon     = item.icon
            const isActive = active === item.id
            const label    = lang === 'fr' ? item.labelFr : item.labelEn

            return (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: open ? 'flex-start' : 'center',
                  gap: 10,
                  width: '100%',
                  height: 40,
                  padding: open ? '0 10px' : '0',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive ? activeBg : 'transparent',
                  color: isActive ? '#22C55E' : textNormal,
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  fontFamily: "'Outfit',sans-serif",
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                  borderLeft: open ? ('2px solid ' + (isActive ? '#22C55E' : 'transparent')) : 'none',
                  textAlign: 'left',
                  flexShrink: 0,
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = hoverBg
                    e.currentTarget.style.color = darkMode ? '#CBD5E1' : '#0F172A'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = textNormal
                  }
                }}
              >
                <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
                {open && (
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {label}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Divider + Admin link — pinned to bottom */}
        <div style={{ padding: '0 8px 12px', flexShrink: 0 }}>
          <div style={{ height: '1px', background: border, marginBottom: '10px' }} />
          <Link
            to="/login"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: open ? 'flex-start' : 'center',
              gap: 10,
              width: '100%',
              height: 40,
              padding: open ? '0 10px' : '0',
              borderRadius: 10,
              border: `1px solid ${darkMode ? 'rgba(34,197,94,0.18)' : 'rgba(34,197,94,0.2)'}`,
              cursor: 'pointer',
              background: darkMode ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.07)',
              color: darkMode ? '#4ADE80' : '#16A34A',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'Outfit',sans-serif",
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              boxSizing: 'border-box',
              textDecoration: 'none',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = darkMode ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.12)' }}
            onMouseLeave={e => { e.currentTarget.style.background = darkMode ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.07)' }}
          >
            <Lock size={15} strokeWidth={1.8} style={{ flexShrink: 0, color: darkMode ? '#4ADE80' : '#16A34A' }} />
            {open && <span>{lang === 'fr' ? 'Espace Admin' : 'Admin Space'}</span>}
          </Link>
        </div>


      </aside>
    </>
  )
}
