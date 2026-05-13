// src/components/geoportail/FooterGeoportail.jsx
export default function FooterGeoportail({ lang, darkMode }) {
  const bg     = darkMode ? '#04090F' : '#ECF3EE'
  const border = darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'
  const text   = darkMode ? '#F8FAFC' : '#0F172A'
  const muted  = darkMode ? '#64748B' : '#94A3B8'
  const second = darkMode ? '#CBD5E1' : '#475569'

  return (
    <footer style={{ background: bg, borderTop: `1px solid ${border}`, padding: '3rem 3rem 2rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '2rem', alignItems: 'start', marginBottom: '2rem' }}>

          {/* Left — institution */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg,#16a34a,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 3C12 3 5 7 5 13c0 4 3 7 7 7s7-3 7-7c0-6-7-10-7-10z" stroke="white" strokeWidth="1.6"/>
                <path d="M12 20V10M9 14l3-2 3 2" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: text }}>IAV Hassan II</div>
              <div style={{ fontSize: '13px', color: second, marginTop: '2px' }}>
                {lang === 'fr' ? 'Institut Agronomique et Vétérinaire' : 'Agronomic and Veterinary Institute'}
              </div>
              <div style={{ fontSize: '13px', color: muted }}>
                {lang === 'fr' ? 'Rabat, Maroc' : 'Rabat, Morocco'}
              </div>
            </div>
          </div>

          {/* Center */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '17px', fontWeight: 800, color: text, fontFamily: "'Outfit',sans-serif", marginBottom: '5px', letterSpacing: '-0.02em' }}>
              {lang === 'fr' ? 'Serre Digitale Intelligente' : 'Smart Digital Greenhouse'}
            </div>
            <div style={{ fontSize: '13px', color: muted, marginBottom: '12px' }}>
              {lang === 'fr' ? 'Campus AgroBioTech · Géoportail Interactif · Jumeau Numérique' : 'AgroBioTech Campus · Interactive Geoportal · Digital Twin'}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: darkMode ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E', fontSize: '12px', fontWeight: 600, padding: '5px 14px', borderRadius: '20px' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2.5"/><polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2.5"/></svg>
              {lang === 'fr' ? 'PFE · Ingénieur Géomètre Topographe · 2024–2025' : 'Final Year · Surveying Engineer · 2024–2025'}
            </div>
          </div>

          {/* Right — authors */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: muted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {lang === 'fr' ? 'Réalisé par' : 'Authors'}
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: text }}>Lemghari Rania</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: text }}>Nafia Kaoutar</div>
            <div style={{ fontSize: '12px', color: muted, marginTop: '10px' }}>
              {lang === 'fr' ? 'Encadrantes :' : 'Supervisors:'}
            </div>
            <div style={{ fontSize: '13px', color: second }}>Pr. Ait el Kadi Kenza</div>
            <div style={{ fontSize: '13px', color: second }}>Pr. Taimourya Houda</div>
          </div>
        </div>

        <div style={{ height: '1px', background: border }} />
        <div style={{ fontSize: '12px', color: muted, textAlign: 'center', paddingTop: '1.25rem' }}>
          © 2025 IAV Hassan II · Campus AgroBioTech · {lang === 'fr' ? 'Tous droits réservés' : 'All rights reserved'}
        </div>
      </div>
    </footer>
  )
}
