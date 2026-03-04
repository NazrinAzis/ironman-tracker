import { useState, useMemo } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { buildPMCSeries, getCurrentPMC, slicePMCSeries } from '../../utils/pmc'

const RANGES = [
  { label: '90d', days: 90 },
  { label: '180d', days: 180 },
  { label: 'All', days: null },
]

function getTrainingStatus(tsb) {
  if (tsb === null) return null
  if (tsb > 25)  return { label: 'Overtapered',  color: '#92400E', bg: '#FEF9C3', advice: 'Too much rest — you may be losing fitness. Add some quality sessions.' }
  if (tsb > 5)   return { label: 'Race Ready',    color: '#166534', bg: '#DCFCE7', advice: 'Peak form. Ideal for racing, time trials, or key brick sessions.' }
  if (tsb > -10) return { label: 'Neutral',       color: '#1E40AF', bg: '#DBEAFE', advice: 'Balanced load. Good for steady aerobic work and technique sessions.' }
  if (tsb > -30) return { label: 'Building',      color: '#9A3412', bg: '#FFEDD5', advice: 'Normal training fatigue. Fitness is accumulating — keep going.' }
  return           { label: 'Overreaching', color: '#991B1B', bg: '#FEE2E2', advice: 'High fatigue. Prioritise sleep and easy sessions to avoid injury.' }
}

function ctlContext(ctl) {
  if (ctl < 20)  return 'Base building'
  if (ctl < 45)  return 'Amateur range'
  if (ctl < 75)  return 'Age-group competitive'
  if (ctl < 100) return 'Strong age-grouper'
  return 'Elite / podium range'
}

function formatXAxis(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null
  const tsbEntry = payload.find((p) => p.dataKey === 'tsb')
  const status = tsbEntry ? getTrainingStatus(tsbEntry.value) : null
  return (
    <div style={{ background: 'white', border: '1px solid #EEEEF2', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: 'var(--color-text-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', maxWidth: 200 }}>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{formatXAxis(label)}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {Number(entry.value).toFixed(1)}
        </p>
      ))}
      {status && (
        <p style={{ marginTop: 6, fontWeight: 600, color: status.color }}>{status.label}</p>
      )}
    </div>
  )
}

function MetricBox({ label, value, sub, valueColor, hint }) {
  return (
    <div style={{ background: 'var(--color-bg)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4 }}>
      <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1.2 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 900, color: valueColor ?? 'var(--color-text-primary)' }}>
        {value != null ? value.toFixed(1) : '—'}
      </p>
      {sub && <p style={{ fontSize: 12, fontWeight: 500, color: valueColor ?? 'var(--color-text-secondary)' }}>{sub}</p>}
      {hint && <p style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.3 }}>{hint}</p>}
    </div>
  )
}

const GLOSSARY = [
  { term: 'CTL — Fitness',            color: '#3b82f6', desc: '42-day rolling average of your daily TSS. Think of it as your aerobic engine. Builds slowly — expect +3–5 per week in a hard training block. Most IRONMAN athletes peak at 80–120.' },
  { term: 'ATL — Fatigue',            color: '#f97316', desc: '7-day rolling average of TSS. Spikes after big weeks or long rides. When ATL is much higher than CTL you are accumulating debt — normal in build phases.' },
  { term: 'TSB — Form',               color: '#e94560', desc: 'CTL minus ATL. Positive = fresh, negative = fatigued. Target TSB of +5 to +15 on race morning. During base/build it is normal to sit at -10 to -30.' },
  { term: 'TSS — Training Stress Score', color: '#8A8FA8', desc: 'A number that captures how hard a single workout was (intensity × duration). An easy 1-hour run ≈ 50 TSS. A race-pace 3-hour ride ≈ 200+ TSS.' },
]

const TSB_ZONES = [
  { range: '< −30',     label: 'Overreaching', bg: '#FEE2E2', color: '#991B1B' },
  { range: '−30 to −10', label: 'Building',    bg: '#FFEDD5', color: '#9A3412' },
  { range: '−10 to +5', label: 'Neutral',      bg: '#DBEAFE', color: '#1E40AF' },
  { range: '+5 to +25', label: 'Race Ready',   bg: '#DCFCE7', color: '#166534' },
  { range: '> +25',     label: 'Overtapered',  bg: '#FEF9C3', color: '#92400E' },
]

export default function PMCChart({ workouts }) {
  const [rangeIdx, setRangeIdx] = useState(0)
  const [showGuide, setShowGuide] = useState(false)

  const fullSeries = useMemo(() => buildPMCSeries(workouts), [workouts])
  const current = getCurrentPMC(fullSeries)
  const status = current ? getTrainingStatus(current.tsb) : null

  const { days } = RANGES[rangeIdx]
  const series = useMemo(
    () => (days ? slicePMCSeries(fullSeries, days) : fullSeries),
    [fullSeries, days]
  )

  if (fullSeries.length === 0) {
    return (
      <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: 24, textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 14 }}>
        <p style={{ fontSize: 32, marginBottom: 8 }}>📈</p>
        <p>No TSS data yet. Log workouts or sync from Strava to see your fitness chart.</p>
      </div>
    )
  }

  const tsbValueColor = current
    ? current.tsb > 5 ? '#166534' : current.tsb < -10 ? '#991B1B' : '#92400E'
    : undefined

  return (
    <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Training status banner */}
      {status && (
        <div style={{ background: status.bg, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: status.color }}>{status.label}</span>
            <p style={{ fontSize: 12, color: status.color, opacity: 0.8, marginTop: 2 }}>{status.advice}</p>
          </div>
        </div>
      )}

      {/* Metric boxes */}
      <div className="grid grid-cols-3 gap-3">
        <MetricBox
          label="Fitness · CTL"
          value={current?.ctl}
          sub={current?.ctl != null ? ctlContext(current.ctl) : null}
          hint="42-day avg TSS/day"
        />
        <MetricBox
          label="Fatigue · ATL"
          value={current?.atl}
          sub={current?.atl != null && current?.ctl != null
            ? current.atl > current.ctl ? 'Above baseline' : 'Below baseline'
            : null}
          hint="7-day avg TSS/day"
        />
        <MetricBox
          label="Form · TSB"
          value={current?.tsb}
          sub={status?.label ?? null}
          valueColor={tsbValueColor}
          hint="CTL − ATL"
        />
      </div>

      {/* TSB zone reference */}
      <div className="grid grid-cols-5 gap-1 text-center">
        {TSB_ZONES.map((z) => (
          <div key={z.label} style={{ background: z.bg, borderRadius: 8, padding: '6px 4px' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: z.color, lineHeight: 1.2 }}>{z.label}</p>
            <p style={{ fontSize: 10, color: z.color, opacity: 0.7, marginTop: 2, lineHeight: 1.2 }}>{z.range}</p>
          </div>
        ))}
      </div>

      {/* Range toggle + guide link */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => setShowGuide((v) => !v)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--color-text-muted)', textDecoration: 'underline', textUnderlineOffset: 2 }}
        >
          {showGuide ? 'Hide guide ▲' : 'How to read this chart ▼'}
        </button>
        <div style={{ display: 'flex', background: 'var(--color-bg)', borderRadius: 10, padding: 2, gap: 2 }}>
          {RANGES.map((r, i) => (
            <button
              key={r.label}
              onClick={() => setRangeIdx(i)}
              style={{
                padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: rangeIdx === i ? 'var(--color-primary)' : 'transparent',
                color: rangeIdx === i ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expandable glossary */}
      {showGuide && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--color-bg)', borderRadius: 12, padding: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Understanding your PMC
          </p>
          {GLOSSARY.map((g) => (
            <div key={g.term} style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 3, borderRadius: 100, flexShrink: 0, marginTop: 2, background: g.color }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: g.color }}>{g.term}</p>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2, lineHeight: 1.5 }}>{g.desc}</p>
              </div>
            </div>
          ))}
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-border)', paddingTop: 12, marginTop: 4, lineHeight: 1.5 }}>
            <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>Race week tip:</span> Taper 2–3 weeks out to let TSB climb into the +5 to +15 range. Arriving at the start line with CTL still high and TSB positive is the goal.
          </p>
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEEEF2" />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            tick={{ fill: '#8A8FA8', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#8A8FA8', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '11px', color: '#8A8FA8', paddingTop: '8px' }} />
          <ReferenceLine y={0}   stroke="#CBD5E1" strokeDasharray="4 2" />
          <ReferenceLine y={5}   stroke="#22c55e" strokeDasharray="2 4" strokeOpacity={0.5} label={{ value: 'race ready', fill: '#22c55e', fontSize: 9, position: 'insideTopRight' }} />
          <ReferenceLine y={-30} stroke="#ef4444" strokeDasharray="2 4" strokeOpacity={0.5} label={{ value: 'overreaching', fill: '#ef4444', fontSize: 9, position: 'insideTopRight' }} />

          <Bar dataKey="tss" name="TSS" fill="#CBD5E1" opacity={0.8} radius={[2, 2, 0, 0]} />
          <Line type="monotone" dataKey="ctl" name="CTL" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="atl" name="ATL" stroke="#f97316" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="tsb" name="TSB" stroke="#e94560" strokeWidth={1.5} strokeDasharray="4 2" dot={false} activeDot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
