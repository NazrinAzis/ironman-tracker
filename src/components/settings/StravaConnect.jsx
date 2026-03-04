import { useState } from 'react'
import { useStrava } from '../../hooks/useStrava'
import { getStravaAuthUrl } from '../../utils/strava'

export default function StravaConnect({ profile, onImportComplete }) {
  const { importing, importResult, error, importActivities, disconnectStrava } = useStrava()
  const [disconnecting, setDisconnecting] = useState(false)
  const isConnected = Boolean(profile?.strava_athlete_id)

  async function handleSync() {
    const result = await importActivities(profile)
    if (result.imported > 0 || result.skipped >= 0) {
      onImportComplete?.()
    }
  }

  async function handleDisconnect() {
    if (!window.confirm('Disconnect Strava? Your imported workouts will remain.')) return
    setDisconnecting(true)
    await disconnectStrava()
    setDisconnecting(false)
    onImportComplete?.()
  }

  return (
    <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 24 }}>⚡</span>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>Strava</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {isConnected
              ? `Connected · Athlete ID ${profile.strava_athlete_id}`
              : 'Import your activities from Strava automatically'}
          </p>
        </div>
      </div>

      {error && (
        <p style={{ fontSize: 14, color: '#DC2626', background: '#FEE2E2', borderRadius: 8, padding: '8px 12px' }}>{error}</p>
      )}

      {importResult && (
        <p style={{ fontSize: 14, color: '#166534', background: '#DCFCE7', borderRadius: 8, padding: '8px 12px' }}>
          Imported {importResult.imported} new activities
          {importResult.skipped > 0 && `, ${importResult.skipped} already existed`}.
        </p>
      )}

      {isConnected ? (
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleSync}
            disabled={importing}
            style={{ flex: 1, background: 'var(--color-primary)', color: 'white', fontWeight: 600, fontSize: 14, padding: '10px 0', borderRadius: 12, border: 'none', cursor: importing ? 'not-allowed' : 'pointer', opacity: importing ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {importing ? (
              <>
                <span style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                Syncing…
              </>
            ) : (
              'Sync Activities'
            )}
          </button>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            style={{ padding: '10px 16px', borderRadius: 12, background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', cursor: disconnecting ? 'not-allowed' : 'pointer', opacity: disconnecting ? 0.5 : 1, fontSize: 14 }}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={() => { window.location.href = getStravaAuthUrl() }}
          style={{ background: '#FC4C02', color: 'white', fontWeight: 600, fontSize: 15, padding: '10px 0', borderRadius: 12, border: 'none', cursor: 'pointer' }}
        >
          Connect Strava
        </button>
      )}

      {!isConnected && (
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          You'll be redirected to Strava to authorize read access to your activities.
          Your Strava password is never shared with this app.
        </p>
      )}
    </div>
  )
}
