import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { autoCalcTSS } from '../../utils/tss'

const TYPES = ['swim', 'bike', 'run', 'strength']

const TYPE_LABELS = {
  swim:     '🏊 Swim',
  bike:     '🚴 Bike',
  run:      '🏃 Run',
  strength: '🏋️ Strength',
}

const defaultForm = {
  type: 'run',
  distance: '',
  duration: '',
  date: new Date().toISOString().split('T')[0],
  notes: '',
  tss: '',
  tss_manual: false,
}

function toFormValues(workout) {
  return {
    type: workout.type,
    distance: String(workout.distance),
    duration: String(workout.duration),
    date: workout.date,
    notes: workout.notes ?? '',
    tss: workout.tss != null ? String(workout.tss) : '',
    tss_manual: workout.tss_source === 'manual',
  }
}

const inputStyle = {
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 10,
  padding: '8px 12px',
  color: 'var(--color-text-primary)',
  fontSize: 14,
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
}

export default function WorkoutForm({ onSuccess, onCancel, initialWorkout, onUpdate, profile }) {
  const { user } = useAuth()
  const isEditing = Boolean(initialWorkout)
  const [form, setForm] = useState(isEditing ? toFormValues(initialWorkout) : defaultForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  function handleTypeChange(t) {
    setForm(prev => ({
      ...prev,
      type: t,
      distance: t === 'strength' ? '' : prev.type === 'strength' ? '' : prev.distance,
      tss_manual: t === 'strength' ? true : prev.tss_manual,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const isStrength = form.type === 'strength'
    const distance = isStrength ? null : parseFloat(form.distance)
    const duration = parseInt(form.duration, 10)

    if (!isStrength && (!distance || distance <= 0)) return setError('Distance must be a positive number.')
    if (!duration || duration <= 0) return setError('Duration must be a positive number.')

    let tssToSave = null
    let tssSource = null
    let intensityFactor = null

    if (form.tss_manual && form.tss !== '') {
      tssToSave = parseFloat(form.tss)
      tssSource = 'manual'
    } else if (!isStrength) {
      const result = autoCalcTSS({ type: form.type, duration, distance }, profile)
      tssToSave = result.tss
      intensityFactor = result.intensityFactor
      tssSource = 'auto'
    }

    const payload = {
      type: form.type,
      distance,
      duration,
      date: form.date,
      notes: form.notes || null,
      tss: tssToSave,
      tss_source: tssSource,
      intensity_factor: intensityFactor,
    }

    setLoading(true)

    if (isEditing) {
      const { error: dbError } = await supabase
        .from('workouts')
        .update(payload)
        .eq('id', initialWorkout.id)
      setLoading(false)
      if (dbError) {
        setError(dbError.message)
      } else {
        onUpdate?.({ ...initialWorkout, ...payload })
        onSuccess?.()
      }
    } else {
      const { error: dbError } = await supabase
        .from('workouts')
        .insert({ user_id: user.id, ...payload })
      setLoading(false)
      if (dbError) {
        setError(dbError.message)
      } else {
        setForm(defaultForm)
        onSuccess?.()
      }
    }
  }

  const isStrength = form.type === 'strength'
  const previewDistance = parseFloat(form.distance) || 0
  const previewDuration = parseInt(form.duration, 10) || 0
  const previewTSS =
    !isStrength && !form.tss_manual && previewDistance > 0 && previewDuration > 0
      ? autoCalcTSS(
          { type: form.type, duration: previewDuration, distance: previewDistance },
          profile
        ).tss
      : null

  return (
    <form
      onSubmit={handleSubmit}
      style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>
        {isEditing ? 'Edit Workout' : 'Log Workout'}
      </h2>

      {error && (
        <p style={{ fontSize: 14, color: '#DC2626', background: '#FEE2E2', borderRadius: 8, padding: '8px 12px' }}>{error}</p>
      )}

      {/* Type selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTypeChange(t)}
            style={{
              padding: '8px 0', borderRadius: 10, fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: form.type === t ? 'var(--color-primary)' : 'var(--color-bg)',
              color: form.type === t ? 'white' : 'var(--color-text-secondary)',
            }}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <div className={`grid gap-4 ${isStrength ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {!isStrength && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Distance (km)</label>
            <input
              type="number"
              name="distance"
              value={form.distance}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
              placeholder="e.g. 10.5"
              style={inputStyle}
            />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Duration (minutes)</label>
          <input
            type="number"
            name="duration"
            value={form.duration}
            onChange={handleChange}
            min="1"
            required
            placeholder="e.g. 60"
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Date</label>
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          required
          style={inputStyle}
        />
      </div>

      {/* TSS section */}
      <div style={{ background: 'var(--color-bg)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>Training Stress Score (TSS)</span>
          {!isStrength && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none', fontSize: 12, color: 'var(--color-text-secondary)' }}>
              Manual
              <input
                type="checkbox"
                name="tss_manual"
                checked={form.tss_manual}
                onChange={handleChange}
                style={{ accentColor: 'var(--color-primary)' }}
              />
            </label>
          )}
        </div>

        {(form.tss_manual || isStrength) ? (
          <input
            type="number"
            name="tss"
            value={form.tss}
            onChange={handleChange}
            min="0"
            step="0.1"
            placeholder={isStrength ? 'Enter TSS from Garmin/Strava (optional)' : 'Enter TSS from Garmin/Strava'}
            style={inputStyle}
          />
        ) : (
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-primary)' }}>
            {previewTSS != null
              ? `≈ ${previewTSS} TSS (auto)`
              : 'Fill distance & duration to preview'}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Notes (optional)</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={2}
          placeholder="How did it feel?"
          style={{ ...inputStyle, resize: 'none' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
        <button
          type="submit"
          disabled={loading}
          style={{ flex: 1, background: 'var(--color-primary)', color: 'white', fontWeight: 600, fontSize: 15, padding: '10px 0', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s' }}
        >
          {loading ? 'Saving…' : isEditing ? 'Update Workout' : 'Save Workout'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{ padding: '10px 20px', borderRadius: 12, background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 14 }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
