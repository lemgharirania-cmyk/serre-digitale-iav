// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
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

/* ── Bannière d'alerte critique persistante ── */
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

  const msg = lang === 'FR'
    ? `⚠️ Alerte critique détectée dans ${critical.length} serre${critical.length>1?'s':''} — ${critical.map(d=>d.nom_fr?.split('&')[0].trim()||d.code).join(', ')}.`
    : `⚠️ Critical alert in ${critical.length} greenhouse${critical.length>1?'s':''} — ${critical.map(d=>d.nom_en?.split('&')[0].trim()||d.code).join(', ')}.`

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: isDark ? '#7f1d1d' : '#FEF2F2',
      borderBottom: '1px solid #EF4444',
      padding: '10px 20px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <AlertTriangle size={16} color="#EF4444" style={{ flexShrink:0 }} />
      <span style={{ flex:1, fontSize:13, fontWeight:600,
        color: isDark ? '#FCA5A5' : '#991B1B',
        fontFamily:"'Manrope','DM Sans',system-ui,sans-serif" }}>
        {msg}
      </span>
      <button onClick={onDismiss} style={{
        background:'none', border:'none', cursor:'pointer', color:'#EF4444', padding:4,
        display:'flex', alignItems:'center',
      }}>
        <X size={15}/>
      </button>
    </div>
  )
}

export default function Dashboard() {
  const [liveData,    setLiveData]    = useState([])
  const [stats,       setStats]       = useState({})
  const [alertCount,  setAlertCount]  = useState(0)
  const [countdown,   setCountdown]   = useState(120)
  const [meteo,       setMeteo]       = useState({})
  const [bannerOff,   setBannerOff]   = useState(false)

  const [theme, setTheme] = useState(() => localStorage.getItem('sdi_theme') || 'light')
  const [lang,  setLang]  = useState(() => localStorage.getItem('sdi_lang')  || 'FR')

  useEffect(() => {
    document.body.dataset.theme = theme
    localStorage.setItem('sdi_theme', theme)
    // Inject Manrope font
    if (!document.getElementById('manrope-font')) {
      const l = document.createElement('link')
      l.id   = 'manrope-font'
      l.rel  = 'stylesheet'
      l.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap'
      document.head.appendChild(l)
    }
    // Apply font globally
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
      setBannerOff(false) // reset banner on refresh
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

  const countdownLabel = `${Math.floor(countdown/60)}:${String(countdown%60).padStart(2,'0')}`

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
    <div className="admin-shell" data-theme={theme} style={{ fontFamily:"'Manrope','DM Sans',system-ui,sans-serif" }}>

      {/* Bannière critique persistante */}
      {hasCritical && (
        <AlertBanner liveData={liveData} theme={theme} lang={lang} onDismiss={() => setBannerOff(true)} />
      )}

      <Sidebar alertCount={alertCount} theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} />

      <main className="admin-main" style={{ paddingTop: hasCritical ? 'calc(var(--main-pt,1.5rem) + 40px)' : undefined }}>
        <Routes>
          <Route path="/alertes"     element={<Alertes     {...sharedProps} />} />
          <Route path="/seuils"      element={<Seuils      {...sharedProps} />} />
          <Route path="/export"      element={<Export      {...sharedProps} />} />
          <Route path="/parametres"  element={<Parametres  theme={theme} lang={lang} />} />
          <Route path="/calculateur" element={<NSCalculateur theme={theme} lang={lang} />} />
          <Route path="*"            element={<ScrollHome  {...sharedProps} />} />
        </Routes>
      </main>
    </div>
  )
}

/* Trois sections scrollables reliées par la sidebar */
function ScrollHome(props) {
  const sec = { scrollMarginTop: 24, marginBottom: 48 }
  return (
    <>
      {/* 1. Vue d'ensemble + greeting + status */}
      <section id="vue" style={sec}><Overview {...props} /></section>

      {/* 2. Seuils (juste après accueil pour action rapide) */}
      <section id="seuils" style={sec}><Seuils {...props} /></section>

      {/* 3. État de la serre */}
      <section id="etat" style={sec}><EtatSerre {...props} /></section>

      {/* 4. Graphiques analytiques */}
      <section id="graphiques" style={sec}><Graphiques {...props} /></section>

      {/* 5. Calculateur NS — compact accordion */}
      <section id="calculateur" style={sec}><NSCalculateurAccordion {...props} /></section>

      {/* 6. Export */}
      <section id="export" style={sec}><ExportSection {...props} /></section>
    </>
  )
}

/* NSCalculateur en accordion pour réduire la hauteur */
import NSCalculateur from './dashboard/NSCalculateur'
import Export from './dashboard/Export'

function NSCalculateurAccordion({ theme, lang }) {
  const [open, setOpen] = useState(false)
  const isDark = theme === 'dark'
  const label  = lang === 'FR' ? 'Calculateur de solution nutritive' : 'Nutrient solution calculator'
  const cardBg = isDark ? 'rgba(16,27,46,0.85)' : '#FFFFFF'
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
  const ink    = isDark ? '#F1F5F9' : '#0F172A'
  const ink3   = isDark ? '#94A3B8' : '#64748B'

  return (
    <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:18, overflow:'hidden' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'18px 24px', background:'none', border:'none', cursor:'pointer',
        fontFamily:"'Manrope','DM Sans',system-ui,sans-serif",
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:11,
            background:isDark?'rgba(6,182,212,0.12)':'rgba(6,182,212,0.08)',
            border:'1px solid rgba(6,182,212,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:18 }}>⚗️</span>
          </div>
          <div style={{ textAlign:'left' }}>
            <div style={{ fontSize:14, fontWeight:700, color:ink }}>{label}</div>
            <div style={{ fontSize:11, color:ink3, marginTop:2 }}>
              {lang==='FR'
                ? 'Calculer la composition de la solution nutritive de fertigation'
                : 'Calculate fertigation nutrient solution composition'}
            </div>
          </div>
        </div>
        <div style={{
          width:28, height:28, borderRadius:8,
          background:isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)',
          border:`1px solid ${border}`, display:'flex', alignItems:'center', justifyContent:'center',
          color:ink3, transition:'transform 0.3s', transform: open?'rotate(180deg)':'none',
          fontSize:16, flexShrink:0,
        }}>
          ▾
        </div>
      </button>
      {open && (
        <div style={{ borderTop:`1px solid ${border}`, padding:'0 4px 4px' }}>
          <NSCalculateur theme={theme} lang={lang} />
        </div>
      )}
    </div>
  )
}

function ExportSection(props) {
  return <Export {...props} />
}
