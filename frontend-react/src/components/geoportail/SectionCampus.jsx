// src/components/geoportail/SectionCampus.jsx
import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'

const LAT = 33.978659, LNG = -6.864096

const UNITS = [
  { code:'S01', color:'#22C55E', nameFr:'Génétique & Amélioration', nameEn:'Genetics & Improvement' },
  { code:'S02', color:'#06B6D4', nameFr:'Horticulture',             nameEn:'Horticulture' },
  { code:'S03', color:'#F59E0B', nameFr:'Agronomie',                nameEn:'Agronomy' },
  { code:'S04', color:'#8B5CF6', nameFr:'Hydroponie',               nameEn:'Hydroponics' },
  { code:'S05', color:'#EF4444', nameFr:'Protection des Plantes',   nameEn:'Plant Protection' },
]

export default function SectionCampus({ lang, darkMode }) {
  const mapRef      = useRef(null)
  const mapInstance = useRef(null)
  const [expanded, setExpanded] = useState(false)

  const cardBg     = darkMode ? '#101B2E' : '#FFFFFF'
  const cardBorder = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const textColor  = darkMode ? '#F8FAFC' : '#0F172A'
  const textSecond = darkMode ? '#CBD5E1' : '#475569'

  useEffect(() => {
    if (mapInstance.current) return
    const timer = setTimeout(() => {
      if (!mapRef.current || mapInstance.current) return
      import('leaflet').then(L => {
        const map = L.default.map(mapRef.current, {
          zoomControl: true, attributionControl: false,
          dragging: true, scrollWheelZoom: false,
        })
        L.default.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          { maxZoom: 20 }
        ).addTo(map)
        map.setView([LAT - 0.015, LNG], 14)
        setTimeout(() => map.flyTo([LAT, LNG], 18, { animate: true, duration: 3 }), 500)
        const icon = L.default.divIcon({
          className: '',
          html: `<div style="width:20px;height:20px;border-radius:50%;background:#22C55E;border:3px solid white;box-shadow:0 0 0 8px rgba(34,197,94,0.2)"></div>`,
          iconSize: [20, 20], iconAnchor: [10, 10],
        })
        L.default.marker([LAT, LNG], { icon }).addTo(map)
          .bindPopup('<b>AgroBioTech · IAV Hassan II</b><br><small>Rabat, Maroc</small>')
        mapInstance.current = map
      })
    }, 200)
    return () => clearTimeout(timer)
  }, [])

  const T = {
    fr: {
      badge:  'Campus AgroBioTech · IAV Hassan II',
      title:  'Un campus de recherche',
      accent: 'connecté',
      text:   `Le Campus AgroBioTech de l'Institut Agronomique et Vétérinaire Hassan II constitue une infrastructure scientifique de référence dédiée à l'innovation agricole, à la recherche appliquée et au développement des technologies de demain. Situé à Rabat, ce complexe unique en son genre regroupe cinq serres de recherche spécialisées, un bloc technique intégré et une plateforme numérique de monitoring en temps réel. Il incarne la vision de l'IAV Hassan II pour une agriculture marocaine moderne, durable et connectée, en liant la rigueur académique aux défis concrets du terrain.`,
      loc:    'AgroBioTech · IAV Hassan II',
      coords: 'Rabat, Maroc · 33.9787°N 6.8641°W',
    },
    en: {
      badge:  'AgroBioTech Campus · IAV Hassan II',
      title:  'A connected research',
      accent: 'campus',
      text:   '[Insert the AgroBioTech campus introduction and Moroccan smart agriculture context here — presentation of IAV Hassan II, the complex mission, the strategic importance of this project for agriculture in Morocco, and the pioneering role of IAV in national agronomic research. You may also present institutional partnerships, research objectives of each unit and the long-term vision of the AgroBioTech complex within the digital transformation of Moroccan agriculture.]',
      loc:    'AgroBioTech · IAV Hassan II',
      coords: 'Rabat, Morocco · 33.9787°N 6.8641°W',
    }
  }[lang]

  return (
    <section id="campus" style={{ padding: '6rem 3rem', scrollMarginTop: '64px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        {/* Section title */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: darkMode ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '100px', padding: '6px 18px', marginBottom: '1rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#22C55E', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{T.badge}</span>
          </div>
          <h2 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, color: textColor, fontFamily: "'Outfit',sans-serif", letterSpacing: '-0.04em' }}>
            {T.title} <span style={{ color: '#22C55E' }}>{T.accent}</span>
          </h2>
        </div>

        {/* ── FIX: className="campus-grid" enables CSS media queries ── */}
        <div className="campus-grid" style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '2.5rem', alignItems: 'start' }}>

          {/* Left — map — ── FIX: className="campus-map" controls height on mobile/tablet ── */}
          <div
            className="campus-map"
            style={{
              borderRadius: '24px',
              overflow: 'hidden',
              border: `1px solid ${cardBorder}`,
              position: 'relative',
              height: '460px',
              boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.5)' : '0 4px 24px rgba(0,0,0,0.1)',
              flexShrink: 0,
            }}
          >
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(0,0,0,0.75))', padding: '1rem 1.2rem', pointerEvents: 'none' }}>
              <div style={{ color: 'white', fontSize: '14px', fontWeight: 700 }}>{T.loc}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '2px' }}>{T.coords}</div>
            </div>
          </div>

          {/* Right — text (wider) */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '24px', padding: '2.5rem', boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.07)' }}>
            <p style={{
              fontSize: '15px', color: textSecond, lineHeight: 2, marginBottom: '1rem',
              overflow: expanded ? 'visible' : 'hidden',
              display: expanded ? 'block' : '-webkit-box',
              WebkitLineClamp: expanded ? 'unset' : 4,
              WebkitBoxOrient: 'vertical',
            }}>{T.text}</p>
            <button
              onClick={() => setExpanded(e => !e)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#22C55E', fontFamily: "'Outfit',sans-serif",
                fontSize: '13px', fontWeight: 600, padding: '0 0 1.25rem',
                display: 'flex', alignItems: 'center', gap: '4px',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity='0.75'}
              onMouseLeave={e => e.currentTarget.style.opacity='1'}
            >
              {expanded
                ? (lang === 'fr' ? '← Réduire' : '← Show less')
                : (lang === 'fr' ? 'Lire la suite →' : 'Read more →')
              }
            </button>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {UNITS.map(u => (
                <span key={u.code} style={{ background: `${u.color}12`, border: `1px solid ${u.color}30`, color: u.color, padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
                  {lang === 'fr' ? u.nameFr : u.nameEn}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
