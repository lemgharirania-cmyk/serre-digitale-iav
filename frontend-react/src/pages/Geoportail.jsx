// src/pages/Geoportail.jsx
import { useState, useEffect } from 'react'
import { iotAPI } from '../api/client'
import Navbar from '../components/layout/Navbar'
import Hero from '../components/geoportail/Hero'
import AgroBioTech from '../components/geoportail/AgroBioTech'
import Visite from '../components/geoportail/Visite'
import Donnees from '../components/geoportail/Donnees'
import Footer from '../components/geoportail/Footer'

// Ajoute cet import en haut de src/pages/Geoportail.jsx
import Plan2D from '../components/geoportail/Plan2D'



export default function Geoportail() {
  const [lang, setLang]         = useState('fr')
  const [liveData, setLiveData] = useState([])
  const [stats, setStats]       = useState({})
  const [countdown, setCountdown] = useState(120)

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
      setCountdown(c => {
        if (c <= 1) { fetchAll(); return 120 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const countdownLabel = `${Math.floor(countdown/60)}:${String(countdown%60).padStart(2,'0')}`

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", color: '#111827', overflowX: 'hidden' }}>
      <Navbar lang={lang} setLang={setLang} />
      <Hero lang={lang} stats={stats} />
      <AgroBioTech lang={lang} />
      <Plan2D lang={lang} liveData={liveData} />   {/* ← ajoute cette ligne */}
      <Visite lang={lang} liveData={liveData} />
      <Donnees lang={lang} liveData={liveData} countdown={countdownLabel} onRefresh={fetchAll} />
      <Footer lang={lang} />
    </div>
  )
}