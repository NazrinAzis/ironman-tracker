import { useState } from 'react'
import {
  PHASE_TYPES, PHASE_STYLES, PHASE_ADVICE,
  loadPhases, savePhases, getCurrentPhase, getPhaseDayInfo,
} from '../../utils/trainingPhases'

/* ── Phase editor modal ─────────────────────────────────────── */
function PhaseEditor({ onClose }) {
  const [phases, setPhases] = useState(loadPhases)
  const [form, setForm]     = useState({ type: 'base', startDate: '', endDate: '', name: '' })

  function handleAdd() {
    if (!form.startDate || !form.endDate) return
    const typeInfo  = PHASE_TYPES.find(p => p.id === form.type)
    const newPhase  = {
      id:        Date.now().toString(),
      type:      form.type,
      label:     form.name.trim() || typeInfo.label,
      startDate: form.startDate,
      endDate:   form.endDate,
    }
    const updated = [...phases, newPhase].sort((a, b) => a.startDate.localeCompare(b.startDate))
    setPhases(updated)
    savePhases(updated)
    setForm({ type: 'base', startDate: '', endDate: '', name: '' })
  }

  function handleDelete(id) {
    const updated = phases.filter(p => p.id !== id)
    setPhases(updated)
    savePhases(updated)
  }

  const fmtDate = iso =>
    new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-ironman-navy rounded-xl w-full max-w-lg flex flex-col gap-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">Training Phases</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center rounded text-xl">
            ✕
          </button>
        </div>

        {/* Add form */}
        <div className="bg-ironman-blue/40 rounded-lg p-4 flex flex-col gap-3">
          <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold">Add Phase</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Phase Type</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full bg-ironman-blue text-white rounded px-2 py-1.5 text-sm border border-gray-700"
              >
                {PHASE_TYPES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Custom Name (optional)</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder={PHASE_TYPES.find(p => p.id === form.type)?.label}
                className="w-full bg-ironman-blue text-white rounded px-2 py-1.5 text-sm border border-gray-700"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full bg-ironman-blue text-white rounded px-2 py-1.5 text-sm border border-gray-700"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className="w-full bg-ironman-blue text-white rounded px-2 py-1.5 text-sm border border-gray-700"
              />
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={!form.startDate || !form.endDate}
            className="bg-ironman-accent text-white rounded px-4 py-1.5 text-sm font-semibold disabled:opacity-40 self-start"
          >
            Add Phase
          </button>
        </div>

        {/* Phase list */}
        <div className="flex flex-col gap-2">
          {phases.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">No phases defined yet</p>
          )}
          {phases.map(p => {
            const s = PHASE_STYLES[p.type] || PHASE_STYLES.base
            return (
              <div key={p.id} className={`flex items-center gap-3 rounded-lg px-3 py-2 border ${s.bg} ${s.border}`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${s.text}`}>{p.label}</p>
                  <p className="text-gray-400 text-xs">{fmtDate(p.startDate)} → {fmtDate(p.endDate)}</p>
                </div>
                <button onClick={() => handleDelete(p.id)} className="text-gray-600 hover:text-ironman-accent text-sm px-1">✕</button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── Phase banner (receives phases from Dashboard) ──────────── */
export default function PhaseCard({ phases, onUpdate }) {
  const [showEditor, setShowEditor] = useState(false)

  function handleClose() {
    if (onUpdate) onUpdate(loadPhases())
    setShowEditor(false)
  }

  const current = getCurrentPhase(phases)
  const s       = current ? (PHASE_STYLES[current.type] || PHASE_STYLES.base) : null
  const info    = current ? getPhaseDayInfo(current) : null
  const advice  = current ? (PHASE_ADVICE[current.type] || []) : []

  return (
    <>
      {showEditor && <PhaseEditor onClose={handleClose} />}

      {!current ? (
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>No active training phase</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>Define your training block structure for phase-specific advice</p>
          </div>
          <button
            onClick={() => setShowEditor(true)}
            className="btn btn-primary"
            style={{ flexShrink: 0 }}
          >
            Set Phases
          </button>
        </div>
      ) : (
        <div className={`rounded-xl p-5 border ${s.bg} ${s.border}`} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className={`w-3 h-3 rounded-full flex-shrink-0 ${s.dot}`} />
              <div>
                <p className={`text-lg font-black ${s.text}`}>{current.label} Phase</p>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  Day {info.daysIn} of {info.totalDays}
                  {info.daysLeft > 0 ? ` · ${info.daysLeft} days remaining` : ' · Phase ends today'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowEditor(true)}
              className="btn btn-ghost"
              style={{ flexShrink: 0, fontSize: 12, padding: '4px 10px' }}
            >
              Edit
            </button>
          </div>

          {/* Progress bar */}
          <div>
            <div style={{ height: 8, background: 'rgba(0,0,0,0.1)', borderRadius: 100, overflow: 'hidden' }}>
              <div className={`h-full rounded-full ${s.bar} transition-all`} style={{ width: `${info.percent}%` }} />
            </div>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>{info.percent}% of phase complete</p>
          </div>

          {/* Phase-specific advice */}
          {advice.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: 12 }}>
              {advice.map((a, i) => (
                <p key={i} style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', gap: 8 }}>
                  <span className={`flex-shrink-0 ${s.text}`}>›</span> {a}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
