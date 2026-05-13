// src/components/geoportail/Sidebar.jsx
import { ChevronLeft, ChevronRight, LayoutDashboard, Info, MapPin, Map, BarChart2, Scan, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'

const NAV = [
  { id: 'projet',  icon: LayoutDashboard, labelFr: 'Notre Projet',     labelEn: 'Our Project' },
  { id: 'apropos', icon: Info,            labelFr: 'À Propos',          labelEn: 'About' },
  { id: 'campus',  icon: MapPin,          labelFr: 'AgroBioTech',       labelEn: 'AgroBioTech' },
  { id: 'plan2d',  icon: Map,             labelFr: 'Plan 2D',           labelEn: '2D Plan' },
  { id: 'donnees', icon: BarChart2,       labelFr: 'Données',           labelEn: 'Data' },
  { id: 'visite',  icon: Scan,            labelFr: 'Visite Virtuelle',  labelEn: 'Virtual Tour' },
]

export default function Sidebar({ open, setOpen, active, lang, darkMode }) {
  const bg    = darkMode ? '#0B1728' : '#FFFFFF'
  const border= darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'
  const text  = darkMode ? '#CBD5E1' : '#475569'
  const textM = darkMode ? '#64748B' : '#94A3B8'
  const activeText = '#22C55E'
  const activeBg   = darkMode ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.08)'

  function scrollTo(id) {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <aside style={{
      position: 'fixed', top: '64px', left: 0, bottom: 0, zIndex: 200,
      width: open ? '240px' : '56px',
      background: bg,
      borderRight: `1px solid ${border}`,
      backdropFilter: 'blur(20px)',
      transition: 'width 0.3s ease',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Toggle button */}
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', justifyContent: open ? 'flex-end' : 'center',
        padding: '12px', border: 'none', background: 'transparent', cursor: 'pointer',
        borderBottom: `1px solid ${border}`, color: textM,
      }}>
        {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV.map(item => {
          const Icon = item.icon
          const isActive = active === item.id
          return (
            <button key={item.id} onClick={() => scrollTo(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 10px',
              borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: isActive ? activeBg : 'transparent',
              borderLeft: `3px solid ${isActive ? '#22C55E' : 'transparent'}`,
              color: isActive ? activeText : text,
              fontFamily: 'inherit', fontSize: '13px', fontWeight: isActive ? 600 : 400,
              transition: 'all 0.2s', textAlign: 'left',
              justifyContent: open ? 'flex-start' : 'center',
              whiteSpace: 'nowrap', overflow: 'hidden',
            }}>
              <Icon size={16} style={{ flexShrink: 0, color: isActive ? '#22C55E' : textM }} />
              {open && <span>{lang === 'fr' ? item.labelFr : item.labelEn}</span>}
            </button>
          )
        })}
      </nav>

      {/* Admin link */}
      <div style={{ padding: '8px', borderTop: `1px solid ${border}` }}>
        <Link to="/dashboard" style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px', borderRadius: '10px', textDecoration: 'none',
          background: darkMode ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.06)',
          border: '1px solid rgba(34,197,94,0.2)',
          color: '#22C55E', fontSize: '13px', fontWeight: 600,
          justifyContent: open ? 'flex-start' : 'center',
          transition: 'all 0.2s',
        }}>
          <Lock size={15} style={{ flexShrink: 0 }} />
          {open && <span>{lang === 'fr' ? 'Espace Admin' : 'Admin'}</span>}
        </Link>
      </div>
    </aside>
  )
}
