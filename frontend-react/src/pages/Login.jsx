// src/pages/Login.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../api/client'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const navigate = useNavigate()

  async function handleLogin() {
    if (!email || !password) { setError('Veuillez remplir tous les champs.'); return }
    setLoading(true)
    setError('')
    try {
      const { ok, data } = await authAPI.login(email, password)
      if (!ok) { setError(data.detail || 'Email ou mot de passe incorrect.'); return }
      localStorage.setItem('sdi_token', data.access_token)
      localStorage.setItem('sdi_user', JSON.stringify(data.user))
      navigate('/dashboard')
    } catch {
      setError('Impossible de joindre le serveur.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#0a2e1a 0%,#0d4a2a 50%,#064e3b 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        background: 'white', borderRadius: '24px', padding: '2.5rem',
        width: '100%', maxWidth: '420px', boxShadow: '0 24px 80px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg,var(--green-400),var(--green-500))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 3C12 3 5 7 5 13c0 4 3 7 7 7s7-3 7-7c0-6-7-10-7-10z"
                stroke="white" strokeWidth="1.6"/>
              <path d="M12 20V10M9 14l3-2 3 2"
                stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>
            Espace Gérant
          </div>
          <div style={{ fontSize: '13px', color: '#9ca3af' }}>
            Serre Digitale Intelligente · IAV Hassan II
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
            padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {/* Email */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
            Adresse email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="admin@agrobiotech.ma"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb',
              borderRadius: '12px', fontSize: '14px', fontFamily: 'inherit',
              outline: 'none', background: '#f9fafb', color: '#111827'
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
            Mot de passe
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb',
              borderRadius: '12px', fontSize: '14px', fontFamily: 'inherit',
              outline: 'none', background: '#f9fafb', color: '#111827'
            }}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '14px',
            background: 'linear-gradient(135deg,var(--green-400),var(--green-500))',
            color: 'white', border: 'none', borderRadius: '12px',
            fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, transition: 'all 0.2s'
          }}
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '11px', color: '#9ca3af' }}>
          admin@agrobiotech.ma · Admin2024!
        </div>
      </div>
    </div>
  )
}