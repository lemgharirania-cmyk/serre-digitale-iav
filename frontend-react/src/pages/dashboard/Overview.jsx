// src/pages/dashboard/Overview.jsx
import { useNavigate } from 'react-router-dom'
import { Wind, Sun, CloudRain, Sunrise, Sunset } from 'lucide-react'

const SERRES = [
  { id:1, code:'S01', nom:'Génétique' },
  { id:2, code:'S02', nom:'Horticulture' },
  { id:3, code:'S03', nom:'Agronomie' },
  { id:4, code:'S04', nom:'Hydroponie' },
  { id:5, code:'S05', nom:'Protection' },
]

const T = {
  FR: {
    title:'Vue d\'ensemble', subtitle:'serres supervisées',
    refresh:'Actualiser', serresActives:'Serres actives', online:'en ligne',
    capteurs:'Capteurs', actifsLabel:'capteurs actifs',
    alertesActives:'Alertes actives', nonLues:'non lues', aucuneAlerte:'Aucune alerte',
    mesures:'Mesures 24h', collecte:'Collecte toutes les 2 min',
    etatSerres:'État des serres', donneesRT:'Données capteurs en temps réel',
    alertesRecentes:'Alertes récentes', toutVoir:'Tout voir →',
    irrIndispo:'IRR non disponible',
    alertesSub1:'alerte', alertesSub2:'active', voirDetails:'voir les détails →',
    aucuneAlerteActive:'Aucune alerte active.',
    temp:'Temp', hum:'Hum', eau:'T°eau', niv:'Niv.',
    extTitle:'Conditions extérieures', extSub:'Station météo · Rabat (Open-Meteo)',
    ventL:'Vent', rayL:'Rayonnement', pluieL:'Pluie', oui:'Oui', non:'Non',
    leverL:'Lever soleil', coucherL:'Coucher soleil',
  },
  EN: {
    title:'Overview', subtitle:'greenhouses monitored',
    refresh:'Refresh', serresActives:'Active greenhouses', online:'online',
    capteurs:'Sensors', actifsLabel:'active sensors',
    alertesActives:'Active alerts', nonLues:'unread', aucuneAlerte:'No alerts',
    mesures:'Measures 24h', collecte:'Updated every 2 min',
    etatSerres:'Greenhouse status', donneesRT:'Real-time sensor data',
    alertesRecentes:'Recent alerts', toutVoir:'View all →',
    irrIndispo:'IRR unavailable',
    alertesSub1:'alert', alertesSub2:'active', voirDetails:'see details →',
    aucuneAlerteActive:'No active alerts.',
    temp:'Temp', hum:'Hum', eau:'H₂O T°', niv:'Lvl.',
    extTitle:'Outdoor conditions', extSub:'Weather station · Rabat (Open-Meteo)',
    ventL:'Wind', rayL:'Radiation', pluieL:'Rain', oui:'Yes', non:'No',
    leverL:'Sunrise', coucherL:'Sunset',
  }
}

export default function Overview({ liveData, stats, countdown, refreshAll, meteo = {}, theme, lang }) {
  const navigate = useNavigate()
  const isDark   = theme === 'dark'
  const t        = T[lang] || T.FR
  const user     = JSON.parse(localStorage.getItem('sdi_user') || '{}')

  // Couleurs réactives
  const cardBg    = isDark ? 'rgba(22,35,56,0.85)' : 'white'
  const cardBorder= isDark ? 'rgba(255,255,255,0.07)' : 'var(--border)'
  const ink3      = isDark ? '#94A3B8' : 'var(--ink-3)'
  const ink4      = isDark ? '#64748B' : 'var(--ink-4)'
  const borderLine= isDark ? 'rgba(255,255,255,0.06)' : 'var(--border)'

  const now = new Date()
  const dateLabel = lang === 'EN'
    ? now.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
    : now.toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })

  const fmtT = (iso) => { if (!iso) return '—'; const p = String(iso).split('T')[1]; return p ? p.slice(0,5) : '—' }
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior:'smooth', block:'start' })
  const extStats = [
    { icon:<Wind size={16} />,    label:t.ventL,    val: meteo.vent    != null ? `${meteo.vent}`    : '—', unit:'km/h',  color:'#06B6D4' },
    { icon:<Sun size={16} />,     label:t.rayL,     val: meteo.solaire != null ? `${meteo.solaire}` : '—', unit:'W/m²',  color:'#F59E0B' },
    { icon:<CloudRain size={16} />,label:t.pluieL,  val: meteo.pluie ? t.oui : t.non,                       unit:'',      color: meteo.pluie ? '#3773bd' : ink4 },
    { icon:<Sunrise size={16} />, label:t.leverL,   val: fmtT(meteo.sunrise),                               unit:'',      color:'#F59E0B' },
    { icon:<Sunset size={16} />,  label:t.coucherL, val: fmtT(meteo.sunset),                                unit:'',      color:'#8B5CF6' },
  ]

  return (
    <>
      {/* ── Top bar ── */}
      <div className="admin-top">
        <div>
          <h1>{t.title}</h1>
          <div className="admin-sub">
            {dateLabel} · 5 {t.subtitle}
          </div>
        </div>
        <div className="admin-top-r">
          <span className="chip">
            <span className="dot ok" />
            {countdown}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={refreshAll}>
            ↻ {t.refresh}
          </button>
          <div className="avatar">{user.nom?.[0]?.toUpperCase() || 'A'}</div>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="kpi-row">
        {[
          {
            label: t.serresActives,
            val: <>{liveData.filter(d => d.statut === 'ok').length}<span style={{fontSize:16,color:ink3}}> / 5</span></>,
            delta: `100% ${t.online}`, dot:'ok'
          },
          {
            label: t.capteurs,
            badge: <span className="mono" style={{fontSize:10,color:ink3}}>10 / 10</span>,
            val: '100%',
            delta: `10 ${t.actifsLabel}`
          },
          {
            label: t.alertesActives,
            badge: <span className="chip warn" style={{padding:'2px 8px',fontSize:10}}>{stats.alertes_actives||0}</span>,
            val: stats.alertes_actives || 0,
            delta: stats.alertes_actives > 0 ? `${stats.alertes_actives} ${t.nonLues}` : t.aucuneAlerte,
            deltaClass: stats.alertes_actives > 0 ? 'down' : ''
          },
          {
            label: t.mesures,
            badge: <span className="mono" style={{fontSize:10,color:'var(--green-500)'}}>LIVE</span>,
            val: stats.mesures_24h > 1000 ? Math.round(stats.mesures_24h/1000)+'k' : stats.mesures_24h||'—',
            delta: t.collecte
          },
        ].map((k, i) => (
          <div key={i} className="kpi" style={{ background:cardBg, borderColor:cardBorder }}>
            <div className="k-top">
              <span className="k-label">{k.label}</span>
              {k.dot ? <span className={`dot ${k.dot}`}/> : k.badge}
            </div>
            <div className="k-val tnum">{k.val}</div>
            <div className={`k-delta ${k.deltaClass||''}`}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* ── Conditions extérieures (Rabat · Open-Meteo) ── */}
      <div className="panel" style={{ background:cardBg, borderColor:cardBorder, marginBottom:16 }}>
        <div className="panel-head">
          <div>
            <h2>{t.extTitle}</h2>
            <div style={{ fontSize:12, color:ink3, marginTop:2 }}>{t.extSub}</div>
          </div>
          <span className="mono" style={{ fontSize:10, color:'var(--green-500)' }}>OPEN-METEO</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:14 }}>
          {extStats.map((s, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:12,
              border:`1px solid ${borderLine}`, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(16,48,36,0.015)' }}>
              <span style={{ width:34, height:34, borderRadius:10, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                background:`${s.color}18`, color:s.color }}>{s.icon}</span>
              <div>
                <div style={{ fontSize:11, color:ink3 }}>{s.label}</div>
                <div className="tnum" style={{ fontSize:18, fontWeight:700, fontFamily:'var(--font-mono)' }}>
                  {s.val}<span style={{ fontSize:11, color:ink4, marginLeft:3 }}>{s.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Serre cards ── */}
      <div className="panel" style={{ background:cardBg, borderColor:cardBorder, marginBottom:16 }}>
        <div className="panel-head">
          <div>
            <h2>{t.etatSerres}</h2>
            <div style={{ fontSize:12, color:ink3, marginTop:2 }}>{t.donneesRT}</div>
          </div>
        </div>
        <div className="over-row">
          {liveData.map((d, i) => {
            const env    = d.env || {}
            const irr    = d.irr || {}
            const st     = d.statut === 'ok' ? 'ok' : d.statut === 'partiel' ? 'warn' : 'crit'
            const tWarn  = env.temperature > 27 || env.temperature < 16
            const hWarn  = env.humidite > 88 || env.humidite < 40
            const phWarn = irr.ph != null && (irr.ph < 5.5 || irr.ph > 7.5)
            const hasIrr = irr && Object.values(irr).some(v => v != null)

            return (
              <div
                key={d.serre_id}
                className="over-card"
                style={{ background:cardBg, borderColor:cardBorder }}
                onClick={() => scrollTo('graphiques')}
              >
                <div className="oc-head">
                  <span className={`dot ${st}`} />
                  <span className="mono" style={{
                    fontSize:10,
                    color: st==='ok' ? 'var(--green-500)' : st==='warn' ? '#a46f1a' : '#a8463b'
                  }}>
                    {st.toUpperCase()}
                  </span>
                </div>
                <div className="oc-name">{d.nom_fr?.split('&')[0].trim()}</div>
                <div className="oc-id">{SERRES[i]?.code}</div>

                {/* ENV */}
                <div className="oc-stats">
                  <div>
                    <div className="l">{t.temp}</div>
                    <div className="v tnum" style={{color: tWarn ? '#a46f1a' : 'inherit'}}>
                      {env.temperature != null ? `${env.temperature}°` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="l">{t.hum}</div>
                    <div className="v tnum" style={{color: hWarn ? '#a46f1a' : 'inherit'}}>
                      {env.humidite != null ? `${env.humidite}%` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="l">VPD</div>
                    <div className="v tnum">{env.vpd != null ? env.vpd : '—'}</div>
                  </div>
                </div>

                {/* IRR */}
                {hasIrr ? (
                  <div className="oc-stats" style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${borderLine}` }}>
                    <div>
                      <div className="l">pH</div>
                      <div className="v tnum" style={{color: phWarn ? '#a46f1a' : 'inherit'}}>
                        {irr.ph != null ? irr.ph : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="l">EC</div>
                      <div className="v tnum">{irr.ec != null ? irr.ec : '—'}</div>
                    </div>
                    <div>
                      <div className="l">{t.eau}</div>
                      <div className="v tnum">{irr.temp_eau != null ? `${irr.temp_eau}°` : '—'}</div>
                    </div>
                    <div>
                      <div className="l">{t.niv}</div>
                      <div className="v tnum">{irr.niveau_eau != null ? `${irr.niveau_eau}m` : '—'}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    marginTop:8, paddingTop:8, borderTop:`1px solid ${borderLine}`,
                    fontSize:10, color:ink4, fontFamily:'var(--font-mono)'
                  }}>
                    {t.irrIndispo}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Alertes récentes ── */}
      <div className="panel" style={{ background:cardBg, borderColor:cardBorder }}>
        <div className="panel-head">
          <h2>{t.alertesRecentes}</h2>
          <span
            style={{ fontSize:12, color:'var(--green-600)', fontWeight:500, cursor:'pointer' }}
            onClick={() => scrollTo('alertes')}
          >
            {t.toutVoir}
          </span>
        </div>
        {stats.alertes_actives > 0 ? (
          <div style={{ fontSize:13, color:ink3, padding:'1rem 0' }}>
            {stats.alertes_actives} {t.alertesSub1}{stats.alertes_actives > 1 ? 's' : ''} {t.alertesSub2}{stats.alertes_actives > 1 ? 's' : ''} —{' '}
            <span style={{ color:'var(--green-600)', cursor:'pointer' }} onClick={() => scrollTo('alertes')}>
              {t.voirDetails}
            </span>
          </div>
        ) : (
          <div style={{ fontSize:13, color:ink3, padding:'1rem 0' }}>
            {t.aucuneAlerteActive}
          </div>
        )}
      </div>
    </>
  )
}
