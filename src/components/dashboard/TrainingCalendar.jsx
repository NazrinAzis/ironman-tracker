import { useState, useMemo } from 'react'
import { PHASE_CALENDAR_BORDER } from '../../utils/trainingPhases'

const TYPE_DOT = { swim: 'bg-blue-400', bike: 'bg-yellow-400', run: 'bg-red-400', strength: 'bg-green-400' }

function isBrick(dayWorkouts) {
  const types = new Set(dayWorkouts.map(w => w.type))
  return types.has('bike') && types.has('run')
}

function isKeySession(w) {
  if (w.type === 'bike' && (w.duration || 0) >= 240) return true
  if (w.type === 'run'  && (w.duration || 0) >= 90)  return true
  if (w.type === 'swim' && (w.distance || 0) >= 3)   return true
  return false
}

export default function TrainingCalendar({ workouts, phases = [] }) {
  const today = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const byDate = useMemo(() => {
    const map = {}
    workouts.forEach(w => {
      if (!map[w.date]) map[w.date] = []
      map[w.date].push(w)
    })
    return map
  }, [workouts])

  function navMonth(delta) {
    let m = month + delta, y = year
    if (m < 0)  { m = 11; y-- }
    if (m > 11) { m = 0;  y++ }
    setMonth(m); setYear(y)
  }

  const firstDow  = (new Date(year, month, 1).getDay() + 6) % 7
  const totalDays = new Date(year, month + 1, 0).getDate()
  const todayStr  = today.toISOString().slice(0, 10)
  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const cells = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]

  function getPhaseForDate(dateStr) {
    return phases.find(p => p.startDate <= dateStr && p.endDate >= dateStr) || null
  }

  return (
    <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => navMonth(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--color-text-secondary)', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}
        >‹</button>
        <h3 style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)' }}>{monthLabel}</h3>
        <button
          onClick={() => navMonth(1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--color-text-secondary)', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}
        >›</button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 text-center">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e${idx}`} style={{ minHeight: 44 }} />

          const mm      = String(month + 1).padStart(2, '0')
          const dd      = String(day).padStart(2, '0')
          const dateStr = `${year}-${mm}-${dd}`
          const dw      = byDate[dateStr] || []
          const isToday = dateStr === todayStr
          const brick   = dw.length >= 2 && isBrick(dw)
          const hasKey  = dw.some(isKeySession) && !brick
          const phase   = getPhaseForDate(dateStr)
          const types   = [...new Set(dw.map(w => w.type))]

          const phaseBorder = phase ? (PHASE_CALENDAR_BORDER[phase.type] || '') : ''

          return (
            <div
              key={dateStr}
              className={phaseBorder}
              style={{
                minHeight: 44,
                borderRadius: 6,
                padding: 4,
                display: 'flex',
                flexDirection: 'column',
                background: dw.length > 0 ? 'var(--color-bg)' : 'transparent',
                outline: isToday ? '2px solid var(--color-primary)' : 'none',
                outlineOffset: -1,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1, color: isToday ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                {day}
              </span>

              {types.length > 0 && (
                <div style={{ display: 'flex', gap: 2, marginTop: 4, flexWrap: 'wrap' }}>
                  {types.map(t => (
                    <span key={t} className={`w-1.5 h-1.5 rounded-full ${TYPE_DOT[t] || 'bg-gray-400'}`} />
                  ))}
                </div>
              )}

              {brick && (
                <span style={{ marginTop: 2, fontSize: 8, background: '#EDE9FE', color: '#7C3AED', borderRadius: 4, padding: '1px 3px', alignSelf: 'flex-start', lineHeight: 1.3 }}>B+R</span>
              )}
              {hasKey && (
                <span style={{ marginTop: 2, fontSize: 8, background: '#FFEDD5', color: '#C2410C', borderRadius: 4, padding: '1px 3px', alignSelf: 'flex-start', lineHeight: 1.3 }}>KEY</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8, borderTop: '1px solid var(--color-border)', flexWrap: 'wrap' }}>
        {[['swim','bg-blue-400'],['bike','bg-yellow-400'],['run','bg-red-400'],['strength','bg-green-400']].map(([t, c]) => (
          <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-text-muted)' }}>
            <span className={`w-1.5 h-1.5 rounded-full ${c}`} />{t}
          </span>
        ))}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-text-muted)' }}>
          <span style={{ fontSize: 8, background: '#EDE9FE', color: '#7C3AED', borderRadius: 4, padding: '1px 4px' }}>B+R</span>brick
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-text-muted)' }}>
          <span style={{ fontSize: 8, background: '#FFEDD5', color: '#C2410C', borderRadius: 4, padding: '1px 4px' }}>KEY</span>key session
        </span>
      </div>
    </div>
  )
}
