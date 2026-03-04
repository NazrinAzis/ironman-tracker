import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  exchangeStravaCode,
  refreshStravaToken,
  fetchStravaActivities,
  mapStravaActivity,
} from '../utils/strava'

export function useStrava() {
  const { user } = useAuth()
  const [connecting, setConnecting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null) // { imported, skipped }
  const [error, setError] = useState(null)

  /**
   * Exchange the OAuth code for tokens and persist them to the profile.
   * Called from the /strava/callback page.
   */
  const handleStravaCallback = useCallback(async (code) => {
    setConnecting(true)
    setError(null)
    try {
      const tokenData = await exchangeStravaCode(code)
      const { error: dbError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          strava_athlete_id: tokenData.athlete.id,
          strava_access_token: tokenData.access_token,
          strava_refresh_token: tokenData.refresh_token,
          strava_token_expires_at: tokenData.expires_at,
        })
      if (dbError) throw new Error(dbError.message)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setConnecting(false)
    }
  }, [user])

  /**
   * Return a valid access token, refreshing it if it has expired (or is close to expiry).
   * Persists refreshed tokens to Supabase so subsequent calls stay valid.
   */
  const getValidToken = useCallback(async (profile) => {
    const nowSeconds = Math.floor(Date.now() / 1000)
    const BUFFER = 300 // refresh 5 min before expiry

    if (profile.strava_token_expires_at - BUFFER > nowSeconds) {
      return profile.strava_access_token
    }

    const newTokenData = await refreshStravaToken(profile.strava_refresh_token)
    await supabase.from('profiles').upsert({
      id: user.id,
      strava_access_token: newTokenData.access_token,
      strava_refresh_token: newTokenData.refresh_token,
      strava_token_expires_at: newTokenData.expires_at,
    })
    return newTokenData.access_token
  }, [user])

  /**
   * Import all Strava activities for the authenticated user.
   * Paginates until Strava returns an empty page.
   * Uses upsert + ignoreDuplicates to safely re-run without creating duplicates.
   *
   * @param {object} profile — full profile row (must have strava tokens)
   * @returns {Promise<{ imported: number, skipped: number }>}
   */
  const importActivities = useCallback(async (profile) => {
    setImporting(true)
    setError(null)
    setImportResult(null)
    let imported = 0
    let skipped = 0

    try {
      const accessToken = await getValidToken(profile)

      // Fetch all existing strava_activity_ids for this user so we can skip duplicates
      const { data: existing, error: fetchError } = await supabase
        .from('workouts')
        .select('strava_activity_id')
        .eq('user_id', user.id)
        .not('strava_activity_id', 'is', null)
      if (fetchError) throw new Error(fetchError.message)

      // Normalize to string — Supabase returns bigint as string, Strava returns id as number
      const existingIds = new Set((existing ?? []).map((r) => String(r.strava_activity_id)))

      let page = 1

      while (true) {
        const activities = await fetchStravaActivities(accessToken, { page, perPage: 50 })
        if (activities.length === 0) break

        const rows = activities
          .map((a) => mapStravaActivity(a, user.id))
          .filter(Boolean)
          .filter((r) => !existingIds.has(String(r.strava_activity_id)))

        skipped += activities.filter((a) => {
          const mapped = mapStravaActivity(a, user.id)
          return !mapped || existingIds.has(String(mapped?.strava_activity_id))
        }).length

        if (rows.length > 0) {
          const { data, error: insertError } = await supabase
            .from('workouts')
            .upsert(rows, { onConflict: 'strava_activity_id', ignoreDuplicates: true })
            .select('id')

          if (insertError) throw new Error(insertError.message)
          imported += data?.length ?? 0
          rows.forEach((r) => existingIds.add(String(r.strava_activity_id)))
        }

        page += 1
      }

      const result = { imported, skipped }
      setImportResult(result)
      return result
    } catch (err) {
      setError(err.message)
      return { imported: 0, skipped: 0 }
    } finally {
      setImporting(false)
    }
  }, [user, getValidToken])

  /**
   * Disconnect Strava by clearing all token fields on the profile.
   */
  const disconnectStrava = useCallback(async () => {
    setError(null)
    const { error: dbError } = await supabase.from('profiles').upsert({
      id: user.id,
      strava_athlete_id: null,
      strava_access_token: null,
      strava_refresh_token: null,
      strava_token_expires_at: null,
    })
    if (dbError) setError(dbError.message)
  }, [user])

  return {
    connecting,
    importing,
    importResult,
    error,
    handleStravaCallback,
    importActivities,
    disconnectStrava,
  }
}
