import { IRONMAN_GOALS, DISCIPLINE_COLORS, DISCIPLINE_ICONS, formatDuration } from '../../utils/ironman'

const DISCIPLINES = ['swim', 'bike', 'run', 'strength']
const LABELS = { swim: 'Swim', bike: 'Bike', run: 'Run', strength: 'Strength' }

export default function Last30Days({ workouts }) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  const recent = workouts.filter((w) => w.date >= cutoffStr)

  const stats = DISCIPLINES.map((type) => {
    const sessions = recent.filter((w) => w.type === type)
    const km = sessions.reduce((sum, w) => sum + (w.distance ?? 0), 0)
    const mins = sessions.reduce((sum, w) => sum + (w.duration ?? 0), 0)
    const goal = IRONMAN_GOALS[type]
    const pct = goal ? Math.min((km / goal) * 100, 100) : null
    return { type, sessions: sessions.length, km: +km.toFixed(1), mins, pct }
  })

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ type, sessions, km, mins, pct }) => {
        const icon       = DISCIPLINE_ICONS[type] || '🏋️'
        const colorClass = DISCIPLINE_COLORS[type] || 'bg-green-500'
        const isStrength = type === 'strength'

        return (
          <div key={type} style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{LABELS[type]}</span>
            </div>

            <div>
              {isStrength ? (
                <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-text-primary)', lineHeight: 1 }}>{formatDuration(mins)}</p>
              ) : (
                <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-text-primary)', lineHeight: 1 }}>
                  {km} <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--color-text-secondary)' }}>km</span>
                </p>
              )}
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                {sessions} session{sessions !== 1 ? 's' : ''}
              </p>
            </div>

            {pct !== null && (
              <>
                <div style={{ background: '#EEEEF2', borderRadius: 100, height: 6, overflow: 'hidden' }}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: -4 }}>
                  {pct.toFixed(0)}% of race distance
                </p>
              </>
            )}

            {isStrength && (
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>strength &amp; conditioning</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
