/**
 * TSS (Training Stress Score) calculation utilities.
 * All functions are pure — no React, no Supabase dependencies.
 */

/**
 * Bike TSS from duration and intensity factor.
 * TSS = duration_hours * IF^2 * 100
 *
 * @param {number} durationMinutes
 * @param {number} intensityFactor  (0.0 – 1.2)
 * @returns {number}
 */
export function calcBikeTSS(durationMinutes, intensityFactor) {
  const hours = durationMinutes / 60
  return Math.round(hours * Math.pow(intensityFactor, 2) * 100 * 10) / 10
}

/**
 * Run rTSS from duration, distance, and optional threshold pace.
 * IF = threshold_pace / actual_pace (faster pace → higher IF)
 * Falls back to IF=0.75 (moderate) when thresholds are unavailable.
 *
 * @param {number} durationMinutes
 * @param {number} distanceKm
 * @param {number|null} thresholdPaceMinPerKm  e.g. 5.0 for 5:00/km
 * @returns {{ tss: number, intensityFactor: number }}
 */
export function calcRunTSS(durationMinutes, distanceKm, thresholdPaceMinPerKm) {
  const hours = durationMinutes / 60
  if (!thresholdPaceMinPerKm || !distanceKm || distanceKm <= 0) {
    const IF = 0.75
    return { tss: Math.round(hours * IF * IF * 100 * 10) / 10, intensityFactor: IF }
  }
  const actualPace = durationMinutes / distanceKm
  const IF = Math.min(thresholdPaceMinPerKm / actualPace, 1.2)
  const durationSec = durationMinutes * 60
  const thresholdPaceSec = thresholdPaceMinPerKm * 60
  const tss = ((durationSec * IF) / (thresholdPaceSec * 3600)) * 100
  return {
    tss: Math.round(tss * 10) / 10,
    intensityFactor: Math.round(IF * 1000) / 1000,
  }
}

/**
 * Swim sTSS from duration, distance, and optional threshold pace per 100m.
 * Same structure as rTSS.
 *
 * @param {number} durationMinutes
 * @param {number} distanceKm
 * @param {number|null} thresholdPacePer100m  e.g. 1.5 for 1:30/100m
 * @returns {{ tss: number, intensityFactor: number }}
 */
export function calcSwimTSS(durationMinutes, distanceKm, thresholdPacePer100m) {
  const hours = durationMinutes / 60
  if (!thresholdPacePer100m || !distanceKm || distanceKm <= 0) {
    const IF = 0.75
    return { tss: Math.round(hours * IF * IF * 100 * 10) / 10, intensityFactor: IF }
  }
  const distanceHundredMeters = distanceKm * 10
  const actualPace = durationMinutes / distanceHundredMeters
  const IF = Math.min(thresholdPacePer100m / actualPace, 1.2)
  const durationSec = durationMinutes * 60
  const thresholdPaceSec = thresholdPacePer100m * 60
  const tss = ((durationSec * IF) / (thresholdPaceSec * 3600)) * 100
  return {
    tss: Math.round(tss * 10) / 10,
    intensityFactor: Math.round(IF * 1000) / 1000,
  }
}

/**
 * Auto-calculate TSS for any workout type using stored profile thresholds.
 * Returns { tss, intensityFactor }.
 *
 * @param {{ type: 'swim'|'bike'|'run', duration: number, distance: number }} workout
 * @param {object|null} profile  — from useProfile(), may be null/undefined
 * @returns {{ tss: number, intensityFactor: number }}
 */
export function autoCalcTSS(workout, profile) {
  const { type, duration, distance } = workout
  const p = profile ?? {}

  if (type === 'bike') {
    // Without a power meter we use a default moderate IF of 0.75.
    // If the user has set FTP we still use IF=0.75 as a baseline since
    // we don't have actual power data — the formula remains duration-based.
    const IF = 0.75
    return { tss: calcBikeTSS(duration, IF), intensityFactor: IF }
  }

  if (type === 'run') {
    return calcRunTSS(duration, distance, p.threshold_pace_run ?? null)
  }

  if (type === 'swim') {
    return calcSwimTSS(duration, distance, p.threshold_pace_swim ?? null)
  }

  return { tss: 0, intensityFactor: 0 }
}
