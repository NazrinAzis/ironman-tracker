/**
 * Training Load Monitor utilities
 *
 * 1. Weekly volume targets — how much swim/bike/run should a sub-11h athlete
 *    be doing per week in a typical build phase?
 *
 * 2. CTL Ramp Rate + Injury Risk — how fast is fitness growing this week?
 *    Ramp rate > 5–7 CTL pts/week elevates injury risk.
 *    (Adapted from Coggan/Allen PMC literature and IRONMAN coaching guidelines.)
 */

import { getWeekWorkouts } from './ironman'

// ── Weekly volume targets for a sub-11h build phase ──────────────────────────
// These represent a sensible mid-to-peak-build week (not taper, not base).
// Source: IRONMAN coaching literature for athletes targeting 10–11h finish times.

export const WEEKLY_TARGETS = {
  swim: { min: 10, max: 15, unit: 'km',  label: 'Swim' },
  bike: { min: 200, max: 300, unit: 'km', label: 'Bike' },
  run:  { min: 45,  max: 65,  unit: 'km', label: 'Run'  },
}

// ── CTL ramp rate safety zones ────────────────────────────────────────────────
// CTL points gained in the last 7 days.

export const RAMP_ZONES = {
  recovery: {
    label:  'Recovery',
    color:  'blue',
    advice: 'CTL is declining — intentional rest week or taper. Good.',
  },
  safe: {
    label:  'Safe',
    color:  'green',
    advice: 'Optimal adaptation zone. Your body can absorb this load.',
  },
  caution: {
    label:  'Caution',
    color:  'amber',
    advice: 'Slightly elevated. Prioritise sleep, nutrition and easy days.',
  },
  risk: {
    label:  'Risk',
    color:  'red',
    advice: 'High injury risk. Reduce volume this week to protect your training.',
  },
}

// ── Weekly volume computation ─────────────────────────────────────────────────

/**
 * Current week's distance per discipline (km).
 *
 * @param {Array<{ type: string, distance: number, date: string }>} workouts
 * @returns {{ swim: number, bike: number, run: number }}
 */
export function calcWeeklyVolume(workouts) {
  const week = getWeekWorkouts(workouts)
  const sum  = (type) =>
    +week
      .filter((w) => w.type === type)
      .reduce((s, w) => s + (w.distance ?? 0), 0)
      .toFixed(1)
  return { swim: sum('swim'), bike: sum('bike'), run: sum('run') }
}

/**
 * Volume status for a single discipline.
 * Returns how far through the target range the athlete is.
 *
 * @param {number} current   — km logged this week
 * @param {{ min: number, max: number }} target
 * @returns {{
 *   percent: number,      // 0–100+ (can exceed 100 if above max)
 *   status: 'low'|'good'|'over',
 *   midpoint: number,     // midpoint of target range, used as display reference
 * }}
 */
function volumeStatus(current, target) {
  const midpoint = (target.min + target.max) / 2
  const percent  = Math.min((current / target.max) * 100, 110)
  const status   =
    current < target.min  ? 'low' :
    current <= target.max ? 'good' :
    'over'
  return { percent: +percent.toFixed(1), status, midpoint }
}

// ── CTL ramp rate ─────────────────────────────────────────────────────────────

/**
 * Calculate CTL ramp rate and injury risk from the PMC series.
 * Compares CTL today vs CTL exactly 7 days ago.
 *
 * @param {Array<{ ctl: number }>} pmcSeries  — from buildPMCSeries()
 * @returns {{
 *   ratePerWeek: number|null,
 *   status: 'recovery'|'safe'|'caution'|'risk'|null,
 *   zone: object|null,
 *   ctlNow: number|null,
 *   ctl7dAgo: number|null,
 * }}
 */
export function calcRampRate(pmcSeries) {
  if (!pmcSeries || pmcSeries.length < 8) {
    return { ratePerWeek: null, status: null, zone: null, ctlNow: null, ctl7dAgo: null }
  }

  const ctlNow    = pmcSeries[pmcSeries.length - 1].ctl
  const ctl7dAgo  = pmcSeries[pmcSeries.length - 8].ctl
  const rate      = +(ctlNow - ctl7dAgo).toFixed(1)

  let status
  if (rate < 0)       status = 'recovery'
  else if (rate <= 5) status = 'safe'
  else if (rate <= 8) status = 'caution'
  else                status = 'risk'

  return {
    ratePerWeek: rate,
    status,
    zone:        RAMP_ZONES[status],
    ctlNow:      +ctlNow.toFixed(1),
    ctl7dAgo:    +ctl7dAgo.toFixed(1),
  }
}

// ── Master entry point ────────────────────────────────────────────────────────

/**
 * Compute all training load data for the monitor component.
 *
 * @param {Array}  workouts
 * @param {Array}  pmcSeries  — from buildPMCSeries(workouts)
 * @returns {{
 *   volume: { swim, bike, run },
 *   volumeStatus: { swim, bike, run },
 *   targets: typeof WEEKLY_TARGETS,
 *   rampRate: ReturnType<calcRampRate>,
 * }}
 */
export function computeTrainingLoad(workouts, pmcSeries) {
  const volume = calcWeeklyVolume(workouts)
  return {
    volume,
    volumeStatus: {
      swim: volumeStatus(volume.swim, WEEKLY_TARGETS.swim),
      bike: volumeStatus(volume.bike, WEEKLY_TARGETS.bike),
      run:  volumeStatus(volume.run,  WEEKLY_TARGETS.run),
    },
    targets:  WEEKLY_TARGETS,
    rampRate: calcRampRate(pmcSeries),
  }
}
