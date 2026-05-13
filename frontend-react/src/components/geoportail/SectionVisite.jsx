// src/components/geoportail/SectionVisite.jsx
import { useState } from 'react'
 
const SERRES_VISITE = [
  { file: '/walkthrough/viewer-genetique.html',    fr: 'Génétique & Amélioration', en: 'Genetics & Improvement', badge: 'S01', color: '#22C55E', desc: 'Sélection variétale · Culture in vitro', code: 'S01' },
  { file: '/walkthrough/viewer-horticulture.html', fr: 'Horticulture',              en: 'Horticulture',           badge: 'S02', color: '#06B6D4', desc: 'Production florale · Maraîchage',      code: 'S02' },
  { file: '/walkthrough/viewer-agronomie.html',    fr: 'Agronomie',                 en: 'Agronomy',               badge: 'S03', color: '#F59E0B', desc: 'Essais culturaux · Recherche',          code: 'S03' },
  { file: '/walkthrough/viewer-hydroponie.html',   fr: 'Hydroponie',                en: 'Hydroponics',            badge: 'S04', color: '#8B5CF6', desc: 'Culture hors-sol · NFT & DWC',          code: 'S04' },
  { file: '/walkthrough/viewer-protection.html',   fr: 'Protection des Plantes',    en: 'Plant Protection',       badge: 'S05', color: '#EF4444', desc: 'Phytopathologie · Entomologie',         code: 'S05' },
]
 
export default function SectionVisite({ lang, liveData, darkMode }) {
  const [activeSerre, setActiveSerre] = useState(null)
 
  const cardBg     = darkMode ? 'rgba(16,27,46,0.8)' : '#FFFFFF'
  const cardBorder = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const textColor  = darkMode ? '#F8FAFC' : '#0F172A'
  const mutedColor = darkMode ? '#64748B' : '#94A3B8'
  const btnBg      = darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
 
  const T = {
    badge:       lang === 'fr' ? 'Visite 360° · Insta360 X4'                                   : 'Virtual Tour · Insta360 X4',
    title:       lang === 'fr' ? 'Visite Virtuelle Immersive'                                   : 'Immersive Virtual Tour',
    sub:         lang === 'fr' ? 'Explorez le campus complet et naviguez dans chacune des 5 serres de recherche.' : 'Explore the full campus and navigate through each of the 5 research greenhouses.',
    p1:          lang === 'fr' ? 'Campus Complet — Visite Intégrale'                            : 'Full Campus — Complete Tour',
    p1desc:      lang === 'fr' ? 'Parcourez l\'ensemble du campus depuis l\'extérieur jusqu\'aux serres de production et espaces techniques.' : 'Walk through the entire campus from the exterior to production greenhouses and technical spaces.',
    p2:          lang === 'fr' ? 'Les 5 Serres de Recherche'                                    : 'The 5 Research Greenhouses',
    placeholder: lang === 'fr' ? 'Sélectionnez une serre pour lancer sa visite virtuelle'       : 'Select a greenhouse to launch its virtual tour',
    live:        lang === 'fr' ? 'Capteurs live'                                                : 'Live sensors',
    openFull:    lang === 'fr' ? '↗ Ouvrir en plein écran'                                      : '↗ Open fullscreen',
  }
 
  return (
    <section id="visite" style={{ padding: '5rem 3rem', scrollMarginTop: '64px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
 
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: darkMode ? 'rgba(139,92,246,0.08)' : 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '100px', padding: '6px 18px', marginBottom: '1rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8B5CF6' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#8B5CF6', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{T.badge}</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 900, color: textColor, fontFamily: "'Outfit',sans-serif", letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>{T.title}</h2>
          <p style={{ fontSize: '15px', color: mutedColor, maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>{T.sub}</p>
        </div>
 
        {/* Part 1 — Full campus */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '24px', padding: '2rem', marginBottom: '2rem', boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '4px', height: '20px', background: '#06B6D4', borderRadius: '2px' }} />
              <span style={{ fontSize: '15px', fontWeight: 700, color: textColor }}>{T.p1}</span>
            </div>
            <a href="/walkthrough/viewer.html" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '12px', color: mutedColor, textDecoration: 'none' }}>
              {T.openFull}
            </a>
          </div>
          <p style={{ fontSize: '13px', color: mutedColor, marginBottom: '1rem', paddingLeft: '14px' }}>{T.p1desc}</p>
          <div style={{ borderRadius: '16px', overflow: 'hidden', position: 'relative', paddingBottom: '52%', background: darkMode ? '#0B1728' : '#ECF3EE' }}>
            <iframe
              src="/walkthrough/viewer.html"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
            />
          </div>
        </div>
 
        {/* Divider */}
        <div style={{ height: '1px', background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', margin: '0 0 2rem' }} />
 
        {/* Part 2 — Individual serres */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '24px', padding: '2rem', boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
            <div style={{ width: '4px', height: '20px', background: '#22C55E', borderRadius: '2px' }} />
            <span style={{ fontSize: '15px', fontWeight: 700, color: textColor }}>{T.p2}</span>
          </div>
 
          {/* Serre cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '8px', marginBottom: '1.25rem' }}>
            {SERRES_VISITE.map(s => (
              <div key={s.file} onClick={() => setActiveSerre(activeSerre?.file === s.file ? null : s)} style={{
                background: activeSerre?.file === s.file ? `${s.color}15` : btnBg,
                border: `1.5px solid ${activeSerre?.file === s.file ? s.color : (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
                borderTop: `3px solid ${s.color}`,
                borderRadius: '14px', padding: '12px', cursor: 'pointer',
                transition: 'all 0.25s',
                boxShadow: activeSerre?.file === s.file ? `0 0 20px ${s.color}20` : 'none',
                transform: activeSerre?.file === s.file ? 'translateY(-2px)' : 'none',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>{s.badge}</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: textColor, lineHeight: 1.3, marginBottom: '5px' }}>
                  {lang === 'fr' ? s.fr : s.en}
                </div>
                <div style={{ fontSize: '11px', color: mutedColor, lineHeight: 1.4 }}>{s.desc}</div>
              </div>
            ))}
          </div>
 
          {/* Live IoT strip */}
          {activeSerre && (() => {
            const d = liveData?.find(x => x.code === activeSerre.code)
            if (!d) return null
            return (
              <div style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', border: `1px solid ${activeSerre.color}20`, borderRadius: '12px', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: mutedColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{T.live}</div>
                {[
                  { lbl: lang === 'fr' ? 'Température' : 'Temperature', val: d.env?.temperature, unit: '°C' },
                  { lbl: lang === 'fr' ? 'Humidité' : 'Humidity',       val: d.env?.humidite,    unit: '%' },
                  { lbl: 'VPD',                                          val: d.env?.vpd,         unit: ' kPa' },
                  { lbl: 'pH',                                           val: d.irr?.ph,          unit: '' },
                  { lbl: 'EC',                                           val: d.irr?.ec,          unit: ' mS/cm' },
                ].map((c, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: mutedColor, marginBottom: '2px' }}>{c.lbl}</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: textColor, fontFamily: "'Outfit',sans-serif" }}>
                      {c.val != null ? `${c.val}${c.unit}` : '—'}
                    </div>
                  </div>
                ))}
                <div style={{ marginLeft: 'auto' }}>
                  <a href={activeSerre.file} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '11px', color: activeSerre.color, textDecoration: 'none', fontWeight: 600, padding: '5px 12px', borderRadius: '999px', border: `1px solid ${activeSerre.color}` }}>
                    {T.openFull}
                  </a>
                </div>
              </div>
            )
          })()}
 
          {/* Iframe or placeholder */}
          {activeSerre ? (
            <div style={{ borderRadius: '16px', overflow: 'hidden', position: 'relative', paddingBottom: '52%', background: darkMode ? '#0B1728' : '#ECF3EE' }}>
              <iframe
                key={activeSerre.file}
                src={activeSerre.file}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                allowFullScreen
              />
            </div>
          ) : (
            <div style={{ background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${cardBorder}`, borderRadius: '14px', padding: '3rem', textAlign: 'center', color: mutedColor, fontSize: '14px' }}>
              {T.placeholder}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}