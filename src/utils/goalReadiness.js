/**
 * Sub-11 Hour IRONMAN Goal Readiness — pure computation utilities.
 *
 * All functions are side-effect free. No React imports.
 * Call computeGoalReadiness(workouts, profile) to get the full readiness object.
 */

import { buildPMCSeries, getCurrentPMC } from './pmc'
import { daysUntil, getWeekWorkouts } from './ironman'

// ── Sub-11 hour benchmarks (age-group research-based) ────────────────────────

/** Required thresholds per discipline for a sub-11h IRONMAN finish */
export const SUB11_THRESHOLD_TARGETS = {
  swim: 1.75,  // min/100m  — CSS ≤ 1:45/100m
  bike: 220,   // watts FTP — ride at ~72% FTP = ~158W avg
  run:  5.0,   // min/km   — threshold pace ≤ 5:00/km → race pace ~5:49/km
}

/** Target split times in minutes */
export const SUB11_SPLITS = {
  swim: { minutes: 75,  label: '1:15:00' },  // 3.86 km
  bike: { minutes: 330, label: '5:30:00' },  // 180.25 km
  run:  { minutes: 245, label: '4:05:00' },  // 42.2 km
}

/** Target peak CTL (Chronic Training Load / Fitness) for sub-11h */
export const CTL_TARGET = 85

/** Weeks of taper before race (standard IRONMAN protocol) */
export const CTL_TAPER_WEEKS = 3

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converts the database decimal-minute pace format to a MM:SS display string.
 * The DB stores pace as decimal minutes, e.g. 5.25 = 5 min 15 sec (NOT 5:25).
 * The fractional part is a fraction of a minute: 0.25 × 60 = 15 seconds.
 *
 * @param {number|null} decimalMinutes
 * @returns {string}  e.g. "5:15", "1:45", "—"
 */
export function formatDecimalPace(decimalMinutes) {
  if (decimalMinutes == null) return '—'
  const mins = Math.floor(decimalMinutes)
  const secs = Math.round((decimalMinutes - mins) * 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// ── Core computations ─────────────────────────────────────────────────────────

/**
 * Computes CTL progress toward the sub-11h target of 85.
 *
 * @param {number|null} currentCTL
 * @returns {{ current: number, target: number, percent: number, gap: number, status: 'met'|'close'|'gap' }}
 */
export function calcCTLProgress(currentCTL) {
  const current = currentCTL ?? 0
  const target  = CTL_TARGET
  const percent = Math.min((current / target) * 100, 100)
  const gap     = Math.max(target - current, 0)

  let status = 'gap'
  if (current >= target)             status = 'met'
  else if (current >= target * 0.9)  status = 'close'  // within 10% = ~76.5 CTL

  return {
    current: +current.toFixed(1),
    target,
    percent: +percent.toFixed(1),
    gap:     +gap.toFixed(1),
    status,
  }
}

/**
 * Compares each stored threshold against the sub-11 requirement.
 *
 * Pace direction: lower = faster = better (swim & run).
 * Power direction: higher = stronger = better (bike FTP).
 *
 * @param {{ ftp_watts?: number, threshold_pace_run?: number, threshold_pace_swim?: number }|null} profile
 * @returns {{ swim: ThresholdResult, bike: ThresholdResult, run: ThresholdResult }}
 *
 * @typedef {{ current: number|null, target: number, gap: number|null, status: 'met'|'close'|'gap'|'unknown', unit: string }} ThresholdResult
 */
export function calcThresholdGaps(profile) {
  const p = profile ?? {}

  function paceResult(current, target, unit) {
    if (current == null) return { current: null, target, gap: null, status: 'unknown', unit }
    const gap = +(current - target).toFixed(2)   // positive = slower than needed
    let status = 'gap'
    if (gap <= 0)    status = 'met'
    else if (gap <= 0.25) status = 'close'        // within 15 sec/km or /100m
    return { current, target, gap, status, unit }
  }

  function powerResult(current, target, unit) {
    if (current == null) return { current: null, target, gap: null, status: 'unknown', unit }
    const gap = +(target - current).toFixed(0)   // positive = below target
    let status = 'gap'
    if (gap <= 0)   status = 'met'
    else if (gap <= 15) status = 'close'          // within 15W
    return { current, target, gap, status, unit }
  }

  return {
    swim: paceResult(p.threshold_pace_swim ?? null, SUB11_THRESHOLD_TARGETS.swim, 'min/100m'),
    bike: powerResult(p.ftp_watts ?? null,           SUB11_THRESHOLD_TARGETS.bike, 'W'),
    run:  paceResult(p.threshold_pace_run ?? null,   SUB11_THRESHOLD_TARGETS.run,  'min/km'),
  }
}

/**
 * Average weekly CTL gain over the last 4 completed weeks.
 * Returns null when fewer than 28 days of PMC data exist.
 *
 * @param {Array<{ ctl: number }>} pmcSeries  — from buildPMCSeries()
 * @returns {number|null}
 */
export function calcCTLGrowthRate(pmcSeries) {
  if (!pmcSeries || pmcSeries.length < 28) return null
  const recent = pmcSeries[pmcSeries.length - 1].ctl
  const old    = pmcSeries[pmcSeries.length - 29].ctl  // exactly 28 days ago
  return +((recent - old) / 4).toFixed(2)
}

/**
 * Projects CTL on race morning using a build + taper model.
 *
 * Build phase: CTL grows linearly at `growthRate` points/week until 21 days before race.
 * Taper phase: 21-day EMA decay with daily TSS = 30% of peak CTL.
 *   Formula: ctlRaceDay = tssTaper + (ctlPeak − tssTaper) × (41/42)^21
 *   (41/42)^21 ≈ 0.603 — standard 42-day EMA decay over taper duration.
 *
 * @param {number}      currentCTL
 * @param {number|null} growthRate   — weekly CTL gain (null → assume 0)
 * @param {number|null} daysToRace  — from daysUntil(); null or ≤0 → no race date
 * @returns {{ projectedCTL: number|null, buildWeeks: number|null, taperDays: number, willMeetTarget: boolean|null }}
 */
export function projectCTLAtRace(currentCTL, growthRate, daysToRace) {
  const taperDays = CTL_TAPER_WEEKS * 7  // 21 days

  if (!daysToRace || daysToRace <= 0) {
    return { projectedCTL: null, buildWeeks: null, taperDays, willMeetTarget: null }
  }

  const buildDays  = Math.max(daysToRace - taperDays, 0)
  const buildWeeks = buildDays / 7
  const rate       = Math.min(Math.max(growthRate ?? 0, 0), 5)  // cap: 0–5 CTL/week

  const ctlPeak   = currentCTL + rate * buildWeeks
  const tssTaper  = ctlPeak * 0.30                              // 30% maintenance load
  const decay     = Math.pow(41 / 42, taperDays)                // ≈ 0.603 at day 21
  const projectedCTL = tssTaper + (ctlPeak - tssTaper) * decay

  return {
    projectedCTL:   +projectedCTL.toFixed(1),
    buildWeeks:     +buildWeeks.toFixed(1),
    taperDays,
    willMeetTarget: projectedCTL >= CTL_TARGET,
  }
}

/**
 * Total TSS logged in the current training week (Monday → today).
 *
 * @param {Array<{ date: string, tss: number|null }>} workouts
 * @returns {number}
 */
export function calcWeeklyTSS(workouts) {
  return getWeekWorkouts(workouts).reduce((sum, w) => sum + (w.tss ?? 0), 0)
}

/**
 * Synthesises all signals into a single readiness status.
 *
 * Scoring rubric (max 5 pts):
 *   CTL met or projected to meet target  → +2
 *   CTL close (within 10%)              → +1
 *   Each discipline threshold 'met'      → +1
 *   Each discipline threshold 'close'    → +0.5
 *
 * Tiers:
 *   ≥ 5.5  → Race Ready  (green)
 *   ≥ 3.5  → On Track    (amber)
 *   ≥ 1.5  → Building    (blue)
 *   < 1.5  → Needs Work  (red)
 *
 * @param {ReturnType<typeof calcCTLProgress>}    ctlProgress
 * @param {ReturnType<typeof calcThresholdGaps>}  thresholds
 * @param {ReturnType<typeof projectCTLAtRace>}   projection
 * @returns {{ label: string, color: 'green'|'amber'|'blue'|'red', score: number }}
 */
export function getOverallReadinessStatus(ctlProgress, thresholds, projection) {
  let score = 0

  if (ctlProgress.status === 'met' || projection.willMeetTarget === true) score += 2
  else if (ctlProgress.status === 'close')                                score += 1

  for (const key of ['swim', 'bike', 'run']) {
    if (thresholds[key].status === 'met')   score += 1
    if (thresholds[key].status === 'close') score += 0.5
  }

  let label, color
  if (score >= 5.5)      { label = 'Race Ready'; color = 'green' }
  else if (score >= 3.5) { label = 'On Track';   color = 'amber' }
  else if (score >= 1.5) { label = 'Building';   color = 'blue'  }
  else                   { label = 'Needs Work';  color = 'red'   }

  return { label, color, score: +score.toFixed(1) }
}

/**
 * Generates 1–3 prioritised, actionable recommendations.
 * Priority: CTL gap → worst discipline threshold → taper timing.
 *
 * @param {ReturnType<typeof calcCTLProgress>}    ctlProgress
 * @param {ReturnType<typeof calcThresholdGaps>}  thresholds
 * @param {ReturnType<typeof projectCTLAtRace>}   projection
 * @param {number}                                weeklyTSS
 * @returns {string[]}
 */
export function buildRecommendations(ctlProgress, thresholds, projection, weeklyTSS) {
  const recs = []

  // 1. CTL / fitness gap
  if (ctlProgress.status === 'gap') {
    if (weeklyTSS < 400) {
      recs.push(
        `Fitness (CTL ${ctlProgress.current.toFixed(0)}) is ${ctlProgress.gap.toFixed(0)} points below the sub-11h target of ${CTL_TARGET}. ` +
        `Build weekly TSS gradually toward 600–750 to develop the base needed for race day.`
      )
    } else {
      recs.push(
        `CTL is ${ctlProgress.gap.toFixed(0)} points short of the ${CTL_TARGET} target — keep your current training rhythm ` +
        `and you should close the gap in ${Math.ceil(ctlProgress.gap / 2.5)} more weeks.`
      )
    }
  } else if (ctlProgress.status === 'met' && projection.willMeetTarget === false) {
    recs.push(
      `Your CTL meets the target now, but the taper model shows it dropping below ${CTL_TARGET} by race day. ` +
      `Continue building for ${Math.ceil(projection.buildWeeks ?? 2)} more weeks before starting your 3-week taper.`
    )
  }

  // 2. Worst discipline threshold gap (ordered by IRONMAN impact: bike → run → swim)
  const disciplineOrder = ['bike', 'run', 'swim']
  for (const key of disciplineOrder) {
    const t = thresholds[key]
    if (t.status === 'gap' && t.gap != null && recs.length < 2) {
      if (key === 'bike') {
        recs.push(
          `Bike FTP (${t.current}W) is ${t.gap}W below the ${t.target}W sub-11h benchmark. ` +
          `Add one structured interval session per week — e.g. 4×10 min at threshold power.`
        )
      } else if (key === 'run') {
        const gapSec = Math.round(t.gap * 60)
        recs.push(
          `Run threshold pace (${formatDecimalPace(t.current)}/km) is ${gapSec}s/km slower than the ${formatDecimalPace(t.target)}/km target. ` +
          `Include 20–30 min tempo runs at threshold effort weekly to lift your running economy.`
        )
      } else {
        const gapSec = Math.round(t.gap * 60)
        recs.push(
          `Swim CSS (${formatDecimalPace(t.current)}/100m) is ${gapSec}s/100m slower than the ${formatDecimalPace(t.target)}/100m target. ` +
          `Focus on CSS sets (e.g. 10×100m at threshold pace) twice per week.`
        )
      }
    }
  }

  // 3. Taper timing note when build window is tight
  if (recs.length < 3 && projection.buildWeeks != null && projection.buildWeeks < 4) {
    const daysLeft = Math.round(projection.buildWeeks * 7)
    recs.push(
      `Only ${daysLeft} days of build time remain before taper. ` +
      `Protect your key sessions and prioritise quality over volume to arrive at race week fresh.`
    )
  }

  // Positive close-out when everything looks good
  if (recs.length === 0) {
    recs.push(
      'All key metrics are aligned with sub-11h performance. ' +
      'Stick to your taper plan and trust the fitness you have built.'
    )
  }

  return recs.slice(0, 3)
}

// ── Master entry point ────────────────────────────────────────────────────────

/**
 * Computes the complete goal readiness object from raw hook data.
 * This is the single function the GoalReadiness component calls.
 *
 * @param {Array}        workouts  — from useWorkouts()
 * @param {object|null}  profile   — from useProfile()
 * @returns {{
 *   ctlProgress:      ReturnType<typeof calcCTLProgress>,
 *   thresholds:       ReturnType<typeof calcThresholdGaps>,
 *   projection:       ReturnType<typeof projectCTLAtRace>,
 *   weeklyTSS:        number,
 *   overallStatus:    ReturnType<typeof getOverallReadinessStatus>,
 *   recommendations:  string[],
 *   hasWorkouts:      boolean,
 *   hasThresholds:    boolean,
 *   hasRaceDate:      boolean,
 * }}
 */
export function computeGoalReadiness(workouts, profile) {
  const safeWorkouts = workouts ?? []
  const pmcSeries    = buildPMCSeries(safeWorkouts)
  const currentPMC   = getCurrentPMC(pmcSeries)
  const currentCTL   = currentPMC?.ctl ?? 0
  const growthRate   = calcCTLGrowthRate(pmcSeries)
  const daysToRace   = daysUntil(profile?.race_date)

  const ctlProgress    = calcCTLProgress(currentCTL)
  const thresholds     = calcThresholdGaps(profile)
  const projection     = projectCTLAtRace(currentCTL, growthRate, daysToRace)
  const weeklyTSS      = calcWeeklyTSS(safeWorkouts)
  const overallStatus  = getOverallReadinessStatus(ctlProgress, thresholds, projection)
  const recommendations = buildRecommendations(ctlProgress, thresholds, projection, weeklyTSS)

  const hasThresholds = !!(profile?.ftp_watts || profile?.threshold_pace_run || profile?.threshold_pace_swim)

  return {
    ctlProgress,
    thresholds,
    projection,
    weeklyTSS,
    overallStatus,
    recommendations,
    hasWorkouts:   safeWorkouts.length > 0,
    hasThresholds,
    hasRaceDate:   !!profile?.race_date,
  }
}
