export const IRONMAN_GOALS = {
  swim: 3.86,    // km (2.4 miles)
  bike: 180.25,  // km (112 miles)
  run: 42.2,     // km (26.2 miles)
}

export const DISCIPLINE_LABELS = {
  swim:     'Swim',
  bike:     'Bike',
  run:      'Run',
  strength: 'Strength',
}

export const DISCIPLINE_COLORS = {
  swim:     'bg-blue-500',
  bike:     'bg-yellow-500',
  run:      'bg-red-500',
  strength: 'bg-green-500',
}

export const DISCIPLINE_ICONS = {
  swim:     '🏊',
  bike:     '🚴',
  run:      '🏃',
  strength: '🏋️',
}

/**
 * Calculate cumulative progress for a discipline.
 * @param {Array} workouts - all workout records
 * @param {'swim'|'bike'|'run'} type
 * @returns {{ total: number, percent: number }}
 */
export function calcProgress(workouts, type) {
  const total = workouts
    .filter((w) => w.type === type)
    .reduce((sum, w) => sum + w.distance, 0)
  const percent = Math.min((total / IRONMAN_GOALS[type]) * 100, 100)
  return { total: +total.toFixed(2), percent: +percent.toFixed(1) }
}

/**
 * Return the number of days until a given date string (ISO format).
 * Returns null if no date provided. Negative means the race has passed.
 */
export function daysUntil(dateStr) {
  if (!dateStr) return null
  const race = new Date(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  race.setHours(0, 0, 0, 0)
  return Math.round((race - now) / (1000 * 60 * 60 * 24))
}

/**
 * Format duration in minutes to a readable string.
 * e.g. 90 -> "1h 30m", 45 -> "45m"
 */
export function formatDuration(minutes) {
  if (!minutes) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/**
 * Return the ISO date string (YYYY-MM-DD) for the most recent Monday.
 */
export function getWeekStart() {
  const now = new Date()
  const day = now.getDay() // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day // roll back to Monday
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  return monday.toISOString().split('T')[0]
}

/**
 * Filter workouts to only those in the current Mon–today week.
 */
export function getWeekWorkouts(workouts) {
  const weekStart = getWeekStart()
  return workouts.filter((w) => w.date >= weekStart)
}

/**
 * Sum total minutes from a list of workouts.
 */
export function totalDuration(workouts) {
  return workouts.reduce((sum, w) => sum + w.duration, 0)
}
