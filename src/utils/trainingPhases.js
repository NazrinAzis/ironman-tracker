const STORAGE_KEY = 'ironman_training_phases'

export const PHASE_TYPES = [
  { id: 'base',     label: 'Base',       desc: 'Aerobic foundation — long slow distance, high volume' },
  { id: 'build',    label: 'Build',      desc: 'Intensity increases — threshold work, race-specific efforts' },
  { id: 'peak',     label: 'Peak',       desc: 'Highest training stress — simulate race demands' },
  { id: 'taper',    label: 'Taper',      desc: 'Volume drops 40–60% — maintain intensity, rest and sharpen' },
  { id: 'recovery', label: 'Recovery',   desc: 'Active recovery — low volume, rebuild after a race or block' },
  { id: 'off',      label: 'Off-Season', desc: 'Unstructured training — recharge mentally and physically' },
]

// All class strings spelled out fully so Tailwind doesn't purge them
export const PHASE_STYLES = {
  base:     { bg: 'bg-blue-900/30',   border: 'border-blue-700',   text: 'text-blue-400',   dot: 'bg-blue-500',   bar: 'bg-blue-500' },
  build:    { bg: 'bg-yellow-900/30', border: 'border-yellow-700', text: 'text-yellow-400', dot: 'bg-yellow-500', bar: 'bg-yellow-500' },
  peak:     { bg: 'bg-red-900/30',    border: 'border-red-700',    text: 'text-red-400',    dot: 'bg-red-500',    bar: 'bg-red-500' },
  taper:    { bg: 'bg-green-900/30',  border: 'border-green-700',  text: 'text-green-400',  dot: 'bg-green-500',  bar: 'bg-green-500' },
  recovery: { bg: 'bg-purple-900/30', border: 'border-purple-700', text: 'text-purple-400', dot: 'bg-purple-500', bar: 'bg-purple-500' },
  off:      { bg: 'bg-gray-800/40',   border: 'border-gray-700',   text: 'text-gray-400',   dot: 'bg-gray-500',   bar: 'bg-gray-500' },
}

// Phase-specific advice shown in the banner
export const PHASE_ADVICE = {
  base:     ['Focus on Z1–Z2 aerobic work', 'Build long ride toward 5 hrs+', 'Swim volume over speed this phase'],
  build:    ['Add threshold intervals 1–2× per week', 'Include a brick workout every 2 weeks', 'Ride should include race-pace effort segments'],
  peak:     ['Race-simulation long ride + run back-to-back', 'Highest TSS week of the block', 'Sleep and nutrition are critical now'],
  taper:    ['Cut volume 40–60%, keep intensity', 'No new sessions — maintain fitness only', 'Short race-pace efforts to stay sharp'],
  recovery: ['Keep HR in Z1 only', 'No pressure — move for fun', 'Prioritise sleep and nutrition over training'],
  off:      ['Cross-train freely', 'Recharge mentally — no structure required', 'Light movement only'],
}

// Top border classes for calendar day cells (one per phase type, fully spelled out)
export const PHASE_CALENDAR_BORDER = {
  base:     'border-t-2 border-blue-600',
  build:    'border-t-2 border-yellow-600',
  peak:     'border-t-2 border-red-600',
  taper:    'border-t-2 border-green-600',
  recovery: 'border-t-2 border-purple-600',
  off:      'border-t-2 border-gray-600',
}

export function loadPhases() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') }
  catch { return [] }
}

export function savePhases(phases) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(phases))
}

export function getCurrentPhase(phases, today = new Date()) {
  const todayStr = today.toISOString().slice(0, 10)
  return phases.find(p => p.startDate <= todayStr && p.endDate >= todayStr) || null
}

export function getPhaseDayInfo(phase, today = new Date()) {
  const start = new Date(phase.startDate + 'T00:00:00')
  const end   = new Date(phase.endDate   + 'T00:00:00')
  const now   = new Date(today.toISOString().slice(0, 10) + 'T00:00:00')
  const totalDays = Math.round((end   - start) / 86400000) + 1
  const daysIn    = Math.round((now   - start) / 86400000) + 1
  const daysLeft  = Math.round((end   - now)   / 86400000)
  const percent   = Math.min(Math.round((daysIn / totalDays) * 100), 100)
  return { totalDays, daysIn, daysLeft, percent }
}
