// src/components/geoportail/Header.jsx
import { Sun, Moon, Globe } from 'lucide-react'

export default function Header({ lang, setLang, darkMode, setDarkMode, t }) {
  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 300,
      height: '64px',
      background: darkMode
        ? 'rgba(7,17,31,0.92)'
        : 'rgba(244,247,245,0.94)',
      backdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`,
      display: 'flex', alignItems: 'center',
      padding: '0 2rem', gap: '1.5rem',
    }}>
      {/* Logo + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
          background: 'linear-gradient(135deg,#16a34a,#06b6d4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 3C12 3 5 7 5 13c0 4 3 7 7 7s7-3 7-7c0-6-7-10-7-10z" stroke="white" strokeWidth="1.8"/>
            <path d="M12 20V10M9 14l3-2 3 2" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: darkMode ? '#F8FAFC' : '#0F172A', fontFamily: "'Outfit',sans-serif", letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Serre Digitale Intelligente
          </div>
          <div style={{ fontSize: '11px', color: darkMode ? '#64748B' : '#94A3B8', lineHeight: 1 }}>
            IAV Hassan II · AgroBioTech
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Live indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e', animation: 'hdrPulse 2s ease-in-out infinite', display: 'inline-block' }} />
        <span style={{ fontSize: '12px', fontWeight: 500, color: darkMode ? '#64748B' : '#94A3B8' }}>Live</span>
      </div>

      {/* Lang toggle */}
      <div style={{
        display: 'flex', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
        borderRadius: '10px', overflow: 'hidden'
      }}>
        {['fr', 'en'].map(l => (
          <button key={l} onClick={() => setLang(l)} style={{
            padding: '7px 14px', fontSize: '12px', fontWeight: 700,
            background: lang === l
              ? (darkMode ? 'rgba(34,197,94,0.18)' : 'rgba(34,197,94,0.12)')
              : 'transparent',
            color: lang === l ? '#22c55e' : (darkMode ? '#64748B' : '#94A3B8'),
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            letterSpacing: '0.06em', transition: 'all 0.2s'
          }}>{l.toUpperCase()}</button>
        ))}
      </div>

      {/* Dark/Light toggle */}
      <button onClick={() => setDarkMode(d => !d)} style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit',
        background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
        color: darkMode ? '#CBD5E1' : '#475569', fontSize: '12px', fontWeight: 600,
        transition: 'all 0.3s'
      }}>
        {darkMode
          ? <><Sun size={14} /> <span>Mode Jour</span></>
          : <><Moon size={14} /> <span>Mode Nuit</span></>
        }
      </button>

      <style>{`@keyframes hdrPulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </header>
  )
}
