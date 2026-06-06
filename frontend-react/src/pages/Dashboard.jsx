// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import { iotAPI } from '../api/client'
import { X, AlertTriangle, Beaker as BeakerIcon, ChevronDown as ChevronDownIcon } from 'lucide-react'

import Overview      from './dashboard/Overview'
import EtatSerre     from './dashboard/EtatSerre'
import Graphiques    from './dashboard/Graphiques'
import Alertes       from './dashboard/Alertes'
import Seuils        from './dashboard/Seuils'
import Export        from './dashboard/Export'
import Parametres    from './dashboard/Parametres'
import NSCalculateur from './dashboard/NSCalculateur'

const METEO_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=34.0209&longitude=-6.8416' +
  '&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,shortwave_radiation,is_day' +
  '&daily=sunrise,sunset&timezone=Africa%2FCasablanca&forecast_days=1'

/* ── Bannière alerte critique persistante ── */
function AlertBanner({ liveData, theme, lang, onDismiss }) {
  const isDark = theme === 'dark'
  const critical = liveData.filter(d => {
    const env = d.env || {}, irr = d.irr || {}
    return (
      (env.temperature > 32 || env.temperature < 12) ||
      (env.humidite    > 92 || env.humidite    < 30) ||
      (irr.ph != null && (irr.ph < 5 || irr.ph > 8))
    )
  })
  if (!critical.length) return null

  const names = critical.map(d => d.nom_fr?.split('&')[0].trim() || d.code).join(', ')
  const msg = lang === 'FR'
    ? `Alerte critique dans ${critical.length} serre${critical.length > 1 ? 's' : ''} — ${names}.`
    : `Critical alert in ${critical.length} greenhouse${critical.length > 1 ? 's' : ''} — ${names}.`

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: isDark ? '#7f1d1d' : '#FEF2F2',
      borderBottom: '2px solid #EF4444',
      padding: '10px 20px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <AlertTriangle size={16} color="#EF4444" style={{ flexShrink: 0 }} />
      <span style={{
        flex: 1, fontSize: 13, fontWeight: 600,
        color: isDark ? '#FCA5A5' : '#991B1B',
        fontFamily: "'Manrope','DM Sans',system-ui,sans-serif",
      }}>
        {'\u26A0\uFE0F'} {msg}
      </span>
      <button onClick={onDismiss} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#EF4444', padding: 4, display: 'flex', alignItems: 'center',
      }}>
        <X size={15} />
      </button>
    </div>
  )
}

/* ── Accordion NSCalculateur ── */
function NSCalculateurAccordion({ theme, lang }) {
  const [open, setOpen] = useState(false)
  const isDark = theme === 'dark'
  const label  = lang === 'FR' ? 'Calculateur de solution nutritive' : 'Nutrient solution calculator'
  const subLbl = lang === 'FR'
    ? 'Calculer la composition de la solution nutritive de fertigation'
    : 'Calculate the fertigation nutrient solution composition'
  const cardBg = isDark ? 'rgba(16,27,46,0.85)' : '#FFFFFF'
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
  const ink    = isDark ? '#F1F5F9' : '#0F172A'
  const ink3   = isDark ? '#94A3B8' : '#64748B'

  return (
    <div style={{ background: cardBg, border: '1px solid ' + border, borderRadius: 18, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '20px 24px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: "'Manrope','DM Sans',system-ui,sans-serif",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11, flexShrink: 0,
            background: isDark ? 'rgba(6,182,212,0.12)' : 'rgba(6,182,212,0.08)',
            border: '1px solid rgba(6,182,212,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#06B6D4',
          }}>
            <BeakerIcon size={18} />
          </div>
          <div style={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: ink, letterSpacing: '-0.01em' }}>{label}</div>
            <div style={{ fontSize: 12, color: ink3, marginTop: 3 }}>{subLbl}</div>
          </div>
        </div>
        <ChevronDownIcon
          size={18}
          style={{
            flexShrink: 0, color: ink3,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s',
            marginLeft: 12,
          }}
        />
      </button>
      {open && (
        <div style={{ borderTop: '1px solid ' + border, padding: '0 4px 4px' }}>
          <NSCalculateur theme={theme} lang={lang} />
        </div>
      )}
    </div>
  )
}

/* ── Page scrollable principale ── */
function ScrollHome(props) {
  const sec = { scrollMarginTop: 24, marginBottom: 48 }
  return (
    <>
      <section id="vue"          style={sec}><Overview    {...props} /></section>
      <section id="etat"         style={sec}><EtatSerre   {...props} /></section>
      <section id="graphiques"   style={sec}><Graphiques  {...props} /></section>
      <section id="alertes-home" style={sec}><AlertesInline {...props} /></section>
      <section id="seuils"       style={sec}><Seuils      {...props} /></section>
      <section id="calculateur"  style={sec}><NSCalculateurAccordion theme={props.theme} lang={props.lang} /></section>
      <section id="export"       style={sec}><Export      {...props} /></section>
    </>
  )
}

/* Alertes inline dans ScrollHome */
import { useNavigate as _useNav } from 'react-router-dom'
function AlertesInline({ stats, theme, lang }) {
  const navigate   = _useNav()
  const isDark     = theme === 'dark'
  const cardBg     = isDark ? 'rgba(16,27,46,0.85)' : '#FFFFFF'
  const border     = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'
  const ink        = isDark ? '#F1F5F9' : '#0F172A'
  const alertCount = stats?.alertes_actives || 0
  const title   = lang === 'EN' ? 'Recent alerts' : 'Alertes recentes'
  const viewAll = lang === 'EN' ? 'View all' : 'Tout voir'
  const noAlert = lang === 'EN' ? 'No active alerts.' : 'Aucune alerte active.'
  const warnMsg = lang === 'EN'
    ? alertCount + ' active alert' + (alertCount > 1 ? 's' : '') + ' - click to view'
    : alertCount + ' alerte' + (alertCount > 1 ? 's' : '') + ' active' + (alertCount > 1 ? 's' : '')
  return (
    <div style={{ background:cardBg, border:'1px solid ' + border, borderRadius:18, padding:'20px 24px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <h2 style={{ fontSize:14, fontWeight:700, margin:0, color:ink, fontFamily:"'Manrope',system-ui,sans-serif" }}>{title}</h2>
        <button onClick={() => navigate('/dashboard/alertes')} style={{
          fontSize:12, fontWeight:600, color:'#22C55E', background:'none', border:'none', cursor:'pointer' }}>
          {viewAll} &rarr;
        </button>
      </div>
      {alertCount > 0 ? (
        <div onClick={() => navigate('/dashboard/alertes')} style={{ padding:'14px 16px', borderRadius:12, cursor:'pointer',
          background:isDark?'rgba(245,158,11,0.07)':'rgba(245,158,11,0.05)', border:'1px solid rgba(245,158,11,0.2)',
          fontSize:13, color:isDark?'#FDE68A':'#92400E', fontWeight:500 }}>
          &#9888;&#65039; {warnMsg}
        </div>
      ) : (
        <div style={{ padding:'14px 16px', borderRadius:12, fontSize:13, fontWeight:500, color:'#22C55E',
          background:isDark?'rgba(34,197,94,0.06)':'rgba(34,197,94,0.04)', border:'1px solid rgba(34,197,94,0.15)' }}>
          &#10003; {noAlert}
        </div>
      )}
    </div>
  )
}

/* ── Dashboard principal ── */
export default function Dashboard() {
  const [liveData,   setLiveData]   = useState([])
  const [stats,      setStats]      = useState({})
  const [alertCount, setAlertCount] = useState(0)
  const [countdown,  setCountdown]  = useState(120)
  const [meteo,      setMeteo]      = useState({})
  const [bannerOff,  setBannerOff]  = useState(false)
  const [sidebarW,   setSidebarW]   = useState(240) // synced with sidebar collapse

  const [theme, setTheme] = useState(() => localStorage.getItem('sdi_theme') || 'light')
  const [lang,  setLang]  = useState(() => localStorage.getItem('sdi_lang')  || 'FR')

  useEffect(() => {
    document.body.dataset.theme = theme
    localStorage.setItem('sdi_theme', theme)
    if (!document.getElementById('manrope-font')) {
      const l = document.createElement('link')
      l.id   = 'manrope-font'
      l.rel  = 'stylesheet'
      l.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap'
      document.head.appendChild(l)
    }
    document.body.style.fontFamily = "'Manrope','DM Sans',system-ui,sans-serif"
  }, [theme])

  useEffect(() => { localStorage.setItem('sdi_lang', lang) }, [lang])

  async function fetchAll() {
    try {
      const [live, st] = await Promise.all([iotAPI.getLive(), iotAPI.getStats()])
      setLiveData(live.serres || [])
      setStats(st)
      setAlertCount(st.alertes_actives || 0)
      setCountdown(120)
      setBannerOff(false)
    } catch (e) { console.error('Fetch error:', e) }
  }

  async function fetchMeteo() {
    try {
      const r = await fetch(METEO_URL)
      const d = await r.json()
      const c = d.current || {}, dl = d.daily || {}
      setMeteo({
        vent:    c.wind_speed_10m,
        solaire: c.shortwave_radiation,
        pluie:   (c.precipitation || 0) > 0.1,
        is_day:  !!c.is_day,
        sunrise: dl.sunrise?.[0],
        sunset:  dl.sunset?.[0],
      })
    } catch (e) { console.error('Meteo error:', e) }
  }

  useEffect(() => { fetchAll(); fetchMeteo() }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => { if (c <= 1) { fetchAll(); return 120 } return c - 1 })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const m = setInterval(fetchMeteo, 600000)
    return () => clearInterval(m)
  }, [])

  const countdownLabel = `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`

  const sharedProps = {
    liveData, stats, alertCount, meteo,
    countdown: countdownLabel,
    refreshAll: () => { fetchAll(); fetchMeteo() },
    theme, lang,
  }

  const hasCritical = !bannerOff && liveData.some(d => {
    const env = d.env || {}, irr = d.irr || {}
    return (
      (env.temperature > 32 || env.temperature < 12) ||
      (env.humidite    > 92 || env.humidite    < 30) ||
      (irr.ph != null && (irr.ph < 5 || irr.ph > 8))
    )
  })

  return (
    <div
      className="admin-shell"
      data-theme={theme}
      style={{
        fontFamily: "'Manrope','DM Sans',system-ui,sans-serif",
        display: 'flex',
        minHeight: '100vh',
      }}
    >
      {hasCritical && (
        <AlertBanner
          liveData={liveData}
          theme={theme}
          lang={lang}
          onDismiss={() => setBannerOff(true)}
        />
      )}

      <Sidebar
        alertCount={alertCount}
        theme={theme} setTheme={setTheme}
        lang={lang}   setLang={setLang}
        onWidthChange={setSidebarW}
      />

      {/* Spacer that matches fixed sidebar width */}
      <div id="sidebar-spacer" style={{ width: sidebarW, flexShrink: 0, transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)' }} aria-hidden="true" />

      <main
        className="admin-main"
        style={{
          flex: 1,
          minWidth: 0,
          height: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '1.5rem',
          paddingTop: hasCritical ? 'calc(1.5rem + 42px)' : '1.5rem',
        }}
      >
        <Routes>
          <Route path="/alertes"     element={<Alertes    {...sharedProps} />} />
          <Route path="/seuils"      element={<Seuils     {...sharedProps} />} />
          <Route path="/export"      element={<Export     {...sharedProps} />} />
          <Route path="/parametres"  element={<Parametres theme={theme} lang={lang} />} />
          <Route path="/calculateur" element={<NSCalculateur theme={theme} lang={lang} />} />
          <Route path="*"            element={<ScrollHome {...sharedProps} />} />
        </Routes>
      </main>
    </div>
  )
}
