// src/pages/dashboard/Parametres.jsx
import { useState, useEffect, useRef } from 'react'
import {
  Settings, Key, Eye, EyeOff, Save, RefreshCw, Shield,
  User, Lock, Bell, BellOff, Camera, Trash2, Check, X,
  Mail, Building2, IdCard,
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'https://serre-digitale-iav.onrender.com'

const T = {
  FR: {
    title: 'Paramètres', sub: 'Gérez votre profil et la configuration du système',
    // Sections
    secProfil: 'Mon profil',
    secPassword: 'Sécurité',
    secNotif: 'Notifications',
    secSystem: 'Système',
    // Profil
    nom: 'Nom complet', email: 'Adresse email',
    unit: 'Unité / Serre', role: 'Rôle',
    photoChange: 'Changer la photo', photoDelete: 'Supprimer',
    photoHint: 'JPG, PNG — max 500KB',
    saveProfil: 'Enregistrer le profil',
    // Password
    ancienMdp: 'Mot de passe actuel', nouveauMdp: 'Nouveau mot de passe',
    confirmMdp: 'Confirmer le nouveau mot de passe',
    savePassword: 'Changer le mot de passe',
    errConfirm: 'Les mots de passe ne correspondent pas.',
    errMin: 'Minimum 6 caractères.',
    errSame: 'Le nouveau mot de passe doit être différent.',
    // Notifications
    alertesTitle: 'Alertes email de monitoring',
    alertesSub: 'Recevoir un email quand un capteur dépasse ses seuils',
    alertesOn: 'Activées', alertesOff: 'Désactivées',
    saveNotif: 'Enregistrer les préférences',
    // System
    inviteTitle: 'Code d\'invitation',
    inviteSub: 'Requis pour créer un nouveau compte admin',
    codeActuel: 'Code actuel', nouveauCode: 'Nouveau code',
    placeholder: 'Min. 6 caractères',
    save: 'Enregistrer', saving: 'Enregistrement...',
    refresh: 'Actualiser',
    infoText: 'Partagez ce code uniquement avec les personnes autorisées.',
    // Toast
    success: 'Modifications enregistrées !',
    error: 'Une erreur est survenue.',
  },
  EN: {
    title: 'Settings', sub: 'Manage your profile and system configuration',
    secProfil: 'My profile', secPassword: 'Security',
    secNotif: 'Notifications', secSystem: 'System',
    nom: 'Full name', email: 'Email address',
    unit: 'Unit / Greenhouse', role: 'Role',
    photoChange: 'Change photo', photoDelete: 'Remove',
    photoHint: 'JPG, PNG — max 500KB',
    saveProfil: 'Save profile',
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
    save: 'Save', saving: 'Saving...',
    refresh: 'Refresh',
    infoText: 'Share this code only with authorized people.',
    success: 'Changes saved!',
    error: 'An error occurred.',
  }
}

function getToken() { return localStorage.getItem('sdi_token') }
function authH() { return { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' } }

// ── Toast ──────────────────────────────────────────────────
function Toast({ msg, type }) {
  if (!msg) return null
  const bg = type === 'success' ? '#16a34a' : '#dc2626'
  const Icon = type === 'success' ? Check : X
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: bg, color: 'white', borderRadius: 12,
      padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 8,
      fontSize: 13, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      fontFamily: "'Manrope',system-ui,sans-serif",
      animation: 'fadeIn 0.2s ease',
    }}>
      <Icon size={15} />
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

// ── Input field ────────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', readOnly = false, isDark, suffix, placeholder }) {
  const [show, setShow] = useState(false)
  const inputBg  = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(16,48,36,0.03)'
  const inputBdr = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(16,48,36,0.14)'
  const ink      = isDark ? '#F8FAFC' : '#0F172A'
  const ink3     = isDark ? '#94A3B8' : '#64748B'
  const ink4     = isDark ? '#475569' : '#94A3B8'
  const isPass   = type === 'password'
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, color: ink3, marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <div style={{ position: 'relative' }}>
        <input
          type={isPass ? (show ? 'text' : 'password') : type}
          value={value}
          onChange={onChange ? e => onChange(e.target.value) : undefined}
          readOnly={readOnly}
          placeholder={placeholder}
          style={{
            width: '100%', height: 42, boxSizing: 'border-box',
            background: readOnly ? (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)') : inputBg,
            border: `1.5px solid ${inputBdr}`, borderRadius: 10,
            padding: isPass || suffix ? '0 44px 0 14px' : '0 14px',
            fontSize: 14, color: readOnly ? ink3 : ink,
            fontFamily: isPass ? 'JetBrains Mono, monospace' : "'Manrope',system-ui,sans-serif",
            outline: 'none', cursor: readOnly ? 'default' : 'text',
          }}
          onFocus={e => { if (!readOnly) { e.target.style.borderColor = isDark ? 'rgba(34,197,94,0.5)' : 'rgba(34,197,94,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.1)' }}}
          onBlur={e  => { e.target.style.borderColor = inputBdr; e.target.style.boxShadow = 'none' }}
        />
        {isPass && (
          <button onClick={() => setShow(s => !s)} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', color: show ? '#22C55E' : ink4,
            cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4,
          }}>
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
        {suffix && !isPass && (
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: ink4, fontSize: 11 }}>
            {suffix}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Btn principal ──────────────────────────────────────────
function Btn({ onClick, disabled, loading, children, isDark }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '10px 20px', borderRadius: 12, border: 'none',
        background: disabled || loading
          ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)')
          : 'linear-gradient(135deg,#22C55E,#059669)',
        color: disabled || loading ? (isDark ? '#475569' : '#94A3B8') : 'white',
        fontSize: 13, fontWeight: 600, cursor: disabled || loading ? 'not-allowed' : 'pointer',
        fontFamily: "'Manrope',system-ui,sans-serif",
        boxShadow: disabled || loading ? 'none' : '0 4px 14px rgba(34,197,94,0.3)',
        transition: 'all 0.2s', opacity: loading ? 0.7 : 1,
      }}
      onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {children}
    </button>
  )
}

// ── Main ───────────────────────────────────────────────────
export default function Parametres({ theme, lang }) {
  const isDark   = theme === 'dark'
  const t        = T[lang] || T.FR
  const cardBg   = isDark ? 'rgba(16,27,46,0.82)' : 'white'
  const border   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'
  const ink3     = isDark ? '#94A3B8' : '#64748B'
  const ink4     = isDark ? '#475569' : '#94A3B8'

  const [toast,   setToast]   = useState({ msg: '', type: '' })
  const [profil,  setProfil]  = useState(null)
  const [loading, setLoading] = useState(true)
  const fileRef = useRef()

  // Profil state
  const [nom,         setNom]         = useState('')
  const [photo,       setPhoto]       = useState(null)
  const [savingProfil, setSavingP]    = useState(false)

  // Password state
  const [ancienMdp,    setAncienMdp]   = useState('')
  const [nouveauMdp,   setNouveauMdp]  = useState('')
  const [confirmMdp,   setConfirmMdp]  = useState('')
  const [savingPass,   setSavingPass]  = useState(false)
  const [passErr,      setPassErr]     = useState('')

  // Notifications state
  const [alertesEmail, setAlertesEmail] = useState(true)
  const [savingNotif,  setSavingNotif]  = useState(false)

  // Invite code state
  const [codeActuel,   setCodeActuel]  = useState('')
  const [nouveauCode,  setNouveauCode] = useState('')
  const [showCode,     setShowCode]    = useState(false)
  const [savingCode,   setSavingCode]  = useState(false)
  const [loadingCode,  setLoadingCode] = useState(true)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: '' }), 3500)
  }

  // ── Load profil ──
  async function loadProfil() {
    setLoading(true)
    try {
      const res  = await fetch(`${API}/api/profil/me`, { headers: authH() })
      const data = await res.json()
      if (res.ok) {
        setProfil(data)
        setNom(data.nom || '')
        setPhoto(data.photo_profil || null)
        setAlertesEmail(data.alertes_email !== false)
        // Sync localStorage pour sidebar
        const stored = JSON.parse(localStorage.getItem('sdi_user') || '{}')
        localStorage.setItem('sdi_user', JSON.stringify({
          ...stored,
          nom: data.nom,
          photo_profil: data.photo_profil,
        }))
      }
    } catch { showToast(t.error, 'error') }
    finally  { setLoading(false) }
  }

  // ── Load invite code ──
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

  // ── Save profil ──
  async function saveProfil() {
    setSavingP(true)
    try {
      const res = await fetch(`${API}/api/profil/me`, {
        method: 'PUT', headers: authH(),
        body: JSON.stringify({ nom, photo_profil: photo }),
      })
      if (res.ok) {
        showToast(t.success)
        // Sync localStorage → sidebar se met à jour automatiquement
        const stored = JSON.parse(localStorage.getItem('sdi_user') || '{}')
        localStorage.setItem('sdi_user', JSON.stringify({ ...stored, nom, photo_profil: photo }))
        // Dispatch event pour que Sidebar réagisse sans refresh
        window.dispatchEvent(new Event('sdi_profil_updated'))
      } else {
        const d = await res.json()
        showToast(d.detail || t.error, 'error')
      }
    } catch { showToast(t.error, 'error') }
    finally { setSavingP(false) }
  }

  // ── Photo upload ──
  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500_000) { showToast('Image trop volumineuse (max 500KB).', 'error'); return }
    const reader = new FileReader()
    reader.onload = ev => setPhoto(ev.target.result)
    reader.readAsDataURL(file)
  }

  async function deletePhoto() {
    setPhoto(null)
    await fetch(`${API}/api/profil/photo`, { method: 'DELETE', headers: authH() })
    const stored = JSON.parse(localStorage.getItem('sdi_user') || '{}')
    localStorage.setItem('sdi_user', JSON.stringify({ ...stored, photo_profil: null }))
    window.dispatchEvent(new Event('sdi_profil_updated'))
    showToast(t.success)
  }

  // ── Save password ──
  async function savePassword() {
    setPassErr('')
    if (nouveauMdp.length < 6) { setPassErr(t.errMin); return }
    if (nouveauMdp !== confirmMdp) { setPassErr(t.errConfirm); return }
    if (ancienMdp === nouveauMdp) { setPassErr(t.errSame); return }
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

  // ── Save notifications ──
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

  // ── Save invite code ──
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
  const roleLabel = profil?.role === 'admin' ? (lang === 'FR' ? 'Administrateur' : 'Administrator') : 'Gérant'

  return (
    <>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>
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

      <div style={{ maxWidth: 640 }}>

        {/* ── 1. PROFIL ── */}
        <SectionCard title={t.secProfil} icon={User} iconColor="#22C55E"
          iconBg={isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)'}
          isDark={isDark} border={border} cardBg={cardBg}>

          {/* Photo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {photo ? (
                <img src={photo} alt="profil" style={{
                  width: 72, height: 72, borderRadius: '50%', objectFit: 'cover',
                  border: `3px solid ${isDark ? 'rgba(34,197,94,0.4)' : 'rgba(34,197,94,0.3)'}`,
                }} />
              ) : (
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg,#22C55E,#059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, fontWeight: 800, color: 'white',
                }}>
                  {initials}
                </div>
              )}
              <button onClick={() => fileRef.current?.click()} style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 24, height: 24, borderRadius: '50%',
                background: '#22C55E', border: '2px solid white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}>
                <Camera size={11} color="white" />
              </button>
            </div>
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <button onClick={() => fileRef.current?.click()} style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)',
                  border: `1px solid ${isDark ? 'rgba(34,197,94,0.3)' : 'rgba(34,197,94,0.2)'}`,
                  color: '#22C55E', cursor: 'pointer', fontFamily: "'Manrope',sans-serif",
                }}>
                  <Camera size={12} style={{ marginRight: 5, verticalAlign: 'middle' }} />
                  {t.photoChange}
                </button>
                {photo && (
                  <button onClick={deletePhoto} style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: 'transparent', border: `1px solid ${isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)'}`,
                    color: '#EF4444', cursor: 'pointer', fontFamily: "'Manrope',sans-serif",
                  }}>
                    <Trash2 size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                    {t.photoDelete}
                  </button>
                )}
              </div>
              <div style={{ fontSize: 11, color: ink4 }}>{t.photoHint}</div>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange} style={{ display: 'none' }} />

          {/* Champs */}
          <Field label={t.nom} value={nom} onChange={setNom} isDark={isDark} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label={t.email} value={profil?.email || ''} readOnly isDark={isDark} />
            <Field label={t.unit} value={profil?.unit || '—'} readOnly isDark={isDark} suffix={<Building2 size={13} />} />
          </div>
          <Field label={t.role} value={roleLabel} readOnly isDark={isDark} suffix={<IdCard size={13} />} />

          <Btn onClick={saveProfil} loading={savingProfil} isDark={isDark}>
            <Save size={14} /> {savingProfil ? t.saving : t.saveProfil}
          </Btn>
        </SectionCard>

        {/* ── 2. SÉCURITÉ ── */}
        <SectionCard title={t.secPassword} icon={Lock} iconColor="#8B5CF6"
          iconBg={isDark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.1)'}
          isDark={isDark} border={border} cardBg={cardBg}>

          <Field label={t.ancienMdp} value={ancienMdp} onChange={setAncienMdp} type="password" isDark={isDark} />
          <Field label={t.nouveauMdp} value={nouveauMdp} onChange={setNouveauMdp} type="password" isDark={isDark} />
          <Field label={t.confirmMdp} value={confirmMdp} onChange={setConfirmMdp} type="password" isDark={isDark} />

          {passErr && (
            <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <X size={13} /> {passErr}
            </div>
          )}

          <Btn onClick={savePassword} loading={savingPass}
            disabled={!ancienMdp || !nouveauMdp || !confirmMdp} isDark={isDark}>
            <Lock size={14} /> {savingPass ? t.saving : t.savePassword}
          </Btn>
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
              {alertesEmail
                ? <Bell size={18} color="#F59E0B" />
                : <BellOff size={18} color={ink4} />}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#F1F5F9' : '#0F172A' }}>
                  {t.alertesTitle}
                </div>
                <div style={{ fontSize: 11, color: ink4, marginTop: 2 }}>{t.alertesSub}</div>
              </div>
            </div>
            {/* Toggle switch */}
            <div
              onClick={() => setAlertesEmail(a => !a)}
              style={{
                width: 44, height: 24, borderRadius: 12, cursor: 'pointer', flexShrink: 0,
                background: alertesEmail ? '#22C55E' : (isDark ? '#374151' : '#D1D5DB'),
                position: 'relative', transition: 'background 0.2s',
              }}
            >
              <div style={{
                position: 'absolute', top: 3, left: alertesEmail ? 23 : 3,
                width: 18, height: 18, borderRadius: '50%',
                background: 'white', transition: 'left 0.2s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }} />
            </div>
          </div>
          <div style={{ fontSize: 12, color: alertesEmail ? '#22C55E' : ink4, marginBottom: 16, fontWeight: 600 }}>
            {alertesEmail ? `✓ ${t.alertesOn}` : `✗ ${t.alertesOff}`}
          </div>

          <Btn onClick={saveNotif} loading={savingNotif} isDark={isDark}>
            <Save size={14} /> {savingNotif ? t.saving : t.saveNotif}
          </Btn>
        </SectionCard>

        {/* ── 4. SYSTÈME (admin only) ── */}
        {profil?.role === 'admin' && (
          <SectionCard title={t.secSystem} icon={Key} iconColor="#A78BFA"
            iconBg={isDark ? 'rgba(167,139,250,0.15)' : 'rgba(167,139,250,0.1)'}
            isDark={isDark} border={border} cardBg={cardBg}>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: isDark ? '#94A3B8' : '#64748B', marginBottom: 6, fontWeight: 600 }}>{t.codeActuel}</div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCode ? 'text' : 'password'}
                  value={loadingCode ? '...' : codeActuel}
                  readOnly
                  style={{
                    width: '100%', height: 42, boxSizing: 'border-box',
                    background: isDark ? 'rgba(167,139,250,0.06)' : 'rgba(167,139,250,0.04)',
                    border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.09)' : 'rgba(16,48,36,0.14)'}`,
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

            <Field
              label={t.nouveauCode}
              value={nouveauCode}
              onChange={setNouveauCode}
              type="password"
              isDark={isDark}
              placeholder={t.placeholder}
            />

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
              <Btn onClick={saveCode} disabled={nouveauCode.trim().length < 6} loading={savingCode} isDark={isDark}>
                <Save size={14} /> {savingCode ? t.saving : t.save}
              </Btn>
              <button onClick={loadCode} style={{
                padding: '10px 14px', borderRadius: 12, border: `1px solid ${border}`,
                background: 'transparent', color: ink3, cursor: 'pointer', fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Manrope',sans-serif",
              }}>
                <RefreshCw size={13} /> {t.refresh}
              </button>
            </div>
          </SectionCard>
        )}
      </div>
    </>
  )
}
