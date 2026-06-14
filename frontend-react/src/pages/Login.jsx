// src/pages/Login.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../api/client'

const API = import.meta.env.VITE_API_URL || 'https://serre-digitale-iav.onrender.com'

const UNITS = [
  { value:'ALL', label:'Accès complet (Super Admin)' },
  { value:'S01', label:'S01 — Génétique & Amélioration' },
  { value:'S02', label:'S02 — Horticulture' },
  { value:'S03', label:'S03 — Agronomie' },
  { value:'S04', label:'S04 — Hydroponie' },
  { value:'S05', label:'S05 — Protection des Plantes' },
]

function EyeOpen() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}
function EyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

function PwdInput({ value, onChange, placeholder, show, setShow, onEnter }) {
  return (
    <div style={{ position:'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onEnter?.()}
        placeholder={placeholder || '••••••••'}
        style={{
          width:'100%', padding:'12px 44px 12px 14px',
          border:'1px solid rgba(255,255,255,0.09)',
          borderRadius:'12px', fontSize:'14px', fontFamily:'inherit',
          outline:'none', background:'rgba(255,255,255,0.06)',
          color:'#F8FAFC', boxSizing:'border-box', transition:'border-color 0.2s',
        }}
        onFocus={e  => e.target.style.borderColor='#22C55E'}
        onBlur={e   => e.target.style.borderColor='rgba(255,255,255,0.09)'}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        style={{
          position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)',
          background:'none', border:'none', padding:'4px',
          color: show ? '#22C55E' : '#64748B',
          cursor:'pointer', display:'flex', alignItems:'center', transition:'color 0.2s',
        }}
      >
        {show ? <EyeOff /> : <EyeOpen />}
      </button>
    </div>
  )
}

function TextInput({ value, onChange, type='text', placeholder, onEnter }) {
  return (
    <input
      type={type} value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && onEnter?.()}
      placeholder={placeholder}
      style={{
        width:'100%', padding:'12px 14px',
        border:'1px solid rgba(255,255,255,0.09)',
        borderRadius:'12px', fontSize:'14px', fontFamily:'inherit',
        outline:'none', background:'rgba(255,255,255,0.06)',
        color:'#F8FAFC', boxSizing:'border-box', transition:'border-color 0.2s',
      }}
      onFocus={e => e.target.style.borderColor='#22C55E'}
      onBlur={e  => e.target.style.borderColor='rgba(255,255,255,0.09)'}
    />
  )
}

function Label({ children }) {
  return (
    <label style={{ display:'block', fontSize:'12px', fontWeight:'600',
      color:'#94A3B8', marginBottom:'6px', letterSpacing:'0.02em' }}>
      {children}
    </label>
  )
}

function Field({ children }) {
  return <div style={{ marginBottom:'14px' }}>{children}</div>
}

function AlertBox({ msg, type='error' }) {
  if (!msg) return null
  const isOk = type === 'success'
  return (
    <div style={{
      background: isOk ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
      border: `1px solid ${isOk ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
      color: isOk ? '#4ADE80' : '#F87171',
      padding:'10px 14px', borderRadius:'10px',
      fontSize:'13px', marginBottom:'16px', lineHeight:'1.4',
    }}>
      {msg}
    </div>
  )
}

function BigBtn({ onClick, disabled, loading, label }) {
  return (
    <button
      onClick={onClick} disabled={disabled || loading}
      style={{
        width:'100%', padding:'14px', border:'none', borderRadius:'14px',
        background:'linear-gradient(135deg,#22C55E,#06B6D4)',
        color:'white', fontSize:'15px', fontWeight:'700',
        fontFamily:'inherit', cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
        boxShadow:'0 8px 24px rgba(34,197,94,0.3)',
        transition:'all 0.2s', marginTop:'4px',
      }}
      onMouseEnter={e => { if(!loading) e.currentTarget.style.transform='translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)' }}
    >
      {label}
    </button>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('login')

  // login
  const [lEmail,   setLEmail]   = useState('')
  const [lPwd,     setLPwd]     = useState('')
  const [lShow,    setLShow]    = useState(false)
  const [lErr,     setLErr]     = useState('')
  const [lLoading, setLLoading] = useState(false)

  // signup
  const [sFirst,   setSFirst]   = useState('')
  const [sLast,    setSLast]    = useState('')
  const [sUnit,    setSUnit]    = useState('ALL')
  const [sEmail,   setSEmail]   = useState('')
  const [sPwd,     setSPwd]     = useState('')
  const [sPwd2,    setSPwd2]    = useState('')
  const [sShow1,   setSShow1]   = useState(false)
  const [sShow2,   setSShow2]   = useState(false)
  const [sErr,     setSErr]     = useState('')
  const [sOk,      setSOk]      = useState('')
  const [sLoading, setSLoading] = useState(false)
  const [sCode,    setSCode]    = useState('')

  // verify
  const [vEmail,   setVEmail]   = useState('')
  const [vCode,    setVCode]    = useState('')
  const [vErr,     setVErr]     = useState('')
  const [vOk,      setVOk]      = useState('')
  const [vLoading, setVLoading] = useState(false)

  // ── Handlers ─────────────────────────────────────────
  async function doLogin() {
    if (!lEmail || !lPwd) { setLErr('Veuillez remplir tous les champs.'); return }
    setLLoading(true); setLErr('')
    try {
      const { ok, data } = await authAPI.login(lEmail, lPwd)
      if (!ok) { setLErr(data.detail || 'Email ou mot de passe incorrect.'); return }
      localStorage.setItem('sdi_token', data.access_token)
      localStorage.setItem('sdi_user', JSON.stringify(data.user))
      navigate('/dashboard')
    } catch { setLErr('Impossible de joindre le serveur.') }
    finally   { setLLoading(false) }
  }

  async function doSignup() {
    setSErr(''); setSOk('')
    if (!sFirst || !sLast || !sEmail || !sPwd) { setSErr('Tous les champs sont obligatoires.'); return }
    if (sPwd !== sPwd2) { setSErr('Les mots de passe ne correspondent pas.'); return }
    if (sPwd.length < 8) { setSErr('Mot de passe trop court (min. 8 caractères).'); return }
    setSLoading(true)
    try {
      const res  = await fetch(`${API}/api/auth/register`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ first_name:sFirst, last_name:sLast, unit:sUnit, email:sEmail, password:sPwd, invite_code:sCode })
      })
      const data = await res.json()
      if (!res.ok) { setSErr(typeof data.detail === 'string' ? data.detail : 'Erreur création compte.'); return }
      setVEmail(sEmail)
      setSOk('Compte créé ! Vérifiez votre email pour le code.')
      setTimeout(() => setTab('verify'), 2000)
    } catch { setSErr('Impossible de joindre le serveur.') }
    finally   { setSLoading(false) }
  }

  async function doVerify() {
    setVErr(''); setVOk('')
    if (!vCode) { setVErr('Entrez le code reçu par email.'); return }
    setVLoading(true)
    try {
      const res  = await fetch(`${API}/api/auth/verify-email`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email:vEmail, code:vCode })
      })
      const data = await res.json()
      if (!res.ok) { setVErr(data.detail || 'Code incorrect.'); return }
      setVOk('Email vérifié ! Redirection vers la connexion…')
      setTimeout(() => { setTab('login'); setLEmail(vEmail) }, 2500)
    } catch { setVErr('Impossible de joindre le serveur.') }
    finally   { setVLoading(false) }
  }

  function switchTab(t) {
    setTab(t); setLErr(''); setSErr(''); setVErr('')
  }

  // ── Render ────────────────────────────────────────────
  return (
    <div style={{
      minHeight:'100vh',
      background:'linear-gradient(135deg,#07111F 0%,#0B1728 55%,#063B2D 100%)',
      display:'flex', alignItems:'flex-start', justifyContent:'center',
      padding:'clamp(60px,12vw,80px) clamp(12px,4vw,16px) clamp(24px,5vw,32px)',
      fontFamily:"'Inter','Outfit',sans-serif",
      position:'relative', overflowY:'auto', minHeight:'100dvh',
    }}>

      {/* Grid background */}
      <div style={{
        position:'fixed', inset:0, zIndex:0, pointerEvents:'none',
        backgroundImage:'linear-gradient(rgba(34,197,94,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.04) 1px,transparent 1px)',
        backgroundSize:'60px 60px',
      }}/>

      {/* ── Back button ── */}
      <button
        onClick={() => navigate('/')}
        style={{
          position:'fixed', top:'clamp(12px,3vw,20px)', left:'clamp(12px,3vw,20px)', zIndex:10,
          display:'flex', alignItems:'center', gap:'8px',
          padding:'9px 16px', borderRadius:'12px',
          background:'rgba(255,255,255,0.07)',
          border:'1px solid rgba(255,255,255,0.12)',
          color:'rgba(255,255,255,0.75)', fontSize:'13px',
          fontFamily:'inherit', cursor:'pointer',
          transition:'all 0.2s', backdropFilter:'blur(8px)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background='rgba(34,197,94,0.15)'
          e.currentTarget.style.borderColor='rgba(34,197,94,0.35)'
          e.currentTarget.style.color='#4ADE80'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background='rgba(255,255,255,0.07)'
          e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'
          e.currentTarget.style.color='rgba(255,255,255,0.75)'
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Retour au géoportail
      </button>

      {/* ── Card ── */}
      <div style={{
        position:'relative', zIndex:1,
        background:'rgba(16,27,46,0.85)',
        backdropFilter:'blur(20px)',
        border:'1px solid rgba(255,255,255,0.08)',
        borderRadius:'clamp(16px, 4vw, 28px)',
        padding: tab === 'signup' ? 'clamp(20px,5vw,36px) clamp(16px,5vw,32px)' : 'clamp(24px,5vw,40px) clamp(16px,5vw,36px)',
        width:'100%', maxWidth:'440px',
        boxShadow:'0 20px 60px rgba(0,0,0,0.4)',
        animation:'lgFadeIn 0.45s ease',
      }}>
        <style>{`
          @keyframes lgFadeIn { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        `}</style>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'22px' }}>
          <div style={{
            width:'68px', height:'68px', borderRadius:'17px',
            overflow:'hidden', background:'white',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 12px',
            boxShadow:'0 0 28px rgba(34,197,94,0.3)',
          }}>
            <img src="/iav_logo.png" alt="IAV Hassan II" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
          <div style={{ fontSize:'24px', fontWeight:'800', color:'#F8FAFC', letterSpacing:'-0.5px' }}>
            Espace Gérant
          </div>
          <div style={{ fontSize:'12px', color:'#64748B', marginTop:'3px' }}>
            Serre Digitale Intelligente · IAV Hassan II
          </div>
        </div>

        {/* Tabs — hidden on verify screen */}
        {tab !== 'verify' && (
          <div style={{
            display:'flex', background:'rgba(255,255,255,0.04)',
            borderRadius:'13px', padding:'4px', marginBottom:'22px', gap:'4px',
          }}>
            {[{k:'login',label:'Connexion'},{k:'signup',label:'Créer un compte'}].map(tb => (
              <button key={tb.k} onClick={() => switchTab(tb.k)} style={{
                flex:1, padding:'9px', borderRadius:'9px', border:'none',
                fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit',
                transition:'all 0.2s',
                background: tab === tb.k
                  ? 'linear-gradient(135deg,rgba(34,197,94,0.22),rgba(6,182,212,0.18))'
                  : 'transparent',
                color: tab === tb.k ? '#F8FAFC' : '#64748B',
                boxShadow: tab === tb.k ? '0 0 0 1px rgba(34,197,94,0.3)' : 'none',
              }}>
                {tb.label}
              </button>
            ))}
          </div>
        )}

        {/* ── LOGIN ── */}
        {tab === 'login' && (<>
          <AlertBox msg={lErr} />
          <Field><Label>Adresse email</Label><TextInput value={lEmail} onChange={setLEmail} type="email" placeholder="admin@agrobiotech.ma" onEnter={doLogin}/></Field>
          <Field>
            <Label>Mot de passe</Label>
            <PwdInput value={lPwd} onChange={setLPwd} show={lShow} setShow={setLShow} onEnter={doLogin}/>
          </Field>
          <BigBtn onClick={doLogin} loading={lLoading} label={lLoading ? 'Connexion…' : 'Se connecter'}/>
          <div style={{ textAlign:'center', marginTop:'12px', fontSize:'11px', color:'#334155',
            padding:'7px 10px', background:'rgba(255,255,255,0.03)', borderRadius:'8px' }}>
            Test : admin@agrobiotech.ma · Admin2024!
          </div>
        </>)}

        {/* ── SIGNUP ── */}
        {tab === 'signup' && (<>
          <AlertBox msg={sErr} />
          <AlertBox msg={sOk} type="success" />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:'10px', marginBottom:'14px' }}>
            <div><Label>Prénom *</Label><TextInput value={sFirst} onChange={setSFirst} placeholder="Jean"/></div>
            <div><Label>Nom *</Label><TextInput value={sLast} onChange={setSLast} placeholder="Dupont"/></div>
          </div>
          <Field>
            <Label>Unité assignée *</Label>
            <select value={sUnit} onChange={e => setSUnit(e.target.value)} style={{
              width:'100%', padding:'12px 14px', borderRadius:'12px',
              border:'1px solid rgba(255,255,255,0.09)',
              background:'rgba(22,35,56,0.95)', color:'#F8FAFC',
              fontSize:'14px', fontFamily:'inherit', outline:'none',
              cursor:'pointer', WebkitAppearance:'none', boxSizing:'border-box',
            }}>
              {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </Field>
          <Field><Label>Adresse email *</Label><TextInput value={sEmail} onChange={setSEmail} type="email" placeholder="nom@exemple.com"/></Field>
          <Field>
            <Label>Mot de passe * <span style={{color:'#475569',fontWeight:400}}>(min. 8 car.)</span></Label>
            <PwdInput value={sPwd} onChange={setSPwd} show={sShow1} setShow={setSShow1}/>
          </Field>
          <Field>
            <Label>Confirmer le mot de passe *</Label>
            <PwdInput value={sPwd2} onChange={setSPwd2} show={sShow2} setShow={setSShow2}/>
          </Field>
          <div style={{ padding:'9px 12px', borderRadius:'10px', marginBottom:'12px',
            background:'rgba(59,130,246,0.07)', border:'1px solid rgba(59,130,246,0.18)',
            fontSize:'12px', color:'#93C5FD', display:'flex', alignItems:'center', gap:'8px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            Un code de vérification sera envoyé à votre email
          </div>
          <Field>
            <Label>Code d'invitation *</Label>
            <input
              type="text"
              value={sCode}
              onChange={e => setSCode(e.target.value)}
              placeholder="Code fourni par l'administrateur"
              style={{
                width:'100%', padding:'12px 14px',
                border:'1px solid rgba(255,255,255,0.09)',
                borderRadius:'12px', fontSize:'14px', fontFamily:'inherit',
                outline:'none', background:'rgba(255,255,255,0.06)',
                color:'#F8FAFC', boxSizing:'border-box', transition:'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor='#22C55E'}
              onBlur={e  => e.target.style.borderColor='rgba(255,255,255,0.09)'}
            />
            <div style={{fontSize:'11px',color:'#475569',marginTop:'5px'}}>
              Contactez un administrateur IAV pour obtenir ce code
            </div>
          </Field>
          <BigBtn onClick={doSignup} loading={sLoading} label={sLoading ? 'Création…' : 'Créer mon compte'}/>
        </>)}

        {/* ── VERIFY ── */}
        {tab === 'verify' && (<>
          <div style={{ textAlign:'center', marginBottom:'20px' }}>
            <div style={{ fontSize:'36px', marginBottom:'10px' }}>📧</div>
            <div style={{ fontSize:'16px', fontWeight:'700', color:'#F8FAFC', marginBottom:'6px' }}>
              Vérifiez votre email
            </div>
            <div style={{ fontSize:'12px', color:'#64748B' }}>
              Code envoyé à <strong style={{color:'#22C55E'}}>{vEmail}</strong>
            </div>
          </div>
          <AlertBox msg={vErr} />
          <AlertBox msg={vOk} type="success" />
          <Field>
            <Label>Code à 6 chiffres</Label>
            <input
              type="text" maxLength={6} value={vCode}
              onChange={e => setVCode(e.target.value.replace(/\D/g,''))}
              onKeyDown={e => e.key === 'Enter' && doVerify()}
              placeholder="123456"
              style={{
                width:'100%', padding:'14px',
                border:'1px solid rgba(255,255,255,0.09)',
                borderRadius:'12px', fontSize:'30px', fontFamily:'JetBrains Mono,monospace',
                fontWeight:'700', letterSpacing:'10px', textAlign:'center',
                background:'rgba(255,255,255,0.06)', color:'#F8FAFC',
                outline:'none', boxSizing:'border-box', transition:'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor='#22C55E'}
              onBlur={e  => e.target.style.borderColor='rgba(255,255,255,0.09)'}
            />
          </Field>
          <BigBtn onClick={doVerify} loading={vLoading} label={vLoading ? 'Vérification…' : 'Valider le code'}/>
          <button onClick={() => switchTab('login')} style={{
            display:'block', width:'100%', marginTop:'10px', padding:'9px',
            background:'none', border:'none', color:'#475569',
            fontSize:'12px', fontFamily:'inherit', cursor:'pointer', transition:'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color='#94A3B8'}
          onMouseLeave={e => e.currentTarget.style.color='#475569'}>
            ← Retour à la connexion
          </button>
        </>)}

      </div>
    </div>
  )
}
