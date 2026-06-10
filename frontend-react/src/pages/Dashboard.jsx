// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import { iotAPI } from '../api/client'
import { X, AlertTriangle } from 'lucide-react'

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
    ? 'Alerte critique dans ' + critical.length + ' serre' + (critical.length > 1 ? 's' : '') + ' \u2014 ' + names + '.'
    : 'Critical alert in ' + critical.length + ' greenhouse' + (critical.length > 1 ? 's' : '') + ' \u2014 ' + names + '.'

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

/* ── Page scrollable principale (sans NSCalculateur ni Paramètres) ── */
function ScrollHome(props) {
  const sec = { scrollMarginTop: 24, marginBottom: 48 }
  return (
    <>
      {/* Bannière + ambiance intérieure + schéma : tout dans EtatSerre */}
      <section id="etat"       style={sec}><EtatSerre  {...props} /></section>
      <section id="graphiques" style={sec}><Graphiques {...props} /></section>
      <section id="seuils"     style={sec}><Seuils     {...props} /></section>
      <section id="export"     style={sec}><Export     {...props} /></section>
    </>
  )
}

/* ── Contenu de la route principale : 3 vues exclusives ── */
function HomeView({ view, sharedProps, theme, lang }) {
  if (view === 'calculateur') {
    // Vue plein écran, ouverte directement — accessible uniquement via la sidebar
    return <NSCalculateur theme={theme} lang={lang} />
  }
  if (view === 'parametres') {
    return <Parametres theme={theme} lang={lang} />
  }
  return <ScrollHome {...sharedProps} />
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

  // Vue active de la route principale : 'scroll' | 'calculateur' | 'parametres'
  const [view, setView] = useState('scroll')

  const [theme, setTheme] = useState(() => localStorage.getItem('sdi_theme') || 'light')
  const [lang,  setLang]  = useState(() => localStorage.getItem('sdi_lang')  || 'FR')

  const location = useLocation()
  const navigate = useNavigate()
  const onDashboard = location.pathname === '/dashboard' || location.pathname === '/dashboard/'

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

  /* ── Navigation centrale pilotée par la sidebar ──
     target = { view: 'scroll'|'calculateur'|'parametres', anchor?: 'etat'|'graphiques'|'seuils'|'export' }
     Fonctionne depuis n'importe où : vue scrollable, vue calculateur,
     vue paramètres, ou même la route /dashboard/alertes. */
  function goTo(target) {
    const needRoute = !onDashboard
    if (needRoute) navigate('/dashboard')
    setView(target.view)

    // Le scroll s'exécute APRÈS le changement de vue / de route
    // (délai plus long si on revient d'une autre route, le temps du mount)
    const delay = needRoute ? 350 : 80
    setTimeout(() => {
      const main = document.querySelector('.admin-main')
      if (target.view === 'scroll' && target.anchor && target.anchor !== 'etat') {
        document.getElementById(target.anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        // vue calculateur / paramètres / retour en haut : reset scroll
        main?.scrollTo({ top: 0, behavior: target.view === 'scroll' ? 'smooth' : 'auto' })
      }
    }, delay)
  }

  const countdownLabel = Math.floor(countdown / 60) + ':' + String(countdown % 60).padStart(2, '0')

  // Rôle utilisateur — détermine l'accès aux serres
  const sdiUser  = (() => { try { return JSON.parse(localStorage.getItem('sdi_user') || '{}') } catch { return {} } })()
  const userRole = sdiUser.unit || sdiUser.role || 'ALL'  // unit='ALL'/'S01'…'S05' ; fallback sur role

  const sharedProps = {
    liveData, stats, alertCount, meteo,
    countdown: countdownLabel,
    refreshAll: () => { fetchAll(); fetchMeteo() },
    theme, lang, userRole,
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
        currentView={view}
        onViewNav={goTo}
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
          {/* Routes conservées en fallback (liens directs / anciens favoris) */}
          <Route path="/parametres"  element={<Parametres theme={theme} lang={lang} />} />
          <Route path="/calculateur" element={<NSCalculateur theme={theme} lang={lang} />} />
          <Route path="*"            element={<HomeView view={view} sharedProps={sharedProps} theme={theme} lang={lang} />} />
        </Routes>
      </main>
    </div>
  )
}
