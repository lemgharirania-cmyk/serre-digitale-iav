// src/components/geoportail/BottomNav.jsx
// Visible uniquement sur mobile/tablette (≤768px) — remplace la sidebar
import { LayoutDashboard, MapPin, Map, Scan, BarChart2, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'

const NAV = [
  { id: 'projet',  icon: LayoutDashboard, labelFr: 'Projet',   labelEn: 'Project' },
  { id: 'campus',  icon: MapPin,          labelFr: 'Campus',   labelEn: 'Campus'  },
  { id: 'plan2d',  icon: Map,             labelFr: 'Plan 2D',  labelEn: '2D Plan' },
  { id: 'visite',  icon: Scan,            labelFr: 'Visite',   labelEn: 'Tour'    },
  { id: 'donnees', icon: BarChart2,       labelFr: 'Données',  labelEn: 'Data'    },
]

export default function BottomNav({ active, lang, darkMode }) {
  const bg     = darkMode ? 'rgba(7,17,31,0.97)' : 'rgba(255,255,255,0.97)'
  const border = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const ink3   = darkMode ? '#64748B' : '#94A3B8'
  const green  = '#22C55E'

  function scrollTo(id) {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <style>{`
        .geo-bottom-nav { display: none; }
        @media (max-width: 768px) {
          .geo-bottom-nav { display: flex !important; }
        }
      `}</style>

      <nav
        className="geo-bottom-nav"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          zIndex: 600, height: '62px',
          background: bg,
          borderTop: `1px solid ${border}`,
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          alignItems: 'stretch', justifyContent: 'space-around',
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: darkMode ? '0 -8px 32px rgba(0,0,0,0.5)' : '0 -4px 24px rgba(0,0,0,0.08)',
        }}
      >
        {/* Regular nav items */}
        {NAV.map(item => {
          const Icon     = item.icon
          const isActive = active === item.id
          const label    = lang === 'fr' ? item.labelFr : item.labelEn

          return (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '3px', border: 'none', background: 'none',
                cursor: 'pointer', padding: '6px 4px',
                color: isActive ? green : ink3,
                transition: 'color 0.15s',
                position: 'relative',
              }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute', top: 0, left: '50%',
                  transform: 'translateX(-50%)',
                  width: '24px', height: '2px',
                  background: green, borderRadius: '0 0 2px 2px',
                }} />
              )}
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
              <span style={{
                fontSize: '9px', fontWeight: isActive ? 700 : 500,
                fontFamily: "'Outfit',sans-serif",
                letterSpacing: '0.02em',
              }}>
                {label}
              </span>
            </button>
          )
        })}

        {/* ── Admin button — 6th item, links to login ── */}
        <Link
          to="/login"
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '3px', border: 'none',
            // Subtle green tint to distinguish it
            background: darkMode ? 'rgba(34,197,94,0.06)' : 'rgba(34,197,94,0.05)',
            borderLeft: `1px solid ${border}`,
            cursor: 'pointer', padding: '6px 4px',
            color: darkMode ? '#4ADE80' : '#16A34A',
            textDecoration: 'none',
            transition: 'color 0.15s',
          }}
        >
          <Lock size={18} strokeWidth={1.8} />
          <span style={{
            fontSize: '9px', fontWeight: 600,
            fontFamily: "'Outfit',sans-serif",
            letterSpacing: '0.02em',
          }}>
            {lang === 'fr' ? 'Admin' : 'Admin'}
          </span>
        </Link>
      </nav>
    </>
  )
}
