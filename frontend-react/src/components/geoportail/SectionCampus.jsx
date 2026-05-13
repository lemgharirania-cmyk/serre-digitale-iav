// src/components/geoportail/SectionCampus.jsx
import { useEffect, useRef } from 'react'
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

  const cardBg     = darkMode ? 'rgba(16,27,46,0.8)' : '#FFFFFF'
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
      text:   "[Ici vous insérez l'introduction du campus AgroBioTech et le contexte marocain de l'agriculture intelligente — présentation de l'IAV Hassan II, de la mission du complexe et de l'importance stratégique de ce projet pour l'agriculture au Maroc.]",
      loc:    'AgroBioTech · IAV Hassan II',
      coords: 'Rabat, Maroc · 33.9787°N 6.8641°W',
    },
    en: {
      badge:  'AgroBioTech Campus · IAV Hassan II',
      title:  'A connected research',
      accent: 'campus',
      text:   '[Insert the AgroBioTech campus introduction and Moroccan smart agriculture context here — presentation of IAV Hassan II, the complex mission and the strategic importance of this project for agriculture in Morocco.]',
      loc:    'AgroBioTech · IAV Hassan II',
      coords: 'Rabat, Morocco · 33.9787°N 6.8641°W',
    }
  }[lang]

  return (
    <section id="campus" style={{ padding: '5rem 3rem', scrollMarginTop: '64px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Section title */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: darkMode ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '100px', padding: '6px 18px', marginBottom: '1rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#22C55E', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{T.badge}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
          {/* Left — map */}
          <div style={{ borderRadius: '24px', overflow: 'hidden', border: `1px solid ${cardBorder}`, position: 'relative', height: '440px', boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.5)' : '0 4px 24px rgba(0,0,0,0.1)' }}>
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(0,0,0,0.7))', padding: '1rem 1.2rem', pointerEvents: 'none' }}>
              <div style={{ color: 'white', fontSize: '14px', fontWeight: 600 }}>{T.loc}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{T.coords}</div>
            </div>
          </div>

          {/* Right — intro text + units */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '24px', padding: '2.5rem', backdropFilter: 'blur(16px)', boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 800, color: textColor, fontFamily: "'Outfit',sans-serif", letterSpacing: '-0.03em', marginBottom: '1.25rem', lineHeight: 1.1 }}>
              {T.title} <span style={{ color: '#22C55E' }}>{T.accent}</span>
            </h2>
            <p style={{ fontSize: '15px', color: textSecond, lineHeight: 1.9, marginBottom: '2rem' }}>{T.text}</p>

            {/* Unit badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {UNITS.map(u => (
                <span key={u.code} style={{
                  background: `${u.color}12`, border: `1px solid ${u.color}30`,
                  color: u.color, padding: '6px 14px', borderRadius: '20px',
                  fontSize: '13px', fontWeight: 600,
                }}>
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
