// src/components/layout/Navbar.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Navbar({ lang, setLang }) {
  const [scrolled, setScrolled] = useState(false)

  if (typeof window !== 'undefined') {
    window.onscroll = () => setScrolled(window.scrollY > 50)
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--gray-200)', padding: '0 2rem',
      height: '68px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.08)' : 'none',
      transition: 'all 0.3s'
    }}>
      {/* Brand */}
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '11px',
          background: 'linear-gradient(135deg,#16a34a,#14b8a6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 3C12 3 5 7 5 13c0 4 3 7 7 7s7-3 7-7c0-6-7-10-7-10z" stroke="white" strokeWidth="1.6"/>
            <path d="M12 20V10M9 14l3-2 3 2" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#15803d', lineHeight: 1.2 }}>
            Serre Digitale Intelligente
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>IAV Hassan II · AgroBioTech</div>
        </div>
      </a>

      {/* Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {[
          { href: '#agrobiotech', fr: 'Campus', en: 'Campus' },
          { href: '#plan',        fr: 'Plan 2D', en: '2D Plan' },
          { href: '#visite',      fr: 'Visite 3D', en: '3D Tour' },
          { href: '#donnees',     fr: 'Données', en: 'Data' },
        ].map(l => (
          <a key={l.href} href={l.href} style={{
            fontSize: '13px', fontWeight: 500, color: '#4b5563',
            textDecoration: 'none', padding: '6px 14px', borderRadius: '8px'
          }}>
            {lang === 'fr' ? l.fr : l.en}
          </a>
        ))}
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
          {['fr', 'en'].map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              padding: '5px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              background: lang === l ? '#16a34a' : 'none', color: lang === l ? 'white' : '#9ca3af',
              border: 'none', fontFamily: 'inherit'
            }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <Link to="/dashboard" style={{
          background: '#16a34a', color: 'white', padding: '8px 18px',
          borderRadius: '10px', fontSize: '13px', fontWeight: 600, textDecoration: 'none'
        }}>
          {lang === 'fr' ? 'Espace Gérant' : 'Manager'}
        </Link>
      </div>
    </nav>
  )
}