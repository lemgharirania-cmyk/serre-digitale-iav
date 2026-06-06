// src/pages/dashboard/Overview.jsx
import { useNavigate } from 'react-router-dom'
import { Wind, Sun, CloudRain, Sunrise, Sunset, Bell, Cpu, RefreshCw,
         Thermometer, Droplets, Zap, FlaskConical, ChevronRight } from 'lucide-react'
import { useMemo } from 'react'

const SERRES = [
  { id:1, code:'S01', nom:'Génétique',     color:'#22C55E' },
  { id:2, code:'S02', nom:'Horticulture',  color:'#06B6D4' },
  { id:3, code:'S03', nom:'Agronomie',     color:'#F59E0B' },
  { id:4, code:'S04', nom:'Hydroponie',    color:'#8B5CF6' },
  { id:5, code:'S05', nom:'Protection',    color:'#EF4444' },
]

const T = {
  FR: {
    greeting: (h, name) => h < 12 ? `Bonjour ${name}` : h < 18 ? `Bon après-midi ${name}` : `Bonsoir ${name}`,
    statusBar:'Barre d\'état rapide',
    alertes:'alertes actives nécessitent attention',
    aucuneAlerte:'Aucun dépassement détecté aujourd\'hui.',
    subtitle:(n) => `Supervision de ${n} serres de recherche`,
    refresh:'Actualiser',
    alertesActives:'Alertes actives', capteursCo:'Capteurs connectés',
    derniereSync:'Dernière synchronisation', etatGeneral:'État général',
    ok:'OK', attention:'Attention', critique:'Critique',
    etatSerres:'État des serres', donneesRT:'Données capteurs temps réel',
    alertesRecentes:'Alertes récentes', toutVoir:'Tout voir',
    irrIndispo:'Irrigation N/A',
    aucuneAlerteActive:'Aucune alerte active.',
    voirDetails:'voir les détails',
    temp:'T°', hum:'HR', niv:'Niv.',
    extTitle:'Conditions extérieures', extSub:'Station météo · Rabat (Open-Meteo)',
    ventL:'Vent', rayL:'Rayonnement', pluieL:'Pluie', oui:'Oui', non:'Non',
    leverL:'Lever', coucherL:'Coucher',
  },
  EN: {
    greeting: (h, name) => h < 12 ? `Good morning ${name}` : h < 18 ? `Good afternoon ${name}` : `Good evening ${name}`,
    statusBar:'Quick status bar',
    alertes:'active alerts require attention',
    aucuneAlerte:'No threshold exceeded today.',
    subtitle:(n) => `Monitoring ${n} research greenhouses`,
    refresh:'Refresh',
    alertesActives:'Active alerts', capteursCo:'Connected sensors',
    derniereSync:'Last sync', etatGeneral:'Overall status',
    ok:'OK', attention:'Warning', critique:'Critical',
    etatSerres:'Greenhouse status', donneesRT:'Real-time sensor data',
    alertesRecentes:'Recent alerts', toutVoir:'View all',
    irrIndispo:'Irrigation N/A',
    aucuneAlerteActive:'No active alerts.',
    voirDetails:'see details',
    temp:'T°', hum:'RH', niv:'Lvl.',
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
  const userName = user.prenom || user.nom || (lang==='FR'?'Admin':'Admin')

  const now   = new Date()
  const hour  = now.getHours()
  const greeting = t.greeting(hour, userName)

  const cardBg     = isDark ? 'rgba(16,27,46,0.85)' : '#FFFFFF'
  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
  const ink        = isDark ? '#F1F5F9' : '#0F172A'
  const ink2       = isDark ? '#CBD5E1' : '#334155'
  const ink3       = isDark ? '#94A3B8' : '#64748B'
  const ink4       = isDark ? '#475569' : '#94A3B8'
  const surfaceBg  = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.02)'
  const borderLine = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

  const fmtT = (iso) => { if (!iso) return '—'; const p = String(iso).split('T')[1]; return p ? p.slice(0,5) : '—' }

  const alertCount   = stats.alertes_actives || 0
  const capteurCount = 10

  // Derive quick status from liveData
  const statusItems = useMemo(() => {
    if (!liveData.length) return []
    const all = liveData.flatMap(d => [
      { key:'temp', label: lang==='FR'?'Température':'Temperature', val: d.env?.temperature, min:15, max:30, unit:'°C', color:'#F59E0B' },
      { key:'hum',  label: lang==='FR'?'Humidité':'Humidity',       val: d.env?.humidite,    min:40, max:90, unit:'%',  color:'#06B6D4' },
      { key:'ec',   label: 'EC',                                     val: d.irr?.ec,          min:0.5,max:4,  unit:'mS', color:'#059669' },
      { key:'ph',   label: 'pH',                                     val: d.irr?.ph,          min:5.5,max:7.5,unit:'',  color:'#8B5CF6' },
    ])
    // Aggregate worst status per type
    const byKey = {}
    all.forEach(item => {
      if (item.val == null) return
      const warn = item.val < item.min || item.val > item.max
      if (!byKey[item.key] || warn) byKey[item.key] = { ...item, warn }
    })
    return Object.values(byKey)
  }, [liveData, lang])

  const extStats = [
    { icon:<Wind size={14}/>,      label:t.ventL,   val:meteo.vent    != null ? `${meteo.vent}`    : '—', unit:'km/h',  color:'#06B6D4' },
    { icon:<Sun size={14}/>,       label:t.rayL,    val:meteo.solaire != null ? `${meteo.solaire}` : '—', unit:'W/m²',  color:'#F59E0B' },
    { icon:<CloudRain size={14}/>, label:t.pluieL,  val:meteo.pluie ? t.oui : t.non,                      unit:'',      color:meteo.pluie?'#3773bd':ink4 },
    { icon:<Sunrise size={14}/>,   label:t.leverL,  val:fmtT(meteo.sunrise),                              unit:'',      color:'#F59E0B' },
    { icon:<Sunset size={14}/>,    label:t.coucherL,val:fmtT(meteo.sunset),                               unit:'',      color:'#8B5CF6' },
  ]

  return (
    <div style={{ fontFamily: "'Manrope','DM Sans',system-ui,sans-serif" }}>

      {/* ── Greeting banner ── */}
      <div style={{
        background: isDark
          ? 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(6,182,212,0.05) 100%)'
          : 'linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(6,182,212,0.04) 100%)',
        border: `1px solid ${isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.12)'}`,
        borderRadius: 20, padding: '24px 28px', marginBottom: 20,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative accent */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:2,
          background:'linear-gradient(90deg,#22C55E,#06B6D4,transparent)' }} />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontSize:'clamp(1.25rem,2.5vw,1.6rem)', fontWeight:700, margin:'0 0 6px', color:ink, letterSpacing:'-0.02em' }}>
              {greeting} 👋
            </h1>
            <p style={{ fontSize:13, color:ink3, margin:0 }}>
              {alertCount > 0
                ? `⚠️ ${alertCount} ${t.alertes}`
                : `✓ ${t.aucuneAlerte}`}
            </p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <span style={{
              display:'flex', alignItems:'center', gap:6, padding:'6px 14px',
              borderRadius:999, fontSize:12, fontFamily:'var(--font-mono,monospace)',
              background: isDark?'rgba(34,197,94,0.1)':'rgba(34,197,94,0.08)',
              border:'1px solid rgba(34,197,94,0.25)', color:'#22C55E', fontWeight:600,
            }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#22C55E',
                boxShadow:'0 0 6px #22C55E', animation:'pulse 2s infinite' }} />
              {countdown}
            </span>
            <button onClick={refreshAll} style={{
              display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:12,
              background: isDark?'rgba(255,255,255,0.06)':'rgba(15,23,42,0.05)',
              border:`1px solid ${cardBorder}`, color:ink3, fontSize:13, fontWeight:600,
              cursor:'pointer', fontFamily:'inherit',
            }}>
              <RefreshCw size={13}/> {t.refresh}
            </button>
          </div>
        </div>
      </div>

      {/* ── Quick status bar ── */}
      {statusItems.length > 0 && (
        <div style={{
          display:'grid', gridTemplateColumns:`repeat(${Math.min(statusItems.length,4)},1fr)`,
          gap:10, marginBottom:20,
        }}>
          {statusItems.map((item, i) => (
            <div key={i} style={{
              background: item.warn
                ? (isDark?'rgba(245,158,11,0.08)':'rgba(245,158,11,0.06)')
                : (isDark?'rgba(34,197,94,0.06)':'rgba(34,197,94,0.04)'),
              border:`1px solid ${item.warn
                ? 'rgba(245,158,11,0.25)'
                : (isDark?'rgba(34,197,94,0.2)':'rgba(34,197,94,0.15)')}`,
              borderRadius:14, padding:'12px 16px',
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <div>
                <div style={{ fontSize:11, color:ink3, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase' }}>
                  {item.label}
                </div>
                <div style={{ fontSize:18, fontWeight:700, fontFamily:'var(--font-mono,monospace)', color:item.warn?'#F59E0B':'#22C55E', marginTop:2 }}>
                  {item.val != null ? `${item.val}${item.unit}` : '—'}
                </div>
              </div>
              <span style={{
                fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:6,
                background: item.warn?'rgba(245,158,11,0.15)':'rgba(34,197,94,0.15)',
                color: item.warn?'#F59E0B':'#22C55E', letterSpacing:'0.05em',
              }}>
                {item.warn ? t.attention : t.ok}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── KPI Row ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12, marginBottom:20 }}>
        {[
          {
            icon: <Bell size={16}/>, iconBg:'rgba(239,68,68,0.12)', iconColor:'#EF4444',
            label: t.alertesActives, val: alertCount,
            delta: alertCount > 0 ? `${alertCount} non lues` : t.aucuneAlerte,
            status: alertCount > 0 ? 'warn' : 'ok',
          },
          {
            icon: <Cpu size={16}/>, iconBg:'rgba(6,182,212,0.12)', iconColor:'#06B6D4',
            label: t.capteursCo, val: capteurCount,
            delta: `10 / 10 actifs`, status:'ok',
          },
          {
            icon: <RefreshCw size={16}/>, iconBg:'rgba(34,197,94,0.12)', iconColor:'#22C55E',
            label: t.derniereSync, val: countdown,
            delta: lang==='FR'?'Collecte 2 min':'Update every 2 min', status:'ok',
          },
          {
            icon: <Thermometer size={16}/>, iconBg:'rgba(139,92,246,0.12)', iconColor:'#8B5CF6',
            label: t.etatGeneral,
            val: <span style={{ fontSize:20, fontWeight:800 }}>
              {liveData.filter(d=>d.statut==='ok').length}<span style={{ fontSize:14, fontWeight:500, color:ink3 }}>/5</span>
            </span>,
            delta: lang==='FR'?'serres en ligne':'greenhouses online', status:'ok',
          },
        ].map((k, i) => (
          <div key={i} style={{ background:cardBg, border:`1px solid ${cardBorder}`,
            borderRadius:18, padding:'18px 20px', transition:'transform 0.2s,box-shadow 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=isDark?'0 8px 24px rgba(0,0,0,0.3)':'0 8px 20px rgba(0,0,0,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <span style={{ fontSize:11, fontWeight:700, color:ink3, letterSpacing:'0.06em', textTransform:'uppercase' }}>{k.label}</span>
              <div style={{ width:30, height:30, borderRadius:9, background:k.iconBg, display:'flex', alignItems:'center', justifyContent:'center', color:k.iconColor }}>
                {k.icon}
              </div>
            </div>
            <div style={{ fontSize:26, fontWeight:800, color:ink, fontFamily:'var(--font-mono,monospace)', letterSpacing:'-0.02em', marginBottom:4 }}>
              {k.val}
            </div>
            <div style={{ fontSize:11, color: k.status==='warn' ? '#F59E0B' : ink3 }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* ── Conditions extérieures ── */}
      <div style={{ background:cardBg, border:`1px solid ${cardBorder}`, borderRadius:18, padding:'20px 24px', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:8 }}>
          <div>
            <h2 style={{ fontSize:14, fontWeight:700, margin:0, color:ink }}>{t.extTitle}</h2>
            <div style={{ fontSize:11, color:ink3, marginTop:3 }}>{t.extSub}</div>
          </div>
          <span style={{ fontSize:10, fontFamily:'monospace', fontWeight:700, color:'#22C55E', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.2)', padding:'3px 10px', borderRadius:20 }}>
            OPEN-METEO
          </span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:10 }}>
          {extStats.map((s, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px',
              borderRadius:12, border:`1px solid ${borderLine}`, background:surfaceBg }}>
              <span style={{ width:32, height:32, borderRadius:9, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:`${s.color}15`, color:s.color }}>
                {s.icon}
              </span>
              <div>
                <div style={{ fontSize:10, color:ink3, fontWeight:600 }}>{s.label}</div>
                <div style={{ fontSize:16, fontWeight:700, fontFamily:'monospace', color:s.color }}>
                  {s.val}<span style={{ fontSize:10, color:ink4, marginLeft:2 }}>{s.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Serre cards ── */}
      <div style={{ background:cardBg, border:`1px solid ${cardBorder}`, borderRadius:18, padding:'20px 24px', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:8 }}>
          <div>
            <h2 style={{ fontSize:14, fontWeight:700, margin:0, color:ink }}>{t.etatSerres}</h2>
            <div style={{ fontSize:11, color:ink3, marginTop:3 }}>{t.donneesRT}</div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12 }}>
          {liveData.map((d, i) => {
            const meta  = SERRES[i] || {}
            const env   = d.env || {}
            const irr   = d.irr || {}
            const st    = d.statut === 'ok' ? 'ok' : d.statut === 'partiel' ? 'warn' : 'crit'
            const tWarn = env.temperature > 27 || env.temperature < 16
            const hWarn = env.humidite    > 88 || env.humidite    < 40
            const pWarn = irr.ph != null && (irr.ph < 5.5 || irr.ph > 7.5)
            const hasIrr = irr && Object.values(irr).some(v => v != null)
            const stColor = st==='ok'?'#22C55E':st==='warn'?'#F59E0B':'#EF4444'

            return (
              <div key={d.serre_id} style={{
                borderRadius:14, border:`1px solid ${borderLine}`,
                overflow:'hidden', cursor:'pointer', transition:'all 0.2s',
                background: surfaceBg,
                borderTop:`3px solid ${meta.color||'#22C55E'}`,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 8px 24px ${meta.color||'#22C55E'}20` }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none' }}
              onClick={() => document.getElementById('graphiques')?.scrollIntoView({behavior:'smooth'})}>
                <div style={{ padding:'12px 14px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontFamily:'monospace', fontSize:10, fontWeight:700, color:meta.color }}>{meta.code}</span>
                    <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:5,
                      background:`${stColor}15`, color:stColor, letterSpacing:'0.05em' }}>
                      {st.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize:12, fontWeight:600, color:ink, marginBottom:10, lineHeight:1.35 }}>
                    {d.nom_fr?.split('&')[0].trim() || meta.nom}
                  </div>

                  {/* ENV values */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom: hasIrr?8:0 }}>
                    {[
                      { label:t.temp, val:env.temperature!=null?`${env.temperature}°`:'—', warn:tWarn },
                      { label:t.hum,  val:env.humidite!=null?`${env.humidite}%`:'—', warn:hWarn },
                      { label:'VPD',  val:env.vpd!=null?env.vpd:'—', warn:false },
                    ].map((v,j) => (
                      <div key={j} style={{ textAlign:'center', padding:'6px 4px', borderRadius:8,
                        background: v.warn ? 'rgba(245,158,11,0.1)' : (isDark?'rgba(255,255,255,0.03)':'rgba(0,0,0,0.02)'),
                        border:`1px solid ${v.warn?'rgba(245,158,11,0.2)':borderLine}` }}>
                        <div style={{ fontSize:9, color:ink3, marginBottom:2 }}>{v.label}</div>
                        <div style={{ fontSize:13, fontWeight:700, fontFamily:'monospace', color:v.warn?'#F59E0B':ink }}>
                          {v.val}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* IRR values */}
                  {hasIrr ? (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:4, paddingTop:8, borderTop:`1px solid ${borderLine}` }}>
                      {[
                        { label:'pH', val:irr.ph!=null?irr.ph:'—', warn:pWarn },
                        { label:'EC', val:irr.ec!=null?irr.ec:'—', warn:false },
                        { label:t.niv, val:irr.niveau_eau!=null?`${irr.niveau_eau}m`:'—', warn:false },
                        { label:'T°eau', val:irr.temp_eau!=null?`${irr.temp_eau}°`:'—', warn:false },
                      ].map((v,j) => (
                        <div key={j} style={{ textAlign:'center' }}>
                          <div style={{ fontSize:9, color:ink4 }}>{v.label}</div>
                          <div style={{ fontSize:11, fontWeight:600, fontFamily:'monospace', color:v.warn?'#F59E0B':ink3 }}>
                            {v.val}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize:9, color:ink4, fontFamily:'monospace', paddingTop:8,
                      borderTop:`1px solid ${borderLine}`, textAlign:'center' }}>
                      {t.irrIndispo}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Alertes récentes ── */}
      <div style={{ background:cardBg, border:`1px solid ${cardBorder}`, borderRadius:18, padding:'20px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <h2 style={{ fontSize:14, fontWeight:700, margin:0, color:ink }}>{t.alertesRecentes}</h2>
          <button onClick={() => navigate('/dashboard/alertes')} style={{
            display:'flex', alignItems:'center', gap:4, fontSize:12, fontWeight:600,
            color:'#22C55E', background:'none', border:'none', cursor:'pointer',
          }}>
            {t.toutVoir} <ChevronRight size={14}/>
          </button>
        </div>
        {alertCount > 0 ? (
          <div style={{ padding:'14px 16px', borderRadius:12,
            background:isDark?'rgba(245,158,11,0.07)':'rgba(245,158,11,0.05)',
            border:'1px solid rgba(245,158,11,0.2)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:13, color:ink2 }}>
              ⚠️ {alertCount} {lang==='FR'?`alerte${alertCount>1?'s':''} active${alertCount>1?'s':''}`:`alert${alertCount>1?'s':''} active`}
            </span>
            <button onClick={() => navigate('/dashboard/alertes')} style={{
              fontSize:11, color:'#F59E0B', background:'none', border:'none', cursor:'pointer', fontWeight:600,
            }}>
              {t.voirDetails} →
            </button>
          </div>
        ) : (
          <div style={{ padding:'14px 16px', borderRadius:12,
            background:isDark?'rgba(34,197,94,0.06)':'rgba(34,197,94,0.04)',
            border:'1px solid rgba(34,197,94,0.15)', fontSize:13, color:'#22C55E', fontWeight:500 }}>
            ✓ {t.aucuneAlerteActive}
          </div>
        )}
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  )
}
