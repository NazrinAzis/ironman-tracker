/**
 * Training Quality utilities
 *
 * Three features:
 * 1. Discipline Time Balance  — actual swim/bike/run time split vs IRONMAN-optimal
 * 2. Key Session Compliance   — long rides/runs/swims done in last 28 days vs targets
 * 3. Brick Workout Detection  — bike+run same-day combos, count + recent dates
 */

// ── Constants ────────────────────────────────────────────────────────────────

/**
 * IRONMAN-optimal training time allocation by discipline.
 * Based on race time distribution for ~10–11h athletes:
 * bike ≈ 50% of race, so training bias toward bike is correct.
 */
export const OPTIMAL_TIME_SPLIT = { swim: 15, bike: 60, run: 25 } // %

/**
 * Thresholds that define a "key" long session for each discipline.
 * These are the sessions that build IRONMAN-specific endurance.
 */
export const KEY_SESSION_DEF = {
  swim: { minKm: 3,   minMin: null, display: '3 km+'    },
  bike: { minKm: null, minMin: 240, display: '4 hrs+'   }, // 240 min = 4 h
  run:  { minKm: null, minMin: 90,  display: '90 min+'  },
}

/** Recommended key sessions per 28-day block (build phase) */
export const KEY_SESSION_TARGETS = { swim: 2, bike: 3, run: 3 }

/** Recommended brick workouts per 28-day block */
export const BRICK_TARGET = 4

/** Look-back window in days for key-session and brick tracking */
const LOOKBACK_DAYS = 28

// ── Helpers ──────────────────────────────────────────────────────────────────

/** ISO date string for N days ago */
function daysAgoISO(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

// ── 1. Discipline Time Balance ────────────────────────────────────────────────

/**
 * Computes how the athlete's ALL-TIME training time is split across disciplines
 * vs the IRONMAN-optimal ratio.
 *
 * "gap" is positive when over-allocated, negative when under-allocated.
 * status: 'ok' = within ±5pp  |  'under'  |  'over'
 *
 * Returns null when no workout duration data exists.
 *
 * @param {Array<{ type: string, duration: number }>} workouts
 * @returns {{
 *   swim: DisciplineSlice,
 *   bike: DisciplineSlice,
 *   run:  DisciplineSlice,
 *   totalMinutes: number,
 *   insight: string|null,
 * } | null}
 *
 * @typedef {{ minutes: number, actual: number, target: number, gap: number, status: string }} DisciplineSlice
 */
export function calcDisciplineBalance(workouts) {
  const totals = { swim: 0, bike: 0, run: 0 }
  for (const w of workouts) {
    if (w.type in totals) totals[w.type] += w.duration ?? 0
  }

  const totalMin = totals.swim + totals.bike + totals.run
  if (totalMin === 0) return null

  const result = {}
  for (const key of ['swim', 'bike', 'run']) {
    const actual = (totals[key] / totalMin) * 100
    const target = OPTIMAL_TIME_SPLIT[key]
    const gap    = +(actual - target).toFixed(1)
    result[key]  = {
      minutes: totals[key],
      actual:  +actual.toFixed(1),
      target,
      gap,
      status: Math.abs(gap) < 5 ? 'ok' : gap < 0 ? 'under' : 'over',
    }
  }

  result.totalMinutes = totalMin

  // Primary insight: biggest under-allocated discipline
  const worstKey = ['swim', 'bike', 'run'].reduce(
    (worst, k) => (result[k].gap < result[worst].gap ? k : worst),
    'swim'
  )

  const INSIGHTS = {
    swim: 'Swim volume is below optimal. It is the easiest place to add low-stress aerobic time.',
    bike: 'Bike is under-represented — it covers 50% of your race time and is the biggest lever for sub-11h.',
    run:  'Run volume is lower than optimal. Add one more quality run each week to close the gap.',
  }

  result.insight = result[worstKey].status === 'under' ? INSIGHTS[worstKey] : null

  return result
}

// ── 2. Key Session Compliance ─────────────────────────────────────────────────

/**
 * Counts long sessions per discipline in the last 28 days.
 *
 * @param {Array<{ type: string, distance?: number, duration?: number, date: string }>} workouts
 * @returns {{ swim: number, bike: number, run: number }}
 */
export function calcKeySessions(workouts) {
  const cutoff = daysAgoISO(LOOKBACK_DAYS)
  const recent = workouts.filter((w) => w.date >= cutoff)

  return {
    swim: recent.filter(
      (w) => w.type === 'swim' && (w.distance ?? 0) >= KEY_SESSION_DEF.swim.minKm
    ).length,
    bike: recent.filter(
      (w) => w.type === 'bike' && (w.duration ?? 0) >= KEY_SESSION_DEF.bike.minMin
    ).length,
    run: recent.filter(
      (w) => w.type === 'run' && (w.duration ?? 0) >= KEY_SESSION_DEF.run.minMin
    ).length,
  }
}

// ── 3. Brick Workout Detection ────────────────────────────────────────────────

/**
 * Detects days where both a bike AND a run workout were logged.
 * Returns recent brick dates (newest first) and 28-day count.
 *
 * @param {Array<{ type: string, date: string }>} workouts
 * @returns {{
 *   recentCount: number,   // bricks in last 28 days
 *   recentDates: string[], // ISO dates of up to 3 most recent bricks
 *   totalCount:  number,   // all-time brick count
 * }}
 */
export function detectBricks(workouts) {
  // Group workout types by date
  const byDate = {}
  for (const w of workouts) {
    if (!w.date) continue
    const d = w.date.slice(0, 10)
    if (!byDate[d]) byDate[d] = new Set()
    byDate[d].add(w.type)
  }

  // Days with both bike and run
  const brickDates = Object.entries(byDate)
    .filter(([, types]) => types.has('bike') && types.has('run'))
    .map(([date]) => date)
    .sort()
    .reverse()

  const cutoff      = daysAgoISO(LOOKBACK_DAYS)
  const recentBricks = brickDates.filter((d) => d >= cutoff)

  return {
    recentCount: recentBricks.length,
    recentDates: recentBricks.slice(0, 3), // show up to 3 most recent
    totalCount:  brickDates.length,
  }
}

// ── Master entry point ────────────────────────────────────────────────────────

/**
 * Compute all training quality metrics.
 *
 * @param {Array} workouts
 * @returns {{
 *   balance:     ReturnType<calcDisciplineBalance>,
 *   keySessions: ReturnType<calcKeySessions>,
 *   bricks:      ReturnType<detectBricks>,
 * }}
 */
export function computeTrainingQuality(workouts) {
  return {
    balance:     calcDisciplineBalance(workouts),
    keySessions: calcKeySessions(workouts),
    bricks:      detectBricks(workouts),
  }
}
