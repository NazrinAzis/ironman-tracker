import { daysUntil } from '../../utils/ironman'

export default function RaceCountdown({ raceDate }) {
  const days = daysUntil(raceDate)

  if (!raceDate) {
    return (
      <div className="countdown-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🏁</div>
        <div className="countdown-label">No race date set</div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Go to Settings to add your race day</div>
      </div>
    )
  }

  const raceLabel = new Date(raceDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  if (days < 0) {
    return (
      <div className="countdown-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🏅</div>
        <div className="countdown-days" style={{ fontSize: 36 }}>Done!</div>
        <div className="countdown-label">Race day was {raceLabel}</div>
      </div>
    )
  }

  if (days === 0) {
    return (
      <div className="countdown-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🔥</div>
        <div className="countdown-days" style={{ fontSize: 36 }}>RACE DAY!</div>
        <div className="countdown-label">{raceLabel}</div>
      </div>
    )
  }

  // Progress ring — assumes ~140-day (20-week) training block
  const totalDays = 140
  const elapsed = Math.max(0, totalDays - days)
  const progress = Math.min(elapsed / totalDays, 1)
  const r = 36
  const cx = 44
  const cy = 44
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - progress)

  return (
    <div className="countdown-card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
      <svg width={88} height={88} style={{ flexShrink: 0 }}>
        <circle className="progress-ring-bg" cx={cx} cy={cy} r={r} strokeWidth={6} />
        <circle
          className="progress-ring-circle"
          cx={cx}
          cy={cy}
          r={r}
          strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      <div>
        <div style={{ fontSize: 11, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          Race Countdown
        </div>
        <div className="countdown-days">{days}</div>
        <div className="countdown-label">{days === 1 ? 'day' : 'days'} to go</div>
        <div style={{ fontSize: 11, opacity: 0.65, marginTop: 6 }}>{raceLabel}</div>
      </div>
    </div>
  )
}
