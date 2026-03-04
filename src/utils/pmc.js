/**
 * Performance Management Chart (PMC) utilities.
 * Implements the classic CTL/ATL/TSB model used in endurance sports.
 *
 * - CTL (Chronic Training Load)  = 42-day EMA of daily TSS → "Fitness"
 * - ATL (Acute Training Load)    = 7-day EMA of daily TSS  → "Fatigue"
 * - TSB (Training Stress Balance) = CTL - ATL              → "Form"
 */

/**
 * Build a PMC data series from a workout list.
 * Returns one entry per calendar day from the first workout through today.
 * Workouts with tss=null contribute 0 to that day's load.
 *
 * @param {Array<{ date: string, tss: number|null }>} workouts
 * @param {number} [ctlDays=42]
 * @param {number} [atlDays=7]
 * @returns {Array<{ date: string, tss: number, ctl: number, atl: number, tsb: number }>}
 */
export function buildPMCSeries(workouts, ctlDays = 42, atlDays = 7) {
  if (!workouts || workouts.length === 0) return []

  // Aggregate TSS by date
  const tssByDate = {}
  for (const w of workouts) {
    if (!w.date) continue
    const key = w.date.slice(0, 10)
    tssByDate[key] = (tssByDate[key] || 0) + (w.tss ?? 0)
  }

  const allDates = Object.keys(tssByDate).sort()
  if (allDates.length === 0) return []

  const startDate = new Date(allDates[0] + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const series = []
  let ctl = 0
  let atl = 0
  const cursor = new Date(startDate)

  while (cursor <= today) {
    const key = cursor.toISOString().slice(0, 10)
    const tss = tssByDate[key] ?? 0
    ctl = ctl + (tss - ctl) / ctlDays
    atl = atl + (tss - atl) / atlDays
    const tsb = ctl - atl

    series.push({
      date: key,
      tss: Math.round(tss * 10) / 10,
      ctl: Math.round(ctl * 10) / 10,
      atl: Math.round(atl * 10) / 10,
      tsb: Math.round(tsb * 10) / 10,
    })

    cursor.setDate(cursor.getDate() + 1)
  }

  return series
}

/**
 * Return the most recent data point — today's fitness snapshot.
 * @param {ReturnType<typeof buildPMCSeries>} series
 * @returns {{ ctl: number, atl: number, tsb: number } | null}
 */
export function getCurrentPMC(series) {
  if (!series || series.length === 0) return null
  return series[series.length - 1]
}

/**
 * Slice a PMC series to the last N days.
 * @param {ReturnType<typeof buildPMCSeries>} series
 * @param {number} days
 * @returns {ReturnType<typeof buildPMCSeries>}
 */
export function slicePMCSeries(series, days) {
  if (!series || series.length === 0) return []
  return series.slice(-days)
}
