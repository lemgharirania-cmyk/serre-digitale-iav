// src/pages/Geoportail.jsx — Page principale assemblée
import { useState, useEffect, useRef } from 'react'
import { iotAPI } from '../api/client'

import Header           from '../components/geoportail/Header'
import Sidebar          from '../components/geoportail/Sidebar'
import SectionProjet    from '../components/geoportail/SectionProjet'
import SectionApropos   from '../components/geoportail/SectionApropos'
import SectionCampus    from '../components/geoportail/SectionCampus'
import SectionPlan2D    from '../components/geoportail/SectionPlan2D'
import SectionDonnees   from '../components/geoportail/SectionDonnees'
import SectionVisite    from '../components/geoportail/SectionVisite'
import FooterGeoportail from '../components/geoportail/FooterGeoportail'

export default function Geoportail() {
  const [lang,      setLang]      = useState('fr')
  const [darkMode,  setDarkMode]  = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [liveData,  setLiveData]  = useState([])
  const [stats,     setStats]     = useState({})
  const [countdown, setCountdown] = useState(120)
  const [activeSection, setActiveSection] = useState('projet')

  // Fetch data
  async function fetchAll() {
    try {
      const [live, st] = await Promise.all([iotAPI.getLive(), iotAPI.getStats()])
      setLiveData(live.serres || [])
      setStats(st)
      setCountdown(120)
    } catch(e) { console.error(e) }
  }

  useEffect(() => { fetchAll() }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => { if (c <= 1) { fetchAll(); return 120 } return c - 1 })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Track active section on scroll
  useEffect(() => {
    const ids = ['projet','apropos','campus','plan2d','donnees','visite']
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setActiveSection(entry.target.id)
      })
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 })

    ids.forEach(id => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const countdownLabel = `${Math.floor(countdown/60)}:${String(countdown%60).padStart(2,'0')}`
  const sidebarWidth = sidebarOpen ? 240 : 56

  // Theme background
  const bgColor = darkMode ? '#07111F' : '#F4F7F5'

  return (
    <div style={{ fontFamily: "'Outfit','Inter',sans-serif", background: bgColor, minHeight: '100vh', transition: 'background 0.4s ease' }}>

      {/* Header — full width, fixed top */}
      <Header
        lang={lang} setLang={setLang}
        darkMode={darkMode} setDarkMode={setDarkMode}
      />

      {/* Sidebar — fixed left, below header */}
      <Sidebar
        open={sidebarOpen} setOpen={setSidebarOpen}
        active={activeSection}
        lang={lang} darkMode={darkMode}
      />

      {/* Main content — scrollable, offset by sidebar */}
     {/* Header offset by sidebar */}
<div style={{ marginLeft: `${sidebarWidth}px`, transition: 'margin-left 0.3s ease' }}>
  <Header ... />
</div>
<main style={{
  marginLeft: `${sidebarWidth}px`,
  marginTop: '80px',
  ...
}}>
        <SectionProjet  lang={lang} stats={stats}    darkMode={darkMode} />
        <SectionApropos lang={lang}                  darkMode={darkMode} />
        <SectionCampus  lang={lang}                  darkMode={darkMode} />
        <SectionPlan2D  lang={lang} liveData={liveData} darkMode={darkMode} />
        <SectionDonnees
          lang={lang} liveData={liveData}
          countdown={countdownLabel} onRefresh={fetchAll}
          darkMode={darkMode}
        />
        <SectionVisite  lang={lang} liveData={liveData} darkMode={darkMode} />
        <FooterGeoportail lang={lang} darkMode={darkMode} />
      </main>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(34,197,94,0.2); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(34,197,94,0.4); }
      `}</style>
    </div>
  )
}
