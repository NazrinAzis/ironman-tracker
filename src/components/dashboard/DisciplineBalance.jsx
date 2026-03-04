import { useMemo } from 'react'
import { calcDisciplineBalance, OPTIMAL_TIME_SPLIT } from '../../utils/trainingQuality'
import { formatDuration } from '../../utils/ironman'

// Discipline stacked-bar and row colors
const DISC_STYLES = {
  swim: { bar: 'bg-blue-500',   text: 'text-blue-600',   label: '🏊 Swim' },
  bike: { bar: 'bg-yellow-400', text: 'text-yellow-600', label: '🚴 Bike' },
  run:  { bar: 'bg-red-500',    text: 'text-red-600',    label: '🏃 Run'  },
}

function Empty() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '32px 0', textAlign: 'center' }}>
      <span style={{ fontSize: 32 }}>⚖️</span>
      <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>No workout data yet.</p>
      <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
        Log workouts to see your discipline time balance.
      </p>
    </div>
  )
}

function StackedBar({ balance }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Actual distribution bar */}
      <div style={{ display: 'flex', width: '100%', height: 16, borderRadius: 100, overflow: 'hidden', gap: 1 }}>
        {['swim', 'bike', 'run'].map((key) => (
          <div
            key={key}
            className={`${DISC_STYLES[key].bar} transition-all duration-700`}
            style={{ width: `${balance[key].actual}%` }}
            title={`${key}: ${balance[key].actual}%`}
          />
        ))}
      </div>

      {/* Optimal reference bar */}
      <div style={{ display: 'flex', width: '100%', height: 6, borderRadius: 100, overflow: 'hidden', gap: 1, opacity: 0.3 }}>
        <div className="bg-blue-500"   style={{ width: `${OPTIMAL_TIME_SPLIT.swim}%` }} />
        <div className="bg-yellow-400" style={{ width: `${OPTIMAL_TIME_SPLIT.bike}%` }} />
        <div className="bg-red-500"    style={{ width: `${OPTIMAL_TIME_SPLIT.run}%`  }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-muted)' }}>
        <span>Actual</span>
        <span>↑ Optimal reference</span>
      </div>
    </div>
  )
}

function DisciplineRow({ discipline, slice }) {
  const sty = DISC_STYLES[discipline]

  const gapLabel =
    slice.status === 'ok'    ? '✓ On target'                       :
    slice.status === 'under' ? `${Math.abs(slice.gap).toFixed(0)}% under` :
                               `${slice.gap.toFixed(0)}% over`

  const gapColor =
    slice.status === 'ok'    ? 'var(--color-primary)' :
    slice.status === 'under' ? '#D97706' :
    '#2563EB'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 80, flexShrink: 0 }}>
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${sty.bar}`} />
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{sty.label.split(' ')[1]}</span>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{ width: '100%', background: '#EEEEF2', borderRadius: 100, height: 8, position: 'relative' }}>
          <div
            className={`h-full rounded-full transition-all duration-700 ${sty.bar}`}
            style={{ width: `${Math.min((slice.actual / 70) * 100, 100)}%` }}
          />
          <div
            style={{ position: 'absolute', top: 0, height: '100%', width: 2, background: 'rgba(0,0,0,0.15)', borderRadius: 100, left: `${(slice.target / 70) * 100}%` }}
            title={`Target: ${slice.target}%`}
          />
        </div>
      </div>

      <span className={`text-xs font-bold w-8 text-right ${sty.text}`}>{slice.actual}%</span>

      <span style={{ fontSize: 12, fontWeight: 600, width: 80, textAlign: 'right', color: gapColor }}>
        {gapLabel}
      </span>
    </div>
  )
}

export default function DisciplineBalance({ workouts }) {
  const balance = useMemo(() => calcDisciplineBalance(workouts), [workouts])

  return (
    <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Training Time Balance
        </p>
        {balance && (
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {formatDuration(balance.totalMinutes)} total
          </p>
        )}
      </div>

      {!balance ? (
        <Empty />
      ) : (
        <>
          <StackedBar balance={balance} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--color-text-muted)' }}>
            <span style={{ width: 80 }}>Discipline</span>
            <span style={{ flex: 1 }} />
            <span style={{ width: 32, textAlign: 'right' }}>Actual</span>
            <span style={{ width: 80, textAlign: 'right' }}>vs Target</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(['swim', 'bike', 'run']).map((d) => (
              <DisciplineRow key={d} discipline={d} slice={balance[d]} />
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-secondary)', background: 'var(--color-bg)', borderRadius: 12, padding: '8px 12px' }}>
            <span>Sub-11h optimal split:</span>
            <div style={{ display: 'flex', gap: 12 }}>
              <span className="text-blue-600">Swim 15%</span>
              <span className="text-yellow-600">Bike 60%</span>
              <span className="text-red-600">Run 25%</span>
            </div>
          </div>

          {balance.insight && (
            <div style={{ display: 'flex', gap: 8, background: 'var(--color-bg)', borderRadius: 12, padding: '10px 12px' }}>
              <span style={{ color: 'var(--color-primary)', fontWeight: 900, flexShrink: 0 }}>→</span>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{balance.insight}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
