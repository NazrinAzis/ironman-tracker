import { useMemo } from 'react'
import {
  computeRacePrediction,
  formatFinishTime,
  formatSplitTime,
} from '../../utils/racePredictor'

const CONFIDENCE_STYLES = {
  high:         { label: 'High confidence',   bg: '#DCFCE7', color: '#166534', border: '#86EFAC' },
  medium:       { label: 'Medium confidence', bg: '#FEF9C3', color: '#92400E', border: '#FDE047' },
  low:          { label: 'Low confidence',    bg: '#FFEDD5', color: '#9A3412', border: '#FED7AA' },
  insufficient: { label: 'Needs more data',   bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' },
}

function SourceTag({ source }) {
  if (!source) return <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>no data</span>
  return (
    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
      {source === 'threshold' ? '📐 threshold' : '📊 avg pace'}
    </span>
  )
}

function Empty() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 8, padding: '24px 0' }}>
      <span style={{ fontSize: 32 }}>⏱️</span>
      <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Not enough data to estimate finish time.</p>
      <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
        Log at least 2 sessions per discipline or{' '}
        <a href="/settings" style={{ color: 'var(--color-primary)' }}>
          set thresholds in Settings
        </a>
        .
      </p>
    </div>
  )
}

export default function FinishTimeEstimate({ workouts, profile }) {
  const pred = useMemo(
    () => computeRacePrediction(profile, workouts),
    [profile, workouts]
  )

  const conf = CONFIDENCE_STYLES[pred.confidence]

  const gapMin   = pred.gapToSub11 != null ? Math.abs(pred.gapToSub11) : null
  const gapH     = gapMin != null ? Math.floor(gapMin / 60) : null
  const gapM     = gapMin != null ? Math.round(gapMin % 60) : null
  const gapLabel = gapMin != null
    ? (gapH > 0 ? `${gapH}h ${gapM}m` : `${gapM} min`)
    : null

  const totalMin   = pred.total ?? 0
  const barPercent = Math.min((totalMin / 660) * 100, 120)
  const barColor   = pred.isSubEleven ? '#22c55e' : '#EF4444'

  return (
    <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Estimated Finish Time
        </p>
        <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 999, background: conf.bg, color: conf.color, border: `1px solid ${conf.border}` }}>
          {conf.label}
        </span>
      </div>

      {!pred.hasData ? (
        <Empty />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ fontSize: 38, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em', color: pred.isSubEleven ? '#166534' : 'var(--color-text-primary)' }}>
              {formatFinishTime(pred.total)}
            </p>

            {gapLabel && (
              <p style={{ fontSize: 14, fontWeight: 500, color: pred.isSubEleven ? '#166534' : '#DC2626' }}>
                {pred.isSubEleven
                  ? `✓ ${gapLabel} under sub-11h goal`
                  : `${gapLabel} from sub-11h goal`}
              </p>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ width: '100%', background: '#EEEEF2', borderRadius: 100, height: 8, overflow: 'hidden', position: 'relative' }}>
              <div style={{ height: '100%', borderRadius: 100, background: barColor, transition: 'width 0.7s', width: `${Math.min(barPercent, 100)}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-muted)' }}>
              <span>0h</span>
              <span style={{ color: pred.isSubEleven ? '#166534' : 'var(--color-text-muted)', fontWeight: pred.isSubEleven ? 600 : 400 }}>
                11:00:00 goal
              </span>
            </div>
          </div>

          {/* Split breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { icon: '🏊', label: 'Swim',  split: pred.swim, time: pred.swim.minutes },
              { icon: '🚴', label: 'Bike',  split: pred.bike, time: pred.bike.minutes },
              { icon: '⏱️', label: 'T1+T2', split: null,      time: pred.transitions  },
              { icon: '🏃', label: 'Run',   split: pred.run,  time: pred.run.minutes  },
            ].map(({ icon, label, split, time }) => (
              <div
                key={label}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-bg)', borderRadius: 10, padding: '6px 12px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{icon}</span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', width: 40 }}>{label}</span>
                  {split && <SourceTag source={split.source} />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {split?.paceLabel && (
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }} className="hidden sm:block">
                      {split.paceLabel}
                    </span>
                  )}
                  {split?.speedLabel && (
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }} className="hidden sm:block">
                      {split.speedLabel}
                    </span>
                  )}
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', width: 48, textAlign: 'right' }}>
                    {formatSplitTime(time)}
                  </span>
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 12px', borderTop: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Total
              </span>
              <span style={{ fontSize: 16, fontWeight: 900, color: pred.isSubEleven ? '#166534' : 'var(--color-text-primary)' }}>
                {formatFinishTime(pred.total)}
              </span>
            </div>
          </div>

          {pred.confidence === 'low' && (
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              Estimate uses average training paces. Set{' '}
              <a href="/settings" style={{ color: 'var(--color-primary)' }}>
                threshold paces in Settings
              </a>{' '}
              for a more accurate prediction.
            </p>
          )}
          {pred.confidence === 'insufficient' && (
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              One or more splits are missing — using conservative fallback times.
            </p>
          )}
        </>
      )}
    </div>
  )
}
