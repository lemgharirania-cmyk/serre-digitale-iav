// src/components/layout/DashBottomNav.jsx
// Mobile-only bottom navigation for the dashboard (≤900px)
// Desktop sidebar stays completely untouched

import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, BarChart2, Bell, Sliders,
  Download, LogOut, ClipboardList,
} from 'lucide-react'

const ITEMS = [
  { id: 'etat',       icon: LayoutDashboard, labelFr: 'Direct',  labelEn: 'Live'   },
  { id: 'graphiques', icon: BarChart2,        labelFr: 'Graphes', labelEn: 'Charts' },
  { id: 'alertes',    icon: Bell,             labelFr: 'Alertes', labelEn: 'Alerts', route: '/dashboard/alertes' },
  { id: 'journal',    icon: ClipboardList,    labelFr: 'Journal', labelEn: 'Log',    route: '/dashboard/journal' },
  { id: 'seuils',     icon: Sliders,          labelFr: 'Seuils',  labelEn: 'Limits', route: '/dashboard/seuils' },
]

export default function DashBottomNav({ theme, lang, alertCount = 0 }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isDark   = theme === 'dark'

  const bg     = isDark ? 'rgba(6,13,26,0.98)'  : 'rgba(255,255,255,0.98)'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const ink3   = isDark ? '#64748B' : '#94A3B8'
  const green  = '#22C55E'

  function getActive(item) {
    if (item.route) return location.pathname === item.route
    // 'etat' and 'graphiques' are anchors on /dashboard root
    return (
      location.pathname === '/dashboard' ||
      location.pathname === '/dashboard/'
    ) && item.id === 'etat'
  }

  function handleNav(item) {
    if (item.route) {
      navigate(item.route)
      return
    }
    // anchor sections — go to /dashboard then scroll
    if (location.pathname !== '/dashboard' && location.pathname !== '/dashboard/') {
      navigate('/dashboard')
      setTimeout(() => {
        document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 120)
    } else {
      document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  function handleLogout() {
    localStorage.removeItem('sdi_token')
    localStorage.removeItem('sdi_user')
    navigate('/')
  }

  return (
    <>
      {/* Only show on ≤900px */}
      <style>{`
        .dash-bottom-nav { display: none; }
        @media (max-width: 900px) {
          .dash-bottom-nav { display: flex !important; }
        }
      `}</style>

      <nav
        className="dash-bottom-nav"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          zIndex: 1100,
          height: '62px',
          background: bg,
          borderTop: `1px solid ${border}`,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          alignItems: 'stretch',
          justifyContent: 'space-around',
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: isDark
            ? '0 -8px 32px rgba(0,0,0,0.55)'
            : '0 -4px 24px rgba(0,0,0,0.08)',
        }}
      >
        {ITEMS.map(item => {
          const Icon     = item.icon
          const isActive = getActive(item)
          const label    = lang === 'FR' ? item.labelFr : item.labelEn

          return (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '3px', border: 'none', background: 'none',
                cursor: 'pointer', padding: '6px 2px',
                color: isActive ? green : ink3,
                transition: 'color 0.15s',
                position: 'relative',
              }}
            >
              {/* Active indicator bar at top */}
              {isActive && (
                <div style={{
                  position: 'absolute', top: 0, left: '50%',
                  transform: 'translateX(-50%)',
                  width: '24px', height: '2px',
                  background: green,
                  borderRadius: '0 0 2px 2px',
                }} />
              )}

              {/* Icon with badge for alerts */}
              <div style={{ position: 'relative' }}>
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                {item.id === 'alertes' && alertCount > 0 && (
                  <div style={{
                    position: 'absolute', top: -4, right: -6,
                    width: 15, height: 15, borderRadius: '50%',
                    background: '#EF4444', color: 'white',
                    fontSize: 8, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `2px solid ${isDark ? '#060D1A' : '#fff'}`,
                  }}>
                    {alertCount > 9 ? '9+' : alertCount}
                  </div>
                )}
              </div>

              <span style={{
                fontSize: '9px',
                fontWeight: isActive ? 700 : 500,
                fontFamily: "'Manrope','DM Sans',sans-serif",
                letterSpacing: '0.02em',
              }}>
                {label}
              </span>
            </button>
          )
        })}

        {/* Logout — visually separated with red tint */}
        <button
          onClick={handleLogout}
          style={{
            flex: 1,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '3px', border: 'none',
            background: isDark ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.04)',
            borderLeft: `1px solid ${border}`,
            cursor: 'pointer', padding: '6px 2px',
            color: '#EF4444',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
          onMouseLeave={e => e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.04)'}
        >
          <LogOut size={19} strokeWidth={1.8} />
          <span style={{
            fontSize: '9px', fontWeight: 600,
            fontFamily: "'Manrope','DM Sans',sans-serif",
          }}>
            {lang === 'FR' ? 'Quitter' : 'Logout'}
          </span>
        </button>
      </nav>
    </>
  )
}
