// src/components/geoportail/AgroBioTech.jsx
import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

const LAT = 33.978659
const LNG = -6.864096

export default function AgroBioTech({ lang }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)

  useEffect(() => {
    if (mapInstance.current) return
    import('leaflet').then(L => {
      const map = L.default.map(mapRef.current, {
        zoomControl: false, attributionControl: false,
        dragging: false, scrollWheelZoom: false
      })
      L.default.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 20 }
      ).addTo(map)
      map.setView([LAT - 0.02, LNG], 13)
      setTimeout(() => map.flyTo([LAT, LNG], 18, { animate: true, duration: 3.5 }), 600)

      const icon = L.default.divIcon({
        className: '',
        html: `<div style="width:22px;height:22px;border-radius:50%;background:#16a34a;border:3px solid white;box-shadow:0 0 0 8px rgba(22,163,74,0.25)"></div>`,
        iconSize: [22, 22], iconAnchor: [11, 11]
      })
      L.default.marker([LAT, LNG], { icon }).addTo(map)
        .bindPopup('<b style="color:#155c32">AgroBioTech · IAV Hassan II</b><br><small>Rabat, Maroc</small>')
      mapInstance.current = map
    })
  }, [])

  const t = lang === 'fr' ? {
    label: 'Campus AgroBioTech · IAV Hassan II',
    title: 'Un campus de recherche agricole',
    accent: 'connecté',
    desc: "Le campus AgroBioTech de l'IAV Hassan II à Rabat abrite 5 serres de recherche connectées, équipées de capteurs IoT, de systèmes d'irrigation intelligents et de scans 3D Matterport.",
    stats: ['Serres de recherche', 'Scans Matterport Pro 2', 'Capteurs IoT actifs', 'Monitoring en continu'],
    units: ['Génétique', 'Horticulture', 'Agronomie', 'Hydroponie', 'Protection'],
    loc: 'AgroBioTech · IAV Hassan II',
  } : {
    label: 'AgroBioTech Campus · IAV Hassan II',
    title: 'A connected agricultural research campus',
    accent: 'connected',
    desc: 'The AgroBioTech campus of IAV Hassan II in Rabat houses 5 connected research greenhouses, equipped with IoT sensors, smart irrigation systems and 3D Matterport scans.',
    stats: ['Research greenhouses', 'Matterport scans', 'Active IoT sensors', 'Continuous monitoring'],
    units: ['Genetics', 'Horticulture', 'Agronomy', 'Hydroponics', 'Protection'],
    loc: 'AgroBioTech · IAV Hassan II',
  }

  return (
    <section id="agrobiotech" style={{ background: '#f8faf8', padding: '5rem 2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>

          {/* Left text */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '12px' }}>
              {t.label}
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.6rem)', fontWeight: 800, color: '#111827', marginBottom: '1.25rem', lineHeight: 1.2 }}>
              {t.title} <span style={{ color: '#16a34a' }}>{t.accent}</span>
            </h2>
            <p style={{ fontSize: '15px', color: '#4b5563', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              {t.desc}
            </p>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1.5rem' }}>
              {[
                { val: '5',   lbl: t.stats[0], color: '#16a34a' },
                { val: '15',  lbl: t.stats[1], color: '#16a34a' },
                { val: '10',  lbl: t.stats[2], color: '#2563eb' },
                { val: '24/7',lbl: t.stats[3], color: '#0f766e' },
              ].map((s, i) => (
                <div key={i} style={{
                  background: 'white', border: '1px solid #e5e7eb', borderRadius: '14px',
                  padding: '1rem', borderLeft: `4px solid ${s.color}`
                }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{s.lbl}</div>
                </div>
              ))}
            </div>

            {/* Unit badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {t.units.map((u, i) => (
                <span key={i} style={{
                  background: '#f0fdf4', color: '#15803d', padding: '5px 12px',
                  borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                  border: '1px solid #bbf7d0'
                }}>{u}</span>
              ))}
            </div>
          </div>

          {/* Right map */}
          <div style={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.12)', border: '1px solid #e5e7eb', position: 'relative' }}>
            <div ref={mapRef} style={{ height: '420px', width: '100%' }} />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(transparent,rgba(0,0,0,0.5))',
              padding: '1rem 1.2rem', pointerEvents: 'none'
            }}>
              <div style={{ color: 'white', fontSize: '13px', fontWeight: 600 }}>{t.loc}</div>
              <div style={{ color: 'rgba(255,255,255,.7)', fontSize: '11px' }}>Rabat, Maroc · 33.9787°N 6.8641°W</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}