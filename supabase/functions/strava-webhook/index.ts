/**
 * Strava Webhook Edge Function
 *
 * Handles two types of requests from Strava:
 *   GET  — subscription validation challenge (one-time during setup)
 *   POST — activity event (create / update / delete)
 *
 * Only "create" events are acted on — the new activity is fetched from
 * Strava and upserted into the workouts table.
 *
 * Required Supabase secrets (set via `supabase secrets set`):
 *   STRAVA_VERIFY_TOKEN      — any secret string you choose
 *   STRAVA_CLIENT_ID         — from strava.com/settings/api
 *   STRAVA_CLIENT_SECRET     — from strava.com/settings/api
 *   SUPABASE_SERVICE_ROLE_KEY — from Supabase dashboard → Settings → API
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VERIFY_TOKEN        = Deno.env.get('STRAVA_VERIFY_TOKEN')!
const CLIENT_ID           = Deno.env.get('STRAVA_CLIENT_ID')!
const CLIENT_SECRET       = Deno.env.get('STRAVA_CLIENT_SECRET')!
const SUPABASE_URL        = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

/* ─── Type mapping (mirrors src/utils/strava.js) ──────── */
const TYPE_MAP: Record<string, string> = {
  Ride:          'bike',
  VirtualRide:   'bike',
  EBikeRide:     'bike',
  GravelRide:    'bike',
  Run:           'run',
  VirtualRun:    'run',
  TrailRun:      'run',
  Swim:          'swim',
  WeightTraining:'strength',
  Workout:       'strength',
  Crossfit:      'strength',
}

/* ─── Token refresh helper ─────────────────────────────── */
async function getValidToken(profile: Record<string, unknown>, supabase: ReturnType<typeof createClient>) {
  const nowSeconds = Math.floor(Date.now() / 1000)
  const expires = profile.strava_token_expires_at as number

  if (expires - 300 > nowSeconds) {
    return profile.strava_access_token as string
  }

  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: profile.strava_refresh_token,
      grant_type: 'refresh_token',
    }),
  })
  const tokens = await res.json()
  await supabase.from('profiles').update({
    strava_access_token:      tokens.access_token,
    strava_refresh_token:     tokens.refresh_token,
    strava_token_expires_at:  tokens.expires_at,
  }).eq('id', profile.id)

  return tokens.access_token as string
}

/* ─── Main handler ─────────────────────────────────────── */
serve(async (req: Request) => {
  // ── GET: Strava subscription validation challenge ──────
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const mode      = url.searchParams.get('hub.mode')
    const token     = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token === VERIFY_TOKEN && challenge) {
      return new Response(JSON.stringify({ 'hub.challenge': challenge }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response('Forbidden', { status: 403 })
  }

  // ── POST: Strava activity event ────────────────────────
  if (req.method === 'POST') {
    const event = await req.json()

    // Only handle new activity creations
    if (event.object_type !== 'activity' || event.aspect_type !== 'create') {
      return new Response('OK', { status: 200 })
    }

    const activityId = event.object_id
    const athleteId  = event.owner_id

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Look up the user by their Strava athlete ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, strava_access_token, strava_refresh_token, strava_token_expires_at')
      .eq('strava_athlete_id', athleteId)
      .single()

    if (!profile) {
      return new Response('Athlete not found', { status: 200 })
    }

    // Get a valid (possibly refreshed) access token
    const accessToken = await getValidToken(profile, supabase)

    // Fetch the full activity from Strava
    const actRes = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!actRes.ok) {
      return new Response('Failed to fetch activity', { status: 200 })
    }
    const activity = await actRes.json()

    // Map to our workout type
    const type = TYPE_MAP[activity.type]
    if (!type) return new Response('Unsupported type', { status: 200 })

    const isStrength = type === 'strength'
    const distance = isStrength
      ? null
      : Math.round((activity.distance / 1000) * 100) / 100

    const rawSeconds = (isStrength && !activity.moving_time)
      ? activity.elapsed_time
      : activity.moving_time
    const duration = Math.max(1, Math.round((rawSeconds || 0) / 60))

    const row = {
      user_id:             profile.id,
      type,
      distance,
      duration,
      date:                activity.start_date_local.slice(0, 10),
      notes:               activity.name ?? null,
      strava_activity_id:  activity.id,
      heart_rate:          activity.average_heartrate
                             ? Math.round(activity.average_heartrate) : null,
      tss:                 activity.suffer_score ?? null,
      tss_source:          activity.suffer_score != null ? 'strava' : null,
      intensity_factor:    null,
    }

    const { error } = await supabase
      .from('workouts')
      .upsert(row, { onConflict: 'strava_activity_id', ignoreDuplicates: true })

    if (error) {
      console.error('Upsert error:', error.message)
      return new Response('DB error', { status: 500 })
    }

    return new Response('OK', { status: 200 })
  }

  return new Response('Method not allowed', { status: 405 })
})
