/**
 * Heart Rate Zone utilities
 *
 * Zones are defined as a percentage of Lactate Threshold Heart Rate (LTHR),
 * following the Coggan 5-zone model commonly used in triathlon coaching.
 *
 * Zone boundaries (% of LTHR):
 *   Z1 Easy       < 80%   — recovery, very light aerobic
 *   Z2 Aerobic    80–90%  — the "money zone" for IRONMAN; builds fat oxidation
 *   Z3 Tempo      90–95%  — moderate-hard; the "grey zone" to avoid overdoing
 *   Z4 Threshold  95–105% — lactate threshold, used sparingly
 *   Z5 Hard      > 105%   — VO₂ max / anaerobic, rare in IRONMAN training
 *
 * Profile stores:
 *   threshold_hr_bike  — LTHR on the bike (typically ~155–175 bpm)
 *   threshold_hr_run   — LTHR running (typically 5–10 bpm higher than bike)
 * Swim workouts are excluded (pool HR is unreliable).
 *
 * Workouts store: heart_rate — average HR for the session (integer bpm).
 */

export const HR_ZONES = [
  {
    id:    1,
    label: 'Z1 · Easy',
    min:   0,
    max:   0.80,
    color: 'bg-gray-400',
    text:  'text-gray-400',
    bar:   'bg-gray-500',
    desc:  'Recovery',
    ideal: false,
  },
  {
    id:    2,
    label: 'Z2 · Aerobic',
    min:   0.80,
    max:   0.90,
    color: 'bg-green-500',
    text:  'text-green-400',
    bar:   'bg-green-500',
    desc:  '★ Money zone for IRONMAN',
    ideal: true,
  },
  {
    id:    3,
    label: 'Z3 · Tempo',
    min:   0.90,
    max:   0.95,
    color: 'bg-yellow-400',
    text:  'text-yellow-400',
    bar:   'bg-yellow-400',
    desc:  'Grey zone — use sparingly',
    ideal: false,
  },
  {
    id:    4,
    label: 'Z4 · Threshold',
    min:   0.95,
    max:   1.05,
    color: 'bg-orange-500',
    text:  'text-orange-400',
    bar:   'bg-orange-500',
    desc:  'Threshold intervals',
    ideal: false,
  },
  {
    id:    5,
    label: 'Z5 · Hard',
    min:   1.05,
    max:   Infinity,
    color: 'bg-red-500',
    text:  'text-red-400',
    bar:   'bg-red-500',
    desc:  'VO₂ max / anaerobic',
    ideal: false,
  },
]

/**
 * Classify a single workout into an HR zone.
 * Returns the zone object, or null if classification is not possible.
 *
 * @param {{ type: string, heart_rate?: number }} workout
 * @param {{ threshold_hr_bike?: number, threshold_hr_run?: number }|null} profile
 * @returns {typeof HR_ZONES[0] | null}
 */
export function classifyWorkoutZone(workout, profile) {
  if (!workout.heart_rate || !profile) return null

  const lthr =
    workout.type === 'bike' ? profile.threshold_hr_bike :
    workout.type === 'run'  ? profile.threshold_hr_run  :
    null

  if (!lthr) return null

  const ratio = workout.heart_rate / lthr
  return HR_ZONES.find((z) => ratio >= z.min && ratio < z.max) ?? HR_ZONES[HR_ZONES.length - 1]
}

/**
 * Compute the HR zone distribution across all classifiable workouts.
 *
 * @param {Array<{ type: string, heart_rate?: number, duration?: number }>} workouts
 * @param {{ threshold_hr_bike?: number, threshold_hr_run?: number }|null} profile
 * @returns {{
 *   zones: Array<{ zone: ZoneDef, count: number, minutes: number, percent: number }>,
 *   totalClassified: number,
 *   totalMinutes: number,
 *   hasData: boolean,
 *   hasThresholds: boolean,
 *   polarizationOk: boolean,  // true when Z2 ≥ 60% and Z3 < 20% (good polarization)
 *   z2Percent: number,
 *   z3Percent: number,
 * }}
 */
export function computeHRZoneDistribution(workouts, profile) {
  const hasThresholds = !!(profile?.threshold_hr_bike || profile?.threshold_hr_run)

  // Count + minutes per zone
  const zoneCounts   = {}
  const zoneMinutes  = {}
  HR_ZONES.forEach((z) => { zoneCounts[z.id] = 0; zoneMinutes[z.id] = 0 })

  let totalClassified = 0
  let totalMinutes    = 0

  for (const w of workouts) {
    const zone = classifyWorkoutZone(w, profile)
    if (!zone) continue
    zoneCounts[zone.id]  += 1
    zoneMinutes[zone.id] += w.duration ?? 0
    totalClassified      += 1
    totalMinutes         += w.duration ?? 0
  }

  const hasData = totalClassified > 0

  const zones = HR_ZONES.map((zone) => ({
    zone,
    count:   zoneCounts[zone.id],
    minutes: zoneMinutes[zone.id],
    percent: totalMinutes > 0
      ? +((zoneMinutes[zone.id] / totalMinutes) * 100).toFixed(1)
      : 0,
  }))

  const z2Percent = zones.find((z) => z.zone.id === 2)?.percent ?? 0
  const z3Percent = zones.find((z) => z.zone.id === 3)?.percent ?? 0

  // Good polarization: Z1+Z2 ≥ 70% and Z3 < 20%
  const z1Percent     = zones.find((z) => z.zone.id === 1)?.percent ?? 0
  const polarizationOk = (z1Percent + z2Percent) >= 70 && z3Percent < 20

  return {
    zones,
    totalClassified,
    totalMinutes,
    hasData,
    hasThresholds,
    polarizationOk,
    z2Percent,
    z3Percent,
  }
}
