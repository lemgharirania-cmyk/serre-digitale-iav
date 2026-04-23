// src/components/geoportail/Footer.jsx
export default function Footer({ lang }) {
  return (
    <footer style={{
      background: '#f8faf8', borderTop: '1px solid #e5e7eb',
      padding: '3.5rem 2rem 2.5rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr',
          gap: '2rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap'
        }}>
          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: 'linear-gradient(135deg,#16a34a,#14b8a6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 3C12 3 5 7 5 13c0 4 3 7 7 7s7-3 7-7c0-6-7-10-7-10z" stroke="white" strokeWidth="1.6"/>
                <path d="M12 20V10M9 14l3-2 3 2" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>IAV Hassan II</div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>Institut Agronomique et Vétérinaire</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>Rabat, Maroc</div>
            </div>
          </div>

          {/* Center */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
              Serre Digitale Intelligente
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
              Campus AgroBioTech · Géoportail Interactif · Jumeau Numérique
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d',
              fontSize: '11px', fontWeight: 600, padding: '4px 12px',
              borderRadius: '20px', marginTop: '10px'
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2.5"/><polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2.5"/></svg>
              PFE · Ingénieur Géomètre Topographe · 2024–2025
            </div>
          </div>

          {/* Right */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.05em' }}>
              {lang === 'fr' ? 'Réalisé par' : 'Authors'}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>Lemghari Rania</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>Nafia Kaoutar</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>
              {lang === 'fr' ? 'Encadrantes :' : 'Supervisors:'}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Pr. Ait el Kadi Kenza</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Pr. Taimourya Houda</div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: 0 }} />
        <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', paddingTop: '1.25rem' }}>
          © 2025 IAV Hassan II · Campus AgroBioTech · Tous droits réservés
        </div>
      </div>
    </footer>
  )
}