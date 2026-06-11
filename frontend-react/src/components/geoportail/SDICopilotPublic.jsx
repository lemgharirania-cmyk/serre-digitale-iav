// src/components/geoportail/SDICopilotPublic.jsx
// Version PUBLIQUE du copilot — sans JWT, données IoT live injectées côté client
// Appelle /api/copilot/public (endpoint sans auth)

import { useState, useRef, useEffect, useCallback } from 'react'

const API_BASE = 'https://serre-digitale-iav.onrender.com'

const QUICK_QUESTIONS = {
  FR: [
    "Quelle serre a la température la plus élevée ?",
    "Quelles sont les conditions actuelles de S04 Hydroponie ?",
    "Le VPD est-il optimal dans toutes les serres ?",
    "C'est quoi l'AgroBioTech ?",
  ],
  EN: [
    "Which greenhouse has the highest temperature?",
    "What are current conditions in S04 Hydroponics?",
    "Is VPD optimal across all greenhouses?",
    "What is the AgroBioTech campus?",
  ],
  AR: [
    "أي بيت محمي لديه أعلى درجة حرارة؟",
    "ما هي الظروف الحالية في S04؟",
    "هل مستوى VPD مثالي في جميع البيوت؟",
    "ما هو مجمع AgroBioTech؟",
  ],
}

const BotIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/>
    <path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>
  </svg>
)
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const MinimizeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const SparkleIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/>
  </svg>
)

function formatMessage(text) {
  if (!text) return ''
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(34,197,94,0.12);padding:1px 5px;border-radius:4px;font-size:12px;font-family:monospace">$1</code>')
    .replace(/\n/g, '<br/>')
}

function Message({ msg, isDark }) {
  const isUser  = msg.role === 'user'
  const isError = msg.role === 'error'
  const ink     = isDark ? 'rgba(255,255,255,0.85)' : '#111827'
  const inkMuted = isDark ? 'rgba(255,255,255,0.45)' : '#6B7280'

  const bubbleBg = isUser
    ? 'linear-gradient(135deg, #22C55E, #16A34A)'
    : isError
      ? (isDark ? 'rgba(239,68,68,0.15)' : '#FEF2F2')
      : (isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB')
  const bubbleBorder = isUser ? 'none'
    : isError ? '1px solid rgba(239,68,68,0.3)'
    : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`
  const bubbleColor = isUser ? '#fff' : isError ? '#EF4444' : ink

  return (
    <div style={{ display:'flex', flexDirection: isUser ? 'row-reverse' : 'row', gap:8, marginBottom:12, alignItems:'flex-start' }}>
      {!isUser && (
        <div style={{
          width:28, height:28, borderRadius:'50%', flexShrink:0,
          background: isError ? 'rgba(239,68,68,0.15)' : 'linear-gradient(135deg,#22C55E20,#06B6D420)',
          border:`1px solid ${isError ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          color: isError ? '#EF4444' : '#22C55E', fontSize:12,
        }}>
          {isError ? '!' : <BotIcon />}
        </div>
      )}
      <div style={{ maxWidth:'78%' }}>
        <div style={{
          background: bubbleBg, border: bubbleBorder,
          borderRadius: isUser ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
          padding:'10px 14px', color: bubbleColor, fontSize:13, lineHeight:1.55,
        }} dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
        {msg.timestamp && (
          <div style={{ fontSize:10, color:inkMuted, marginTop:3, textAlign: isUser ? 'right' : 'left' }}>
            {new Date(msg.timestamp).toLocaleTimeString('fr-MA', { hour:'2-digit', minute:'2-digit' })}
          </div>
        )}
      </div>
    </div>
  )
}

function TypingIndicator({ isDark }) {
  return (
    <div style={{ display:'flex', gap:8, marginBottom:12, alignItems:'flex-start' }}>
      <div style={{
        width:28, height:28, borderRadius:'50%', flexShrink:0,
        background:'linear-gradient(135deg,#22C55E20,#06B6D420)',
        border:'1px solid rgba(34,197,94,0.3)',
        display:'flex', alignItems:'center', justifyContent:'center', color:'#22C55E',
      }}><BotIcon /></div>
      <div style={{
        background: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB',
        border:`1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        borderRadius:'4px 16px 16px 16px', padding:'12px 16px',
        display:'flex', gap:4, alignItems:'center',
      }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width:6, height:6, borderRadius:'50%', background:'#22C55E', opacity:0.7,
            animation:`pd 1.2s ease-in-out ${i*0.2}s infinite`,
          }} />
        ))}
      </div>
      <style>{`@keyframes pd{0%,80%,100%{transform:scale(.6);opacity:.4}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  )
}

export default function SDICopilotPublic({ isDark = true, lang = 'FR', liveData = [], bottomOffset = 24 }) {
  const [isOpen,     setIsOpen]     = useState(false)
  const [isMin,      setIsMin]      = useState(false)
  const [messages,   setMessages]   = useState([])
  const [input,      setInput]      = useState('')
  const [isLoading,  setIsLoading]  = useState(false)
  const [greeted,    setGreeted]    = useState(false)
  const [unread,     setUnread]     = useState(0)
  const [streaming,  setStreaming]  = useState('')

  const endRef   = useRef(null)
  const inputRef = useRef(null)

  const bg          = isDark ? '#0B1728' : '#FFFFFF'
  const bgSecondary = isDark ? '#07111F' : '#F8FAFC'
  const border      = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const ink         = isDark ? 'rgba(255,255,255,0.9)' : '#111827'
  const inkMuted    = isDark ? 'rgba(255,255,255,0.45)' : '#6B7280'
  const inputBg     = isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9'

  // Greeting
  useEffect(() => {
    if (isOpen && !greeted) {
      const h = new Date().getHours()
      const greet = h < 12 ? 'Bonjour' : h < 18 ? 'Bonjour' : 'Bonsoir'
      setMessages([{
        role: 'assistant',
        content: `${greet} ! Je suis **SDI Copilot**, l'assistant du Géoportail AgroBioTech.\n\nJe peux vous informer sur les 5 serres du campus IAV Hassan II et leurs données en temps réel. Que souhaitez-vous savoir ?`,
        timestamp: Date.now(),
      }])
      setGreeted(true)
    }
  }, [isOpen, greeted])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, streaming, isLoading])
  useEffect(() => { if (isOpen && !isMin) setTimeout(() => inputRef.current?.focus(), 100) }, [isOpen, isMin])
  useEffect(() => { if (isMin) { const last = messages[messages.length-1]; if (last?.role==='assistant') setUnread(c=>c+1) } }, [messages])

  const sendMessage = useCallback(async (text) => {
    const userMsg = text || input.trim()
    if (!userMsg || isLoading) return
    setInput('')
    setIsLoading(true)
    setStreaming('')

    const newMessages = [...messages, { role:'user', content:userMsg, timestamp:Date.now() }]
    setMessages(newMessages)

    // Préparer un résumé compact des données live à envoyer
    const liveSnapshot = liveData.map(s => ({
      code: s.code, nom: s.nom_fr,
      temp: s.env?.temperature, hum: s.env?.humidite,
      vpd: s.env?.vpd, co2: s.env?.co2,
      ph: s.irr?.ph, ec: s.irr?.ec,
    }))

    const apiMessages = newMessages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: m.content }))
      .slice(-8)

    try {
      const response = await fetch(`${API_BASE}/api/copilot/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          lang: lang.toLowerCase(),
          live_snapshot: liveSnapshot,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.detail || `Erreur ${response.status}`)
      }

      const reader  = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.text) { accumulated += parsed.text; setStreaming(accumulated) }
          } catch (e) { if (e.message !== 'Unexpected end of JSON input') console.warn(e) }
        }
      }

      if (accumulated) setMessages(prev => [...prev, { role:'assistant', content:accumulated, timestamp:Date.now() }])
      setStreaming('')
    } catch (err) {
      setMessages(prev => [...prev, { role:'error', content:`Erreur : ${err.message}`, timestamp:Date.now() }])
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [input, isLoading, messages, lang, liveData])

  const handleKeyDown = e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }

  const quickQs = QUICK_QUESTIONS[lang] || QUICK_QUESTIONS.FR

  // ── Bouton flottant fermé ─────────────────────────────
  if (!isOpen) return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:1000 }}>
      <button onClick={() => { setIsOpen(true); setIsMin(false); setUnread(0) }}
        title="SDI Copilot — Assistant IA"
        style={{
          width:56, height:56, borderRadius:'50%',
          background:'linear-gradient(135deg,#22C55E,#16A34A)',
          border:'none', cursor:'pointer',
          boxShadow:'0 4px 24px rgba(34,197,94,0.4)',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'#fff', fontSize:22, position:'relative',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform='scale(1.08)'; e.currentTarget.style.boxShadow='0 6px 32px rgba(34,197,94,0.5)' }}
        onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 4px 24px rgba(34,197,94,0.4)' }}
      >
        <BotIcon />
        {unread > 0 && (
          <div style={{ position:'absolute', top:-2, right:-2, width:18, height:18, borderRadius:'50%',
            background:'#EF4444', color:'#fff', fontSize:10, fontWeight:700,
            display:'flex', alignItems:'center', justifyContent:'center',
            border:`2px solid ${isDark ? '#07111F' : '#fff'}` }}>
            {unread}
          </div>
        )}
      </button>
    </div>
  )

  // ── Minimisé ──────────────────────────────────────────
  if (isMin) return (
    <div style={{
      position:'fixed', bottom:bottomOffset, right:24, zIndex:1000,
      background:bg, border:`1px solid ${border}`, borderRadius:16,
      padding:'10px 16px', display:'flex', alignItems:'center', gap:10,
      boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.12)',
      cursor:'pointer',
    }} onClick={() => { setIsMin(false); setUnread(0) }}>
      <div style={{ width:32, height:32, borderRadius:'50%',
        background:'linear-gradient(135deg,#22C55E,#16A34A)',
        display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
        <BotIcon />
      </div>
      <div>
        <div style={{ fontSize:12, fontWeight:600, color:ink }}>SDI Copilot</div>
        <div style={{ fontSize:10, color:inkMuted }}>{isLoading ? 'En cours...' : 'Reprendre'}</div>
      </div>
      {unread > 0 && (
        <div style={{ width:18, height:18, borderRadius:'50%', background:'#EF4444', color:'#fff',
          fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {unread}
        </div>
      )}
    </div>
  )

  // ── Fenêtre principale ────────────────────────────────
  return (
    <div style={{
      position:'fixed', bottom:bottomOffset, right:24, zIndex:1000,
      width:380, height:560,
      background:bg, border:`1px solid ${border}`, borderRadius:20,
      boxShadow: isDark
        ? '0 20px 60px rgba(0,0,0,0.5),0 0 0 1px rgba(34,197,94,0.1)'
        : '0 20px 60px rgba(0,0,0,0.15),0 0 0 1px rgba(34,197,94,0.08)',
      display:'flex', flexDirection:'column', overflow:'hidden',
      fontFamily:'"DM Sans",system-ui,sans-serif',
    }}>

      {/* Header */}
      <div style={{
        padding:'14px 16px',
        background: isDark
          ? 'linear-gradient(135deg,rgba(34,197,94,0.12),rgba(6,182,212,0.08))'
          : 'linear-gradient(135deg,rgba(34,197,94,0.06),rgba(6,182,212,0.04))',
        borderBottom:`1px solid ${border}`,
        display:'flex', alignItems:'center', gap:10, flexShrink:0,
      }}>
        <div style={{ width:36, height:36, borderRadius:'50%',
          background:'linear-gradient(135deg,#22C55E,#16A34A)',
          display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', flexShrink:0 }}>
          <BotIcon />
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:700, color:ink, display:'flex', alignItems:'center', gap:6 }}>
            SDI Copilot
            <span style={{ fontSize:9, fontWeight:600, padding:'2px 6px', borderRadius:4,
              background:'rgba(34,197,94,0.15)', color:'#22C55E',
              letterSpacing:'0.05em', textTransform:'uppercase' }}>PUBLIC</span>
          </div>
          <div style={{ fontSize:11, color:inkMuted }}>AgroBioTech · IAV Hassan II</div>
        </div>
        <button onClick={() => setIsMin(true)} style={{ background:'none', border:'none', cursor:'pointer', color:inkMuted, padding:4, borderRadius:6, display:'flex', alignItems:'center' }}><MinimizeIcon /></button>
        <button onClick={() => setIsOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:inkMuted, padding:4, borderRadius:6, display:'flex', alignItems:'center' }}><CloseIcon /></button>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px',
        scrollbarWidth:'thin',
        scrollbarColor:`${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} transparent` }}>
        {messages.map((msg,i) => <Message key={i} msg={msg} isDark={isDark} />)}
        {isLoading && !streaming && <TypingIndicator isDark={isDark} />}
        {streaming && <Message msg={{ role:'assistant', content:streaming+'▋' }} isDark={isDark} />}

        {/* Questions rapides */}
        {messages.length <= 1 && !isLoading && (
          <div style={{ marginTop:4 }}>
            <div style={{ fontSize:10, fontWeight:600, color:inkMuted,
              textTransform:'uppercase', letterSpacing:'0.06em',
              marginBottom:8, display:'flex', alignItems:'center', gap:4 }}>
              <SparkleIcon /> Questions suggérées
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {quickQs.map((q,i) => (
                <button key={i} onClick={() => sendMessage(q)} style={{
                  background: isDark ? 'rgba(34,197,94,0.06)' : 'rgba(34,197,94,0.04)',
                  border:`1px solid ${isDark ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.15)'}`,
                  borderRadius:10, padding:'8px 12px',
                  fontSize:12, color:ink, textAlign:'left', cursor:'pointer',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = isDark ? 'rgba(34,197,94,0.06)' : 'rgba(34,197,94,0.04)'}
                >{q}</button>
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ padding:'12px 14px', borderTop:`1px solid ${border}`, background:bgSecondary, flexShrink:0 }}>
        <div style={{ display:'flex', gap:8, alignItems:'flex-end',
          background:inputBg, border:`1px solid ${border}`, borderRadius:14, padding:'8px 12px' }}>
          <textarea
            ref={inputRef} value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={lang==='EN' ? 'Ask about the greenhouses...' : lang==='AR' ? '...اسأل عن البيوت المحمية' : 'Posez votre question sur les serres...'}
            rows={1} disabled={isLoading}
            style={{ flex:1, background:'none', border:'none', outline:'none',
              resize:'none', color:ink, fontSize:13, lineHeight:1.5,
              fontFamily:'inherit', maxHeight:80,
              direction: lang==='AR' ? 'rtl' : 'ltr' }}
            onInput={e => { e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,80)+'px' }}
          />
          <button onClick={() => sendMessage()} disabled={!input.trim()||isLoading} style={{
            width:32, height:32, borderRadius:10, flexShrink:0,
            background: input.trim()&&!isLoading ? 'linear-gradient(135deg,#22C55E,#16A34A)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
            border:'none', cursor: input.trim()&&!isLoading ? 'pointer' : 'not-allowed',
            color: input.trim()&&!isLoading ? '#fff' : inkMuted,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}><SendIcon /></button>
        </div>
        <div style={{ fontSize:10, color:inkMuted, textAlign:'center', marginTop:6 }}>
          Données live IAV · Gemini AI · Accès public
        </div>
      </div>
    </div>
  )
}
