// src/components/geoportail/Donnees.jsx
import { useState, useEffect } from 'react'
import { iotAPI } from '../../api/client'

export default function Donnees({ lang, liveData, countdown, onRefresh }) {
  const t = lang === 'fr'
    ? { title: 'Données des Capteurs', sub: 'Températures, humidité, pH, EC — mis à jour toutes les 2 minutes.', label: 'Temps Réel', live: 'Données en temps réel', refresh: '↻ Actualiser', noData: 'Chargement...' }
    : { title: 'Sensor Data', sub: 'Temperature, humidity, pH, EC — updated every 2 minutes.', label: 'Real-time', live: 'Real-time data', refresh: '↻ Refresh', noData: 'Loading...' }

  const fv = (v, u) => v != null ? `${v}${u}` : '—'

  return (
    <section id="donnees" style={{ background: '#f9fafb', padding: '5rem 2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '8px' }}>
            {t.label}
          </div>
          <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>{t.title}</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>{t.sub}</p>
        </div>

        {/* Refresh bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem',
          background: 'white', padding: '12px 20px', borderRadius: '14px',
          border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '13px', color: '#6b7280', flex: 1 }}>{t.live}</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a' }}>{countdown}</span>
          <button onClick={onRefresh} style={{
            background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0',
            padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit'
          }}>{t.refresh}</button>
        </div>

        {/* Cards grid */}
        {liveData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>{t.noData}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: '20px' }}>
            {liveData.map((d, i) => {
              const env = d.env || {}
              const irr = d.irr || {}
              const isOk = d.statut === 'ok'
              const colors = ['#16a34a', '#3b82f6', '#16a34a', '#3b82f6', '#6b7280']
              return (
                <div key={d.serre_id} style={{
                  background: 'white', borderRadius: '20px', padding: '1.5rem',
                  border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'all 0.3s'
                }}>
                  {/* Card header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: colors[i] }} />
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', flex: 1 }}>
                      {lang === 'fr' ? d.nom_fr : d.nom_en}
                    </div>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '100px',
                      background: isOk ? '#f0fdf4' : '#fffbeb',
                      color: isOk ? '#15803d' : '#92400e'
                    }}>
                      {isOk ? '● Live' : '◐ Partiel'}
                    </span>
                  </div>

                  {/* ENV sensors */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '1rem' }}>
                    {[
                      { lbl: 'Temp.', val: fv(env.temperature, '°C') },
                      { lbl: 'Humid.', val: fv(env.humidite, '%') },
                      { lbl: 'VPD', val: fv(env.vpd, ' kPa') },
                    ].map((s, j) => (
                      <div key={j} style={{ textAlign: 'center', background: '#f9fafb', borderRadius: '10px', padding: '10px 6px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '.03em' }}>{s.lbl}</div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{s.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* IRR sensors */}
                  {(irr.ph != null || irr.ec != null) && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px', paddingTop: '10px', borderTop: '1px solid #f3f4f6' }}>
                      {[
                        { lbl: 'pH', val: irr.ph ?? '—' },
                        { lbl: 'EC', val: irr.ec != null ? `${irr.ec} mS/cm` : '—' },
                        irr.temp_eau != null   ? { lbl: 'Temp. eau', val: `${irr.temp_eau}°C` } : null,
                        irr.niveau_eau != null  ? { lbl: 'Niveau',    val: `${irr.niveau_eau}m` } : null,
                      ].filter(Boolean).map((s, j) => (
                        <div key={j} style={{ background: '#eff6ff', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 500 }}>{s.lbl}</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#2563eb' }}>{s.val}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </section>
  )
}