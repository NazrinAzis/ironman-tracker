/**
 * IRONMAN Race Finish Time Predictor
 *
 * Estimates finish time from:
 *  1. Stored threshold data (preferred — higher accuracy)
 *  2. Average training pace/speed from logged workouts (fallback)
 *
 * Race pace factors vs threshold/training pace (validated against age-group data):
 *  Swim:  race CSS ≈ threshold × 1.08  (open water + wetsuit ≈ CSS race performance)
 *  Bike:  race speed ≈ training avg    (IRONMAN bike is sustained moderate effort;
 *                                       training average already reflects aerobic base)
 *  Run:   race pace ≈ threshold × 1.18 (bike-fatigue factor on IRONMAN marathon)
 *
 * Sub-11h splits: Swim 1:15 | Bike 5:30 | Run 4:05 | T1+T2 0:10
 */

// ── Constants ────────────────────────────────────────────────────────────────

const IRONMAN_DIST = { swim: 3.86, bike: 180.25, run: 42.2 } // km
const TRANSITIONS_MIN = 10
const SUB11_MIN = 660 // 11 × 60

const RACE_FACTOR = {
  swim_threshold: 1.08, // open water race CSS relative to pool CSS
  swim_avg:       1.12, // conservative factor when using average pace (no threshold)
  run_threshold:  1.18, // IRONMAN marathon vs run threshold (bike fatigue)
  run_avg:        1.28, // conservative when using average (no threshold)
}

// ── Formatting helpers ────────────────────────────────────────────────────────

/**
 * Format total minutes → "H:MM:SS" display string.
 * e.g. 702.5 → "11:42:30"
 * @param {number|null} totalMinutes
 * @returns {string}
 */
export function formatFinishTime(totalMinutes) {
  if (totalMinutes == null) return '—'
  const h = Math.floor(totalMinutes / 60)
  const m = Math.floor(totalMinutes % 60)
  const s = Math.round((totalMinutes - Math.floor(totalMinutes)) * 60)
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

/**
 * Format minutes → "H:MM" split display string.
 * e.g. 330.5 → "5:31"
 * @param {number|null} minutes
 * @returns {string}
 */
export function formatSplitTime(minutes) {
  if (minutes == null) return '—'
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return `${h}:${m.toString().padStart(2, '0')}`
}

/**
 * Convert decimal-minute pace → "M:SS" string.
 * e.g. 5.9 → "5:54", 1.89 → "1:53"
 * (DB format: 5.25 = 5 min 15 sec, NOT 5:25)
 * @param {number|null} decimalMin
 * @returns {string}
 */
function fmtPace(decimalMin) {
  if (decimalMin == null) return '—'
  const m = Math.floor(decimalMin)
  const s = Math.round((decimalMin - m) * 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ── Per-discipline predictors ─────────────────────────────────────────────────

/**
 * Predict swim split time.
 *
 * @param {{ threshold_pace_swim?: number }|null} profile
 * @param {Array<{ type: string, distance: number, duration: number }>} workouts
 * @returns {{ minutes: number|null, source: 'threshold'|'average'|null, paceLabel: string }}
 */
export function predictSwimTime(profile, workouts) {
  // Method 1: Use CSS (Critical Swim Speed) threshold
  if (profile?.threshold_pace_swim) {
    const racePace = profile.threshold_pace_swim * RACE_FACTOR.swim_threshold // min/100m
    const minutes  = (IRONMAN_DIST.swim * 10) * racePace                      // 3.86km = 38.6 × 100m
    return {
      minutes:    +minutes.toFixed(1),
      source:     'threshold',
      paceLabel:  `${fmtPace(racePace)}/100m`,
    }
  }

  // Method 2: Average swim pace from logged workouts
  const swims = workouts.filter((w) => w.type === 'swim' && w.distance > 0 && w.duration > 0)
  if (swims.length >= 2) {
    const dist = swims.reduce((s, w) => s + w.distance, 0)  // km
    const dur  = swims.reduce((s, w) => s + w.duration, 0)  // min
    const avgPacePer100m  = (dur / dist) / 10               // min/100m
    const racePacePer100m = avgPacePer100m * RACE_FACTOR.swim_avg
    const minutes = (IRONMAN_DIST.swim * 10) * racePacePer100m
    return {
      minutes:    +minutes.toFixed(1),
      source:     'average',
      paceLabel:  `${fmtPace(racePacePer100m)}/100m`,
    }
  }

  return { minutes: null, source: null, paceLabel: '—' }
}

/**
 * Predict bike split time.
 * Uses average training speed — IRONMAN bike pace closely mirrors aerobic
 * training speed. Filters rides ≥ 60 min to exclude recovery spins.
 *
 * @param {Array<{ type: string, distance: number, duration: number }>} workouts
 * @returns {{ minutes: number|null, source: 'average'|null, speedLabel: string }}
 */
export function predictBikeTime(workouts) {
  // Only use rides ≥ 60 min to get meaningful aerobic pace data
  const rides = workouts.filter(
    (w) => w.type === 'bike' && w.distance > 0 && w.duration >= 60
  )

  if (rides.length >= 3) {
    const dist      = rides.reduce((s, w) => s + w.distance, 0)  // km
    const dur       = rides.reduce((s, w) => s + w.duration, 0)  // min
    const avgKmh    = (dist / dur) * 60
    // IRONMAN race speed ≈ training average for well-trained athletes at this distance
    const raceKmh   = avgKmh
    const minutes   = (IRONMAN_DIST.bike / raceKmh) * 60
    return {
      minutes:    +minutes.toFixed(1),
      source:     'average',
      speedLabel: `${raceKmh.toFixed(1)} km/h`,
    }
  }

  return { minutes: null, source: null, speedLabel: '—' }
}

/**
 * Predict IRONMAN marathon split time.
 * Prefers run threshold pace; falls back to average training run pace.
 *
 * @param {{ threshold_pace_run?: number }|null} profile
 * @param {Array<{ type: string, distance: number, duration: number }>} workouts
 * @returns {{ minutes: number|null, source: 'threshold'|'average'|null, paceLabel: string }}
 */
export function predictRunTime(profile, workouts) {
  // Method 1: Run threshold pace
  if (profile?.threshold_pace_run) {
    const racePace = profile.threshold_pace_run * RACE_FACTOR.run_threshold  // min/km
    const minutes  = IRONMAN_DIST.run * racePace
    return {
      minutes:    +minutes.toFixed(1),
      source:     'threshold',
      paceLabel:  `${fmtPace(racePace)}/km`,
    }
  }

  // Method 2: Average training run pace
  const runs = workouts.filter((w) => w.type === 'run' && w.distance > 0 && w.duration > 0)
  if (runs.length >= 3) {
    const dist        = runs.reduce((s, w) => s + w.distance, 0)
    const dur         = runs.reduce((s, w) => s + w.duration, 0)
    const avgPace     = dur / dist                                 // min/km
    const racePace    = avgPace * RACE_FACTOR.run_avg
    const minutes     = IRONMAN_DIST.run * racePace
    return {
      minutes:    +minutes.toFixed(1),
      source:     'average',
      paceLabel:  `${fmtPace(racePace)}/km`,
    }
  }

  return { minutes: null, source: null, paceLabel: '—' }
}

// ── Master predictor ──────────────────────────────────────────────────────────

/**
 * Compute complete race prediction with gap analysis.
 *
 * When a split is missing we apply a conservative fallback:
 *  swim → 90 min  |  bike → 360 min  |  run → 300 min
 * These are marked in `usedFallback` and lower the confidence level.
 *
 * confidence:
 *  'high'         — all splits from threshold data
 *  'medium'       — mix of threshold + average pace data
 *  'low'          — mostly average pace or partial data
 *  'insufficient' — fewer than 2 disciplines have any data
 *
 * @param {{ threshold_pace_swim?, threshold_pace_run? }|null} profile
 * @param {Array} workouts
 * @returns {{
 *   swim: ReturnType<predictSwimTime>,
 *   bike: ReturnType<predictBikeTime>,
 *   run:  ReturnType<predictRunTime>,
 *   transitions: number,
 *   total: number|null,
 *   gapToSub11: number|null,
 *   isSubEleven: boolean|null,
 *   confidence: 'high'|'medium'|'low'|'insufficient',
 *   hasData: boolean,
 * }}
 */
export function computeRacePrediction(profile, workouts) {
  const swim = predictSwimTime(profile, workouts)
  const bike = predictBikeTime(workouts)
  const run  = predictRunTime(profile, workouts)

  const available = [swim, bike, run].filter((s) => s.minutes != null)
  const hasData   = available.length >= 1

  if (!hasData) {
    return {
      swim, bike, run,
      transitions:  TRANSITIONS_MIN,
      total:        null,
      gapToSub11:   null,
      isSubEleven:  null,
      confidence:   'insufficient',
      hasData:      false,
    }
  }

  // Conservative fallbacks for missing splits
  const swimMin = swim.minutes ?? 90
  const bikeMin = bike.minutes ?? 360
  const runMin  = run.minutes  ?? 300
  const total   = +(swimMin + bikeMin + runMin + TRANSITIONS_MIN).toFixed(1)

  const gapToSub11  = +(total - SUB11_MIN).toFixed(1)  // negative = already sub-11h!
  const isSubEleven = total < SUB11_MIN

  // Confidence rating
  const missingCount    = [swim.minutes, bike.minutes, run.minutes].filter((m) => m == null).length
  const thresholdCount  = [swim.source, run.source].filter((s) => s === 'threshold').length
  let confidence
  if (missingCount >= 2)                              confidence = 'insufficient'
  else if (missingCount === 1)                        confidence = 'low'
  else if (thresholdCount === 2 && missingCount === 0) confidence = 'high'
  else if (thresholdCount >= 1)                       confidence = 'medium'
  else                                                confidence = 'low'

  return {
    swim, bike, run,
    transitions:  TRANSITIONS_MIN,
    total,
    gapToSub11,
    isSubEleven,
    confidence,
    hasData:      true,
  }
}
