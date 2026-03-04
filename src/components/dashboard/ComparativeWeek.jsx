import { useMemo } from 'react'
import { buildWeeklyHistory, findBestWeek, getWeekNAgo } from '../../utils/weeklyHistory'

const METRICS = [
  { key: 'swim', label: 'Swim', unit: 'km', bar: 'bg-blue-500',   icon: '🏊' },
  { key: 'bike', label: 'Bike', unit: 'km', bar: 'bg-yellow-500', icon: '🚴' },
  { key: 'run',  label: 'Run',  unit: 'km', bar: 'bg-red-500',    icon: '🏃' },
  { key: 'tss',  label: 'TSS',  unit: '',   bar: 'bg-purple-500', icon: '⚡' },
]

function MetricBlock({ metric, weeks, maxes }) {
  const { key, label, unit, bar, icon } = metric
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{icon} {label}</p>
      <div className="grid grid-cols-3 gap-2">
        {weeks.map((week, i) => {
          const val  = week?.[key] ?? null
          const pct  = val !== null ? Math.min((val / (maxes[key] || 1)) * 100, 100) : 0
          const gold = val !== null && val > 0 && val === maxes[key]
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: gold ? 'var(--color-run)' : 'var(--color-text-primary)' }}>
                {val !== null ? `${val}${unit ? ` ${unit}` : ''}` : '—'}
              </span>
              <div style={{ height: 6, background: '#EEEEF2', borderRadius: 100, overflow: 'hidden' }}>
                {val !== null && (
                  <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ComparativeWeek({ workouts }) {
  const { thisWeek, week4, bestWeek, maxes, tssChange } = useMemo(() => {
    const history  = buildWeeklyHistory(workouts, 20)
    const thisWeek = getWeekNAgo(history, 0)
    const week4    = getWeekNAgo(history, 4)
    const bestWeek = findBestWeek(history, 'tss')

    const maxes = {}
    METRICS.forEach(({ key }) => {
      maxes[key] = Math.max(thisWeek?.[key] || 0, week4?.[key] || 0, bestWeek?.[key] || 0, 1)
    })

    const tssChange =
      thisWeek?.tss && week4?.tss
        ? Math.round(((thisWeek.tss - week4.tss) / week4.tss) * 100)
        : null

    return { thisWeek, week4, bestWeek, maxes, tssChange }
  }, [workouts])

  const COLS = [
    { label: 'This Week',   sub: thisWeek?.label,  data: thisWeek },
    { label: '4 Weeks Ago', sub: week4?.label,     data: week4 },
    { label: 'Best Week',   sub: bestWeek?.label,  data: bestWeek },
  ]

  return (
    <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <h3 style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Weekly Comparison</h3>
        {tssChange !== null && (
          <span style={{
            fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 999,
            background: tssChange >= 0 ? '#DCFCE7' : '#FEE2E2',
            color: tssChange >= 0 ? '#15803D' : '#DC2626',
          }}>
            {tssChange >= 0 ? '+' : ''}{tssChange}% TSS vs 4w ago
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {COLS.map(({ label, sub }, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>{label}</p>
            {sub && <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{sub}</p>}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {METRICS.map(metric => (
          <MetricBlock
            key={metric.key}
            metric={metric}
            weeks={COLS.map(c => c.data)}
            maxes={maxes}
          />
        ))}
      </div>

      {workouts.length === 0 && (
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: '8px 0' }}>
          Log workouts to see weekly comparisons
        </p>
      )}

      <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
        🥇 Gold = highest value across the three columns
      </p>
    </div>
  )
}
