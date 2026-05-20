// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import { iotAPI, dashboardAPI } from '../api/client'

// Pages
import Overview      from './dashboard/Overview'
import Graphiques    from './dashboard/Graphiques'
import Alertes       from './dashboard/Alertes'
import Seuils        from './dashboard/Seuils'
import Export        from './dashboard/Export'
import NSCalculateur from './dashboard/NSCalculateur'

export default function Dashboard() {
  const [liveData,    setLiveData]    = useState([])
  const [stats,       setStats]       = useState({})
  const [alertCount,  setAlertCount]  = useState(0)
  const [countdown,   setCountdown]   = useState(120)

  // ── Thème jour/nuit ──────────────────────────────────
  const [theme, setTheme] = useState(
    () => localStorage.getItem('sdi_theme') || 'light'
  )

  // ── Langue FR / EN ───────────────────────────────────
  const [lang, setLang] = useState(
    () => localStorage.getItem('sdi_lang') || 'FR'
  )

  // Appliquer le thème sur le <body> pour que le CSS global suive
  useEffect(() => {
    document.body.dataset.theme = theme
    localStorage.setItem('sdi_theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('sdi_lang', lang)
  }, [lang])

  // ── Fetch IoT data ───────────────────────────────────
  async function fetchAll() {
    try {
      const [live, st] = await Promise.all([iotAPI.getLive(), iotAPI.getStats()])
      setLiveData(live.serres || [])
      setStats(st)
      setAlertCount(st.alertes_actives || 0)
      setCountdown(120)
    } catch(e) {
      console.error('Fetch error:', e)
    }
  }

  useEffect(() => { fetchAll() }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { fetchAll(); return 120 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const countdownLabel = `${Math.floor(countdown/60)}:${String(countdown%60).padStart(2,'0')}`

  // ── Props partagés avec toutes les pages ─────────────
  const sharedProps = {
    liveData,
    stats,
    alertCount,
    countdown: countdownLabel,
    refreshAll: fetchAll,
    theme,   // 'light' | 'dark'
    lang,    // 'FR' | 'EN'
  }

  return (
    <div className="admin-shell" data-theme={theme}>
      <Sidebar
        alertCount={alertCount}
        theme={theme}
        setTheme={setTheme}
        lang={lang}
        setLang={setLang}
      />
      <main className="admin-main">
        <Routes>
          <Route path="/"            element={<Overview      {...sharedProps} />} />
          <Route path="/graphiques"  element={<Graphiques    {...sharedProps} />} />
          <Route path="/alertes"     element={<Alertes       {...sharedProps} />} />
          <Route path="/seuils"      element={<Seuils        {...sharedProps} />} />
          <Route path="/export"      element={<Export        {...sharedProps} />} />
          <Route path="/calculateur" element={<NSCalculateur theme={theme} lang={lang} />} />
        </Routes>
      </main>
    </div>
  )
}
