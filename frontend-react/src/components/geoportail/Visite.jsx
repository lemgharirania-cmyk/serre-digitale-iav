// src/components/geoportail/Visite.jsx
import { useState } from 'react'

const SERRES = [
  {
    file: '/walkthrough/viewer-genetique.html',
    fr: 'Génétique & Amélioration', en: 'Plant Genetics',
    badge: 'Unité 1', desc: 'Sélection variétale · Culture in vitro',
    color: '#86efac', serreCode: 'S01'
  },
  {
    file: '/walkthrough/viewer-horticulture.html',
    fr: 'Horticulture', en: 'Horticulture',
    badge: 'Unité 2', desc: 'Production florale · Maraîchage',
    color: '#6ee7b7', serreCode: 'S02'
  },
  {
    file: '/walkthrough/viewer-agronomie.html',
    fr: 'Agronomie', en: 'Agronomy',
    badge: 'Unité 3', desc: 'Essais culturaux · Recherche appliquée',
    color: '#34d399', serreCode: 'S03'
  },
  {
    file: '/walkthrough/viewer-hydroponie.html',
    fr: 'Hydroponie', en: 'Hydroponics',
    badge: 'Unité 4', desc: 'Culture hors-sol · Systèmes NFT & DWC',
    color: '#2dd4bf', serreCode: 'S04'
  },
  {
    file: '/walkthrough/viewer-protection.html',
    fr: 'Protection des Plantes', en: 'Plant Protection',
    badge: 'Unité 5', desc: 'Phytopathologie · Entomologie',
    color: '#a3e635', serreCode: 'S05'
  },
]

export default function Visite({ lang, liveData }) {
  const [activeSerre, setActiveSerre] = useState(null)
  const [fullscreenSerre, setFullscreenSerre] = useState(false)

  function loadSerre(serre) {
    setActiveSerre(serre)
    setFullscreenSerre(false)
    setTimeout(() => {
      document.getElementById('serre-embed')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  const t = lang === 'fr'
    ? {
        badge: 'Visite 360° · Insta360 X4',
        title: 'Visite Virtuelle Immersive',
        sub: 'Explorez le campus complet et naviguez dans chacune des 5 serres de recherche.',
        p1: 'Partie 1', p1title: 'Campus Complet — Visite Intégrale',
        p1desc: 'Parcourez l\'ensemble du campus depuis l\'extérieur jusqu\'aux serres de production et espaces techniques.',
        p2: 'Partie 2', p2title: 'Les 5 Serres de Recherche',
        placeholder: 'Sélectionnez une unité ci-dessus pour lancer sa visite virtuelle',
        live: 'Capteurs live', launch: 'Lancer la visite',
        fullscreen: 'Plein écran', back: '← Retour',
        openFull: '↗ Ouvrir en plein écran',
      }
    : {
        badge: 'Virtual Tour · Insta360 X4',
        title: 'Immersive Virtual Tour',
        sub: 'Explore the full campus and navigate through each of the 5 research greenhouses.',
        p1: 'Part 1', p1title: 'Full Campus — Complete Tour',
        p1desc: 'Walk through the entire campus from the exterior to production greenhouses and technical spaces.',
        p2: 'Part 2', p2title: 'The 5 Research Greenhouses',
        placeholder: 'Select a unit above to launch its virtual tour',
        live: 'Live sensors', launch: 'Launch tour',
        fullscreen: 'Fullscreen', back: '← Back',
        openFull: '↗ Open fullscreen',
      }

  return (
    <section id="visite" style={{ background: '#111827', padding: '5rem 2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '8px' }}>
            {t.badge}
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.6rem)', fontWeight: 800, color: 'white', marginBottom: '10px' }}>
            {t.title}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', maxWidth: '500px', margin: '0 auto' }}>
            {t.sub}
          </p>
        </div>

        {/* Part 1 — Full campus tour */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
            <div style={{ width: '4px', height: '28px', background: '#4ade80', borderRadius: '2px' }} />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '2px' }}>{t.p1}</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'white' }}>{t.p1title}</div>
            </div>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '1.25rem', paddingLeft: '16px' }}>
            {t.p1desc}
          </p>

          {/* Full campus iframe */}
          <div style={{ borderRadius: '16px', overflow: 'hidden', position: 'relative', paddingBottom: '56.25%', background: '#0a1628', border: '1px solid rgba(255,255,255,0.08)' }}>
            <iframe
              src="/walkthrough/viewer.html"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
            />
          </div>

          {/* Open in new tab */}
          <div style={{ textAlign: 'right', marginTop: '8px' }}>
            <a
              href="/walkthrough/viewer.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}
            >
              {t.openFull}
            </a>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '0 0 3rem' }} />

        {/* Part 2 — Individual serres */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
            <div style={{ width: '4px', height: '28px', background: '#2dd4bf', borderRadius: '2px' }} />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#2dd4bf', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '2px' }}>{t.p2}</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'white' }}>{t.p2title}</div>
            </div>
          </div>

          {/* Serre cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '10px', marginBottom: '1.5rem' }}>
            {SERRES.map(s => (
              <div key={s.file} onClick={() => loadSerre(s)} style={{
                background: activeSerre?.file === s.file ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
                border: `1.5px solid ${activeSerre?.file === s.file ? s.color : 'rgba(255,255,255,0.1)'}`,
                borderTop: `3px solid ${s.color}`,
                borderRadius: '14px', padding: '1rem 1.25rem', cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: activeSerre?.file === s.file ? `0 0 0 1px ${s.color}` : 'none'
              }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '6px' }}>
                  {s.badge}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.35 }}>
                  {lang === 'fr' ? s.fr : s.en}
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '6px', lineHeight: 1.4 }}>
                  {s.desc}
                </div>
              </div>
            ))}
          </div>

          {/* IoT strip */}
          {activeSerre && (() => {
            const d = liveData.find(x => x.code === activeSerre.serreCode)
            if (!d) return null
            return (
              <div style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '14px', padding: '14px 20px', display: 'flex',
                alignItems: 'center', gap: '24px', flexWrap: 'wrap', marginBottom: '1rem'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                  {t.live}
                </div>
                {[
                  { lbl: 'Température', val: d.env?.temperature, unit: '°C' },
                  { lbl: 'Humidité',    val: d.env?.humidite,    unit: '%' },
                  { lbl: 'VPD',         val: d.env?.vpd,         unit: ' kPa' },
                  { lbl: 'pH',          val: d.irr?.ph,          unit: '' },
                  { lbl: 'EC',          val: d.irr?.ec,          unit: ' mS/cm' },
                ].map((c, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,.4)', marginBottom: '2px' }}>{c.lbl}</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>
                      {c.val != null ? `${c.val}${c.unit}` : '—'}
                    </div>
                  </div>
                ))}
                <div style={{ marginLeft: 'auto' }}>
                  <a
                    href={activeSerre.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '11px', color: activeSerre.color,
                      textDecoration: 'none', fontWeight: 600,
                      padding: '5px 12px', borderRadius: '999px',
                      border: `1px solid ${activeSerre.color}`,
                    }}
                  >
                    {t.openFull}
                  </a>
                </div>
              </div>
            )
          })()}

          {/* Serre iframe */}
          {activeSerre ? (
            <div id="serre-embed" style={{ borderRadius: '16px', overflow: 'hidden', position: 'relative', paddingBottom: '56.25%', background: '#0a1628', border: '1px solid rgba(255,255,255,0.08)' }}>
              <iframe
                key={activeSerre.file}
                src={activeSerre.file}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                allowFullScreen
              />
            </div>
          ) : (
            <div id="serre-embed" style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px', padding: '3rem', textAlign: 'center',
              color: 'rgba(255,255,255,0.35)', fontSize: '14px'
            }}>
              {t.placeholder}
            </div>
          )}
        </div>

      </div>
    </section>
  )
}
