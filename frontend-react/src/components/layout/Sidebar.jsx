// src/components/layout/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, LineChart, Bell, SlidersHorizontal,
  Download, FlaskConical, LogOut, Sun, Moon,
  Globe, Leaf
} from 'lucide-react'

const NAV = [
  {
    section: { FR:'Supervision', EN:'Monitoring' },
    links: [
      { to:'/dashboard',            labelFR:'Vue d\'ensemble', labelEN:'Overview',        Icon:LayoutDashboard, end:true },
      { to:'/dashboard/graphiques', labelFR:'Graphiques',      labelEN:'Charts',          Icon:LineChart },
      { to:'/dashboard/alertes',    labelFR:'Alertes',         labelEN:'Alerts',          Icon:Bell,   badge:true },
    ]
  },
  {
    section: { FR:'Outils', EN:'Tools' },
    links: [
      { to:'/dashboard/calculateur',labelFR:'Solution Nutritive',labelEN:'Nutrient Solution',Icon:FlaskConical },
    ]
  },
  {
    section: { FR:'Configuration', EN:'Settings' },
    links: [
      { to:'/dashboard/seuils',     labelFR:'Seuils agronomiques',labelEN:'Thresholds',   Icon:SlidersHorizontal },
      { to:'/dashboard/export',     labelFR:'Export de données',  labelEN:'Export data',  Icon:Download },
    ]
  },
]

export default function Sidebar({ alertCount, theme, setTheme, lang, setLang }) {
  const navigate   = useNavigate()
  const isDark     = theme === 'dark'
  const user       = JSON.parse(localStorage.getItem('sdi_user') || '{}')

  function logout() {
    localStorage.removeItem('sdi_token')
    localStorage.removeItem('sdi_user')
    navigate('/login')
  }

  // Couleurs selon le thème
  const bg        = isDark ? 'rgba(7,17,31,0.92)'  : 'rgba(255,255,255,0.72)'
  const border    = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(16,48,36,0.08)'
  const ink       = isDark ? '#F8FAFC'  : '#0c1f17'
  const ink3      = isDark ? '#94A3B8'  : '#6b7e75'
  const ink4      = isDark ? '#64748B'  : '#9aa8a0'
  const activeBg  = isDark
    ? 'linear-gradient(135deg,rgba(34,197,94,0.22),rgba(6,182,212,0.16))'
    : 'var(--ink)'
  const activeColor  = isDark ? '#F8FAFC' : 'white'
  const activeBorder = isDark ? '1px solid rgba(34,197,94,0.3)' : 'none'
  const hoverBg      = isDark ? 'rgba(255,255,255,0.05)' : 'var(--surface-glass)'
  const pillBg       = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(16,48,36,0.05)'
  const pillBorder   = isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(16,48,36,0.12)'

  return (
    <aside style={{
      width: 240,
      padding: '20px 14px',
      borderRight: `1px solid ${border}`,
      background: bg,
      backdropFilter: 'blur(14px)',
      position: 'sticky',
      top: 0,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      overflowY: 'auto',
      transition: 'background 0.3s ease',
    }}>

      {/* ── Brand ── */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, padding:'4px 8px' }}>
        <div style={{
          width:36, height:36, borderRadius:11,
          background:'linear-gradient(135deg,var(--green-400,#4fb37f),var(--blue-400,#5690d2))',
          display:'grid', placeItems:'center', flexShrink:0,
          boxShadow:'0 0 0 1px rgba(124,201,160,0.35),0 4px 12px rgba(47,154,100,0.2)'
        }}>
          <Leaf size={18} color="white" />
        </div>
        <div>
          <div style={{ fontSize:13, fontWeight:600, letterSpacing:'-0.01em', color:ink }}>
            {lang === 'FR' ? 'Espace Gérant' : 'Admin Space'}
          </div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:ink4, letterSpacing:'0.06em', textTransform:'uppercase' }}>
            AgroBioTech · IAV
          </div>
        </div>
      </div>

      {/* ── Nav links ── */}
      {NAV.map(group => (
        <div key={group.section.FR}>
          <div style={{
            fontFamily:'var(--font-mono)', fontSize:10, color:ink4,
            letterSpacing:'0.12em', textTransform:'uppercase',
            padding:'12px 10px 4px'
          }}>
            {lang === 'FR' ? group.section.FR : group.section.EN}
          </div>

          {group.links.map(({ to, labelFR, labelEN, Icon, badge, end }) => (
            <NavLink
              key={to} to={to} end={end}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 10px',
                fontSize: 13,
                borderRadius: 10,
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
                marginBottom: 2,
                background: isActive ? activeBg : 'transparent',
                color: isActive ? activeColor : ink3,
                border: isActive ? activeBorder : '1px solid transparent',
                fontWeight: isActive ? 500 : 400,
              })}
              onMouseEnter={e => {
                if (!e.currentTarget.classList.contains('active-nav'))
                  e.currentTarget.style.background = hoverBg
              }}
              onMouseLeave={e => {
                // NavLink handles active state via style prop
              }}
            >
              {({ isActive }) => (
                <>
                  <Icon size={15} style={{ flexShrink:0 }} />
                  <span style={{ flex:1 }}>
                    {lang === 'FR' ? labelFR : labelEN}
                  </span>
                  {badge && alertCount > 0 && (
                    <span style={{
                      fontFamily:'var(--font-mono)', fontSize:10,
                      padding:'2px 6px', borderRadius:999,
                      background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(214,147,42,0.15)',
                      color: isActive ? 'white' : '#d6932a',
                      fontWeight: 600,
                    }}>
                      {alertCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      ))}

      {/* ── Spacer ── */}
      <div style={{ flex:1 }} />

      {/* ── Theme + Lang toggles ── */}
      <div style={{
        display:'flex', gap:8, padding:'10px 8px',
        borderTop:`1px solid ${border}`, marginTop:8
      }}>
        {/* Thème */}
        <button
          onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
          title={isDark ? 'Mode jour' : 'Mode nuit'}
          style={{
            flex:1, height:34, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            borderRadius:8, border:`1px solid ${pillBorder}`, background:pillBg,
            color:ink3, fontSize:11, cursor:'pointer', transition:'all 0.2s',
            fontFamily:'var(--font-sans)',
          }}
        >
          {isDark ? <Sun size={13} /> : <Moon size={13} />}
          {isDark ? 'Jour' : 'Nuit'}
        </button>

        {/* Langue */}
        <button
          onClick={() => setLang(l => l === 'FR' ? 'EN' : 'FR')}
          title="Changer la langue"
          style={{
            flex:1, height:34, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            borderRadius:8, border:`1px solid ${pillBorder}`, background:pillBg,
            color:ink3, fontSize:11, cursor:'pointer', transition:'all 0.2s',
            fontFamily:'var(--font-sans)',
          }}
        >
          <Globe size={13} />
          {lang === 'FR' ? 'EN' : 'FR'}
        </button>
      </div>

      {/* ── User + Logout ── */}
      <div style={{
        display:'flex', alignItems:'center', gap:10,
        padding:'10px 8px',
        borderTop:`1px solid ${border}`,
      }}>
        <div style={{
          width:32, height:32, borderRadius:'50%', flexShrink:0,
          background:'linear-gradient(135deg,var(--green-400,#4fb37f),var(--blue-400,#5690d2))',
          display:'grid', placeItems:'center',
          fontSize:12, fontWeight:600, color:'white',
        }}>
          {user.nom?.[0]?.toUpperCase() || 'A'}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:500, color:ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {user.nom || 'Admin'}
          </div>
          <div style={{ fontSize:10, color:ink4, fontFamily:'var(--font-mono)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {user.unit || 'ALL'}
          </div>
        </div>
        <button
          onClick={logout}
          title="Déconnexion"
          style={{
            padding:6, borderRadius:8, border:`1px solid ${pillBorder}`,
            background:'transparent', color:ink4, cursor:'pointer',
            transition:'all 0.2s', display:'flex', alignItems:'center',
          }}
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  )
}
