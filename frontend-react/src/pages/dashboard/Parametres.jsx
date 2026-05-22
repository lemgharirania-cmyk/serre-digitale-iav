// src/pages/dashboard/Parametres.jsx
import { useState, useEffect } from 'react'
import { Settings, Key, Eye, EyeOff, Save, RefreshCw, Shield } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'https://serre-digitale-iav.onrender.com'

const T = {
  FR: {
    title:       'Paramètres',
    sub:         'Configuration du système',
    inviteTitle: 'Code d\'invitation',
    inviteSub:   'Les nouveaux admins ont besoin de ce code pour créer un compte',
    codeActuel:  'Code actuel',
    nouveauCode: 'Nouveau code',
    placeholder: 'Min. 6 caractères',
    save:        'Enregistrer',
    saving:      'Enregistrement...',
    show:        'Afficher',
    hide:        'Masquer',
    copy:        'Copier',
    copied:      'Copié !',
    successMsg:  'Code mis à jour avec succès !',
    errorMin:    'Le code doit contenir au moins 6 caractères.',
    errorLoad:   'Impossible de charger le code actuel.',
    infoText:    'Partagez ce code uniquement avec les personnes autorisées à créer un compte admin.',
  },
  EN: {
    title:       'Settings',
    sub:         'System configuration',
    inviteTitle: 'Invitation code',
    inviteSub:   'New admins need this code to create an account',
    codeActuel:  'Current code',
    nouveauCode: 'New code',
    placeholder: 'Min. 6 characters',
    save:        'Save',
    saving:      'Saving...',
    show:        'Show',
    hide:        'Hide',
    copy:        'Copy',
    copied:      'Copied!',
    successMsg:  'Code updated successfully!',
    errorMin:    'Code must be at least 6 characters.',
    errorLoad:   'Unable to load current code.',
    infoText:    'Share this code only with people authorized to create an admin account.',
  }
}

export default function Parametres({ theme, lang }) {
  const isDark = theme === 'dark'
  const t      = T[lang] || T.FR

  const [codeActuel,  setCodeActuel]  = useState('...')
  const [nouveauCode, setNouveauCode] = useState('')
  const [showCode,    setShowCode]    = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [toast,       setToast]       = useState({ msg:'', type:'' })
  const [copied,      setCopied]      = useState(false)

  // Couleurs thème
  const cardBg    = isDark ? 'rgba(16,27,46,0.82)' : 'white'
  const border    = isDark ? 'rgba(255,255,255,0.07)' : 'var(--border)'
  const ink       = isDark ? '#F8FAFC' : 'var(--ink)'
  const ink3      = isDark ? '#94A3B8' : 'var(--ink-3)'
  const ink4      = isDark ? '#64748B' : 'var(--ink-4)'
  const inputBg   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(16,48,36,0.03)'
  const inputBdr  = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(16,48,36,0.14)'
  const infoBg    = isDark ? 'rgba(59,130,246,0.07)' : 'rgba(59,130,246,0.05)'
  const infoBdr   = isDark ? 'rgba(59,130,246,0.2)'  : 'rgba(59,130,246,0.15)'

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg:'', type:'' }), 3500)
  }

  // Charger le code actuel
  async function loadCode() {
    setLoading(true)
    try {
      const token = localStorage.getItem('sdi_token')
      const res   = await fetch(`${API}/api/auth/invite-code`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data  = await res.json()
      if (res.ok) setCodeActuel(data.invite_code)
      else        showToast(t.errorLoad, 'error')
    } catch {
      showToast(t.errorLoad, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCode() }, [])

  // Sauvegarder le nouveau code
  async function saveCode() {
    if (nouveauCode.trim().length < 6) {
      showToast(t.errorMin, 'error'); return
    }
    setSaving(true)
    try {
      const token = localStorage.getItem('sdi_token')
      const res   = await fetch(`${API}/api/auth/invite-code`, {
        method:  'PUT',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nouveau_code: nouveauCode.trim() })
      })
      const data = await res.json()
      if (res.ok) {
        setCodeActuel(nouveauCode.trim())
        setNouveauCode('')
        showToast(t.successMsg, 'success')
      } else {
        showToast(data.detail || 'Erreur.', 'error')
      }
    } catch {
      showToast('Impossible de joindre le serveur.', 'error')
    } finally {
      setSaving(false)
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(codeActuel)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inputStyle = {
    width: '100%', height: 42,
    background: inputBg,
    border: `1.5px solid ${inputBdr}`,
    borderRadius: 10, padding: '0 44px 0 14px',
    fontSize: 14, fontFamily: 'JetBrains Mono, monospace',
    color: ink, outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
    letterSpacing: '0.08em',
  }

  return (
    <>
      {/* Top bar */}
      <div className="admin-top">
        <div>
          <h1 style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{
              width:38, height:38, borderRadius:11,
              background: isDark
                ? 'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(59,130,246,0.15))'
                : 'linear-gradient(135deg,rgba(139,92,246,0.12),rgba(59,130,246,0.1))',
              border: `1px solid ${isDark?'rgba(139,92,246,0.3)':'rgba(139,92,246,0.2)'}`,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <Settings size={17} color={isDark?'#A78BFA':'#7c5ccf'} />
            </span>
            {t.title}
          </h1>
          <div className="admin-sub">{t.sub}</div>
        </div>
        <div className="admin-top-r">
          <button
            className="btn btn-secondary btn-sm"
            onClick={loadCode}
            style={{ display:'flex', alignItems:'center', gap:6 }}
          >
            <RefreshCw size={13} />
            {lang === 'FR' ? 'Actualiser' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast.msg && (
        <div style={{
          padding: '12px 18px', borderRadius: 12,
          marginBottom: 16, fontSize: 13, fontWeight: 500,
          background: toast.type === 'success' ? 'var(--green-600)' : '#dc2626',
          color: 'white', transition: 'all 0.3s',
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Code d'invitation ── */}
      <div className="panel" style={{ background:cardBg, borderColor:border, maxWidth:600 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <div style={{
            width:34, height:34, borderRadius:10,
            background: isDark?'rgba(139,92,246,0.15)':'rgba(139,92,246,0.1)',
            border:`1px solid rgba(139,92,246,0.25)`,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <Key size={16} color={isDark?'#A78BFA':'#7c5ccf'} />
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:600, color:ink }}>{t.inviteTitle}</div>
            <div style={{ fontSize:12, color:ink4, marginTop:2 }}>{t.inviteSub}</div>
          </div>
        </div>

        {/* Code actuel */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:12, color:ink3, marginBottom:6, fontWeight:500 }}>
            {t.codeActuel}
          </div>
          <div style={{ position:'relative' }}>
            <input
              type={showCode ? 'text' : 'password'}
              value={loading ? '...' : codeActuel}
              readOnly
              style={{ ...inputStyle, background: isDark?'rgba(139,92,246,0.06)':'rgba(139,92,246,0.04)', paddingRight:90 }}
            />
            {/* Show/hide */}
            <button
              onClick={() => setShowCode(!showCode)}
              style={{
                position:'absolute', right:44, top:'50%', transform:'translateY(-50%)',
                background:'none', border:'none', color:ink4, cursor:'pointer',
                display:'flex', alignItems:'center', padding:4, transition:'color 0.15s',
              }}
            >
              {showCode ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
            {/* Copy */}
            <button
              onClick={copyCode}
              style={{
                position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                background:'none', border:'none',
                color: copied ? (isDark?'#4ADE80':'#2f9a64') : ink4,
                cursor:'pointer', fontSize:11, fontFamily:'Inter,sans-serif',
                padding:'3px 6px', transition:'color 0.15s', fontWeight:500,
              }}
            >
              {copied ? t.copied : t.copy}
            </button>
          </div>
        </div>

        {/* Changer le code */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, color:ink3, marginBottom:6, fontWeight:500 }}>
            {t.nouveauCode}
          </div>
          <div style={{ position:'relative' }}>
            <input
              type={showNew ? 'text' : 'password'}
              value={nouveauCode}
              onChange={e => setNouveauCode(e.target.value)}
              placeholder={t.placeholder}
              onKeyDown={e => e.key === 'Enter' && saveCode()}
              style={{ ...inputStyle }}
              onFocus={e  => { e.target.style.borderColor=isDark?'rgba(139,92,246,0.5)':'rgba(139,92,246,0.4)'; e.target.style.boxShadow='0 0 0 3px rgba(139,92,246,0.1)' }}
              onBlur={e   => { e.target.style.borderColor=inputBdr; e.target.style.boxShadow='none' }}
            />
            <button
              onClick={() => setShowNew(!showNew)}
              style={{
                position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                background:'none', border:'none', color:ink4, cursor:'pointer',
                display:'flex', alignItems:'center', padding:4, transition:'color 0.15s',
              }}
            >
              {showNew ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
        </div>

        {/* Info */}
        <div style={{
          padding:'10px 14px', borderRadius:10, marginBottom:16,
          background:infoBg, border:`1px solid ${infoBdr}`,
          display:'flex', gap:8, alignItems:'flex-start',
          fontSize:12, color:isDark?'#93C5FD':'#3773bd',
        }}>
          <Shield size={13} style={{ flexShrink:0, marginTop:1 }} />
          {t.infoText}
        </div>

        {/* Bouton sauvegarder */}
        <button
          onClick={saveCode}
          disabled={saving || !nouveauCode.trim()}
          style={{
            display:'flex', alignItems:'center', gap:8,
            padding:'11px 20px', borderRadius:12,
            background: nouveauCode.trim()
              ? 'linear-gradient(135deg,#8B5CF6,#3B82F6)'
              : (isDark?'rgba(255,255,255,0.06)':'rgba(16,48,36,0.05)'),
            border:'none', color: nouveauCode.trim() ? 'white' : ink4,
            fontSize:14, fontWeight:600, fontFamily:'Inter,sans-serif',
            cursor: nouveauCode.trim() ? 'pointer' : 'not-allowed',
            opacity: saving ? 0.7 : 1,
            boxShadow: nouveauCode.trim() ? '0 4px 16px rgba(139,92,246,0.3)' : 'none',
            transition:'all 0.2s',
          }}
          onMouseEnter={e => { if(nouveauCode.trim() && !saving) e.currentTarget.style.transform='translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)' }}
        >
          <Save size={15} />
          {saving ? t.saving : t.save}
        </button>
      </div>
    </>
  )
}
