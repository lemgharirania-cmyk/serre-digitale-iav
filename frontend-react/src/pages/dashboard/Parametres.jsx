// src/pages/dashboard/Parametres.jsx
import { useState, useEffect, useRef } from 'react'
import {
  Settings, Key, Eye, EyeOff, Save, RefreshCw, Shield,
  User, Lock, Bell, BellOff, Camera, Trash2, Check, X,
  Pencil, Mail, Building2, IdCard, UserCircle,
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'https://serre-digitale-iav.onrender.com'

const T = {
  FR: {
    title: 'Paramètres', sub: 'Gérez votre profil et la configuration du système',
    secProfil: 'Mon profil', secPassword: 'Sécurité',
    secNotif: 'Notifications', secSystem: 'Système',
    nom: 'Nom complet', email: 'Adresse email',
    unit: 'Unité / Serre', role: 'Rôle',
    photoChange: 'Changer la photo', photoDelete: 'Supprimer',
    photoHint: 'JPG, PNG — max 1MB',
    saveProfil: 'Enregistrer', saving: 'Enregistrement...',
    edit: 'Modifier', cancel: 'Annuler',
    ancienMdp: 'Mot de passe actuel', nouveauMdp: 'Nouveau mot de passe',
    confirmMdp: 'Confirmer le nouveau mot de passe',
    savePassword: 'Changer le mot de passe',
    errConfirm: 'Les mots de passe ne correspondent pas.',
    errMin: 'Minimum 6 caractères.',
    errSame: 'Le nouveau mot de passe doit être différent.',
    alertesTitle: 'Alertes email de monitoring',
    alertesSub: 'Recevoir un email quand un capteur dépasse ses seuils',
    alertesOn: 'Activées', alertesOff: 'Désactivées',
    saveNotif: 'Enregistrer les préférences',
    inviteTitle: 'Code d\'invitation',
    inviteSub: 'Requis pour créer un nouveau compte admin',
    codeActuel: 'Code actuel', nouveauCode: 'Nouveau code',
    placeholder: 'Min. 6 caractères',
    infoText: 'Partagez ce code uniquement avec les personnes autorisées.',
    refresh: 'Actualiser',
    success: 'Modifications enregistrées !',
    error: 'Une erreur est survenue.',
    nonEditable: 'Non modifiable',
  },
  EN: {
    title: 'Settings', sub: 'Manage your profile and system configuration',
    secProfil: 'My profile', secPassword: 'Security',
    secNotif: 'Notifications', secSystem: 'System',
    nom: 'Full name', email: 'Email address',
    unit: 'Unit / Greenhouse', role: 'Role',
    photoChange: 'Change photo', photoDelete: 'Remove',
    photoHint: 'JPG, PNG — max 1MB',
    saveProfil: 'Save', saving: 'Saving...',
    edit: 'Edit', cancel: 'Cancel',
    ancienMdp: 'Current password', nouveauMdp: 'New password',
    confirmMdp: 'Confirm new password',
    savePassword: 'Change password',
    errConfirm: 'Passwords do not match.',
    errMin: 'Minimum 6 characters.',
    errSame: 'New password must be different.',
    alertesTitle: 'Monitoring email alerts',
    alertesSub: 'Receive an email when a sensor exceeds its thresholds',
    alertesOn: 'Enabled', alertesOff: 'Disabled',
    saveNotif: 'Save preferences',
    inviteTitle: 'Invitation code',
    inviteSub: 'Required to create a new admin account',
    codeActuel: 'Current code', nouveauCode: 'New code',
    placeholder: 'Min. 6 characters',
    infoText: 'Share this code only with authorized people.',
    refresh: 'Refresh',
    success: 'Changes saved!',
    error: 'An error occurred.',
    nonEditable: 'Not editable',
  }
}

function getToken() { return localStorage.getItem('sdi_token') }
function authH() { return { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' } }

// ── Toast ──────────────────────────────────────────────────
function Toast({ msg, type }) {
  if (!msg) return null
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: type === 'success' ? '#16a34a' : '#dc2626',
      color: 'white', borderRadius: 12, padding: '12px 18px',
      display: 'flex', alignItems: 'center', gap: 8,
      fontSize: 13, fontWeight: 600,
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      fontFamily: "'Manrope',system-ui,sans-serif",
      animation: 'fadeInUp 0.25s ease',
    }}>
      {type === 'success' ? <Check size={15} /> : <X size={15} />}
      {msg}
    </div>
  )
}

// ── Section Card ───────────────────────────────────────────
function SectionCard({ title, icon: Icon, iconColor, iconBg, children, isDark, border, cardBg }) {
  return (
    <div style={{
      background: cardBg, border: `1px solid ${border}`,
      borderRadius: 18, padding: '24px', marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 11, flexShrink: 0,
          background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={17} color={iconColor} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: isDark ? '#F1F5F9' : '#0F172A' }}>
          {title}
        </div>
      </div>
      {children}
    </div>
  )
}

// ── Info Row (display mode) ────────────────────────────────
function InfoRow({ label, value, icon: Icon, editable, onEdit, isDark, t }) {
  const ink  = isDark ? '#F1F5F9' : '#0F172A'
  const ink3 = isDark ? '#94A3B8' : '#64748B'
  const ink4 = isDark ? '#475569' : '#94A3B8'
  const rowBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', borderRadius: 12, marginBottom: 8,
      background: rowBg, border: `1px solid ${border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
        {Icon && (
          <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={14} color={ink4} />
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, color: ink4, fontWeight: 600, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
          <div style={{ fontSize: 14, color: ink, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || '—'}</div>
        </div>
      </div>
      {editable ? (
        <button onClick={onEdit} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px', borderRadius: 8, border: `1px solid ${border}`,
          background: 'transparent', cursor: 'pointer', flexShrink: 0,
          color: ink3, fontSize: 11, fontWeight: 600,
          fontFamily: "'Manrope',sans-serif", transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.08)'; e.currentTarget.style.color = '#22C55E'; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = ink3; e.currentTarget.style.borderColor = border }}
        >
          <Pencil size={11} /> {t.edit}
        </button>
      ) : (
        <span style={{ fontSize: 10, color: ink4, fontStyle: 'italic', flexShrink: 0 }}>{t.nonEditable}</span>
      )}
    </div>
  )
}

// ── Edit Field ─────────────────────────────────────────────
function EditField({ label, value, onChange, onSave, onCancel, saving, isDark, t }) {
  const inputBg  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(34,197,94,0.04)'
  const inputBdr = isDark ? 'rgba(34,197,94,0.4)' : 'rgba(34,197,94,0.35)'
  const ink      = isDark ? '#F8FAFC' : '#0F172A'
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel() }}
          autoFocus
          style={{
            flex: 1, height: 40, background: inputBg,
            border: `1.5px solid ${inputBdr}`,
            borderRadius: 10, padding: '0 14px',
            fontSize: 14, color: ink, outline: 'none',
            fontFamily: "'Manrope',system-ui,sans-serif",
            boxShadow: '0 0 0 3px rgba(34,197,94,0.08)',
          }}
        />
        <button onClick={onSave} disabled={saving} style={{
          height: 40, padding: '0 14px', borderRadius: 10, border: 'none',
          background: '#22C55E', color: 'white', cursor: saving ? 'not-allowed' : 'pointer',
          fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: "'Manrope',sans-serif", opacity: saving ? 0.7 : 1,
        }}>
          <Check size={13} /> {saving ? t.saving : t.saveProfil}
        </button>
        <button onClick={onCancel} style={{
          height: 40, padding: '0 12px', borderRadius: 10,
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          background: 'transparent', cursor: 'pointer', fontSize: 12,
          color: isDark ? '#94A3B8' : '#64748B',
          display: 'flex', alignItems: 'center', gap: 5,
          fontFamily: "'Manrope',sans-serif",
        }}>
          <X size={13} /> {t.cancel}
        </button>
      </div>
    </div>
  )
}

// ── Password Field ─────────────────────────────────────────
function PassField({ label, value, onChange, isDark }) {
  const [show, setShow] = useState(false)
  const inputBg  = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(16,48,36,0.03)'
  const inputBdr = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(16,48,36,0.14)'
  const ink      = isDark ? '#F8FAFC' : '#0F172A'
  const ink3     = isDark ? '#94A3B8' : '#64748B'
  const ink4     = isDark ? '#475569' : '#94A3B8'
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: ink3, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%', height: 42, boxSizing: 'border-box',
            background: inputBg, border: `1.5px solid ${inputBdr}`,
            borderRadius: 10, padding: '0 44px 0 14px',
            fontSize: 14, color: ink, outline: 'none',
            fontFamily: 'JetBrains Mono, monospace',
          }}
          onFocus={e => { e.target.style.borderColor = isDark ? 'rgba(34,197,94,0.5)' : 'rgba(34,197,94,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.08)' }}
          onBlur={e  => { e.target.style.borderColor = inputBdr; e.target.style.boxShadow = 'none' }}
        />
        <button onClick={() => setShow(s => !s)} style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: show ? '#22C55E' : ink4, display: 'flex', alignItems: 'center',
        }}>
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────
export default function Parametres({ theme, lang }) {
  const isDark = theme === 'dark'
  const t      = T[lang] || T.FR
  const cardBg = isDark ? 'rgba(16,27,46,0.82)' : 'white'
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'
  const ink4   = isDark ? '#475569' : '#94A3B8'

  const [toast,   setToast]   = useState({ msg: '', type: '' })
  const [profil,  setProfil]  = useState(null)
  const [loading, setLoading] = useState(true)
  const fileRef = useRef()

  // Edit states
  const [editingNom, setEditingNom] = useState(false)
  const [nomDraft,   setNomDraft]   = useState('')
  const [savingNom,  setSavingNom]  = useState(false)
  const [photo,      setPhoto]      = useState(null)
  const [savingPhoto, setSavingPhoto] = useState(false)

  // Password
  const [ancienMdp,  setAncienMdp]  = useState('')
  const [nouveauMdp, setNouveauMdp] = useState('')
  const [confirmMdp, setConfirmMdp] = useState('')
  const [savingPass, setSavingPass] = useState(false)
  const [passErr,    setPassErr]    = useState('')

  // Notifications
  const [alertesEmail, setAlertesEmail] = useState(true)
  const [savingNotif,  setSavingNotif]  = useState(false)

  // Invite code
  const [codeActuel,  setCodeActuel]  = useState('')
  const [nouveauCode, setNouveauCode] = useState('')
  const [showCode,    setShowCode]    = useState(false)
  const [savingCode,  setSavingCode]  = useState(false)
  const [loadingCode, setLoadingCode] = useState(true)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: '' }), 3500)
  }

  async function loadProfil() {
    setLoading(true)
    try {
      const res  = await fetch(`${API}/api/profil/me`, { headers: authH() })
      const data = await res.json()
      if (res.ok) {
        setProfil(data)
        setNomDraft(data.nom || '')
        setPhoto(data.photo_profil || null)
        setAlertesEmail(data.alertes_email !== false)
        // Sync localStorage → sidebar
        const stored = JSON.parse(localStorage.getItem('sdi_user') || '{}')
        localStorage.setItem('sdi_user', JSON.stringify({
          ...stored, nom: data.nom, photo_profil: data.photo_profil,
        }))
      } else {
        showToast(t.error, 'error')
      }
    } catch { showToast(t.error, 'error') }
    finally  { setLoading(false) }
  }

  async function loadCode() {
    setLoadingCode(true)
    try {
      const res  = await fetch(`${API}/api/auth/invite-code`, { headers: authH() })
      const data = await res.json()
      if (res.ok) setCodeActuel(data.invite_code)
    } catch {}
    finally { setLoadingCode(false) }
  }

  useEffect(() => { loadProfil(); loadCode() }, [])

  // ── Save nom ──
  async function saveNom() {
    if (!nomDraft.trim() || nomDraft.trim().length < 2) return
    setSavingNom(true)
    try {
      const res = await fetch(`${API}/api/profil/me`, {
        method: 'PUT', headers: authH(),
        body: JSON.stringify({ nom: nomDraft.trim() }),
      })
      if (res.ok) {
        setProfil(p => ({ ...p, nom: nomDraft.trim() }))
        setEditingNom(false)
        syncSidebar({ nom: nomDraft.trim() })
        showToast(t.success)
      } else {
        const d = await res.json()
        showToast(d.detail || t.error, 'error')
      }
    } catch { showToast(t.error, 'error') }
    finally { setSavingNom(false) }
  }

  // ── Photo ──
  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1_000_000) { showToast('Image trop volumineuse (max 1MB).', 'error'); return }
    const reader = new FileReader()
    reader.onload = async ev => {
      const b64 = ev.target.result
      setPhoto(b64)
      setSavingPhoto(true)
      try {
        const res = await fetch(`${API}/api/profil/me`, {
          method: 'PUT', headers: authH(),
          body: JSON.stringify({ photo_profil: b64 }),
        })
        if (res.ok) { syncSidebar({ photo_profil: b64 }); showToast(t.success) }
        else showToast(t.error, 'error')
      } catch { showToast(t.error, 'error') }
      finally { setSavingPhoto(false) }
    }
    reader.readAsDataURL(file)
  }

  async function deletePhoto() {
    await fetch(`${API}/api/profil/photo`, { method: 'DELETE', headers: authH() })
    setPhoto(null)
    syncSidebar({ photo_profil: null })
    showToast(t.success)
  }

  function syncSidebar(updates) {
    const stored = JSON.parse(localStorage.getItem('sdi_user') || '{}')
    localStorage.setItem('sdi_user', JSON.stringify({ ...stored, ...updates }))
    window.dispatchEvent(new Event('sdi_profil_updated'))
  }

  // ── Password ──
  async function savePassword() {
    setPassErr('')
    if (nouveauMdp.length < 6)          { setPassErr(t.errMin);     return }
    if (nouveauMdp !== confirmMdp)       { setPassErr(t.errConfirm); return }
    if (ancienMdp === nouveauMdp)        { setPassErr(t.errSame);    return }
    setSavingPass(true)
    try {
      const res  = await fetch(`${API}/api/profil/password`, {
        method: 'PUT', headers: authH(),
        body: JSON.stringify({ ancien_mdp: ancienMdp, nouveau_mdp: nouveauMdp }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast(t.success)
        setAncienMdp(''); setNouveauMdp(''); setConfirmMdp('')
      } else {
        setPassErr(data.detail || t.error)
      }
    } catch { setPassErr(t.error) }
    finally { setSavingPass(false) }
  }

  // ── Notifications ──
  async function saveNotif() {
    setSavingNotif(true)
    try {
      const res = await fetch(`${API}/api/profil/me`, {
        method: 'PUT', headers: authH(),
        body: JSON.stringify({ alertes_email: alertesEmail }),
      })
      if (res.ok) showToast(t.success)
      else showToast(t.error, 'error')
    } catch { showToast(t.error, 'error') }
    finally { setSavingNotif(false) }
  }

  // ── Invite code ──
  async function saveCode() {
    if (nouveauCode.trim().length < 6) { showToast('Minimum 6 caractères.', 'error'); return }
    setSavingCode(true)
    try {
      const res = await fetch(`${API}/api/auth/invite-code`, {
        method: 'PUT', headers: authH(),
        body: JSON.stringify({ nouveau_code: nouveauCode.trim() }),
      })
      if (res.ok) {
        setCodeActuel(nouveauCode.trim()); setNouveauCode('')
        showToast(t.success)
      }
    } catch { showToast(t.error, 'error') }
    finally { setSavingCode(false) }
  }

  const initials = (profil?.nom?.[0] || 'A').toUpperCase()
  const roleLabel = profil?.role === 'admin'
    ? (lang === 'FR' ? 'Administrateur général' : 'General administrator')
    : (lang === 'FR' ? 'Gérant de serre' : 'Greenhouse manager')

  return (
    <>
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
      <Toast msg={toast.msg} type={toast.type} />

      <div className="admin-top">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              width: 38, height: 38, borderRadius: 11,
              background: isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)',
              border: `1px solid ${isDark ? 'rgba(34,197,94,0.3)' : 'rgba(34,197,94,0.2)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Settings size={17} color="#22C55E" />
            </span>
            {t.title}
          </h1>
          <div className="admin-sub">{t.sub}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: isDark ? '#94A3B8' : '#64748B' }}>
          <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : (
        <div style={{ maxWidth: 640 }}>

          {/* ── 1. PROFIL ── */}
          <SectionCard title={t.secProfil} icon={User} iconColor="#22C55E"
            iconBg={isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)'}
            isDark={isDark} border={border} cardBg={cardBg}>

            {/* Avatar + photo controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {photo ? (
                  <img src={photo} alt="profil" style={{
                    width: 80, height: 80, borderRadius: '50%', objectFit: 'cover',
                    border: `3px solid ${isDark ? 'rgba(34,197,94,0.4)' : 'rgba(34,197,94,0.25)'}`,
                    opacity: savingPhoto ? 0.6 : 1, transition: 'opacity 0.2s',
                  }} />
                ) : (
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#22C55E,#059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 30, fontWeight: 800, color: 'white',
                  }}>{initials}</div>
                )}
                <button onClick={() => fileRef.current?.click()} style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 26, height: 26, borderRadius: '50%',
                  background: '#22C55E', border: '2px solid white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}>
                  <Camera size={12} color="white" />
                </button>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: isDark ? '#F1F5F9' : '#0F172A', marginBottom: 4 }}>
                  {profil?.nom || '—'}
                </div>
                <div style={{ fontSize: 12, color: isDark ? '#94A3B8' : '#64748B', marginBottom: 10 }}>
                  {profil?.email}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => fileRef.current?.click()} style={{
                    padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                    background: isDark ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.08)',
                    border: `1px solid ${isDark ? 'rgba(34,197,94,0.25)' : 'rgba(34,197,94,0.2)'}`,
                    color: '#22C55E', cursor: 'pointer', fontFamily: "'Manrope',sans-serif",
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <Camera size={11} /> {t.photoChange}
                  </button>
                  {photo && (
                    <button onClick={deletePhoto} style={{
                      padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                      background: 'transparent',
                      border: `1px solid ${isDark ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.18)'}`,
                      color: '#EF4444', cursor: 'pointer', fontFamily: "'Manrope',sans-serif",
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      <Trash2 size={11} /> {t.photoDelete}
                    </button>
                  )}
                </div>
                <div style={{ fontSize: 10, color: ink4, marginTop: 6 }}>{t.photoHint}</div>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange} style={{ display: 'none' }} />

            {/* Nom — éditable */}
            {editingNom ? (
              <EditField
                label={t.nom}
                value={nomDraft}
                onChange={setNomDraft}
                onSave={saveNom}
                onCancel={() => { setEditingNom(false); setNomDraft(profil?.nom || '') }}
                saving={savingNom}
                isDark={isDark}
                t={t}
              />
            ) : (
              <InfoRow label={t.nom} value={profil?.nom} icon={UserCircle}
                editable onEdit={() => { setEditingNom(true); setNomDraft(profil?.nom || '') }}
                isDark={isDark} t={t} />
            )}

            {/* Email — non éditable */}
            <InfoRow label={t.email} value={profil?.email} icon={Mail}
              editable={false} isDark={isDark} t={t} />

            {/* Unité — non éditable */}
            <InfoRow
              label={t.unit}
              value={profil?.unit === 'ALL'
                ? (lang === 'FR' ? 'Toutes les serres' : 'All greenhouses')
                : `Serre ${profil?.unit}`}
              icon={Building2}
              editable={false}
              isDark={isDark} t={t}
            />

            {/* Rôle — non éditable */}
            <InfoRow label={t.role} value={roleLabel} icon={IdCard}
              editable={false} isDark={isDark} t={t} />
          </SectionCard>

          {/* ── 2. SÉCURITÉ ── */}
          <SectionCard title={t.secPassword} icon={Lock} iconColor="#8B5CF6"
            iconBg={isDark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.1)'}
            isDark={isDark} border={border} cardBg={cardBg}>

            <PassField label={t.ancienMdp}  value={ancienMdp}  onChange={setAncienMdp}  isDark={isDark} />
            <PassField label={t.nouveauMdp} value={nouveauMdp} onChange={setNouveauMdp} isDark={isDark} />
            <PassField label={t.confirmMdp} value={confirmMdp} onChange={setConfirmMdp} isDark={isDark} />

            {passErr && (
              <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <X size={13} /> {passErr}
              </div>
            )}

            <button
              onClick={savePassword}
              disabled={savingPass || !ancienMdp || !nouveauMdp || !confirmMdp}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 12, border: 'none',
                background: (!ancienMdp || !nouveauMdp || !confirmMdp || savingPass)
                  ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)')
                  : 'linear-gradient(135deg,#8B5CF6,#6D28D9)',
                color: (!ancienMdp || !nouveauMdp || !confirmMdp) ? (isDark ? '#475569' : '#94A3B8') : 'white',
                fontSize: 13, fontWeight: 600, cursor: savingPass || !ancienMdp ? 'not-allowed' : 'pointer',
                fontFamily: "'Manrope',sans-serif",
                boxShadow: (!ancienMdp || !nouveauMdp || !confirmMdp) ? 'none' : '0 4px 14px rgba(139,92,246,0.3)',
                transition: 'all 0.2s', opacity: savingPass ? 0.7 : 1,
              }}
            >
              <Lock size={14} /> {savingPass ? t.saving : t.savePassword}
            </button>
          </SectionCard>

          {/* ── 3. NOTIFICATIONS ── */}
          <SectionCard title={t.secNotif} icon={Bell} iconColor="#F59E0B"
            iconBg={isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.1)'}
            isDark={isDark} border={border} cardBg={cardBg}>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: 12, marginBottom: 16,
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              border: `1px solid ${border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {alertesEmail ? <Bell size={18} color="#F59E0B" /> : <BellOff size={18} color={ink4} />}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#F1F5F9' : '#0F172A' }}>
                    {t.alertesTitle}
                  </div>
                  <div style={{ fontSize: 11, color: ink4, marginTop: 2 }}>{t.alertesSub}</div>
                </div>
              </div>
              <div onClick={() => setAlertesEmail(a => !a)} style={{
                width: 44, height: 24, borderRadius: 12, cursor: 'pointer', flexShrink: 0,
                background: alertesEmail ? '#22C55E' : (isDark ? '#374151' : '#D1D5DB'),
                position: 'relative', transition: 'background 0.2s',
              }}>
                <div style={{
                  position: 'absolute', top: 3,
                  left: alertesEmail ? 23 : 3,
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'white', transition: 'left 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }} />
              </div>
            </div>
            <div style={{ fontSize: 12, color: alertesEmail ? '#22C55E' : ink4, marginBottom: 16, fontWeight: 600 }}>
              {alertesEmail ? `✓ ${t.alertesOn}` : `✗ ${t.alertesOff}`}
            </div>
            <button onClick={saveNotif} disabled={savingNotif} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg,#F59E0B,#D97706)',
              color: 'white', fontSize: 13, fontWeight: 600,
              cursor: savingNotif ? 'not-allowed' : 'pointer',
              fontFamily: "'Manrope',sans-serif",
              boxShadow: '0 4px 14px rgba(245,158,11,0.3)',
              opacity: savingNotif ? 0.7 : 1, transition: 'all 0.2s',
            }}>
              <Save size={14} /> {savingNotif ? t.saving : t.saveNotif}
            </button>
          </SectionCard>

          {/* ── 4. SYSTÈME (admin only) ── */}
          {profil?.role === 'admin' && (
            <SectionCard title={t.secSystem} icon={Key} iconColor="#A78BFA"
              iconBg={isDark ? 'rgba(167,139,250,0.15)' : 'rgba(167,139,250,0.1)'}
              isDark={isDark} border={border} cardBg={cardBg}>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {t.codeActuel}
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCode ? 'text' : 'password'}
                    value={loadingCode ? '...' : codeActuel}
                    readOnly
                    style={{
                      width: '100%', height: 42, boxSizing: 'border-box',
                      background: isDark ? 'rgba(167,139,250,0.06)' : 'rgba(167,139,250,0.04)',
                      border: `1.5px solid ${isDark ? 'rgba(167,139,250,0.2)' : 'rgba(167,139,250,0.15)'}`,
                      borderRadius: 10, padding: '0 44px 0 14px',
                      fontSize: 14, color: isDark ? '#F8FAFC' : '#0F172A',
                      fontFamily: 'JetBrains Mono, monospace', outline: 'none', letterSpacing: '0.08em',
                    }}
                  />
                  <button onClick={() => setShowCode(s => !s)} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: showCode ? '#A78BFA' : ink4, display: 'flex', alignItems: 'center',
                  }}>
                    {showCode ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <PassField label={t.nouveauCode} value={nouveauCode} onChange={setNouveauCode} isDark={isDark} />

              <div style={{
                padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                background: isDark ? 'rgba(59,130,246,0.07)' : 'rgba(59,130,246,0.05)',
                border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.15)'}`,
                display: 'flex', gap: 8, fontSize: 12,
                color: isDark ? '#93C5FD' : '#3773bd',
              }}>
                <Shield size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                {t.infoText}
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={saveCode}
                  disabled={nouveauCode.trim().length < 6 || savingCode}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '10px 20px', borderRadius: 12, border: 'none',
                    background: nouveauCode.trim().length >= 6
                      ? 'linear-gradient(135deg,#A78BFA,#7C3AED)'
                      : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'),
                    color: nouveauCode.trim().length >= 6 ? 'white' : (isDark ? '#475569' : '#94A3B8'),
                    fontSize: 13, fontWeight: 600,
                    cursor: nouveauCode.trim().length < 6 || savingCode ? 'not-allowed' : 'pointer',
                    fontFamily: "'Manrope',sans-serif",
                    boxShadow: nouveauCode.trim().length >= 6 ? '0 4px 14px rgba(167,139,250,0.3)' : 'none',
                    opacity: savingCode ? 0.7 : 1, transition: 'all 0.2s',
                  }}
                >
                  <Save size={14} /> {savingCode ? t.saving : t.save}
                </button>
                <button onClick={loadCode} style={{
                  padding: '10px 14px', borderRadius: 12,
                  border: `1px solid ${border}`, background: 'transparent',
                  color: isDark ? '#94A3B8' : '#64748B', cursor: 'pointer',
                  fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
                  fontFamily: "'Manrope',sans-serif",
                }}>
                  <RefreshCw size={13} /> {t.refresh}
                </button>
              </div>
            </SectionCard>
          )}
        </div>
      )}
    </>
  )
}
