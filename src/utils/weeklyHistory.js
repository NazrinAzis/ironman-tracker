/**
 * Build an array of weekly training totals, ordered oldest → newest.
 * @param {Array}  workouts  - raw workout objects
 * @param {number} weeksBack - how many weeks to include (default 20)
 */
export function buildWeeklyHistory(workouts, weeksBack = 20) {
  const today  = new Date()
  // Monday of the current week (Mon=0 offset formula)
  const dow    = today.getDay()                        // 0=Sun … 6=Sat
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dow + 6) % 7))
  monday.setHours(0, 0, 0, 0)

  const weeks = []

  for (let i = weeksBack - 1; i >= 0; i--) {
    const weekStart = new Date(monday)
    weekStart.setDate(monday.getDate() - i * 7)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const ww = workouts.filter(w => {
      const d = new Date(w.date + 'T00:00:00')
      return d >= weekStart && d <= weekEnd
    })

    const swim = +(ww.filter(w => w.type === 'swim').reduce((s, w) => s + (w.distance || 0), 0)).toFixed(2)
    const bike = +(ww.filter(w => w.type === 'bike').reduce((s, w) => s + (w.distance || 0), 0)).toFixed(2)
    const run  = +(ww.filter(w => w.type === 'run' ).reduce((s, w) => s + (w.distance || 0), 0)).toFixed(2)
    const tss  = Math.round(ww.reduce((s, w) => s + (w.tss || 0), 0))

    weeks.push({
      weekStart:     weekStart.toISOString().slice(0, 10),
      label:         weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      swim, bike, run, tss,
      totalKm:       +(swim + bike + run).toFixed(2),
      workoutCount:  ww.length,
    })
  }

  return weeks
}

/**
 * Find the single best week by a given metric key (default: 'tss').
 */
export function findBestWeek(history, metric = 'tss') {
  if (!history.length) return null
  return history.reduce((best, w) => (w[metric] > (best?.[metric] ?? 0) ? w : best), null)
}

/**
 * Get the week N weeks ago from history array.
 * n=0 → current (most recent) week
 * n=4 → 4 weeks ago
 */
export function getWeekNAgo(history, n) {
  const idx = history.length - 1 - n
  return idx >= 0 ? history[idx] : null
}
