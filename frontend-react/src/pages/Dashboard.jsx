// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import { iotAPI } from '../api/client'

// Pages / sections
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

export default function Dashboard() {
  const [liveData,   setLiveData]   = useState([])
  const [stats,      setStats]      = useState({})
  const [alertCount, setAlertCount] = useState(0)
  const [countdown,  setCountdown]  = useState(120)
  const [meteo,      setMeteo]      = useState({})

  const [theme, setTheme] = useState(() => localStorage.getItem('sdi_theme') || 'light')
  const [lang,  setLang]  = useState(() => localStorage.getItem('sdi_lang')  || 'FR')

  useEffect(() => {
    document.body.dataset.theme = theme
    localStorage.setItem('sdi_theme', theme)
  }, [theme])
  useEffect(() => { localStorage.setItem('sdi_lang', lang) }, [lang])

  // ── IoT (interne) ─────────────────────────────────
  async function fetchAll() {
    try {
      const [live, st] = await Promise.all([iotAPI.getLive(), iotAPI.getStats()])
      setLiveData(live.serres || [])
      setStats(st)
      setAlertCount(st.alertes_actives || 0)
      setCountdown(120)
    } catch (e) { console.error('Fetch error:', e) }
  }

  // ── Open-Meteo (extérieur · Rabat) ────────────────
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

  // Météo : rafraîchissement plus lent (toutes les 10 min)
  useEffect(() => {
    const m = setInterval(fetchMeteo, 600000)
    return () => clearInterval(m)
  }, [])

  const countdownLabel = `${Math.floor(countdown/60)}:${String(countdown%60).padStart(2,'0')}`

  const sharedProps = {
    liveData, stats, alertCount, meteo,
    countdown: countdownLabel,
    refreshAll: () => { fetchAll(); fetchMeteo() },
    theme, lang,
  }

  return (
    <div className="admin-shell" data-theme={theme}>
      <Sidebar alertCount={alertCount} theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} />
      <main className="admin-main">
        <Routes>
          <Route path="/calculateur" element={<NSCalculateur theme={theme} lang={lang} />} />
          <Route path="*"            element={<DashboardHome {...sharedProps} />} />
        </Routes>
      </main>
    </div>
  )
}

/* Page unique scrollable : toutes les sections empilées et ancrées. */
function DashboardHome(props) {
  const sec = { scrollMarginTop: 16, marginBottom: 40 }
  return (
    <div className="admin-scroll">
      <section id="vue"        style={sec}><Overview   {...props} /></section>
      <section id="etat"       style={sec}><EtatSerre  {...props} /></section>
      <section id="graphiques" style={sec}><Graphiques {...props} /></section>
      <section id="alertes"    style={sec}><Alertes    {...props} /></section>
      <section id="seuils"     style={sec}><Seuils     {...props} /></section>
      <section id="export"     style={sec}><Export     {...props} /></section>
      <section id="parametres" style={sec}><Parametres {...props} /></section>
    </div>
  )
}
