/**
 * Personal Records (PRs) — computed from all logged workouts.
 *
 * Records tracked:
 *   Longest Ride     — single bike workout by distance (km)
 *   Longest Run      — single run workout by distance (km)
 *   Longest Swim     — single swim workout by distance (km)
 *   Fastest Run Pace — best avg pace from runs ≥ 5 km (min/km)
 *   Best Session TSS — highest TSS in a single workout
 *   Best Week TSS    — highest total TSS in any 7-day rolling window
 */

/** Format an ISO date → "Mar 1, 2025" */
export function fmtPRDate(isoStr) {
  if (!isoStr) return '—'
  return new Date(isoStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  })
}

/** Convert decimal-minute pace (DB format) to MM:SS display */
function decimalToMMSS(dec) {
  if (dec == null) return '—'
  const m = Math.floor(dec)
  const s = Math.round((dec - m) * 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** Format pace from duration/distance → MM:SS/km display string */
function calcPaceDisplay(durationMin, distanceKm) {
  const pace = durationMin / distanceKm
  return decimalToMMSS(pace)
}

/**
 * Find the workout with the maximum value for a given selector.
 * Returns { value, date, workoutId } or null.
 */
function findPR(workouts, selector) {
  let best = null
  for (const w of workouts) {
    const val = selector(w)
    if (val == null || isNaN(val)) continue
    if (best === null || val > best.value) {
      best = { value: val, date: w.date, id: w.id }
    }
  }
  return best
}

/**
 * Compute all PRs from the workout array.
 *
 * @param {Array<{
 *   id: string,
 *   type: string,
 *   date: string,
 *   distance?: number,
 *   duration?: number,
 *   tss?: number,
 * }>} workouts
 *
 * @returns {{
 *   longestRide:   { km: number, date: string } | null,
 *   longestRun:    { km: number, date: string } | null,
 *   longestSwim:   { km: number, date: string } | null,
 *   fastestRunPace:{ paceDisplay: string, date: string } | null,
 *   bestSessionTSS:{ tss: number, date: string } | null,
 *   bestWeekTSS:   { tss: number, weekOf: string } | null,
 *   hasData:       boolean,
 * }}
 */
export function computePersonalRecords(workouts) {
  const hasData = workouts.length > 0

  // ── Per-discipline longest distance ──────────────────────────────────────
  const bikeW  = workouts.filter((w) => w.type === 'bike' && w.distance > 0)
  const runW   = workouts.filter((w) => w.type === 'run'  && w.distance > 0)
  const swimW  = workouts.filter((w) => w.type === 'swim' && w.distance > 0)

  const prBike = findPR(bikeW, (w) => w.distance)
  const prRun  = findPR(runW,  (w) => w.distance)
  const prSwim = findPR(swimW, (w) => w.distance)

  // ── Fastest run pace (runs ≥ 5 km to exclude short intervals) ────────────
  const longRuns  = runW.filter((w) => w.distance >= 5 && w.duration > 0)
  // Best pace = lowest min/km → highest (distance/duration) ratio
  const fastestRun = findPR(longRuns, (w) => w.distance / w.duration)  // km/min
  let fastestRunPace = null
  if (fastestRun) {
    // Convert km/min ratio back to min/km pace for display
    const minPerKm = 1 / fastestRun.value
    fastestRunPace = {
      paceDisplay: decimalToMMSS(minPerKm),
      minPerKm:    +minPerKm.toFixed(2),
      date:        fastestRun.date,
    }
  }

  // ── Best single session TSS ───────────────────────────────────────────────
  const withTSS    = workouts.filter((w) => w.tss != null && w.tss > 0)
  const prTSS      = findPR(withTSS, (w) => w.tss)
  const bestSessionTSS = prTSS
    ? { tss: Math.round(prTSS.value), date: prTSS.date }
    : null

  // ── Best week TSS (rolling 7-day windows) ────────────────────────────────
  // Build a map of date → daily TSS
  const tssByDate = {}
  for (const w of workouts) {
    if (!w.date || !w.tss) continue
    const d = w.date.slice(0, 10)
    tssByDate[d] = (tssByDate[d] || 0) + w.tss
  }

  const allDates = Object.keys(tssByDate).sort()
  let bestWeekTSS = null

  for (let i = 0; i < allDates.length; i++) {
    // Sum TSS for 7 days starting from allDates[i]
    const weekStart = allDates[i]
    const cutoff    = new Date(weekStart + 'T00:00:00')
    cutoff.setDate(cutoff.getDate() + 7)
    const cutoffStr = cutoff.toISOString().slice(0, 10)

    const weekTSS = allDates
      .filter((d) => d >= weekStart && d < cutoffStr)
      .reduce((sum, d) => sum + tssByDate[d], 0)

    if (bestWeekTSS === null || weekTSS > bestWeekTSS.tss) {
      bestWeekTSS = { tss: Math.round(weekTSS), weekOf: weekStart }
    }
  }

  return {
    longestRide:    prBike ? { km: +prBike.value.toFixed(1), date: prBike.date }     : null,
    longestRun:     prRun  ? { km: +prRun.value.toFixed(1),  date: prRun.date }      : null,
    longestSwim:    prSwim ? { km: +prSwim.value.toFixed(1), date: prSwim.date }     : null,
    fastestRunPace,
    bestSessionTSS,
    bestWeekTSS,
    hasData,
  }
}
