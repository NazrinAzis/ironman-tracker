import { useMemo } from 'react'
import {
  computeGoalReadiness,
  formatDecimalPace,
  CTL_TARGET,
} from '../../utils/goalReadiness'

const STATUS_STYLES = {
  green: { bg: '#DCFCE7', text: '#166534', badge: { bg: '#BBF7D0', color: '#166534', border: '#86EFAC' } },
  amber: { bg: '#FEF9C3', text: '#92400E', badge: { bg: '#FEF08A', color: '#92400E', border: '#FDE047' } },
  blue:  { bg: '#DBEAFE', text: '#1E40AF', badge: { bg: '#BFDBFE', color: '#1E40AF', border: '#93C5FD' } },
  red:   { bg: '#FEE2E2', text: '#991B1B', badge: { bg: '#FECACA', color: '#991B1B', border: '#FCA5A5' } },
}

const THRESHOLD_STATUS_STYLES = {
  met:     { dot: '#22c55e', label: '#166534' },
  close:   { dot: '#EAB308', label: '#92400E' },
  gap:     { dot: '#EF4444', label: '#991B1B' },
  unknown: { dot: '#CBD5E1', label: '#8A8FA8' },
}

const SPLITS = [
  { icon: '🏊', discipline: 'Swim', time: '1:15:00', dist: '3.86 km', threshold: '≤ 1:45/100m CSS' },
  { icon: '🚴', discipline: 'Bike', time: '5:30:00', dist: '180 km',  threshold: '≥ 220W FTP'      },
  { icon: '🏃', discipline: 'Run',  time: '4:05:00', dist: '42.2 km', threshold: '≤ 5:00/km pace'  },
]

function GoalReadinessEmpty() {
  return (
    <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12 }}>
      <span style={{ fontSize: 40 }}>🎯</span>
      <p style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>No training data yet</p>
      <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', maxWidth: 280 }}>
        Log workouts or{' '}
        <a href="/settings" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
          connect Strava
        </a>{' '}
        to see your sub-11h readiness assessment.
      </p>
    </div>
  )
}

function StatusHeader({ status }) {
  const s = STATUS_STYLES[status.color]
  return (
    <div style={{ background: s.bg, borderRadius: 12, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <p style={{ fontSize: 11, color: s.text, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          Sub-11h IRONMAN · Goal Readiness
        </p>
        <p style={{ fontSize: 22, fontWeight: 900, color: s.text, lineHeight: 1.1 }}>{status.label}</p>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 999, flexShrink: 0, background: s.badge.bg, color: s.badge.color, border: `1px solid ${s.badge.border}` }}>
        {status.score} / 5
      </span>
    </div>
  )
}

function TargetSplitRow() {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        Target Splits
      </p>
      <div className="grid grid-cols-3 gap-3">
        {SPLITS.map((s) => (
          <div
            key={s.discipline}
            style={{ background: 'var(--color-bg)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4 }}
          >
            <span style={{ fontSize: 20 }}>{s.icon}</span>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.discipline}</p>
            <p style={{ fontSize: 18, fontWeight: 900, color: 'var(--color-text-primary)', lineHeight: 1 }}>{s.time}</p>
            <p style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 600 }}>{s.threshold}</p>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{s.dist}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CTLProgressSection({ ctlProgress, projection, hasRaceDate }) {
  const { current, target, percent, gap, status } = ctlProgress
  const barColor =
    status === 'met'   ? '#22c55e' :
    status === 'close' ? '#EAB308' :
    '#EF4444'

  const projPct =
    projection.projectedCTL != null
      ? Math.min((projection.projectedCTL / target) * 100, 100)
      : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-secondary)' }}>
        <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Fitness · CTL toward {target}</span>
        <span>
          <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{current.toFixed(0)}</span>
          <span style={{ color: 'var(--color-text-muted)' }}> / {target}</span>
          {gap > 0 && <span style={{ color: 'var(--color-text-muted)', marginLeft: 4 }}>({gap.toFixed(0)} to go)</span>}
        </span>
      </div>

      <div style={{ position: 'relative', width: '100%', background: '#EEEEF2', borderRadius: 100, height: 10 }}>
        <div style={{ height: '100%', borderRadius: 100, background: barColor, transition: 'width 0.7s', width: `${percent}%` }} />
        {projPct != null && projPct > percent && (
          <div style={{ position: 'absolute', top: 0, height: '100%', width: 2, background: 'rgba(0,0,0,0.2)', borderRadius: 100, left: `${projPct}%` }} title={`Projected CTL on race day: ${projection.projectedCTL}`} />
        )}
        <div style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 2, background: 'rgba(0,0,0,0.15)', borderRadius: 100 }} />
      </div>

      {hasRaceDate && projection.projectedCTL != null ? (
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          Projected on race day:{' '}
          <span style={{ color: projection.willMeetTarget ? '#166534' : '#92400E', fontWeight: 600 }}>
            {projection.projectedCTL} CTL
          </span>
          <span style={{ color: 'var(--color-text-muted)' }}>
            {' '}({projection.buildWeeks?.toFixed(0)}w build · {projection.taperDays}d taper)
          </span>
        </p>
      ) : !hasRaceDate ? (
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          Set your race date in{' '}
          <a href="/settings" style={{ color: 'var(--color-primary)' }}>Settings</a>{' '}
          to see the race-day CTL projection.
        </p>
      ) : null}
    </div>
  )
}

function ThresholdGrid({ thresholds, hasThresholds }) {
  if (!hasThresholds) {
    return (
      <div style={{ background: 'var(--color-bg)', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
          No threshold data found.{' '}
          <a href="/settings" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Set your FTP and pace thresholds in Settings
          </a>{' '}
          to see per-discipline readiness.
        </p>
      </div>
    )
  }

  const disciplineMeta = {
    swim: { icon: '🏊', label: 'Swim CSS',  direction: 'pace',  targetDisplay: '1:45/100m' },
    bike: { icon: '🚴', label: 'Bike FTP',  direction: 'power', targetDisplay: '220 W'     },
    run:  { icon: '🏃', label: 'Run Pace',  direction: 'pace',  targetDisplay: '5:00/km'   },
  }

  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        Threshold Analysis
      </p>
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(thresholds).map(([key, t]) => {
          const meta = disciplineMeta[key]
          const sty  = THRESHOLD_STATUS_STYLES[t.status]
          const gapSec = t.gap != null && meta.direction === 'pace' ? Math.round(t.gap * 60) : null

          return (
            <div
              key={key}
              style={{ background: 'var(--color-bg)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 16 }}>{meta.icon}</span>
                  <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{meta.label}</p>
                </div>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: sty.dot, flexShrink: 0 }} />
              </div>

              {t.status === 'unknown' ? (
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Not set</p>
              ) : (
                <p style={{ fontSize: 18, fontWeight: 900, color: 'var(--color-text-primary)', lineHeight: 1 }}>
                  {meta.direction === 'power'
                    ? `${t.current}W`
                    : formatDecimalPace(t.current)}
                  <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--color-text-secondary)', marginLeft: 4 }}>
                    {meta.direction === 'power' ? '' : `/${t.unit.replace('min/', '')}`}
                  </span>
                </p>
              )}

              {t.status !== 'unknown' && (
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Target <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{meta.targetDisplay}</span>
                </p>
              )}

              <span style={{ fontSize: 12, fontWeight: 600, color: sty.label }}>
                {t.status === 'met'     && '✓ Target met'}
                {t.status === 'close'   && (
                  meta.direction === 'pace'
                    ? `${gapSec}s off — close`
                    : `${t.gap}W off — close`
                )}
                {t.status === 'gap'     && (
                  meta.direction === 'pace'
                    ? `${gapSec}s to close`
                    : `${t.gap}W to close`
                )}
                {t.status === 'unknown' && 'Set in Settings →'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RecommendationsList({ recommendations }) {
  if (!recommendations || recommendations.length === 0) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Recommendations
      </p>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', margin: 0, padding: 0 }}>
        {recommendations.map((rec, i) => (
          <li key={i} style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            <span style={{ color: 'var(--color-primary)', fontWeight: 900, flexShrink: 0, marginTop: 1 }}>→</span>
            <span>{rec}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function GoalReadiness({ workouts, profile }) {
  const readiness = useMemo(
    () => computeGoalReadiness(workouts, profile),
    [workouts, profile]
  )

  if (!readiness.hasWorkouts) return <GoalReadinessEmpty />

  return (
    <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <StatusHeader status={readiness.overallStatus} />
      <TargetSplitRow />
      <CTLProgressSection
        ctlProgress={readiness.ctlProgress}
        projection={readiness.projection}
        hasRaceDate={readiness.hasRaceDate}
      />
      <ThresholdGrid
        thresholds={readiness.thresholds}
        hasThresholds={readiness.hasThresholds}
      />
      <RecommendationsList recommendations={readiness.recommendations} />
    </div>
  )
}
