import { getWeekWorkouts, calcProgress, totalDuration, formatDuration, DISCIPLINE_ICONS } from '../../utils/ironman'

const TRIATHLON = ['swim', 'bike', 'run']
const ALL_DISCIPLINES = ['swim', 'bike', 'run', 'strength']

const SPORT_BG = {
  swim: 'var(--color-swim-light)',
  bike: 'var(--color-bike-light)',
  run: 'var(--color-run-light)',
  strength: '#F3F4F6',
}

export default function WeeklySummary({ workouts }) {
  const weekWorkouts = getWeekWorkouts(workouts)
  const totalMins = totalDuration(weekWorkouts)
  const totalSessions = weekWorkouts.length

  return (
    <section>
      <h2 className="section-title">This Week</h2>

      <div className="chart-card">
        {/* Summary row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 32, marginBottom: 20,
          paddingBottom: 16, borderBottom: '1.5px solid var(--color-border)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 28, color: 'var(--color-text-primary)', lineHeight: 1 }}>
              {totalSessions}
            </p>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              {totalSessions === 1 ? 'session' : 'sessions'}
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 28, color: 'var(--color-text-primary)', lineHeight: 1 }}>
              {formatDuration(totalMins)}
            </p>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>total time</p>
          </div>
        </div>

        {/* Per-discipline breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {ALL_DISCIPLINES.map((type) => {
            const isTriathlon = TRIATHLON.includes(type)
            const { total } = isTriathlon ? calcProgress(weekWorkouts, type) : { total: 0 }
            const sessions = weekWorkouts.filter((w) => w.type === type).length
            const mins = totalDuration(weekWorkouts.filter((w) => w.type === type))

            return (
              <div key={type} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: SPORT_BG[type] || '#F3F4F6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>
                  {DISCIPLINE_ICONS[type]}
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--color-text-primary)' }}>
                  {isTriathlon
                    ? (total > 0 ? `${total} km` : '—')
                    : (mins > 0 ? formatDuration(mins) : '—')
                  }
                </p>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  {sessions > 0
                    ? `${sessions} × ${formatDuration(Math.round(mins / sessions))} avg`
                    : 'no sessions'}
                </p>
              </div>
            )
          })}
        </div>

        {weekWorkouts.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13, marginTop: 8 }}>
            No workouts logged this week yet.
          </p>
        )}
      </div>
    </section>
  )
}
