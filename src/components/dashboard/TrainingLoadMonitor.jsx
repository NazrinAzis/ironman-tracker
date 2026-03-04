import { useMemo } from 'react'
import { buildPMCSeries } from '../../utils/pmc'
import { computeTrainingLoad, WEEKLY_TARGETS } from '../../utils/trainingLoad'

const RAMP_STYLES = {
  recovery: { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  safe:     { bg: '#DCFCE7', text: '#166534', dot: '#22C55E' },
  caution:  { bg: '#FEF9C3', text: '#92400E', dot: '#EAB308' },
  risk:     { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
}

const DISCIPLINE_META = {
  swim: { icon: '🏊', label: 'Swim' },
  bike: { icon: '🚴', label: 'Bike' },
  run:  { icon: '🏃', label: 'Run'  },
}

function VolumeRow({ discipline, current, target, volStatus }) {
  const meta = DISCIPLINE_META[discipline]
  const pct  = Math.min(volStatus.percent, 100)

  const barColor =
    volStatus.status === 'good' ? '#22C55E' :
    volStatus.status === 'over' ? '#3B82F6' :
    '#EF4444'

  const valueColor =
    volStatus.status === 'good' ? '#166534' :
    volStatus.status === 'over' ? '#1E40AF' :
    '#DC2626'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{meta.icon}</span>
          <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{meta.label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, textAlign: 'right' }}>
          <span style={{ fontWeight: 600, color: valueColor }}>{current} {target.unit}</span>
          <span style={{ color: 'var(--color-text-muted)' }}>/ {target.min}–{target.max}</span>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', background: '#EEEEF2', borderRadius: 100, height: 8 }}>
        <div style={{ position: 'absolute', top: 0, height: '100%', width: 1, background: 'rgba(0,0,0,0.15)', left: `${(target.min / target.max) * 100}%` }} />
        <div style={{ height: '100%', borderRadius: 100, background: barColor, transition: 'width 0.7s', width: `${pct}%` }} />
      </div>

      <p style={{ fontSize: 12, color: valueColor }}>
        {volStatus.status === 'low'  && `${(target.min - current).toFixed(0)} ${target.unit} to reach minimum`}
        {volStatus.status === 'good' && 'On target ✓'}
        {volStatus.status === 'over' && 'Above target — great week!'}
      </p>
    </div>
  )
}

function RampRateSection({ rampRate }) {
  if (!rampRate.ratePerWeek == null || rampRate.status === null) {
    return (
      <div style={{ background: 'var(--color-bg)', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          Not enough PMC data yet — sync more workouts to see ramp rate.
        </p>
      </div>
    )
  }

  const sty  = RAMP_STYLES[rampRate.status] ?? RAMP_STYLES.safe
  const rate = rampRate.ratePerWeek
  const sign = rate > 0 ? '+' : ''

  return (
    <div style={{ background: sty.bg, borderRadius: 12, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: sty.dot }} />
          <p style={{ fontSize: 14, fontWeight: 900, color: sty.text }}>{rampRate.zone?.label ?? '—'}</p>
        </div>
        <p style={{ fontSize: 14, fontWeight: 700, color: sty.text }}>
          {sign}{rate} CTL / week
        </p>
      </div>
      <p style={{ fontSize: 12, color: sty.text, opacity: 0.8, lineHeight: 1.5 }}>
        {rampRate.zone?.advice ?? ''}
      </p>
      <p style={{ fontSize: 12, color: sty.text, opacity: 0.6 }}>
        CTL: {rampRate.ctl7dAgo} → {rampRate.ctlNow} (7 days)
      </p>
    </div>
  )
}

const ZONE_REF = [
  { label: 'Recovery', sub: '< 0',  color: '#1E40AF', bg: '#DBEAFE' },
  { label: 'Safe',     sub: '0–5',  color: '#166534', bg: '#DCFCE7' },
  { label: 'Caution',  sub: '5–8',  color: '#92400E', bg: '#FEF9C3' },
  { label: 'Risk',     sub: '> 8',  color: '#991B1B', bg: '#FEE2E2' },
]

export default function TrainingLoadMonitor({ workouts }) {
  const pmcSeries = useMemo(() => buildPMCSeries(workouts), [workouts])

  const load = useMemo(
    () => computeTrainingLoad(workouts, pmcSeries),
    [workouts, pmcSeries]
  )

  return (
    <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: 20, display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Weekly Volume
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Sub-11h build targets</p>
        </div>

        {(['swim', 'bike', 'run']).map((d) => (
          <VolumeRow
            key={d}
            discipline={d}
            current={load.volume[d]}
            target={WEEKLY_TARGETS[d]}
            volStatus={load.volumeStatus[d]}
          />
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--color-border)' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Training Ramp Rate
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Injury risk</p>
        </div>

        <RampRateSection rampRate={load.rampRate} />

        <div className="grid grid-cols-4 gap-1 text-center">
          {ZONE_REF.map((z) => (
            <div key={z.label} style={{ background: z.bg, borderRadius: 8, padding: '6px 4px' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: z.color }}>{z.label}</p>
              <p style={{ fontSize: 11, color: z.color, opacity: 0.7 }}>{z.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
