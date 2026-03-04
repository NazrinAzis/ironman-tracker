import { useState, useEffect } from 'react'

const fields = [
  {
    name: 'ftp_watts',
    label: 'Bike FTP',
    unit: 'watts',
    placeholder: 'e.g. 250',
    hint: 'Functional Threshold Power — used to calculate bike TSS',
  },
  {
    name: 'threshold_hr_bike',
    label: 'Bike Threshold HR',
    unit: 'bpm',
    placeholder: 'e.g. 162',
    hint: 'Heart rate at lactate threshold for cycling',
  },
  {
    name: 'threshold_hr_run',
    label: 'Run Threshold HR',
    unit: 'bpm',
    placeholder: 'e.g. 168',
    hint: 'Heart rate at lactate threshold for running',
  },
  {
    name: 'threshold_pace_run',
    label: 'Run Threshold Pace',
    unit: 'min/km',
    placeholder: 'e.g. 5.25',
    step: '0.01',
    hint: 'Pace at threshold (5.25 = 5:15/km). Used to calculate run TSS.',
  },
  {
    name: 'threshold_pace_swim',
    label: 'Swim Threshold Pace',
    unit: 'min/100m',
    placeholder: 'e.g. 1.75',
    step: '0.01',
    hint: 'Pace per 100m at threshold (1.75 = 1:45/100m). Used for swim TSS.',
  },
]

const inputStyle = {
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 10,
  padding: '10px 12px',
  color: 'var(--color-text-primary)',
  fontSize: 14,
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
}

export default function ThresholdSettings({ profile, onSave }) {
  const [form, setForm] = useState({
    ftp_watts: '',
    threshold_hr_bike: '',
    threshold_hr_run: '',
    threshold_pace_run: '',
    threshold_pace_swim: '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!profile) return
    setForm({
      ftp_watts: profile.ftp_watts ?? '',
      threshold_hr_bike: profile.threshold_hr_bike ?? '',
      threshold_hr_run: profile.threshold_hr_run ?? '',
      threshold_pace_run: profile.threshold_pace_run ?? '',
      threshold_pace_swim: profile.threshold_pace_swim ?? '',
    })
  }, [profile])

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setMessage(null)
    setError(null)
    setSaving(true)

    const payload = {}
    for (const f of fields) {
      const val = form[f.name]
      payload[f.name] = val !== '' ? parseFloat(val) : null
    }

    const { error: dbError } = await onSave(payload)
    setSaving(false)
    if (dbError) {
      setError(dbError.message)
    } else {
      setMessage('Thresholds saved!')
      setTimeout(() => setMessage(null), 3000)
    }
  }

  return (
    <form
      onSubmit={handleSave}
      style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>Training Thresholds</h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
          Used to auto-calculate TSS when you log workouts. Leave blank to use defaults.
        </p>
      </div>

      {error && (
        <p style={{ fontSize: 14, color: '#DC2626', background: '#FEE2E2', borderRadius: 8, padding: '8px 12px' }}>{error}</p>
      )}
      {message && (
        <p style={{ fontSize: 14, color: '#166534', background: '#DCFCE7', borderRadius: 8, padding: '8px 12px' }}>{message}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              {f.label} <span style={{ color: 'var(--color-text-muted)' }}>({f.unit})</span>
            </label>
            <input
              type="number"
              name={f.name}
              value={form[f.name]}
              onChange={handleChange}
              min="0"
              step={f.step ?? '1'}
              placeholder={f.placeholder}
              style={inputStyle}
            />
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{f.hint}</p>
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={saving}
        style={{ background: 'var(--color-primary)', color: 'white', fontWeight: 600, fontSize: 15, padding: '10px 0', borderRadius: 12, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, transition: 'opacity 0.15s' }}
      >
        {saving ? 'Saving…' : 'Save Thresholds'}
      </button>
    </form>
  )
}
