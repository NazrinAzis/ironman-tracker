/**
 * Strava OAuth and API utilities.
 *
 * NOTE: VITE_STRAVA_CLIENT_SECRET is bundled into the client build.
 * This is acceptable for a personal training tool. For a multi-user
 * production app, move the token exchange to a Supabase Edge Function
 * to keep the secret server-side.
 */

const CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID
const CLIENT_SECRET = import.meta.env.VITE_STRAVA_CLIENT_SECRET
const REDIRECT_URI = import.meta.env.VITE_STRAVA_REDIRECT_URI

/**
 * Return the Strava OAuth authorization URL.
 * Redirects the user to Strava to grant activity:read_all access.
 * @returns {string}
 */
export function getStravaAuthUrl() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'activity:read_all',
  })
  return `https://www.strava.com/oauth/authorize?${params.toString()}`
}

/**
 * Exchange an authorization code for access + refresh tokens.
 * @param {string} code
 * @returns {Promise<{ access_token, refresh_token, expires_at, athlete }>}
 */
export async function exchangeStravaCode(code) {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Strava token exchange failed (${res.status}): ${body}`)
  }
  return res.json()
}

/**
 * Refresh an expired Strava access token.
 * @param {string} refreshToken
 * @returns {Promise<{ access_token, refresh_token, expires_at }>}
 */
export async function refreshStravaToken(refreshToken) {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Strava token refresh failed (${res.status}): ${body}`)
  }
  return res.json()
}

/**
 * Fetch one page of activities from Strava API.
 * @param {string} accessToken
 * @param {{ page?: number, perPage?: number, after?: number }} opts
 * @returns {Promise<Array>}
 */
export async function fetchStravaActivities(accessToken, { page = 1, perPage = 50, after } = {}) {
  const params = new URLSearchParams({ page, per_page: perPage })
  if (after) params.set('after', String(after))
  const res = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Strava activities fetch failed (${res.status}): ${body}`)
  }
  return res.json()
}

/**
 * Map a Strava activity type to the app's workout type.
 * Returns null for unsupported types (they will be skipped on import).
 * @param {string} stravaType
 * @returns {'bike'|'run'|'swim'|'strength'|null}
 */
export function mapStravaType(stravaType) {
  const map = {
    // Triathlon disciplines
    Ride:          'bike',
    VirtualRide:   'bike',
    EBikeRide:     'bike',
    GravelRide:    'bike',
    Run:           'run',
    VirtualRun:    'run',
    TrailRun:      'run',
    Swim:          'swim',
    // Strength & conditioning
    WeightTraining: 'strength',
    Workout:        'strength',
    Crossfit:       'strength',
  }
  return map[stravaType] ?? null
}

/**
 * Convert a raw Strava activity to an app workout insert row.
 * Uses suffer_score as TSS proxy when available.
 * Returns null for unsupported activity types.
 *
 * @param {object} activity  — raw Strava activity object
 * @param {string} userId    — Supabase auth user id
 * @returns {object|null}
 */
export function mapStravaActivity(activity, userId) {
  const type = mapStravaType(activity.type)
  if (!type) return null

  // Strength activities have no meaningful distance — store null
  const distance = type === 'strength'
    ? null
    : Math.round((activity.distance / 1000) * 100) / 100

  // Strength activities often have moving_time=0 (no GPS movement tracked).
  // Fall back to elapsed_time so duration is never 0.
  const rawSeconds = (type === 'strength' && !activity.moving_time)
    ? activity.elapsed_time
    : activity.moving_time
  const duration = Math.max(1, Math.round((rawSeconds || 0) / 60))

  return {
    user_id: userId,
    type,
    distance,
    duration,
    date: activity.start_date_local.slice(0, 10),
    notes: activity.name ?? null,
    strava_activity_id: activity.id,
    heart_rate: activity.average_heartrate ? Math.round(activity.average_heartrate) : null,
    tss: activity.suffer_score ?? null,
    tss_source: activity.suffer_score != null ? 'strava' : null,
    intensity_factor: null,
  }
}
