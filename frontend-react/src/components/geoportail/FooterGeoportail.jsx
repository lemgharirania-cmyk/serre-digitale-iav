// src/components/geoportail/FooterGeoportail.jsx
export default function FooterGeoportail({ lang, darkMode }) {
  const bg      = darkMode ? '#07111F' : '#f8faf8'
  const border  = darkMode ? 'rgba(255,255,255,0.07)' : '#e5e7eb'
  const ink     = darkMode ? '#F8FAFC' : '#111827'
  const ink2    = darkMode ? '#94A3B8' : '#6b7280'
  const ink3    = darkMode ? '#64748B' : '#9ca3af'
  const badgeBg = darkMode ? 'rgba(34,197,94,0.1)' : '#f0fdf4'
  const badgeBd = darkMode ? 'rgba(34,197,94,0.25)' : '#bbf7d0'
  const badgeCl = darkMode ? '#4ADE80' : '#15803d'

  return (
    <footer style={{
      background: bg,
      borderTop: `1px solid ${border}`,
      padding: '3.5rem 2rem 2.5rem',
      transition: 'background 0.4s ease',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr',
          gap: '2rem', alignItems: 'center', marginBottom: '2rem',
        }}>

          {/* ── Left — IAV Logo ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px',
              overflow: 'hidden', flexShrink: 0,
              background: 'white',
              boxShadow: darkMode
                ? '0 0 20px rgba(34,197,94,0.15), 0 4px 12px rgba(0,0,0,0.3)'
                : '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.06)'
              e.currentTarget.style.boxShadow = '0 0 24px rgba(34,197,94,0.3), 0 8px 20px rgba(0,0,0,0.2)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = darkMode
                ? '0 0 20px rgba(34,197,94,0.15), 0 4px 12px rgba(0,0,0,0.3)'
                : '0 4px 12px rgba(0,0,0,0.1)'
            }}
            >
              <img
                src="/iav_logo.png"
                alt="IAV Hassan II"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: ink }}>
                IAV Hassan II
              </div>
              <div style={{ fontSize: '12px', color: ink3, marginTop: '2px' }}>
                Institut Agronomique et Vétérinaire
              </div>
              <div style={{ fontSize: '12px', color: ink3 }}>Rabat, Maroc</div>
            </div>
          </div>

          {/* ── Center ── */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: ink, marginBottom: '4px' }}>
              Serre Digitale Intelligente
            </div>
            <div style={{ fontSize: '12px', color: ink3 }}>
              Campus AgroBioTech · Géoportail Interactif · Jumeau Numérique
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: badgeBg, border: `1px solid ${badgeBd}`, color: badgeCl,
              fontSize: '11px', fontWeight: 600, padding: '4px 12px',
              borderRadius: '20px', marginTop: '10px',
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2.5"/>
                <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2.5"/>
              </svg>
              PFE · Ingénieur Géomètre Topographe · 2024–2025
            </div>
          </div>

          {/* ── Right ── */}
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '12px', fontWeight: 600, color: ink2, marginBottom: '8px',
              textTransform: 'uppercase', letterSpacing: '.05em',
            }}>
              {lang === 'fr' ? 'Réalisé par' : 'Authors'}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: ink }}>Lemghari Rania</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: ink }}>Nafia Kaoutar</div>
            <div style={{ fontSize: '11px', color: ink3, marginTop: '8px' }}>
              {lang === 'fr' ? 'Encadrantes :' : 'Supervisors:'}
            </div>
            <div style={{ fontSize: '12px', color: ink2 }}>Pr. Ait el Kadi Kenza</div>
            <div style={{ fontSize: '12px', color: ink2 }}>Pr. Taimourya Houda</div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: `1px solid ${border}`, margin: 0 }} />
        <div style={{
          fontSize: '11px', color: ink3,
          textAlign: 'center', paddingTop: '1.25rem',
        }}>
          © 2025 IAV Hassan II · Campus AgroBioTech · Tous droits réservés
        </div>
      </div>
    </footer>
  )
}
