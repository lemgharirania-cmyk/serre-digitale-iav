// src/components/layout/Sidebar.jsx
import { useNavigate, useLocation } from 'react-router-dom'

const links = [
  {
    section: 'Supervision',
    items: [
      { id: 'overview',    label: "Vue d'ensemble", path: '/dashboard' },
      { id: 'graphiques',  label: 'Graphiques',     path: '/dashboard/graphiques' },
      { id: 'alertes',     label: 'Alertes',        path: '/dashboard/alertes', badge: true },
    ]
  },
  {
    section: 'Configuration',
    items: [
      { id: 'seuils',  label: 'Seuils agronomiques', path: '/dashboard/seuils' },
      { id: 'export',  label: 'Export de données',   path: '/dashboard/export' },
    ]
  }
]

export default function Sidebar({ alertCount }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const user      = JSON.parse(localStorage.getItem('sdi_user') || '{}')
  const initial   = user.nom?.[0]?.toUpperCase() || 'A'

  function handleLogout() {
    localStorage.removeItem('sdi_token')
    localStorage.removeItem('sdi_user')
    navigate('/login')
  }

  return (
    <aside className="admin-side">
      {/* Brand */}
      <div className="brand">
        <div className="brand-mark">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 3C12 3 5 7 5 13c0 4 3 7 7 7s7-3 7-7c0-6-7-10-7-10z"
              stroke="white" strokeWidth="1.6"/>
            <path d="M12 20V10M9 14l3-2 3 2"
              stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
          </svg>
        </div>
        <div>
          <div className="brand-name">Espace Gérant</div>
          <div className="brand-sub">AgroBioTech · Admin</div>
        </div>
      </div>

      {/* Nav links */}
      {links.map(group => (
        <div key={group.section}>
          <div className="side-sec">{group.section}</div>
          {group.items.map(item => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
            return (
              <div
                key={item.id}
                className={`side-link ${isActive ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                {item.label}
                {item.badge && alertCount > 0 && (
                  <span className="count">{alertCount}</span>
                )}
              </div>
            )
          })}
        </div>
      ))}

      {/* Géoportail public */}
      <div className="side-sec">Navigation</div>
      <a className="side-link" href="/">
        Géoportail public
      </a>

      {/* Footer */}
      <div className="side-foot" style={{ marginTop: 'auto' }}>
        <span className="dot ok"></span>
        <span style={{ flex: 1 }}>Systèmes opérationnels</span>
        <button
          onClick={handleLogout}
          style={{ fontSize: '11px', color: 'var(--green-600)', cursor: 'pointer' }}
        >
          Déconnexion
        </button>
      </div>
    </aside>
  )
}