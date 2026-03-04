import { useMemo } from 'react'
import { computePersonalRecords, fmtPRDate } from '../../utils/personalRecords'

function sub11Context(type, value) {
  if (value == null) return null
  switch (type) {
    case 'longestRide':
      if (value >= 180) return { label: '≥ race distance ✓', color: '#166534' }
      if (value >= 150) return { label: `${(180 - value).toFixed(0)} km to race dist`, color: '#92400E' }
      return { label: 'Build toward 180 km', color: '#DC2626' }
    case 'longestRun':
      if (value >= 30)  return { label: 'Strong long run ✓', color: '#166534' }
      if (value >= 20)  return { label: 'Aim for 30+ km', color: '#92400E' }
      return { label: 'Build toward 30 km', color: '#DC2626' }
    case 'longestSwim':
      if (value >= 3.86) return { label: '≥ race distance ✓', color: '#166534' }
      if (value >= 3)    return { label: 'Close to race dist', color: '#92400E' }
      return { label: 'Build toward 3.86 km', color: '#DC2626' }
    case 'fastestRunPace':
      if (value <= 5.0)  return { label: 'At sub-11h pace ✓', color: '#166534' }
      if (value <= 5.5)  return { label: 'Close to target', color: '#92400E' }
      return { label: 'Target < 5:00/km', color: '#DC2626' }
    default:
      return null
  }
}

function PRTile({ icon, label, value, date, context }) {
  return (
    <div style={{ background: 'var(--color-bg)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1.2 }}>{label}</p>
      </div>

      {value != null ? (
        <>
          <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--color-text-primary)', lineHeight: 1 }}>{value}</p>
          {date && <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{fmtPRDate(date)}</p>}
          {context && (
            <p style={{ fontSize: 12, fontWeight: 600, color: context.color, lineHeight: 1.3 }}>
              {context.label}
            </p>
          )}
        </>
      ) : (
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No data yet</p>
      )}
    </div>
  )
}

export default function PersonalRecords({ workouts }) {
  const prs = useMemo(() => computePersonalRecords(workouts), [workouts])

  const records = [
    {
      icon:    '🚴',
      label:   'Longest Ride',
      value:   prs.longestRide  ? `${prs.longestRide.km} km`  : null,
      date:    prs.longestRide?.date,
      context: sub11Context('longestRide', prs.longestRide?.km),
    },
    {
      icon:    '🏃',
      label:   'Longest Run',
      value:   prs.longestRun   ? `${prs.longestRun.km} km`   : null,
      date:    prs.longestRun?.date,
      context: sub11Context('longestRun', prs.longestRun?.km),
    },
    {
      icon:    '🏊',
      label:   'Longest Swim',
      value:   prs.longestSwim  ? `${prs.longestSwim.km} km`  : null,
      date:    prs.longestSwim?.date,
      context: sub11Context('longestSwim', prs.longestSwim?.km),
    },
    {
      icon:    '⚡',
      label:   'Fastest 5 km Pace',
      value:   prs.fastestRunPace ? `${prs.fastestRunPace.paceDisplay}/km` : null,
      date:    prs.fastestRunPace?.date,
      context: sub11Context('fastestRunPace', prs.fastestRunPace?.minPerKm),
    },
    {
      icon:    '🔥',
      label:   'Best Session TSS',
      value:   prs.bestSessionTSS ? `${prs.bestSessionTSS.tss}` : null,
      date:    prs.bestSessionTSS?.date,
      context: prs.bestSessionTSS?.tss >= 200
        ? { label: 'Race-sim level effort', color: '#166534' }
        : prs.bestSessionTSS?.tss >= 150
          ? { label: 'Strong key session',   color: '#92400E' }
          : null,
    },
    {
      icon:    '📅',
      label:   'Best Week TSS',
      value:   prs.bestWeekTSS ? `${prs.bestWeekTSS.tss}` : null,
      date:    prs.bestWeekTSS?.weekOf,
      context: prs.bestWeekTSS?.tss >= 800
        ? { label: 'Peak-week level ✓', color: '#166534' }
        : prs.bestWeekTSS?.tss >= 600
          ? { label: 'Good build week',   color: '#92400E' }
          : { label: 'Target 700–900 at peak', color: '#DC2626' },
    },
  ]

  return (
    <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Personal Records
        </p>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>All-time bests</p>
      </div>

      {!prs.hasData ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '32px 0', textAlign: 'center' }}>
          <span style={{ fontSize: 32 }}>🏅</span>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>No records yet — start training!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {records.map((r) => (
              <PRTile key={r.label} {...r} />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--color-text-muted)' }}>
            <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>✓</span>
            <span>Sub-11h benchmarks: ride 180 km, run 30 km long, pace &lt; 5:00/km</span>
          </div>
        </>
      )}
    </div>
  )
}
