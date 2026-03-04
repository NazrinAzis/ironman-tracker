import { useEffect } from 'react'
import { DISCIPLINE_ICONS, DISCIPLINE_LABELS, formatDuration } from '../../utils/ironman'

function fmtMinSec(decimalMins) {
  if (!isFinite(decimalMins) || decimalMins <= 0) return null
  const mins = Math.floor(decimalMins)
  const secs = Math.round((decimalMins - mins) * 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function getPaceInfo(type, distance, duration) {
  if (!distance || !duration) return null
  switch (type) {
    case 'swim': {
      const pace = duration / (distance * 10)
      const formatted = fmtMinSec(pace)
      return formatted ? { value: formatted, unit: 'min:sec/100m' } : null
    }
    case 'bike':
      return { value: (distance / (duration / 60)).toFixed(1), unit: 'km/h' }
    case 'run': {
      const pace = duration / distance
      const formatted = fmtMinSec(pace)
      return formatted ? { value: formatted, unit: 'min:sec/km' } : null
    }
    default:
      return null
  }
}

function StatTile({ label, value, unit, accent }) {
  return (
    <div style={{ background: 'var(--color-bg)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: 22, fontWeight: 900, color: accent ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
        {value}
      </span>
      {unit && <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{unit}</span>}
    </div>
  )
}

const TSS_SOURCE_LABELS = {
  auto:   { label: 'Auto'   },
  manual: { label: 'Manual' },
  strava: { label: 'Strava' },
}

const SPORT_COLORS = {
  swim:     { bg: 'var(--color-swim-light)', icon: 'var(--color-swim)', border: 'var(--color-swim)' },
  bike:     { bg: 'var(--color-bike-light)', icon: 'var(--color-bike)', border: 'var(--color-bike)' },
  run:      { bg: 'var(--color-run-light)',  icon: 'var(--color-run)',  border: 'var(--color-run)'  },
  strength: { bg: '#F3F4F6',                 icon: '#6B7280',           border: '#6B7280'           },
}

export default function WorkoutDetailModal({ workout, onClose, onEdit, onDelete }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!workout) return null

  const { type, distance, duration, date, notes, tss, tss_source, heart_rate, intensity_factor, strava_activity_id } = workout

  const icon    = DISCIPLINE_ICONS[type] || '🏋️'
  const label   = DISCIPLINE_LABELS[type] || type
  const colors  = SPORT_COLORS[type] || SPORT_COLORS.strength
  const isStrength = type === 'strength'

  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  const paceInfo = getPaceInfo(type, distance, duration)

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--color-card)',
        borderRadius: 'var(--radius-lg)',
        width: '100%', maxWidth: 512,
        borderTop: `4px solid ${colors.border}`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column',
        maxHeight: '90vh', overflowY: 'auto',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '24px 24px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0, background: colors.bg }}>
              {icon}
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>{label}</h2>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>{displayDate}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--color-text-muted)', padding: 4, lineHeight: 1, marginTop: 4 }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Strava badge */}
        {strava_activity_id && (
          <div style={{ padding: '0 24px 12px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, background: '#FFEDD5', color: '#C2410C', border: '1px solid #FED7AA', borderRadius: 999, padding: '4px 12px' }}>
              ⚡ Synced from Strava
            </span>
          </div>
        )}

        {/* Stats grid */}
        <div style={{ padding: '0 24px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <StatTile label="Duration" value={formatDuration(duration)} unit="hh mm" />

          {!isStrength && distance != null ? (
            <StatTile label="Distance" value={distance} unit="km" />
          ) : (
            <StatTile label="Type" value={label} />
          )}

          {paceInfo ? (
            <StatTile label="Pace" value={paceInfo.value} unit={paceInfo.unit} />
          ) : (
            <StatTile label="Pace" value="—" />
          )}

          {tss != null ? (
            <StatTile
              label={`TSS${TSS_SOURCE_LABELS[tss_source] ? ` · ${TSS_SOURCE_LABELS[tss_source].label}` : ''}`}
              value={tss}
              accent
            />
          ) : (
            <StatTile label="TSS" value="—" />
          )}

          {heart_rate != null && (
            <StatTile label="Avg Heart Rate" value={heart_rate} unit="bpm" />
          )}

          {intensity_factor != null && (
            <StatTile label="Intensity Factor" value={intensity_factor.toFixed(2)} />
          )}
        </div>

        {/* Notes */}
        {notes && (
          <div style={{ padding: '0 24px 20px' }}>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Notes</p>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', background: 'var(--color-bg)', borderRadius: 12, padding: '12px 16px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {notes}
            </p>
          </div>
        )}

        {/* Actions */}
        {(onEdit || onDelete) && (
          <div style={{ padding: '0 24px 24px', display: 'flex', gap: 12, marginTop: 'auto' }}>
            {onEdit && (
              <button
                onClick={() => { onEdit(workout); onClose() }}
                style={{ flex: 1, background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', fontSize: 14, fontWeight: 600, padding: '12px 0', borderRadius: 12, cursor: 'pointer', transition: 'background 0.15s' }}
              >
                ✏️ Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => { onDelete(workout.id); onClose() }}
                style={{ flex: 1, background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#DC2626', fontSize: 14, fontWeight: 600, padding: '12px 0', borderRadius: 12, cursor: 'pointer', transition: 'background 0.15s' }}
              >
                🗑 Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
