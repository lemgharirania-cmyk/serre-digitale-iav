// src/components/layout/Sidebar.jsx  (dashboard admin)
// Sidebar FIXE — position:fixed, height:100vh, indépendante du scroll du contenu
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Server, BarChart2, Bell, Sliders,
  Download, Settings, FlaskConical,
  ChevronLeft, ChevronRight, Sun, Moon,
} from 'lucide-react'

const NAV = [
  { to: '/dashboard',            icon: LayoutDashboard, labelFR: 'Vue d\'ensemble', labelEN: 'Overview',    id: 'vue'         },
  { to: '/dashboard#seuils',     icon: Sliders,         labelFR: 'Seuils',          labelEN: 'Thresholds',  id: 'seuils'      },
  { to: '/dashboard#etat',       icon: Server,          labelFR: 'État serre',      labelEN: 'Status',      id: 'etat'        },
  { to: '/dashboard#graphiques', icon: BarChart2,       labelFR: 'Graphiques',      labelEN: 'Charts',      id: 'graphiques'  },
  { to: '/dashboard#calculateur',icon: FlaskConical,    labelFR: 'Calculateur NS',  labelEN: 'NS Calc',     id: 'calculateur' },
  { to: '/dashboard#export',     icon: Download,        labelFR: 'Export',          labelEN: 'Export',      id: 'export'      },
  { to: '/dashboard/alertes',    icon: Bell,            labelFR: 'Alertes',         labelEN: 'Alerts',      id: 'alertes', badge: true },
  { to: '/dashboard/parametres', icon: Settings,        labelFR: 'Paramètres',      labelEN: 'Settings',    id: 'parametres'  },
]

export default function Sidebar({ alertCount = 0, theme, setTheme, lang, setLang }) {
  const [open, setOpen] = useState(true)
  const location = useLocation()
  const isDark = theme === 'dark'

  const W         = open ? 220 : 60
  const bg        = isDark ? '#070F1C' : '#FFFFFF'
  const border    = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'
  const ink       = isDark ? '#F1F5F9' : '#0F172A'
  const ink3      = isDark ? '#94A3B8' : '#64748B'
  const ink4      = isDark ? '#475569' : '#94A3B8'
  const hoverBg   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const activeBg  = isDark ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.08)'
  const activeClr = '#22C55E'

  function isActive(item) {
    if (item.id === 'vue') return location.pathname === '/dashboard' || location.pathname === '/dashboard/'
    if (item.to.startsWith('/dashboard/')) return location.pathname === item.to
    return false
  }

  function scrollTo(anchorId) {
    const el = document.getElementById(anchorId)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleClick(item) {
    if (item.to.includes('#')) {
      const anchor = item.to.split('#')[1]
      // If already on dashboard, just scroll
      if (location.pathname === '/dashboard' || location.pathname === '/dashboard/') {
        scrollTo(anchor)
      }
      // Otherwise navigate then scroll (React Router will handle the path)
    }
  }

  return (
    <aside style={{
      // ── THE KEY FIX: position fixed, full viewport height ──
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      height: '100vh',
      zIndex: 1000,
      width: W,
      flexShrink: 0,
      // ──────────────────────────────────────────────────────
      background: bg,
      borderRight: '1px solid ' + border,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden',
      boxShadow: isDark
        ? '4px 0 24px rgba(0,0,0,0.4)'
        : '4px 0 16px rgba(0,0,0,0.06)',
    }}>

      {/* ── Logo / Brand ── */}
      <div style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        padding: open ? '0 16px' : '0',
        justifyContent: open ? 'space-between' : 'center',
        borderBottom: '1px solid ' + border,
        flexShrink: 0,
      }}>
        {open && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg,#22C55E,#059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>S</span>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: ink, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                SDI
              </div>
              <div style={{ fontSize: 9, color: ink4, fontWeight: 500, letterSpacing: '0.03em', lineHeight: 1 }}>
                AgroBioTech
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            border: '1px solid ' + border,
            color: ink3, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.08)'; e.currentTarget.style.color = activeClr }}
          onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'; e.currentTarget.style.color = ink3 }}
        >
          {open ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
        </button>
      </div>

      {/* ── Nav items ── */}
      <nav style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '10px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        // Hide scrollbar
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        {NAV.map((item) => {
          const Icon    = item.icon
          const active  = isActive(item)
          const hasAnchor = item.to.includes('#')
          const badgeCount = item.badge ? alertCount : 0

          const itemStyle = {
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: open ? '0 10px' : '0',
            justifyContent: open ? 'flex-start' : 'center',
            height: 40,
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            background: active ? activeBg : 'transparent',
            color: active ? activeClr : ink3,
            fontSize: 13,
            fontWeight: active ? 700 : 500,
            fontFamily: "'Manrope','DM Sans',system-ui,sans-serif",
            transition: 'all 0.15s',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            borderLeft: '2px solid ' + (active ? activeClr : 'transparent'),
            width: '100%',
            boxSizing: 'border-box',
          }

          const content = (
            <>
              <Icon
                size={16}
                style={{
                  flexShrink: 0,
                  color: active ? activeClr : ink4,
                  transition: 'color 0.15s',
                }}
              />
              {open && (
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {lang === 'EN' ? item.labelEN : item.labelFR}
                </span>
              )}
              {open && badgeCount > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  padding: '1px 6px', borderRadius: 10,
                  background: '#EF4444', color: 'white',
                  flexShrink: 0,
                }}>
                  {badgeCount}
                </span>
              )}
              {!open && badgeCount > 0 && (
                <span style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#EF4444',
                }} />
              )}
            </>
          )

          if (hasAnchor) {
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item)}
                style={{ ...itemStyle, position: 'relative' }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = ink } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = ink3 } }}
              >
                {content}
              </button>
            )
          }

          return (
            <NavLink
              key={item.id}
              to={item.to}
              style={{ ...itemStyle, position: 'relative' }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = ink } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = ink3 } }}
            >
              {content}
            </NavLink>
          )
        })}
      </nav>

      {/* ── Footer controls ── */}
      <div style={{
        padding: '8px',
        borderTop: '1px solid ' + border,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        flexShrink: 0,
      }}>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: open ? '0 10px' : '0',
            justifyContent: open ? 'flex-start' : 'center',
            height: 36, borderRadius: 9,
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            border: '1px solid ' + border,
            color: ink3, cursor: 'pointer',
            fontSize: 12, fontWeight: 500,
            fontFamily: "'Manrope',system-ui,sans-serif",
            transition: 'all 0.15s', width: '100%',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = ink }}
          onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = ink3 }}
        >
          {isDark ? <Sun size={14} style={{ flexShrink: 0 }} /> : <Moon size={14} style={{ flexShrink: 0 }} />}
          {open && <span>{isDark ? (lang === 'EN' ? 'Light mode' : 'Mode clair') : (lang === 'EN' ? 'Dark mode' : 'Mode sombre')}</span>}
        </button>

        {/* Lang toggle */}
        <button
          onClick={() => setLang(l => l === 'FR' ? 'EN' : 'FR')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: open ? '0 10px' : '0',
            justifyContent: open ? 'flex-start' : 'center',
            height: 36, borderRadius: 9,
            background: 'transparent',
            border: '1px solid ' + border,
            color: ink3, cursor: 'pointer',
            fontSize: 12, fontWeight: 600,
            fontFamily: "'JetBrains Mono',monospace",
            transition: 'all 0.15s', width: '100%',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = ink }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = ink3 }}
        >
          <span style={{ flexShrink: 0, fontSize: 13 }}>{lang === 'FR' ? '🇫🇷' : '🇬🇧'}</span>
          {open && <span>{lang === 'FR' ? 'FR → EN' : 'EN → FR'}</span>}
        </button>
      </div>
    </aside>
  )
}
