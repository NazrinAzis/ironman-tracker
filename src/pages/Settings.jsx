import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../context/AuthContext'
import ThresholdSettings from '../components/settings/ThresholdSettings'
import StravaConnect from '../components/settings/StravaConnect'
import CSSTestLogger from '../components/settings/CSSTestLogger'
import Layout from '../components/layout/Layout'

export default function Settings() {
  const { user } = useAuth()
  const { profile, loading, updateRaceDate, updateProfile, refetch } = useProfile()
  const [searchParams, setSearchParams] = useSearchParams()
  const [raceDate, setRaceDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (profile?.race_date) setRaceDate(profile.race_date)
  }, [profile])

  // Handle Strava OAuth redirect banners
  useEffect(() => {
    const strava = searchParams.get('strava')
    if (strava === 'connected') {
      setMessage('Strava connected successfully!')
      setSearchParams({}, { replace: true })
      setTimeout(() => setMessage(null), 4000)
    } else if (strava === 'denied') {
      setError('Strava authorization was denied.')
      setSearchParams({}, { replace: true })
      setTimeout(() => setError(null), 4000)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveRaceDate(e) {
    e.preventDefault()
    setMessage(null)
    setError(null)
    setSaving(true)
    const { error: dbError } = await updateRaceDate(raceDate || null)
    setSaving(false)
    if (dbError) {
      setError(dbError.message)
    } else {
      setMessage('Race date saved!')
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const cardStyle = { background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--card-padding)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 8 }
  const labelStyle = { fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }
  const inputStyle = { background: 'var(--color-bg)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 14, color: 'var(--color-text-primary)', outline: 'none', width: '100%' }

  return (
    <Layout>
      <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 32, color: 'var(--color-text-primary)' }}>
          Settings ⚙️
        </h1>

        {error && (
          <p style={{ color: 'var(--color-danger)', fontSize: 13, background: '#FFF0F0', borderRadius: 'var(--radius-sm)', padding: '8px 14px' }}>{error}</p>
        )}
        {message && (
          <p style={{ color: 'var(--color-success)', fontSize: 13, background: 'var(--color-primary-light)', borderRadius: 'var(--radius-sm)', padding: '8px 14px' }}>{message}</p>
        )}

        <div style={cardStyle}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--color-text-primary)' }}>Account</h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{user?.email}</p>
        </div>

        <form onSubmit={handleSaveRaceDate} style={{ ...cardStyle, gap: 16 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--color-text-primary)' }}>Race Day</h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Set your IRONMAN race date to see the countdown on your dashboard.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Race Date</label>
            <input
              type="date"
              value={raceDate}
              onChange={(e) => setRaceDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={saving || loading}
            className="btn btn-primary"
            style={{ opacity: saving || loading ? 0.5 : 1 }}
          >
            {saving ? 'Saving…' : 'Save Race Date'}
          </button>
        </form>

        <ThresholdSettings profile={profile} onSave={updateProfile} />

        <CSSTestLogger />

        <StravaConnect profile={profile} onImportComplete={refetch} />
      </div>
    </Layout>
  )
}
