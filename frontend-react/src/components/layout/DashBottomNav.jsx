// src/components/layout/DashBottomNav.jsx
// Mobile-only bottom navigation for the dashboard (≤900px)
// Desktop sidebar stays completely untouched

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, BarChart2, Bell, Sliders,
  Download, LogOut, ClipboardList, Plus, X,
  Beaker, Settings,
} from 'lucide-react'

// Primary destinations — visible in the bar
const PRIMARY_ITEMS = [
  { id: 'etat',       icon: LayoutDashboard, labelFr: 'Direct',  labelEn: 'Live'   },
  { id: 'graphiques', icon: BarChart2,        labelFr: 'Graphes', labelEn: 'Charts' },
  { id: 'alertes',    icon: Bell,             labelFr: 'Alertes', labelEn: 'Alerts', route: '/dashboard/alertes' },
  { id: 'journal',    icon: ClipboardList,    labelFr: 'Journal', labelEn: 'Log',    route: '/dashboard/journal' },
  { id: 'seuils',     icon: Sliders,          labelFr: 'Seuils',  labelEn: 'Limits', route: '/dashboard/seuils' },
]

// Overflow destinations — opened via the "Plus" sheet
const MORE_ITEMS = [
  { id: 'calculateur', icon: Beaker,   labelFr: 'Calculateur NS', labelEn: 'NS Calculator', route: '/dashboard/calculateur' },
  { id: 'export',      icon: Download, labelFr: 'Export',         labelEn: 'Export',        route: '/dashboard/export' },
  { id: 'parametres',  icon: Settings, labelFr: 'Paramètres',     labelEn: 'Settings',      route: '/dashboard/parametres' },
]

export default function DashBottomNav({ theme, lang, alertCount = 0 }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isDark   = theme === 'dark'
  const [moreOpen, setMoreOpen] = useState(false)

  const bg      = isDark ? 'rgba(6,13,26,0.98)'    : 'rgba(255,255,255,0.98)'
  const border  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const ink     = isDark ? '#F1F5F9' : '#0F172A'
  const ink3    = isDark ? '#64748B' : '#94A3B8'
  const sheetBg = isDark ? 'rgba(10,18,32,0.98)'   : 'rgba(255,255,255,0.98)'
  const green   = '#22C55E'

  function isPrimaryActive(item) {
    if (item.route) return location.pathname === item.route
    // 'etat' and 'graphiques' are anchors on /dashboard root
    return (
      location.pathname === '/dashboard' ||
      location.pathname === '/dashboard/'
    ) && item.id === 'etat'
  }

  // "Plus" lights up when we're on any overflow route, or when the sheet is open
  const moreActive =
    moreOpen || MORE_ITEMS.some(it => location.pathname === it.route)

  function handleNavPrimary(item) {
    setMoreOpen(false)
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

  function handleNavMore(item) {
    setMoreOpen(false)
    navigate(item.route)
  }

  function handleLogout() {
    setMoreOpen(false)
    localStorage.removeItem('sdi_token')
    localStorage.removeItem('sdi_user')
    navigate('/')
  }

  // Close the sheet automatically on any route change
  useEffect(() => { setMoreOpen(false) }, [location.pathname])

  return (
    <>
      {/* Only show on ≤900px */}
      <style>{`
        .dash-bottom-nav,
        .dash-more-backdrop,
        .dash-more-sheet { display: none; }
        @media (max-width: 900px) {
          .dash-bottom-nav { display: flex !important; }
          .dash-more-backdrop,
          .dash-more-sheet { display: block !important; }
        }
        @keyframes dashSheetUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      {/* Backdrop for the "Plus" sheet */}
      {moreOpen && (
        <div
          className="dash-more-backdrop"
          onClick={() => setMoreOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1099,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* The overflow sheet */}
      {moreOpen && (
        <div
          className="dash-more-sheet"
          style={{
            position: 'fixed',
            left: 0, right: 0,
            bottom: 'calc(62px + env(safe-area-inset-bottom))',
            zIndex: 1101,
            background: sheetBg,
            borderTop: `1px solid ${border}`,
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            padding: '8px 8px 14px',
            boxShadow: isDark
              ? '0 -16px 48px rgba(0,0,0,0.6)'
              : '0 -12px 36px rgba(0,0,0,0.12)',
            animation: 'dashSheetUp 0.22s cubic-bezier(0.4,0,0.2,1)',
            fontFamily: "'Manrope','DM Sans',sans-serif",
          }}
        >
          {/* drag handle */}
          <div style={{
            width: 38, height: 4, borderRadius: 2,
            background: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)',
            margin: '6px auto 12px',
          }} />

          {MORE_ITEMS.map(item => {
            const Icon     = item.icon
            const isActive = location.pathname === item.route
            const label    = lang === 'FR' ? item.labelFr : item.labelEn
            return (
              <button
                key={item.id}
                onClick={() => handleNavMore(item)}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 14px',
                  background: isActive
                    ? (isDark ? 'rgba(34,197,94,0.10)' : 'rgba(34,197,94,0.08)')
                    : 'transparent',
                  border: 'none',
                  borderRadius: 12,
                  cursor: 'pointer',
                  color: isActive ? green : ink,
                  fontFamily: "'Manrope','DM Sans',sans-serif",
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 500,
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
              >
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{label}</span>
              </button>
            )
          })}

          {/* divider + logout */}
          <div style={{
            height: 1, background: border,
            margin: '8px 14px',
          }} />
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 14px',
              background: 'transparent', border: 'none',
              borderRadius: 12, cursor: 'pointer',
              color: '#EF4444',
              fontFamily: "'Manrope','DM Sans',sans-serif",
              fontSize: 14, fontWeight: 600, textAlign: 'left',
            }}
          >
            <LogOut size={20} strokeWidth={1.8} />
            <span>{lang === 'FR' ? 'Quitter' : 'Logout'}</span>
          </button>
        </div>
      )}

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
        {PRIMARY_ITEMS.map(item => {
          const Icon     = item.icon
          const isActive = isPrimaryActive(item)
          const label    = lang === 'FR' ? item.labelFr : item.labelEn

          return (
            <button
              key={item.id}
              onClick={() => handleNavPrimary(item)}
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

        {/* "Plus" overflow button — opens sheet with Calculateur NS, Export, Paramètres, Quitter */}
        <button
          onClick={() => setMoreOpen(o => !o)}
          aria-label={lang === 'FR' ? 'Plus' : 'More'}
          aria-expanded={moreOpen}
          style={{
            flex: 1,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '3px', border: 'none',
            background: moreOpen
              ? (isDark ? 'rgba(34,197,94,0.06)' : 'rgba(34,197,94,0.04)')
              : 'none',
            borderLeft: `1px solid ${border}`,
            cursor: 'pointer', padding: '6px 2px',
            color: moreActive ? green : ink3,
            transition: 'color 0.15s, background 0.15s',
            position: 'relative',
          }}
        >
          {moreActive && !moreOpen && (
            <div style={{
              position: 'absolute', top: 0, left: '50%',
              transform: 'translateX(-50%)',
              width: '24px', height: '2px',
              background: green,
              borderRadius: '0 0 2px 2px',
            }} />
          )}
          <div style={{ position: 'relative' }}>
            {moreOpen
              ? <X    size={20} strokeWidth={2.2} />
              : <Plus size={20} strokeWidth={moreActive ? 2.2 : 1.8} />}
          </div>
          <span style={{
            fontSize: '9px',
            fontWeight: moreActive ? 700 : 500,
            fontFamily: "'Manrope','DM Sans',sans-serif",
            letterSpacing: '0.02em',
          }}>
            {lang === 'FR' ? 'Plus' : 'More'}
          </span>
        </button>
      </nav>
    </>
  )
}
