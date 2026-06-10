// src/components/dashboard/SDICopilot.jsx
// Assistant conversationnel IA — s'intègre dans le Dashboard comme widget flottant
// Usage : <SDICopilot iotData={iotData} lang={lang} isDark={isDark} />

import { useState, useRef, useEffect, useCallback } from 'react'

const API_BASE = 'https://serre-digitale-iav.onrender.com'

// ── Suggestions de questions rapides ─────────────────────
const QUICK_QUESTIONS = {
  FR: [
    "Quelle serre a le VPD le plus élevé ?",
    "Résume l'état de toutes les serres",
    "Y a-t-il des alertes actives ?",
    "La température de S03 est-elle normale ?",
    "Quelle serre consomme le plus d'EC ?",
  ],
  EN: [
    "Which greenhouse has the highest VPD?",
    "Summarize all greenhouse status",
    "Are there any active alerts?",
    "Is S03 temperature within range?",
    "Which greenhouse has the highest EC?",
  ],
  AR: [
    "أي بيت محمي لديه أعلى VPD؟",
    "لخص حالة جميع البيوت المحمية",
    "هل هناك تنبيهات نشطة؟",
    "هل درجة حرارة S03 طبيعية؟",
    "أي بيت محمي لديه أعلى EC؟",
  ],
}

// ── Icônes SVG inline (pas de dépendance externe) ────────
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
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/>
  </svg>
)

// ── Formatte le markdown simple (bold, code inline) ──────
function formatMessage(text) {
  if (!text) return ''
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(34,197,94,0.12);padding:1px 5px;border-radius:4px;font-size:12px;font-family:monospace">$1</code>')
    .replace(/\n/g, '<br/>')
}

// ── Composant Message ─────────────────────────────────────
function Message({ msg, isDark }) {
  const isUser = msg.role === 'user'
  const isError = msg.role === 'error'

  const ink = isDark ? 'rgba(255,255,255,0.85)' : '#111827'
  const inkMuted = isDark ? 'rgba(255,255,255,0.45)' : '#6B7280'
  const bubbleBg = isUser
    ? 'linear-gradient(135deg, #22C55E, #16A34A)'
    : isError
      ? (isDark ? 'rgba(239,68,68,0.15)' : '#FEF2F2')
      : (isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB')
  const bubbleBorder = isUser
    ? 'none'
    : isError
      ? '1px solid rgba(239,68,68,0.3)'
      : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`
  const bubbleColor = isUser ? '#fff' : isError ? '#EF4444' : ink

  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      gap: 8,
      marginBottom: 12,
      alignItems: 'flex-start',
    }}>
      {/* Avatar */}
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: isError
            ? 'rgba(239,68,68,0.15)'
            : 'linear-gradient(135deg, #22C55E20, #06B6D420)',
          border: `1px solid ${isError ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isError ? '#EF4444' : '#22C55E',
          fontSize: 12,
        }}>
          {isError ? '!' : <BotIcon />}
        </div>
      )}

      {/* Bulle */}
      <div style={{ maxWidth: '78%' }}>
        <div style={{
          background: bubbleBg,
          border: bubbleBorder,
          borderRadius: isUser ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
          padding: '10px 14px',
          color: bubbleColor,
          fontSize: 13,
          lineHeight: 1.55,
        }}
          dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
        />
        {msg.timestamp && (
          <div style={{
            fontSize: 10, color: inkMuted, marginTop: 3,
            textAlign: isUser ? 'right' : 'left',
          }}>
            {new Date(msg.timestamp).toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Indicateur de frappe ──────────────────────────────────
function TypingIndicator({ isDark }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-start' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #22C55E20, #06B6D420)',
        border: '1px solid rgba(34,197,94,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#22C55E', fontSize: 12,
      }}>
        <BotIcon />
      </div>
      <div style={{
        background: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        borderRadius: '4px 16px 16px 16px',
        padding: '12px 16px',
        display: 'flex', gap: 4, alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#22C55E',
            opacity: 0.7,
            animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes pulse-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────
export default function SDICopilot({ isDark = false, lang = 'FR', liveData = [] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasGreeted, setHasGreeted] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [streamingContent, setStreamingContent] = useState('')

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const abortRef = useRef(null)

  // Couleurs selon le thème
  const bg = isDark ? '#0B1728' : '#FFFFFF'
  const bgSecondary = isDark ? '#07111F' : '#F8FAFC'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const ink = isDark ? 'rgba(255,255,255,0.9)' : '#111827'
  const inkMuted = isDark ? 'rgba(255,255,255,0.45)' : '#6B7280'
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9'

  // Salutation initiale
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      const hour = new Date().getHours()
      const greet = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bonjour' : 'Bonsoir'
      setMessages([{
        role: 'assistant',
        content: `${greet} ! Je suis **SDI Copilot**, votre assistant intelligent pour le Géoportail AgroBioTech.\n\nJe peux analyser les données live de vos 5 serres, expliquer les alertes, et répondre à vos questions agronomiques. Que souhaitez-vous savoir ?`,
        timestamp: Date.now(),
      }])
      setHasGreeted(true)
    }
  }, [isOpen, hasGreeted])

  // Scroll auto
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent, isLoading])

  // Focus input à l'ouverture
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, isMinimized])

  // Compteur non lus quand minimisé
  useEffect(() => {
    if (isMinimized && messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.role === 'assistant') setUnreadCount(c => c + 1)
    }
  }, [messages])

  const getToken = () => localStorage.getItem('sdi_token')

  const sendMessage = useCallback(async (text) => {
    const userMsg = text || input.trim()
    if (!userMsg || isLoading) return

    setInput('')
    setIsLoading(true)
    setStreamingContent('')

    const newMessages = [
      ...messages,
      { role: 'user', content: userMsg, timestamp: Date.now() }
    ]
    setMessages(newMessages)

    // Historique pour l'API (sans les messages d'erreur)
    const apiMessages = newMessages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: m.content }))
      .slice(-10) // max 10 tours d'historique

    try {
      const response = await fetch(`${API_BASE}/api/copilot/public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          lang: lang.toLowerCase(),
          live_snapshot: liveData.map(s => ({
            code: s.code, nom: s.nom_fr,
            temp: s.env?.temperature, hum: s.env?.humidite,
            vpd: s.env?.vpd, co2: s.env?.co2,
            ph: s.irr?.ph, ec: s.irr?.ec,
          })),
        }),
        signal: abortRef.current?.signal,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.detail || `Erreur ${response.status}`)
      }

      // Lecture du stream SSE
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data)
              if (parsed.error) throw new Error(parsed.error)
              if (parsed.text) {
                accumulated += parsed.text
                setStreamingContent(accumulated)
              }
            } catch (e) {
              if (e.message !== 'Unexpected end of JSON input') {
                console.warn('Parse SSE:', e)
              }
            }
          }
        }
      }

      // Finaliser le message
      if (accumulated) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: accumulated,
          timestamp: Date.now(),
        }])
      }
      setStreamingContent('')

    } catch (err) {
      if (err.name === 'AbortError') return
      setMessages(prev => [...prev, {
        role: 'error',
        content: `Une erreur est survenue : ${err.message}`,
        timestamp: Date.now(),
      }])
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [input, isLoading, messages, lang])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleOpen = () => {
    setIsOpen(true)
    setIsMinimized(false)
    setUnreadCount(0)
  }

  const handleMinimize = () => {
    setIsMinimized(true)
    setUnreadCount(0)
  }

  const handleClose = () => {
    setIsOpen(false)
    setIsMinimized(false)
    // Annuler les requêtes en cours
    abortRef.current?.abort()
  }

  const quickQuestions = QUICK_QUESTIONS[lang] || QUICK_QUESTIONS.FR

  // ── Bouton flottant (fermé) ───────────────────────────
  if (!isOpen) {
    return (
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
      }}>
        <button
          onClick={handleOpen}
          title="SDI Copilot — Assistant IA"
          style={{
            width: 56, height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #22C55E, #16A34A)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(34,197,94,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            fontSize: 22,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.08)'
            e.currentTarget.style.boxShadow = '0 6px 32px rgba(34,197,94,0.5)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 24px rgba(34,197,94,0.4)'
          }}
        >
          <BotIcon />
          {unreadCount > 0 && (
            <div style={{
              position: 'absolute', top: -2, right: -2,
              width: 18, height: 18, borderRadius: '50%',
              background: '#EF4444', color: '#fff',
              fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `2px solid ${isDark ? '#07111F' : '#fff'}`,
            }}>
              {unreadCount}
            </div>
          )}
        </button>

        {/* Tooltip label */}
        <div style={{
          position: 'absolute', bottom: 64, right: 0,
          background: isDark ? '#1E293B' : '#1E293B',
          color: '#fff', fontSize: 11, fontWeight: 600,
          padding: '4px 10px', borderRadius: 8,
          whiteSpace: 'nowrap',
          opacity: 0, pointerEvents: 'none',
          transition: 'opacity 0.2s',
        }}
          className="copilot-tooltip"
        >
          SDI Copilot
        </div>
      </div>
    )
  }

  // ── Fenêtre minimisée ─────────────────────────────────
  if (isMinimized) {
    return (
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
        background: bg, border: `1px solid ${border}`,
        borderRadius: 16, padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.12)',
        cursor: 'pointer',
      }} onClick={() => { setIsMinimized(false); setUnreadCount(0) }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #22C55E, #16A34A)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff',
        }}>
          <BotIcon />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: ink }}>SDI Copilot</div>
          <div style={{ fontSize: 10, color: inkMuted }}>
            {isLoading ? 'En cours...' : 'Cliquer pour continuer'}
          </div>
        </div>
        {unreadCount > 0 && (
          <div style={{
            width: 18, height: 18, borderRadius: '50%',
            background: '#EF4444', color: '#fff',
            fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unreadCount}
          </div>
        )}
      </div>
    )
  }

  // ── Fenêtre principale ────────────────────────────────
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
      width: 380, height: 560,
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 20,
      boxShadow: isDark
        ? '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,197,94,0.1)'
        : '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(34,197,94,0.08)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: '"DM Sans", system-ui, sans-serif',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '14px 16px',
        background: isDark
          ? 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(6,182,212,0.08))'
          : 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(6,182,212,0.04))',
        borderBottom: `1px solid ${border}`,
        display: 'flex', alignItems: 'center', gap: 10,
        flexShrink: 0,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #22C55E, #16A34A)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', flexShrink: 0,
        }}>
          <BotIcon />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: ink,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            SDI Copilot
            <span style={{
              fontSize: 9, fontWeight: 600, padding: '2px 6px',
              borderRadius: 4, background: 'rgba(34,197,94,0.15)',
              color: '#22C55E', letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>LIVE</span>
          </div>
          <div style={{ fontSize: 11, color: inkMuted }}>
            AgroBioTech · IAV Hassan II
          </div>
        </div>
        <button onClick={handleMinimize} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: inkMuted, padding: 4, borderRadius: 6,
          display: 'flex', alignItems: 'center',
        }}>
          <MinimizeIcon />
        </button>
        <button onClick={handleClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: inkMuted, padding: 4, borderRadius: 6,
          display: 'flex', alignItems: 'center',
        }}>
          <CloseIcon />
        </button>
      </div>

      {/* ── Zone messages ── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        scrollbarWidth: 'thin',
        scrollbarColor: `${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} transparent`,
      }}>
        {/* Messages */}
        {messages.map((msg, i) => (
          <Message key={i} msg={msg} isDark={isDark} />
        ))}

        {/* Streaming en cours */}
        {isLoading && !streamingContent && <TypingIndicator isDark={isDark} />}
        {streamingContent && (
          <Message
            msg={{ role: 'assistant', content: streamingContent + '▋' }}
            isDark={isDark}
          />
        )}

        {/* Questions rapides (si pas encore de message utilisateur) */}
        {messages.length <= 1 && !isLoading && (
          <div style={{ marginTop: 4 }}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: inkMuted,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <SparkleIcon />
              Questions suggérées
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {quickQuestions.map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)} style={{
                  background: isDark ? 'rgba(34,197,94,0.06)' : 'rgba(34,197,94,0.04)',
                  border: `1px solid ${isDark ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.15)'}`,
                  borderRadius: 10, padding: '8px 12px',
                  fontSize: 12, color: ink,
                  textAlign: 'left', cursor: 'pointer',
                  transition: 'background 0.15s',
                }} onMouseEnter={e => {
                  e.currentTarget.style.background = isDark
                    ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.08)'
                }} onMouseLeave={e => {
                  e.currentTarget.style.background = isDark
                    ? 'rgba(34,197,94,0.06)' : 'rgba(34,197,94,0.04)'
                }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Zone saisie ── */}
      <div style={{
        padding: '12px 14px',
        borderTop: `1px solid ${border}`,
        background: bgSecondary,
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'flex-end',
          background: inputBg,
          border: `1px solid ${border}`,
          borderRadius: 14, padding: '8px 12px',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              lang === 'EN' ? 'Ask about your greenhouses...' :
              lang === 'AR' ? '...اسأل عن البيوت المحمية' :
              'Posez votre question sur les serres...'
            }
            rows={1}
            disabled={isLoading}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              resize: 'none', color: ink, fontSize: 13, lineHeight: 1.5,
              fontFamily: 'inherit', maxHeight: 80,
              direction: lang === 'AR' ? 'rtl' : 'ltr',
            }}
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px'
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: input.trim() && !isLoading
                ? 'linear-gradient(135deg, #22C55E, #16A34A)'
                : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
              border: 'none', cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
              color: input.trim() && !isLoading ? '#fff' : inkMuted,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            <SendIcon />
          </button>
        </div>

        <div style={{
          fontSize: 10, color: inkMuted, textAlign: 'center', marginTop: 6,
        }}>
          Données live IAV · Claude AI
        </div>
      </div>
    </div>
  )
}
