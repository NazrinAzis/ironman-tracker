import { DISCIPLINE_ICONS, DISCIPLINE_COLORS, formatDuration } from '../../utils/ironman'

function fmtMinSec(decimalMins) {
  if (!isFinite(decimalMins) || decimalMins <= 0) return null
  const mins = Math.floor(decimalMins)
  const secs = Math.round((decimalMins - mins) * 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function getPace(type, distance, duration) {
  if (!distance || !duration) return null
  if (type === 'run') {
    const p = fmtMinSec(duration / distance)
    return p ? { value: p, unit: 'min/km' } : null
  }
  if (type === 'bike') {
    return { value: (distance / (duration / 60)).toFixed(1), unit: 'km/h' }
  }
  if (type === 'swim') {
    const p = fmtMinSec(duration / (distance * 10))
    return p ? { value: p, unit: 'min/100m' } : null
  }
  return null
}

const SPORT_COLORS = {
  swim: 'var(--color-swim-light)',
  bike: 'var(--color-bike-light)',
  run: 'var(--color-run-light)',
  strength: '#F3F4F6',
}

const SPORT_TEXT_COLORS = {
  swim: 'var(--color-swim)',
  bike: 'var(--color-bike)',
  run: 'var(--color-run)',
  strength: '#6B7280',
}

export default function WorkoutCard({ workout, onDelete, onEdit, onView }) {
  const { type, distance, duration, date, notes } = workout
  const icon = DISCIPLINE_ICONS[type] || '🏋️'
  const isStrength = type === 'strength'
  const pace = getPace(type, distance, duration)

  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div
      style={{
        background: 'var(--color-card)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        cursor: 'pointer',
        transition: 'box-shadow var(--transition-base), transform var(--transition-base)',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-card)'; e.currentTarget.style.transform = 'none' }}
      onClick={() => onView?.(workout)}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 'var(--radius-sm)',
        background: SPORT_COLORS[type] || '#F3F4F6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0,
      }}>
        {icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
            color: SPORT_TEXT_COLORS[type] || 'var(--color-text-primary)',
            textTransform: 'capitalize',
          }}>{type}</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{displayDate}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4, flexWrap: 'wrap' }}>
          {!isStrength && distance != null && (
            <span style={{ fontSize: 13, color: 'var(--color-text-primary)', fontWeight: 600 }}>{distance} km</span>
          )}
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{formatDuration(duration)}</span>
          {pace && (
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{pace.value} {pace.unit}</span>
          )}
          {workout.tss != null && (
            <span style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 700 }}>
              TSS {workout.tss}
              {workout.tss_source === 'manual' && ' ✎'}
              {workout.tss_source === 'strava' && ' ⚡'}
            </span>
          )}
        </div>

        {notes && (
          <p style={{ marginTop: 4, fontSize: 12, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {notes}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        {onEdit && (
          <button
            onClick={() => onEdit(workout)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: 'var(--color-text-muted)', padding: 4 }}
            aria-label="Edit workout"
          >
            ✏️
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(workout.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--color-text-muted)', padding: 4 }}
            aria-label="Delete workout"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
