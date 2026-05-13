// src/components/geoportail/Sidebar.jsx
import { ChevronLeft, ChevronRight, LayoutDashboard, Info, MapPin, Map, BarChart2, Scan, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'

const NAV = [
  { id: 'projet',  icon: LayoutDashboard, labelFr: 'Notre Projet',    labelEn: 'Our Project' },
  { id: 'apropos', icon: Info,            labelFr: 'À Propos',         labelEn: 'About' },
  { id: 'campus',  icon: MapPin,          labelFr: 'AgroBioTech',      labelEn: 'AgroBioTech' },
  { id: 'plan2d',  icon: Map,             labelFr: 'Plan 2D',          labelEn: '2D Plan' },
  { id: 'donnees', icon: BarChart2,       labelFr: 'Données',          labelEn: 'Data' },
  { id: 'visite',  icon: Scan,            labelFr: 'Visite Virtuelle', labelEn: 'Virtual Tour' },
]

export default function Sidebar({ open, setOpen, active, lang, darkMode }) {
  const bg         = darkMode ? '#0B1728' : '#FFFFFF'
  const border     = darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'
  const textMuted  = darkMode ? '#64748B' : '#94A3B8'
  const textNormal = darkMode ? '#CBD5E1' : '#475569'
  const activeText = '#22C55E'
  const activeBg   = darkMode ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.07)'
  const hoverBg    = darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'

  function scrollTo(id) {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 400,
      width: open ? '240px' : '64px',
      background: bg,
      borderRight: `1px solid ${border}`,
      backdropFilter: 'blur(20px)',
      transition: 'width 0.3s ease',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* Top spacer — aligns with header height */}
      <div style={{
        height: '80px', flexShrink: 0,
        borderBottom: `1px solid ${border}`,
        display: 'flex', alignItems: 'center',
        justifyContent: open ? 'flex-end' : 'center',
        padding: open ? '0 12px' : '0',
      }}>
        <button onClick={() => setOpen(o => !o)} style={{
          width: '32px', height: '32px', borderRadius: '10px',
          background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          border: `1px solid ${border}`,
          color: textMuted, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}>
          {open ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
        </button>
      </div>

      {/* Nav — takes all vertical space, items spread out */}
      <nav style={{
        flex: 1,
        display: 'flex', flexDirection: 'column',
        padding: '12px 8px',
        gap: '4px',
      }}>
        {NAV.map((item, idx) => {
          const Icon     = item.icon
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              style={{
                flex: 1,             // ← each item grows equally
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: open ? '0 12px' : '0',
                justifyContent: open ? 'flex-start' : 'center',
                borderRadius: '12px', border: 'none',
                cursor: 'pointer',
                background: isActive ? activeBg : 'transparent',
                borderLeft: `3px solid ${isActive ? '#22C55E' : 'transparent'}`,
                color: isActive ? activeText : textNormal,
                fontFamily: 'inherit',
                fontSize: '14px',
                fontWeight: isActive ? 700 : 400,
                transition: 'all 0.2s', textAlign: 'left',
                whiteSpace: 'nowrap', overflow: 'hidden',
                minHeight: '44px',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = hoverBg }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
            >
              <Icon
                size={18}
                style={{ flexShrink: 0, color: isActive ? '#22C55E' : textMuted }}
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

      {/* Bottom — Admin link */}
      <div style={{ padding: '12px 8px', borderTop: `1px solid ${border}` }}>
        <Link to="/dashboard" style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: open ? '12px 12px' : '12px 0',
          justifyContent: open ? 'flex-start' : 'center',
          borderRadius: '12px', textDecoration: 'none',
          background: darkMode ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.06)',
          border: '1px solid rgba(34,197,94,0.2)',
          color: '#22C55E', fontSize: '14px', fontWeight: 600,
          transition: 'all 0.2s',
          minHeight: '44px',
        }}>
          <Lock size={17} style={{ flexShrink: 0 }} />
          {open && <span>{lang === 'fr' ? 'Espace Admin' : 'Admin'}</span>}
        </Link>
      </div>
    </aside>
  )
}
