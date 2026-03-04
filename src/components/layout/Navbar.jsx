import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/workouts', label: 'Workouts' },
  { to: '/settings', label: 'Settings' },
]

export default function Navbar() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className="bg-ironman-navy border-b border-ironman-blue px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <span className="text-ironman-accent font-bold text-lg tracking-wide">
          🏅 IRONMAN Tracker
        </span>

        <div className="flex items-center gap-6">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-ironman-accent'
                    : 'text-gray-400 hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}

          <button
            onClick={handleSignOut}
            className="text-sm text-gray-400 hover:text-white transition-colors ml-2"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
