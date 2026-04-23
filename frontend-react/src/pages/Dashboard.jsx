// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import { iotAPI, dashboardAPI } from '../api/client'

// Pages
import Overview from './dashboard/Overview'
import Graphiques from './dashboard/Graphiques'
import Alertes from './dashboard/Alertes'
import Seuils from './dashboard/Seuils'
import Export from './dashboard/Export'

export default function Dashboard() {
  const [liveData, setLiveData]     = useState([])
  const [stats, setStats]           = useState({})
  const [alertCount, setAlertCount] = useState(0)
  const [countdown, setCountdown]   = useState(120)

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

  // Fetch on mount
  useEffect(() => { fetchAll() }, [])

  // Countdown timer
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

  // Shared props passed to all pages
  const sharedProps = { liveData, stats, alertCount, countdown: countdownLabel, refreshAll: fetchAll }

  return (
    <div className="admin-shell">
      <Sidebar alertCount={alertCount} />
      <main className="admin-main">
        <Routes>
          <Route path="/"           element={<Overview    {...sharedProps} />} />
          <Route path="/graphiques" element={<Graphiques  {...sharedProps} />} />
          <Route path="/alertes"    element={<Alertes     {...sharedProps} />} />
          <Route path="/seuils"     element={<Seuils      {...sharedProps} />} />
          <Route path="/export"     element={<Export      {...sharedProps} />} />
        </Routes>
      </main>
    </div>
  )
}