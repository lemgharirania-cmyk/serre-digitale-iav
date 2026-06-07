// src/components/layout/Sidebar.jsx  (dashboard admin)
import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Server, BarChart2, Bell, Sliders,
  Download, Settings, Beaker,
  ChevronLeft, ChevronRight, Sun, Moon,
  ArrowLeft, LogOut, Languages,
} from 'lucide-react'

// ── Toutes les sections scroll dans la ScrollHome ──────────────────────────
// "Vue d'ensemble" est la page principale — les ancres #xxx scrollent dedans
// Les routes /alertes /parametres sont des pages séparées
const NAV_GROUPS = [
  {
    labelFR: 'Monitoring', labelEN: 'Monitoring',
    items: [
      {
        id: 'etat', labelFR: 'Serre en direct', labelEN: 'Live greenhouse',
        icon: LayoutDashboard,
        action: 'home',  // scrolle en haut = bannière serre
      },
      {
        id: 'graphiques', labelFR: 'Graphiques', labelEN: 'Charts',
        icon: BarChart2, action: 'anchor', anchor: 'graphiques',
      },
      {
        id: 'alertes', labelFR: 'Alertes', labelEN: 'Alerts',
        icon: Bell, action: 'route', to: '/dashboard/alertes', badge: true,
      },
    ],
  },
  {
    labelFR: 'Outils', labelEN: 'Tools',
    items: [
      {
        id: 'calculateur', labelFR: 'Solution nutritive', labelEN: 'Nutrient Solution',
        icon: Beaker, action: 'anchor', anchor: 'calculateur',
      },
    ],
  },
  {
    labelFR: 'Configuration', labelEN: 'Settings',
    items: [
      {
        id: 'seuils', labelFR: 'Seuils', labelEN: 'Thresholds',
        icon: Sliders, action: 'anchor', anchor: 'seuils',
      },
      {
        id: 'export', labelFR: 'Export données', labelEN: 'Export data',
        icon: Download, action: 'anchor', anchor: 'export',
      },
      {
        id: 'parametres', labelFR: 'Paramètres', labelEN: 'Settings',
        icon: Settings, action: 'route', to: '/dashboard/parametres',
      },
    ],
  },
]

export default function Sidebar({ alertCount = 0, theme, setTheme, lang, setLang, onWidthChange }) {
  const [open, setOpen] = useState(true)
  function toggleOpen() {
    setOpen(o => {
      const next = !o
      onWidthChange?.(next ? 240 : 64)
      return next
    })
  }
  const location        = useLocation()
  const navigate        = useNavigate()
  const isDark          = theme === 'dark'

  const W        = open ? 240 : 64
  const bg       = isDark ? '#060D1A' : '#FFFFFF'
  const border   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'
  const ink      = isDark ? '#F1F5F9' : '#0F172A'
  const ink2     = isDark ? '#CBD5E1' : '#334155'
  const ink3     = isDark ? '#94A3B8' : '#64748B'
  const ink4     = isDark ? '#475569' : '#94A3B8'
  const hoverBg  = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const activeBg = isDark ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.08)'
  const green    = '#22C55E'

  const user     = (() => { try { return JSON.parse(localStorage.getItem('sdi_user') || '{}') } catch { return {} } })()
  const userName = user.prenom || user.nom || 'Admin'
  const userRole = user.role || 'ALL'
  const initials = (user.prenom?.[0] || user.nom?.[0] || 'A').toUpperCase()

  const onDashboard = location.pathname === '/dashboard' || location.pathname === '/dashboard/'

  function isActive(item) {
    if (item.action === 'home') return onDashboard
    if (item.action === 'route') return location.pathname === item.to
    return false // ancres : pas d'active visuel persistant
  }

  function handleNav(item) {
    if (item.action === 'home') {
      if (onDashboard) {
        // déjà sur /dashboard → scroll vers le haut
        window.scrollTo({ top: 0, behavior: 'smooth' })
        document.querySelector('.admin-main')?.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        navigate('/dashboard')
      }
    } else if (item.action === 'anchor') {
      if (!onDashboard) {
        // navigue vers /dashboard, puis scroll après mount
        navigate('/dashboard')
        setTimeout(() => {
          document.getElementById(item.anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 350)
      } else {
        document.getElementById(item.anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else if (item.action === 'route') {
      navigate(item.to)
    }
  }

  function handleLogout() {
    localStorage.removeItem('sdi_token')
    localStorage.removeItem('sdi_user')
    navigate('/')   // retour site public
  }

  // Style partagé des items nav — TOUT aligné à gauche
  const navItem = (active) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',   // ← toujours left
    gap: 10,
    width: '100%',
    height: 40,
    padding: open ? '0 12px' : '0 0 0 0',
    // Quand fermé : centrer l'icône dans le 64px
    ...(open ? {} : { justifyContent: 'center', padding: 0 }),
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    background: active ? activeBg : 'transparent',
    color: active ? green : ink3,
    fontSize: 13,
    fontWeight: active ? 700 : 500,
    fontFamily: "'Manrope','DM Sans',system-ui,sans-serif",
    transition: 'all 0.15s',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    boxSizing: 'border-box',
    borderLeft: open ? ('2px solid ' + (active ? green : 'transparent')) : 'none',
    position: 'relative',
    textAlign: 'left',
  })

  const ctrlBtn = {
    display: 'flex', alignItems: 'center',
    justifyContent: open ? 'flex-start' : 'center',
    gap: open ? 9 : 0,
    width: '100%', height: 36, boxSizing: 'border-box',
    padding: open ? '0 12px' : '0',
    borderRadius: 9, border: '1px solid ' + border,
    cursor: 'pointer', fontSize: 12, fontWeight: 500,
    fontFamily: "'Manrope',system-ui,sans-serif",
    transition: 'all 0.15s',
    whiteSpace: 'nowrap', overflow: 'hidden',
  }

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, bottom: 0,
      height: '100vh', zIndex: 1000, width: W, flexShrink: 0,
      background: bg, borderRight: '1px solid ' + border,
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden',
      boxShadow: isDark ? '4px 0 32px rgba(0,0,0,0.45)' : '4px 0 16px rgba(0,0,0,0.06)',
    }}>

      {/* ── Logo + collapse ── */}
      <div style={{
        height: 56, flexShrink: 0, display: 'flex', alignItems: 'center',
        padding: open ? '0 12px 0 16px' : '0',
        justifyContent: open ? 'space-between' : 'center',
        borderBottom: '1px solid ' + border,
      }}>
        {open && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,#22C55E,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'white', fontFamily: 'monospace' }}>S</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: ink, letterSpacing: '-0.01em', lineHeight: 1.2 }}>SDI Admin</div>
              <div style={{ fontSize: 9, color: ink4, letterSpacing: '0.04em', lineHeight: 1 }}>AgroBioTech · IAV</div>
            </div>
          </div>
        )}
        <button onClick={toggleOpen} style={{
          width: 28, height: 28, borderRadius: 8, border: '1px solid ' + border,
          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
          color: ink3, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s', flexShrink: 0,
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.1)'; e.currentTarget.style.color = green }}
          onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = ink3 }}
        >
          {open ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
        </button>
      </div>

      {/* ── Retour au site visiteur ── */}
      <div style={{ padding: '10px 8px 6px', flexShrink: 0 }}>
        <button onClick={() => navigate('/')} style={{
          ...navItem(false),
          background: isDark ? 'rgba(34,197,94,0.07)' : 'rgba(34,197,94,0.05)',
          border: '1px solid ' + (isDark ? 'rgba(34,197,94,0.18)' : 'rgba(34,197,94,0.15)'),
          borderLeft: '2px solid ' + green,
          color: green, fontWeight: 600, height: 38,
          padding: open ? '0 12px' : '0',
          justifyContent: open ? 'flex-start' : 'center',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(34,197,94,0.13)' : 'rgba(34,197,94,0.1)' }}
          onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(34,197,94,0.07)' : 'rgba(34,197,94,0.05)' }}
        >
          <ArrowLeft size={15} style={{ flexShrink: 0, color: green }} />
          {open && <span style={{ fontSize: 12, fontWeight: 600, color: green }}>{lang === 'EN' ? 'Back to site' : 'Site visiteur'}</span>}
        </button>
      </div>

      {/* ── Nav groupée ── */}
      <nav style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        padding: '4px 8px', display: 'flex', flexDirection: 'column',
        scrollbarWidth: 'none', msOverflowStyle: 'none',
      }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.labelFR} style={{ marginBottom: 6 }}>
            {/* Label groupe */}
            {open ? (
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: ink4,
                padding: '10px 12px 4px', textAlign: 'left',
              }}>
                {lang === 'EN' ? group.labelEN : group.labelFR}
              </div>
            ) : <div style={{ height: 10 }} />}

            {group.items.map((item) => {
              const Icon   = item.icon
              const active = isActive(item)
              const badge  = item.badge ? alertCount : 0

              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item)}
                  style={navItem(active)}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = ink2 } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = ink3 } }}
                >
                  <Icon size={16} style={{ flexShrink: 0, color: active ? green : ink4, transition: 'color 0.15s' }} />
                  {open && (
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }}>
                      {lang === 'EN' ? item.labelEN : item.labelFR}
                    </span>
                  )}
                  {open && badge > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: '#EF4444', color: '#fff', flexShrink: 0 }}>
                      {badge}
                    </span>
                  )}
                  {!open && badge > 0 && (
                    <span style={{ position: 'absolute', top: 7, right: 8, width: 7, height: 7, borderRadius: '50%', background: '#EF4444' }} />
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer : theme · lang · user · logout ── */}
      <div style={{ padding: '8px', borderTop: '1px solid ' + border, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>

        {/* Boutons theme + lang côte à côte (style original) */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            title={isDark ? (lang === 'EN' ? 'Light mode' : 'Mode clair') : (lang === 'EN' ? 'Dark mode' : 'Mode sombre')}
            style={{
              ...ctrlBtn,
              flex: 1,
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              color: ink3,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = ink }}
            onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = ink3 }}
          >
            {isDark ? <Sun size={14} style={{ flexShrink: 0 }} /> : <Moon size={14} style={{ flexShrink: 0 }} />}
            {open && <span>{isDark ? (lang === 'EN' ? 'Jour' : 'Jour') : (lang === 'EN' ? 'Nuit' : 'Nuit')}</span>}
          </button>

          <button
            onClick={() => setLang(l => l === 'FR' ? 'EN' : 'FR')}
            title={lang === 'FR' ? 'Switch to English' : 'Passer en français'}
            style={{
              ...ctrlBtn,
              flex: 1,
              background: 'transparent',
              color: ink3,
              fontFamily: "'JetBrains Mono',monospace",
              fontWeight: 600, fontSize: 11,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = ink }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = ink3 }}
          >
            <Languages size={14} style={{ flexShrink: 0 }} />
            {open && <span>{lang === 'FR' ? 'FR' : 'EN'}</span>}
          </button>
        </div>

        {/* User card + logout */}
        <div style={{
          padding: open ? '10px 12px' : '8px 0',
          borderRadius: 12, border: '1px solid ' + border,
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          display: 'flex', alignItems: 'center',
          justifyContent: open ? 'space-between' : 'center',
          gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: open ? 9 : 0, minWidth: 0 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#22C55E,#059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 800, color: 'white',
            }}>
              {initials}
            </div>
            {open && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
                <div style={{ fontSize: 9, color: ink4, fontFamily: 'monospace', letterSpacing: '0.04em' }}>{userRole}</div>
              </div>
            )}
          </div>
          {open && (
            <button
              onClick={handleLogout}
              title={lang === 'EN' ? 'Sign out' : 'Se déconnecter'}
              style={{
                width: 28, height: 28, borderRadius: 7, border: '1px solid ' + border,
                background: 'none', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: ink4, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = ink4; e.currentTarget.style.borderColor = border }}
            >
              <LogOut size={13} />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
