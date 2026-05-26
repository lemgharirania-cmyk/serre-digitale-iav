// src/components/geoportail/SectionPlan2D.jsx
import { useState } from 'react'

const SERRES = [
  { code:'S01', color:'#22C55E', nameFr:'Génétique & Amélioration', nameEn:'Genetics & Improvement', roleFr:'Sélection variétale, culture in vitro et amélioration génétique des espèces végétales.', roleEn:'Varietal selection, in vitro culture and genetic improvement of plant species.', culturesFr:'Tomate, Piment, Melon', culturesEn:'Tomato, Pepper, Melon' },
  { code:'S02', color:'#06B6D4', nameFr:'Horticulture',             nameEn:'Horticulture',            roleFr:'Production florale, maraîchage sous abri et expérimentations horticoles.', roleEn:'Flower production, greenhouse vegetables and horticultural experiments.', culturesFr:'Roses, Laitue, Fraise', culturesEn:'Roses, Lettuce, Strawberry' },
  { code:'S03', color:'#F59E0B', nameFr:'Agronomie',                nameEn:'Agronomy',                roleFr:'Essais culturaux, comparaisons variétales et recherche appliquée en agronomie.', roleEn:'Crop trials, varietal comparisons and applied agronomy research.', culturesFr:'Blé, Orge, Légumineuses', culturesEn:'Wheat, Barley, Legumes' },
  { code:'S04', color:'#8B5CF6', nameFr:'Hydroponie',               nameEn:'Hydroponics',             roleFr:'Culture hors-sol en systèmes NFT, DWC et aéroponie pour production intensive.', roleEn:'Soilless cultivation in NFT, DWC and aeroponic systems for intensive production.', culturesFr:'Basilic, Tomate, Laitue', culturesEn:'Basil, Tomato, Lettuce' },
  { code:'S05', color:'#EF4444', nameFr:'Protection des Plantes',   nameEn:'Plant Protection',        roleFr:'Phytopathologie, entomologie et méthodes de lutte intégrée.', roleEn:'Phytopathology, entomology and integrated pest management methods.', culturesFr:'Plants test, Cultures témoin', culturesEn:'Test plants, Control cultures' },
]

const PARAM_INFO = {
  temperature: { labelFr:'Température', labelEn:'Temperature', unit:'°C', color:'#F59E0B' },
  humidite:    { labelFr:'Humidité',    labelEn:'Humidity',    unit:'%',  color:'#06B6D4' },
  vpd:         { labelFr:'VPD',         labelEn:'VPD',         unit:'kPa',color:'#8B5CF6' },
  ph:          { labelFr:'pH',          labelEn:'pH',          unit:'',   color:'#06B6D4' },
  ec:          { labelFr:'EC',          labelEn:'EC',          unit:'mS/cm',color:'#22C55E' },
  temp_eau:    { labelFr:'T° Eau',      labelEn:'Water Temp',  unit:'°C', color:'#F59E0B' },
}

export default function SectionPlan2D({ lang, liveData, darkMode }) {
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('info')

  const cardBg     = darkMode ? 'rgba(16,27,46,0.8)' : '#FFFFFF'
  const cardBorder = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const textColor  = darkMode ? '#F8FAFC' : '#0F172A'
  const textSecond = darkMode ? '#CBD5E1' : '#475569'
  const mutedColor = darkMode ? '#64748B' : '#94A3B8'

  const info = selected ? SERRES.find(s => s.code === selected) : null
  const live = liveData?.find(d => d.code === selected)

  const T = {
    badge:     lang === 'fr' ? 'Plan 2D Interactif · AgroBioTech' : 'Interactive 2D Plan · AgroBioTech',
    select:    lang === 'fr' ? 'Sélectionnez une serre pour afficher ses informations' : 'Select a greenhouse to display its information',
    tabInfo:   lang === 'fr' ? 'Informations' : 'Information',
    tabData:   lang === 'fr' ? 'Données live' : 'Live data',
    role:      lang === 'fr' ? 'Rôle' : 'Role',
    crops:     lang === 'fr' ? 'Cultures principales' : 'Main crops',
    noData:    lang === 'fr' ? 'Données non disponibles' : 'Data unavailable',
    planNote:  lang === 'fr' ? 'Plan 2D interactif à intégrer — cliquez sur une serre pour afficher ses données' : 'Interactive 2D plan to be integrated — click on a greenhouse to display its data',
  }

  return (
    <section id="plan2d" style={{ padding: '5rem 3rem', scrollMarginTop: '64px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: darkMode ? 'rgba(6,182,212,0.08)' : 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '100px', padding: '6px 18px', marginBottom: '1rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06B6D4' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#06B6D4', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{T.badge}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
          {/* Left — plan */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '24px', overflow: 'hidden', backdropFilter: 'blur(16px)', boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)' }}>
            {/* Plan placeholder */}
            <div style={{
              minHeight: '400px', padding: '2rem',
              background: darkMode ? 'linear-gradient(135deg,#060d14,#0a1628)' : 'linear-gradient(135deg,#ECF3EE,#F4F7F5)',
              backgroundImage: `linear-gradient(${darkMode ? 'rgba(34,197,94,0.04)' : 'rgba(34,197,94,0.05)'} 1px,transparent 1px),linear-gradient(90deg,${darkMode ? 'rgba(34,197,94,0.04)' : 'rgba(34,197,94,0.05)'} 1px,transparent 1px)`,
              backgroundSize: '40px 40px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px',
            }}>
              <div style={{ fontSize: '14px', color: mutedColor, textAlign: 'center', maxWidth: '360px', lineHeight: 1.7 }}>{T.planNote}</div>
              {/* Clickable serre buttons as placeholder */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {SERRES.map(s => (
                  <div key={s.code} onClick={() => { setSelected(s.code); setTab('info') }} style={{
                    background: selected === s.code ? `${s.color}20` : (darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
                    border: `2px solid ${selected === s.code ? s.color : cardBorder}`,
                    borderRadius: '14px', padding: '16px 20px', cursor: 'pointer',
                    transition: 'all 0.3s', textAlign: 'center', minWidth: '110px',
                    boxShadow: selected === s.code ? `0 0 20px ${s.color}25` : 'none',
                    transform: selected === s.code ? 'translateY(-2px)' : 'none',
                  }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color, margin: '0 auto 8px', boxShadow: selected === s.code ? `0 0 10px ${s.color}` : 'none' }} />
                    <div style={{ fontSize: '12px', fontWeight: 700, color: selected === s.code ? s.color : mutedColor }}>{s.code}</div>
                    <div style={{ fontSize: '11px', color: mutedColor, marginTop: '3px' }}>
                      {lang === 'fr' ? s.nameFr.split('&')[0].trim() : s.nameEn.split('&')[0].trim()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — info panel */}
          <div style={{
            background: cardBg,
            border: `1px solid ${info ? info.color + '30' : cardBorder}`,
            borderRadius: '24px', overflow: 'hidden', backdropFilter: 'blur(16px)',
            boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)',
            transition: 'border-color 0.4s',
            minHeight: '300px',
          }}>
            {!selected ? (
              <div style={{ padding: '3rem 2rem', textAlign: 'center', color: mutedColor, fontSize: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={mutedColor} strokeWidth="1.5"><path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0z"/></svg>
                </div>
                {T.select}
              </div>
            ) : (
              <>
                {info && <div style={{ height: '4px', background: `linear-gradient(90deg, ${info.color}, transparent)` }} />}
                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: `1px solid ${cardBorder}` }}>
                  {['info','data'].map(t => (
                    <button key={t} onClick={() => setTab(t)} style={{
                      flex: 1, padding: '14px 10px', fontSize: '13px', fontWeight: 600,
                      background: tab === t ? `${info?.color}10` : 'transparent',
                      color: tab === t ? info?.color : mutedColor,
                      border: 'none', borderBottom: `2px solid ${tab === t ? info?.color : 'transparent'}`,
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                    }}>{t === 'info' ? T.tabInfo : T.tabData}</button>
                  ))}
                </div>

                {tab === 'info' ? (
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: info?.color, boxShadow: `0 0 8px ${info?.color}` }} />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: info?.color, letterSpacing: '0.06em' }}>{info?.code}</span>
                    </div>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: textColor, marginBottom: '1rem', fontFamily: "'Outfit',sans-serif" }}>
                      {lang === 'fr' ? info?.nameFr : info?.nameEn}
                    </h3>
                    <p style={{ fontSize: '13px', color: textSecond, lineHeight: 1.8, marginBottom: '1.25rem' }}>
                      {lang === 'fr' ? info?.roleFr : info?.roleEn}
                    </p>
                    <div style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', border: `1px solid ${cardBorder}`, borderRadius: '10px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: mutedColor }}>{T.crops}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: info?.color }}>
                        {lang === 'fr' ? info?.culturesFr : info?.culturesEn}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '1.5rem' }}>
                    {live ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {Object.entries(PARAM_INFO).map(([k, p]) => {
                          const v = k.startsWith('ph') || k === 'ec' || k === 'temp_eau' ? live.irr?.[k] : live.env?.[k]
                          return (
                            <div key={k} style={{ background: `${p.color}10`, border: `1px solid ${p.color}25`, borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                              <div style={{ fontSize: '11px', color: mutedColor, marginBottom: '4px' }}>
                                {lang === 'fr' ? p.labelFr : p.labelEn}
                              </div>
                              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: v != null ? p.color : mutedColor, fontFamily: "'Outfit',sans-serif" }}>
                                {v != null ? `${v}${p.unit}` : '—'}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', color: mutedColor, fontSize: '13px', padding: '2rem' }}>{T.noData}</div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
