import { useMemo } from 'react'
import { computeHRZoneDistribution } from '../../utils/hrZones'
import { formatDuration } from '../../utils/ironman'

function NoThresholds() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '24px 0', textAlign: 'center' }}>
      <span style={{ fontSize: 32 }}>💓</span>
      <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>No HR thresholds set.</p>
      <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
        Set your bike and run threshold heart rates in{' '}
        <a href="/settings" style={{ color: 'var(--color-primary)' }}>Settings</a>{' '}
        to see zone distribution.
      </p>
    </div>
  )
}

function NoHRData() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '24px 0', textAlign: 'center' }}>
      <span style={{ fontSize: 32 }}>📡</span>
      <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>No heart rate data in workouts.</p>
      <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
        HR data syncs automatically from Strava when your device records it.
        Log workouts with heart rate to see zone breakdown.
      </p>
    </div>
  )
}

function ZoneRow({ entry, maxPercent }) {
  const { zone, count, minutes, percent } = entry
  const barWidth = maxPercent > 0 ? (percent / maxPercent) * 100 : 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 112, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${zone.bar}`} />
          <span className={`text-xs font-semibold ${zone.text}`}>{zone.label}</span>
          {zone.ideal && <span style={{ fontSize: 12, color: '#22c55e' }}>★</span>}
        </div>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', paddingLeft: 16, lineHeight: 1.3 }}>{zone.desc}</p>
      </div>

      <div style={{ flex: 1, background: '#EEEEF2', borderRadius: 100, height: 10, position: 'relative' }}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${zone.bar}`}
          style={{ width: `${barWidth}%`, opacity: 0.85 }}
        />
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0, width: 80 }}>
        <p className={`text-xs font-bold ${zone.text}`}>{percent}%</p>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
          {count} {count === 1 ? 'session' : 'sessions'}
        </p>
      </div>
    </div>
  )
}

function PolarizationBanner({ polarizationOk, z2Percent, z3Percent }) {
  if (polarizationOk) {
    return (
      <div style={{ display: 'flex', gap: 8, background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: 10, padding: '8px 12px' }}>
        <span style={{ color: '#166534', flexShrink: 0 }}>✓</span>
        <p style={{ fontSize: 12, color: '#166534', lineHeight: 1.5 }}>
          Good polarization — aerobic base is dominant. Keep most training easy and push hard only on key sessions.
        </p>
      </div>
    )
  }

  if (z3Percent >= 20) {
    return (
      <div style={{ display: 'flex', gap: 8, background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: 10, padding: '8px 12px' }}>
        <span style={{ color: '#92400E', flexShrink: 0 }}>⚠</span>
        <p style={{ fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>
          <span style={{ fontWeight: 600 }}>Grey zone alert:</span>{' '}
          {z3Percent}% of training is in Z3 (tempo). For IRONMAN, this zone fatigues you without building specific fitness — shift sessions to easier Z2 or harder Z4 intervals.
        </p>
      </div>
    )
  }

  if (z2Percent < 60) {
    return (
      <div style={{ display: 'flex', gap: 8, background: '#DBEAFE', border: '1px solid #93C5FD', borderRadius: 10, padding: '8px 12px' }}>
        <span style={{ color: '#1E40AF', flexShrink: 0 }}>→</span>
        <p style={{ fontSize: 12, color: '#1E40AF', lineHeight: 1.5 }}>
          Z2 aerobic base at {z2Percent}% — aim for 70–80%. Slow down your easy runs and rides to stay in Z2 and build fat-burning efficiency.
        </p>
      </div>
    )
  }

  return null
}

export default function HRZoneChart({ workouts, profile }) {
  const dist = useMemo(
    () => computeHRZoneDistribution(workouts, profile),
    [workouts, profile]
  )

  const maxPercent = Math.max(...dist.zones.map((z) => z.percent), 1)

  return (
    <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          HR Zone Distribution
        </p>
        {dist.hasData && (
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {dist.totalClassified} sessions · {formatDuration(dist.totalMinutes)}
          </p>
        )}
      </div>

      {!dist.hasThresholds ? (
        <NoThresholds />
      ) : !dist.hasData ? (
        <NoHRData />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {dist.zones.map((entry) => (
              <ZoneRow key={entry.zone.id} entry={entry} maxPercent={maxPercent} />
            ))}
          </div>

          <PolarizationBanner
            polarizationOk={dist.polarizationOk}
            z2Percent={dist.z2Percent}
            z3Percent={dist.z3Percent}
          />

          <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Based on avg HR per session vs your threshold HR. ★ Z2 is the primary IRONMAN training zone — target 70–80% of sessions here.
          </p>
        </>
      )}
    </div>
  )
}
