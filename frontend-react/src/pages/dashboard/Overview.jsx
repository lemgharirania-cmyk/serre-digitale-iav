// src/pages/dashboard/Overview.jsx
import { useNavigate } from 'react-router-dom'

const SERRES = [
  { id:1, code:'S01', nom:'Génétique' },
  { id:2, code:'S02', nom:'Horticulture' },
  { id:3, code:'S03', nom:'Agronomie' },
  { id:4, code:'S04', nom:'Hydroponie' },
  { id:5, code:'S05', nom:'Protection' },
]

export default function Overview({ liveData, stats, countdown, refreshAll }) {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('sdi_user') || '{}')

  return (
    <>
      {/* ── Top bar ── */}
      <div className="admin-top">
        <div>
          <h1>Vue d'ensemble</h1>
          <div className="admin-sub">
            {new Date().toLocaleDateString('fr-FR', {
              weekday:'long', year:'numeric', month:'long', day:'numeric'
            })} · 5 serres supervisées
          </div>
        </div>
        <div className="admin-top-r">
          <span className="chip">
            <span className="dot ok"></span>
            {countdown}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={refreshAll}>
            ↻ Actualiser
          </button>
          <div className="avatar">{user.nom?.[0]?.toUpperCase() || 'A'}</div>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="kpi-row">
        <div className="kpi">
          <div className="k-top">
            <span className="k-label">Serres actives</span>
            <span className="dot ok"></span>
          </div>
          <div className="k-val tnum">
            {liveData.filter(d => d.statut === 'ok').length}
            <span style={{fontSize:'16px',color:'var(--ink-3)'}}> / 5</span>
          </div>
          <div className="k-delta">100% en ligne</div>
        </div>
        <div className="kpi">
          <div className="k-top">
            <span className="k-label">Capteurs</span>
            <span className="mono" style={{fontSize:'10px',color:'var(--ink-3)'}}>10 / 10</span>
          </div>
          <div className="k-val tnum">100%</div>
          <div className="k-delta">10 capteurs actifs</div>
        </div>
        <div className="kpi">
          <div className="k-top">
            <span className="k-label">Alertes actives</span>
            <span className="chip warn" style={{padding:'2px 8px',fontSize:'10px'}}>
              {stats.alertes_actives || 0}
            </span>
          </div>
          <div className="k-val tnum">{stats.alertes_actives || 0}</div>
          <div className="k-delta down">
            {stats.alertes_actives > 0 ? `${stats.alertes_actives} non lues` : 'Aucune alerte'}
          </div>
        </div>
        <div className="kpi">
          <div className="k-top">
            <span className="k-label">Mesures 24h</span>
            <span className="mono" style={{fontSize:'10px',color:'var(--green-500)'}}>LIVE</span>
          </div>
          <div className="k-val tnum">
            {stats.mesures_24h > 1000
              ? Math.round(stats.mesures_24h / 1000) + 'k'
              : stats.mesures_24h || '—'}
          </div>
          <div className="k-delta">Collecte toutes les 2 min</div>
        </div>
      </div>

      {/* ── Serre cards ── */}
      <div className="panel" style={{marginBottom:'16px'}}>
        <div className="panel-head">
          <div>
            <h2>État des serres</h2>
            <div style={{fontSize:'12px',color:'var(--ink-3)',marginTop:'2px'}}>
              Données capteurs en temps réel
            </div>
          </div>
        </div>
        <div className="over-row">
          {liveData.map((d, i) => {
            const env = d.env || {}
            const st  = d.statut === 'ok' ? 'ok' : d.statut === 'partiel' ? 'warn' : 'crit'
            const tWarn = env.temperature > 27 || env.temperature < 16
            const hWarn = env.humidite > 88 || env.humidite < 40
            return (
              <div
                key={d.serre_id}
                className="over-card"
                onClick={() => navigate('/dashboard/graphiques')}
              >
                <div className="oc-head">
                  <span className={`dot ${st}`}></span>
                  <span className="mono" style={{
                    fontSize:'10px',
                    color: st==='ok' ? 'var(--green-500)' : st==='warn' ? '#a46f1a' : '#a8463b'
                  }}>
                    {st.toUpperCase()}
                  </span>
                </div>
                <div className="oc-name">{d.nom_fr?.split('&')[0].trim()}</div>
                <div className="oc-id">{SERRES[i]?.code}</div>
                <div className="oc-stats">
                  <div>
                    <div className="l">Temp</div>
                    <div className="v tnum" style={{color: tWarn ? '#a46f1a' : 'inherit'}}>
                      {env.temperature ?? '—'}°
                    </div>
                  </div>
                  <div>
                    <div className="l">Hum</div>
                    <div className="v tnum" style={{color: hWarn ? '#a46f1a' : 'inherit'}}>
                      {env.humidite ?? '—'}%
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Quick alerts preview ── */}
      <div className="panel">
        <div className="panel-head">
          <h2>Alertes récentes</h2>
          <span
            style={{fontSize:'12px',color:'var(--green-600)',fontWeight:500,cursor:'pointer'}}
            onClick={() => navigate('/dashboard/alertes')}
          >
            Tout voir →
          </span>
        </div>
        {stats.alertes_actives > 0
          ? <div style={{fontSize:'13px',color:'var(--ink-3)',padding:'1rem 0'}}>
              {stats.alertes_actives} alerte{stats.alertes_actives > 1 ? 's' : ''} active{stats.alertes_actives > 1 ? 's' : ''} —{' '}
              <span
                style={{color:'var(--green-600)',cursor:'pointer'}}
                onClick={() => navigate('/dashboard/alertes')}
              >
                voir les détails →
              </span>
            </div>
          : <div style={{fontSize:'13px',color:'var(--ink-3)',padding:'1rem 0'}}>
              Aucune alerte active.
            </div>
        }
      </div>
    </>
  )
}