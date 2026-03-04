import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/workouts', label: 'Workouts', icon: '🏋️' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function Sidebar() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const displayName = user?.email?.split('@')[0] ?? 'Athlete'

  return (
    <aside className="sidebar">
      <div className="sidebar-profile">
        <div className="sidebar-avatar">🏅</div>
        <div className="sidebar-name">{displayName}</div>
        <div className="sidebar-tier">Ironman Athlete</div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-label">Training</div>
        {navItems.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-cta">
        <div className="sidebar-cta-title">🏁 Race Ready</div>
        <div className="sidebar-cta-sub">Stay consistent, finish strong</div>
        <button
          onClick={handleSignOut}
          style={{
            marginTop: 8,
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            color: 'white',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 16px',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            width: '100%',
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
