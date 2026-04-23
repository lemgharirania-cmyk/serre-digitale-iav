// src/components/geoportail/Plan2D.jsx
import { useState } from 'react'

const UNIT_DATA = {
  'genetique':      { name: 'Génétique & Amélioration', type: 'Recherche',      serreCode: 'S01', mId: 'vG3pzqGDsvE' },
  'horticulture':   { name: 'Horticulture',             type: 'Culture',        serreCode: 'S02', mId: 'ewVdkig18XN' },
  'agronomie':      { name: 'Agronomie',                type: 'Culture',        serreCode: 'S03', mId: 'ximB8o6Y7HL' },
  'hydroponie':     { name: 'Hydroponie & Systèmes',    type: 'Culture',        serreCode: 'S04', mId: 'PMVdAWZFaEn' },
  'protection':     { name: 'Protection des Plantes',   type: 'Technique',      serreCode: 'S05', mId: 'nkZ8GQuN2ep' },
  'bloc-protection':{ name: 'Bloc Protection',          type: 'Technique',      serreCode: null,  mId: 'teWd9VjkgAA' },
  'bloc-nord':      { name: 'Bloc Technique Nord',      type: 'Administration', serreCode: null,  mId: null },
  'bloc-sud':       { name: 'Bloc Technique Sud',       type: 'Technique',      serreCode: null,  mId: null },
}

export default function Plan2D({ lang, liveData, onLaunchVisite }) {
  const [selected, setSelected] = useState(null)

  function selectUnit(id) {
    setSelected(id)
  }

  const d = selected ? UNIT_DATA[selected] : null
  const sd = d?.serreCode ? liveData.find(x => x.code === d.serreCode) : null
  const env = sd?.env || {}
  const irr = sd?.irr || {}

  const t = lang === 'fr'
    ? { title: 'Plan 2D du Campus', label: 'Plan Interactif', sub: 'Cliquez sur une unité pour voir ses données capteurs en temps réel et lancer la visite 3D.', select: 'Sélectionnez une zone sur le plan', click: 'Cliquez sur une unité pour voir ses données', info: 'Informations', launch: 'Lancer la visite 3D →', temp: 'Température', hum: 'Humidité', techno: 'Espace technique' }
    : { title: 'Campus 2D Plan', label: 'Interactive Plan', sub: 'Click on a unit to see its real-time sensor data and launch the 3D tour.', select: 'Select a zone on the plan', click: 'Click on a unit to see its data', info: 'Information', launch: 'Launch 3D tour →', temp: 'Temperature', hum: 'Humidity', techno: 'Technical space' }

  const tStatus = env.temperature > 30 || env.temperature < 15
    ? (env.temperature > 30 ? 'alert' : 'warn') : 'ok'

  return (
    <section id="plan" style={{ background: 'white', padding: '5rem 2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '8px' }}>
            {t.label}
          </div>
          <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>{t.title}</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>{t.sub}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>

          {/* SVG Plan */}
          <div style={{
            background: 'linear-gradient(135deg,#f0f8f3,#e8f5ee)', borderRadius: '20px',
            padding: '1.5rem', border: '1px solid #e5e7eb',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <svg viewBox="0 0 800 530" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
              <rect width="800" height="530" fill="#f0f8f3" rx="8"/>

              {/* Bloc Nord */}
              <g style={{ cursor: 'pointer' }} onClick={() => selectUnit('bloc-nord')}>
                <rect x="30" y="30" width="230" height="185" rx="4" fill={selected==='bloc-nord'?"#c5d8f0":"#dde8f5"} stroke="#4aa8d8" strokeWidth="1.5"/>
                <rect x="30" y="30" width="230" height="4" rx="2" fill="#4aa8d8"/>
                <line x1="107" y1="30" x2="107" y2="215" stroke="#4aa8d8" strokeWidth="1" strokeDasharray="4,3"/>
                <line x1="184" y1="30" x2="184" y2="215" stroke="#4aa8d8" strokeWidth="1" strokeDasharray="4,3"/>
                <text x="68" y="118" textAnchor="middle" fontFamily="Outfit,sans-serif" fontSize="9" fill="#3a7090">Local Technique</text>
                <text x="145" y="118" textAnchor="middle" fontFamily="Outfit,sans-serif" fontSize="9" fill="#3a7090">Salle de Commande</text>
                <text x="214" y="118" textAnchor="middle" fontFamily="Outfit,sans-serif" fontSize="9" fill="#3a7090">Administration</text>
                <text x="145" y="208" textAnchor="middle" fontFamily="Outfit,sans-serif" fontSize="10" fontWeight="700" fill="#1a507a">Bloc Technique Nord</text>
              </g>

              {/* Couloir */}
              <rect x="29" y="217" width="230" height="78" rx="3" fill="#e6efe9" stroke="#7aa890" strokeWidth="1.2"/>
              <text x="145" y="260" textAnchor="middle" fontFamily="Outfit,sans-serif" fontSize="9" fill="#4a7a65">Couloir</text>

              {/* Bloc Sud */}
              <g style={{ cursor: 'pointer' }} onClick={() => selectUnit('bloc-sud')}>
                <rect x="30" y="298" width="230" height="185" rx="4" fill={selected==='bloc-sud'?"#c5d8f0":"#dde8f5"} stroke="#4aa8d8" strokeWidth="1.5"/>
                <rect x="30" y="298" width="230" height="4" rx="2" fill="#4aa8d8"/>
                <line x1="107" y1="298" x2="107" y2="483" stroke="#4aa8d8" strokeWidth="1" strokeDasharray="4,3"/>
                <line x1="184" y1="298" x2="184" y2="483" stroke="#4aa8d8" strokeWidth="1" strokeDasharray="4,3"/>
                <text x="68" y="390" textAnchor="middle" fontFamily="Outfit,sans-serif" fontSize="9" fill="#3a7090">Salle de Lavage</text>
                <text x="145" y="390" textAnchor="middle" fontFamily="Outfit,sans-serif" fontSize="9" fill="#3a7090">Fertilisation</text>
                <text x="214" y="390" textAnchor="middle" fontFamily="Outfit,sans-serif" fontSize="9" fill="#3a7090">Salle Préparation</text>
                <text x="145" y="476" textAnchor="middle" fontFamily="Outfit,sans-serif" fontSize="10" fontWeight="700" fill="#1a507a">Bloc Technique Sud</text>
              </g>

              {/* Liaison */}
              <rect x="258" y="240" width="22" height="36" fill="#e8a830"/>

              {/* Couloir Principal */}
              <rect x="280" y="225" width="490" height="65" rx="4" fill="#c8e6d4" stroke="#2a9e5c" strokeWidth="1.5"/>
              <text x="525" y="265" textAnchor="middle" fontFamily="Outfit,sans-serif" fontSize="11" fontWeight="700" fill="#155c32">Couloir Principal — Hub Central</text>

              {/* Génétique U1 */}
              <g style={{ cursor: 'pointer' }} onClick={() => selectUnit('genetique')}>
                <rect x="280" y="40" width="158" height="183" rx="4" fill={selected==='genetique'?"rgba(42,158,92,0.25)":"rgba(42,158,92,0.12)"} stroke="#2a9e5c" strokeWidth={selected==='genetique'?2.5:1.8}/>
                <rect x="280" y="40" width="158" height="5" rx="2" fill="#2a9e5c"/>
                <line x1="313" y1="50" x2="318" y2="218" stroke="rgba(42,158,92,0.08)" strokeWidth="8"/>
                <line x1="341" y1="50" x2="346" y2="218" stroke="rgba(42,158,92,0.08)" strokeWidth="8"/>
                <line x1="369" y1="50" x2="374" y2="218" stroke="rgba(42,158,92,0.08)" strokeWidth="8"/>
                <text x="359" y="116" textAnchor="middle" fontFamily="Outfit,sans-serif" fontSize="11" fontWeight="700" fill="#155c32">{'Génétique &'}</text>
                <text x="359" y="131" textAnchor="middle" fontFamily="Outfit,sans-serif" fontSize="11" fontWeight="700" fill="#155c32">{'Amélioration'}</text>
                <text x="359" y="216" textAnchor="middle" fontFamily="Outfit,sans-serif" fontSize="9" fill="#5aaa78">{'Unité 1'}</text>
              </g>
              <rect x="340" y="220" width="36" height="8" rx="2" fill="#e8a830"/>

              {/* Horticulture U2 */}
              <g style={{ cursor: 'pointer' }} onClick={() => selectUnit('horticulture')}>
                <rect x="448" y="40" width="155" height="183" rx="4" fill={selected==='horticulture'?"rgba(74,168,216,0.25)":"rgba(74,168,216,0.1)"} stroke="#4aa8d8" strokeWidth={selected==='horticulture'?2.5:1.8}/>
                <rect x="448" y="40" width="155" height="5" rx="2" fill="#4aa8d8"/>
                <line x1="481" y1="50" x2="486" y2="218" stroke="rgba(74,168,216,0.08)" strokeWidth="8"/>
                <line x1="509" y1="50" x2="514" y2="218" stroke="rgba(74,168,216,0.08)" strokeWidth="8"/>
                <text x="525" y="126" textAnchor="middle" fontFamily="Outfit,sans-serif" fontSize="12" fontWeight="700" fill="#1a507a">Horticulture</text>
                <text x="525" y="216" textAnchor="middle" fontFamily="Outfit,sans-serif" fontSize="9" fill="#4a90b0">Unité 2</text>
              </g>
              <rect x="506" y="220" width="36" height="8" rx="2" fill="#e8a830"/>

              {/* Agronomie U3 */}
              <g style={{ cursor: 'pointer' }} onClick={() => selectUnit('agronomie')}>
                <rect x="614" y="40" width="156" height="183" rx="4" fill={selected==='agronomie'?"rgba(106,170,128,0.28)":"rgba(106,170,128,0.12)"} stroke="#5aaa78" strokeWidth={selected==='agronomie'?2.5:1.8}/>
                <rect x="614" y="40" width="156" height="5" rx="2" fill="#5aaa78"/>
                <line x1="647" y1="50" x2="652" y2="218" stroke="rgba(90,170,120,0.08)" strokeWidth="8"/>
                <line x1="675" y1="50" x2="680" y2="218" stroke="rgba(90,170,120,0.08)" strokeWidth="8"/>
                <text x="692" y="126" textAnchor="middle" fontFamily="Outfit,sans-serif" fontSize="12" fontWeight="700" fill="#2a6040">Agronomie</text>
                <text x="692" y="216" textAnchor="middle" fontFamily="Outfit,sans-serif" fontSize="9" fill="#5aaa78">Unité 3</text>
              </g>
              <rect x="672" y="220" width="36" height="8" rx="2" fill="#e8a830"/>

              {/* Bloc Protection */}
              <g style={{ cursor: 'pointer' }} onClick={() => selectUnit('bloc-protection')}>
                <rect x="280" y="293" width="155" height="198" rx="4" fill={selected==='bloc-protection'?"rgba(180,210,185,0.4)":"rgba(180,210,185,0.2)"} stroke="#6aaa80" strokeWidth="1.8"/>
                <rect x="280" y="293" width="155" height="5" rx="2" fill="#6aaa80"/>
                <text x="357" y="390" textAnchor="middle" fontFamily="Outfit,sans-serif" fontSize="10" fontWeight="700" fill="#2a6040">Bloc Protection</text>
              </g>

              {/* Protection U5 */}
              <g style={{ cursor: 'pointer' }} onClick={() => selectUnit('protection')}>
                <rect x="446" y="293" width="155" height="198" rx="4" fill={selected==='protection'?"rgba(42,158,92,0.25)":"rgba(42,158,92,0.1)"} stroke="#2a9e5c" strokeWidth={selected==='protection'?2.5:1.8}/>
                <rect x="446" y="293" width="155" height="5" rx="2" fill="#2a9e5c"/>
                <line x1="479" y1="303" x2="484" y2="486" stroke="rgba(42,158,92,0.08)" strokeWidth="8"/>
                <line x1="507" y1="303" x2="512" y2="486" stroke="rgba(42,158,92,0.08)" strokeWidth="8"/>
                <text x="523" y="385" textAnchor="middle" fontFamily="Outfit,sans-serif" fontSize="11" fontWeight="700" fill="#155c32">Protection</text>
                <text x="523" y="400" textAnchor="middle" fontFamily="Outfit,sans-serif" fontSize="11" fontWeight="700" fill="#155c32">des Plantes</text>
                <text x="523" y="478" textAnchor="middle" fontFamily="Outfit,sans-serif" fontSize="9" fill="#5aaa78">Unité 5</text>
              </g>

              {/* Hydroponie U4 */}
              <g style={{ cursor: 'pointer' }} onClick={() => selectUnit('hydroponie')}>
                <rect x="612" y="293" width="158" height="198" rx="4" fill={selected==='hydroponie'?"rgba(74,168,216,0.25)":"rgba(74,168,216,0.1)"} stroke="#4aa8d8" strokeWidth={selected==='hydroponie'?2.5:1.8}/>
                <rect x="612" y="293" width="158" height="5" rx="2" fill="#4aa8d8"/>
                <line x1="645" y1="303" x2="650" y2="486" stroke="rgba(74,168,216,0.08)" strokeWidth="8"/>
                <line x1="673" y1="303" x2="678" y2="486" stroke="rgba(74,168,216,0.08)" strokeWidth="8"/>
                <text x="691" y="380" textAnchor="middle" fontFamily="Outfit,sans-serif" fontSize="10" fontWeight="700" fill="#1a507a">Hydroponie &amp;</text>
                <text x="691" y="395" textAnchor="middle" fontFamily="Outfit,sans-serif" fontSize="10" fontWeight="700" fill="#1a507a">{'Systèmes Innovants'}</text>
                <text x="691" y="478" textAnchor="middle" fontFamily="Outfit,sans-serif" fontSize="9" fill="#4a90b0">Unité 4</text>
              </g>
              <rect x="670" y="283" width="36" height="12" rx="2" fill="#e8a830"/>

              {/* Légende */}
              <rect x="30" y="505" width="11" height="8" rx="2" fill="rgba(42,158,92,0.2)" stroke="#2a9e5c" strokeWidth="1.2"/>
              <text x="46" y="513" fontFamily="Outfit,sans-serif" fontSize="9" fill="#5aaa78">Serre</text>
              <rect x="90" y="505" width="11" height="8" rx="2" fill="rgba(74,168,216,0.2)" stroke="#4aa8d8" strokeWidth="1.2"/>
              <text x="106" y="513" fontFamily="Outfit,sans-serif" fontSize="9" fill="#4a90b0">Bloc Tech.</text>
              <rect x="178" y="505" width="11" height="8" rx="2" fill="#e8a830"/>
              <text x="194" y="513" fontFamily="Outfit,sans-serif" fontSize="9" fill="#a07820">Entrée</text>
              <text x="30" y="527" fontFamily="Outfit,sans-serif" fontSize="8.5" fill="#aac4b0">{'← Cliquez sur une zone pour afficher les données →'}</text>
            </svg>
          </div>

          {/* Info panel */}
          <div style={{ background: '#f9fafb', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ background: '#f0fdf4', padding: '16px 18px', borderBottom: '1px solid #dcfce7' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#15803d' }}>{t.info}</div>
              <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px' }}>{t.select}</div>
            </div>

            <div style={{ padding: '18px' }}>
              {!selected ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#9ca3af' }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.35, marginBottom: '10px' }}>
                    <path d="M3 6 9 4l6 2 6-2v14l-6 2-6-2-6 2V6z"/><path d="M9 4v16M15 6v16"/>
                  </svg>
                  <div style={{ fontSize: '13px', lineHeight: 1.6 }}>{t.click}</div>
                </div>
              ) : (
                <div>
                  {/* Unit header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '12px',
                      background: '#f0fdf4', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', border: '1px solid #dcfce7', color: '#16a34a'
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M12 3C12 3 5 7 5 13c0 4 3 7 7 7s7-3 7-7c0-6-7-10-7-10z"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>{d?.name}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{d?.type}</div>
                    </div>
                  </div>

                  {/* Sensor data */}
                  {d?.serreCode && sd ? (
                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: '12px' }}>
                      <div style={{ padding: '8px 12px', background: '#f0fdf4', borderBottom: '1px solid #dcfce7', fontSize: '11px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                        Capteurs live
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                        {[
                          { lbl: t.temp, val: env.temperature != null ? `${env.temperature}°C` : '—', color: tStatus === 'ok' ? '#16a34a' : tStatus === 'warn' ? '#d97706' : '#dc2626' },
                          { lbl: t.hum,  val: env.humidite != null ? `${env.humidite}%` : '—', color: '#16a34a' },
                          { lbl: 'pH',   val: irr.ph ?? '—', color: '#2563eb' },
                          { lbl: 'EC',   val: irr.ec != null ? `${irr.ec} mS/cm` : '—', color: '#2563eb' },
                        ].map((s, i) => (
                          <div key={i} style={{
                            padding: '10px 12px',
                            borderBottom: i < 2 ? '1px solid #f3f4f6' : 'none',
                            borderRight: i % 2 === 0 ? '1px solid #f3f4f6' : 'none'
                          }}>
                            <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '3px' }}>{s.lbl}</div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: s.color }}>{s.val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px', fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginBottom: '12px' }}>
                      {t.techno}
                    </div>
                  )}

                  {/* Launch button */}
                  {d?.mId && (
                    <button
                      onClick={() => {
                        document.getElementById('visite')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      style={{
                        display: 'block', width: '100%', padding: '11px',
                        borderRadius: '10px', textAlign: 'center',
                        background: '#16a34a', color: 'white',
                        fontFamily: 'inherit', fontSize: '13.5px', fontWeight: 600,
                        cursor: 'pointer', border: 'none', transition: 'all 0.2s'
                      }}
                    >
                      {t.launch}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}