import { IRONMAN_GOALS, DISCIPLINE_COLORS, DISCIPLINE_ICONS } from '../../utils/ironman'

export default function ProgressBar({ type, total, percent }) {
  const goal = IRONMAN_GOALS[type]
  const colorClass = DISCIPLINE_COLORS[type]
  const icon = DISCIPLINE_ICONS[type]
  const label = type.charAt(0).toUpperCase() + type.slice(1)
  const remaining = Math.max(goal - total, 0).toFixed(2)

  return (
    <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{label}</span>
        </div>
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          {total} / {goal} km
        </span>
      </div>

      <div style={{ background: '#EEEEF2', borderRadius: 100, height: 8, overflow: 'hidden' }}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-secondary)' }}>
        <span>{percent}% complete</span>
        {remaining > 0 ? (
          <span>{remaining} km to go</span>
        ) : (
          <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Goal reached!</span>
        )}
      </div>
    </div>
  )
}
