// src/components/geoportail/BottomNav.jsx
// Visible uniquement sur mobile/tablette (≤768px) — remplace la sidebar
import { LayoutDashboard, Info, MapPin, Map, Scan, BarChart2 } from 'lucide-react'

const NAV = [
  { id: 'projet',  icon: LayoutDashboard, labelFr: 'Projet',   labelEn: 'Project' },
  { id: 'campus',  icon: MapPin,          labelFr: 'Campus',   labelEn: 'Campus'  },
  { id: 'plan2d',  icon: Map,             labelFr: 'Plan 2D',  labelEn: '2D Plan' },
  { id: 'visite',  icon: Scan,            labelFr: 'Visite',   labelEn: 'Tour'    },
  { id: 'donnees', icon: BarChart2,       labelFr: 'Données',  labelEn: 'Data'    },
]

export default function BottomNav({ active, lang, darkMode }) {
  const bg     = darkMode
    ? 'rgba(7,17,31,0.97)'
    : 'rgba(255,255,255,0.97)'
  const border = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const ink3   = darkMode ? '#64748B' : '#94A3B8'
  const green  = '#22C55E'

  function scrollTo(id) {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      {/* Only visible ≤768px */}
      <style>{`
        .geo-bottom-nav {
          display: none;
        }
        @media (max-width: 768px) {
          .geo-bottom-nav {
            display: flex !important;
          }
        }
      `}</style>

      <nav
        className="geo-bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 600,
          height: '62px',
          background: bg,
          borderTop: `1px solid ${border}`,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          alignItems: 'stretch',
          justifyContent: 'space-around',
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: darkMode
            ? '0 -8px 32px rgba(0,0,0,0.5)'
            : '0 -4px 24px rgba(0,0,0,0.08)',
        }}
      >
        {NAV.map(item => {
          const Icon     = item.icon
          const isActive = active === item.id
          const label    = lang === 'fr' ? item.labelFr : item.labelEn

          return (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 4px',
                position: 'relative',
                transition: 'all 0.15s ease',
              }}
            >
              {/* Active indicator dot */}
              {isActive && (
                <span style={{
                  position: 'absolute',
                  top: '6px',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: green,
                  boxShadow: '0 0 6px rgba(34,197,94,0.6)',
                }} />
              )}

              <Icon
                size={20}
                strokeWidth={isActive ? 2.2 : 1.8}
                color={isActive ? green : ink3}
                style={{ transition: 'color 0.15s, transform 0.15s', transform: isActive ? 'scale(1.08)' : 'scale(1)' }}
              />
              <span style={{
                fontSize: '10px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? green : ink3,
                fontFamily: "'Outfit',sans-serif",
                letterSpacing: '0.01em',
                transition: 'color 0.15s',
                lineHeight: 1,
              }}>
                {label}
              </span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
