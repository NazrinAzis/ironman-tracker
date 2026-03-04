import { useMemo } from 'react'
import {
  calcKeySessions,
  detectBricks,
  KEY_SESSION_DEF,
  KEY_SESSION_TARGETS,
  BRICK_TARGET,
} from '../../utils/trainingQuality'

function fmtDate(isoStr) {
  return new Date(isoStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
  })
}

function SessionDots({ done, target, color }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {Array.from({ length: target }).map((_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full border ${
            i < done
              ? `${color} border-transparent`
              : 'border-gray-300'
          }`}
          style={i >= done ? { background: 'transparent' } : {}}
        />
      ))}
    </div>
  )
}

const SESSION_META = {
  swim: { icon: '🏊', label: 'Long Swims', dotColor: 'bg-blue-500'   },
  bike: { icon: '🚴', label: 'Long Rides', dotColor: 'bg-yellow-400' },
  run:  { icon: '🏃', label: 'Long Runs',  dotColor: 'bg-red-500'    },
}

function SessionRow({ discipline, done, target }) {
  const meta      = SESSION_META[discipline]
  const def       = KEY_SESSION_DEF[discipline]
  const remaining = Math.max(target - done, 0)
  const met       = done >= target

  const countColor =
    met      ? 'var(--color-primary)' :
    done > 0 ? '#D97706' :
    '#EF4444'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 112, flexShrink: 0 }}>
        <span style={{ fontSize: 14 }}>{meta.icon}</span>
        <div>
          <p style={{ fontSize: 12, color: 'var(--color-text-primary)', fontWeight: 500, lineHeight: 1.2 }}>{meta.label}</p>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{def.display}</p>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <SessionDots done={Math.min(done, target)} target={target} color={meta.dotColor} />
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: countColor }}>{done}/{target}</span>
        {!met && remaining > 0 && (
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.2 }}>{remaining} more</p>
        )}
        {met && (
          <p style={{ fontSize: 11, color: 'var(--color-primary)', lineHeight: 1.2 }}>Done ✓</p>
        )}
      </div>
    </div>
  )
}

function BrickSection({ bricks }) {
  const met = bricks.recentCount >= BRICK_TARGET
  const countColor =
    met                    ? 'var(--color-primary)' :
    bricks.recentCount > 0 ? '#D97706' :
    '#EF4444'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🧱</span>
          <div>
            <p style={{ fontSize: 12, color: 'var(--color-text-primary)', fontWeight: 500, lineHeight: 1.2 }}>Brick Workouts</p>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Bike + Run same day</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: countColor }}>{bricks.recentCount}/{BRICK_TARGET}</span>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.2 }}>last 4 weeks</p>
        </div>
      </div>

      <SessionDots
        done={Math.min(bricks.recentCount, BRICK_TARGET)}
        target={BRICK_TARGET}
        color="bg-purple-500"
      />

      {bricks.recentDates.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {bricks.recentDates.map((d) => (
            <span
              key={d}
              style={{ fontSize: 12, background: 'var(--color-primary-light)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', borderRadius: 6, padding: '2px 8px' }}
            >
              {fmtDate(d)}
            </span>
          ))}
          {bricks.totalCount > 3 && (
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', alignSelf: 'center' }}>
              +{bricks.totalCount - 3} more all-time
            </span>
          )}
        </div>
      ) : (
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          No bricks yet — schedule a bike followed by a run to practise the transition.
        </p>
      )}
    </div>
  )
}

export default function KeySessions({ workouts }) {
  const keySessions = useMemo(() => calcKeySessions(workouts), [workouts])
  const bricks      = useMemo(() => detectBricks(workouts),    [workouts])

  const hasAny = workouts.length > 0

  return (
    <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: 20, display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Key Sessions
        </p>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Last 4 weeks</p>
      </div>

      {!hasAny ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '24px 0', textAlign: 'center' }}>
          <span style={{ fontSize: 32 }}>🏋️</span>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>No workouts logged yet.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: -4 }}>
              Long sessions build your IRONMAN-specific endurance
            </p>
            {(['swim', 'bike', 'run']).map((d) => (
              <SessionRow
                key={d}
                discipline={d}
                done={keySessions[d]}
                target={KEY_SESSION_TARGETS[d]}
              />
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)' }} />

          <BrickSection bricks={bricks} />

          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            Targets are for a build-phase 4-week block. Reduce during taper and base phases.
          </p>
        </>
      )}
    </div>
  )
}
