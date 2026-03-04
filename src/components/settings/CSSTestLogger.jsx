import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useCSSTests } from '../../hooks/useCSSTests'

function parseTime(str) {
  const parts = str.trim().split(':')
  if (parts.length !== 2) return null
  const m = parseInt(parts[0], 10)
  const s = parseInt(parts[1], 10)
  if (isNaN(m) || isNaN(s) || s >= 60) return null
  return m * 60 + s
}

function fmtSecs(sec) {
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function fmtDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

const SUB11_CSS_TARGET = 105

const inputStyle = {
  width: '100%',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  padding: '6px 10px',
  fontSize: 14,
  color: 'var(--color-text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
}

export default function CSSTestLogger() {
  const { cssTests, loading, addCSSTest, deleteCSSTest } = useCSSTests()
  const [form,   setForm]   = useState({ testDate: '', t400: '', t200: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

  const t400s      = parseTime(form.t400)
  const t200s      = parseTime(form.t200)
  const cssPreview = (t400s && t200s && t400s > t200s) ? (t400s - t200s) / 2 : null
  const cssOnTrack = cssPreview !== null && cssPreview <= SUB11_CSS_TARGET

  async function handleSubmit(e) {
    e.preventDefault()
    if (!t400s || !t200s || !form.testDate) return
    setSaving(true)
    const { error: err } = await addCSSTest({
      testDate:    form.testDate,
      t400Seconds: t400s,
      t200Seconds: t200s,
      notes:       form.notes,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    setForm({ testDate: '', t400: '', t200: '', notes: '' })
    setError(null)
  }

  const chartData = cssTests.map(t => ({
    label: new Date(t.test_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    css:   +parseFloat(t.css_per_100m).toFixed(1),
  }))
  const cssValues = chartData.map(d => d.css)
  const yMin = cssValues.length ? Math.max(0, Math.min(...cssValues) - 8) : 80
  const yMax = cssValues.length ? Math.max(...cssValues) + 8              : 140

  const latestCSS  = cssTests.length ? parseFloat(cssTests[cssTests.length - 1].css_per_100m) : null
  const firstCSS   = cssTests.length ? parseFloat(cssTests[0].css_per_100m) : null
  const improvement = (latestCSS !== null && firstCSS !== null && cssTests.length >= 2)
    ? +(firstCSS - latestCSS).toFixed(1)
    : null

  return (
    <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>CSS Test Logger</h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
          Critical Swim Speed = (T400 − T200) ÷ 2 &nbsp;·&nbsp; Sub-11h target: CSS ≤ 1:45/100m
        </p>
      </div>

      {/* Stat summary row */}
      {latestCSS !== null && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--color-bg)', borderRadius: 12, padding: '8px 14px', display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Current CSS</p>
            <p style={{ fontWeight: 700, fontSize: 18, fontFamily: 'monospace', color: 'var(--color-text-primary)' }}>
              {fmtSecs(latestCSS)}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--color-text-muted)' }}>/100m</span>
            </p>
          </div>
          <div style={{ background: 'var(--color-bg)', borderRadius: 12, padding: '8px 14px', display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Open Water Pace (×1.08)</p>
            <p style={{ fontWeight: 700, fontSize: 18, fontFamily: 'monospace', color: 'var(--color-text-primary)' }}>
              {fmtSecs(latestCSS * 1.08)}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--color-text-muted)' }}>/100m</span>
            </p>
          </div>
          {improvement !== null && (
            <div style={{ background: improvement > 0 ? '#DCFCE7' : 'var(--color-bg)', borderRadius: 12, padding: '8px 14px', display: 'flex', flexDirection: 'column' }}>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Improvement</p>
              <p style={{ fontWeight: 700, fontSize: 18, fontFamily: 'monospace', color: improvement > 0 ? '#166534' : 'var(--color-text-primary)' }}>
                {improvement > 0 ? '−' : '+'}{Math.abs(improvement)}s
              </p>
            </div>
          )}
          <div style={{ background: latestCSS <= SUB11_CSS_TARGET ? '#DCFCE7' : '#FEE2E2', borderRadius: 12, padding: '8px 14px', display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Sub-11h Status</p>
            <p style={{ fontWeight: 700, fontSize: 14, color: latestCSS <= SUB11_CSS_TARGET ? '#166534' : '#DC2626' }}>
              {latestCSS <= SUB11_CSS_TARGET ? '✓ Achieved' : `Need ≤ ${fmtSecs(SUB11_CSS_TARGET)}`}
            </p>
          </div>
        </div>
      )}

      {/* Trend chart */}
      {chartData.length >= 2 && (
        <div>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>CSS Trend (lower = faster)</p>
          <div style={{ height: 144 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="label" tick={{ fill: '#8A8FA8', fontSize: 10 }} />
                <YAxis
                  domain={[yMin, yMax]}
                  reversed
                  tick={{ fill: '#8A8FA8', fontSize: 10 }}
                  tickFormatter={v => fmtSecs(v)}
                  width={40}
                />
                <Tooltip
                  formatter={v => [fmtSecs(v) + '/100m', 'CSS']}
                  contentStyle={{ background: 'white', border: '1px solid #EEEEF2', color: 'var(--color-text-primary)', fontSize: 12, borderRadius: 10 }}
                />
                <ReferenceLine
                  y={SUB11_CSS_TARGET}
                  stroke="#22c55e"
                  strokeDasharray="4 2"
                  strokeWidth={1}
                  label={{ value: 'Sub-11h', fill: '#22c55e', fontSize: 10, position: 'insideTopRight' }}
                />
                <Line
                  type="monotone"
                  dataKey="css"
                  stroke="var(--color-swim)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-swim)', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Log form */}
      <form
        onSubmit={handleSubmit}
        style={{ background: 'var(--color-bg)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid var(--color-border)' }}
      >
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Log New Test</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Test Date</label>
            <input
              type="date"
              value={form.testDate}
              onChange={e => setForm(f => ({ ...f, testDate: e.target.value }))}
              style={inputStyle}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>400m Time (M:SS)</label>
            <input
              value={form.t400}
              onChange={e => setForm(f => ({ ...f, t400: e.target.value }))}
              placeholder="6:20"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>200m Time (M:SS)</label>
            <input
              value={form.t200}
              onChange={e => setForm(f => ({ ...f, t200: e.target.value }))}
              placeholder="2:55"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>CSS Result</label>
            <div style={{ ...inputStyle, minHeight: 34, display: 'flex', alignItems: 'center' }}>
              {cssPreview
                ? <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>{fmtSecs(cssPreview)}/100m</span>
                : <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Enter times above</span>
              }
            </div>
          </div>
        </div>

        {cssPreview && (
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            Open water pace (×1.08):{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>{fmtSecs(cssPreview * 1.08)}/100m</strong>
            {' · '}Sub-11h CSS target:{' '}
            <strong style={{ color: cssOnTrack ? 'var(--color-primary)' : '#DC2626' }}>
              {cssOnTrack ? '✓ on track' : `need ≤${fmtSecs(SUB11_CSS_TARGET)}`}
            </strong>
          </p>
        )}

        {error && <p style={{ fontSize: 14, color: '#DC2626' }}>{error}</p>}

        <button
          type="submit"
          disabled={saving || !form.testDate || !cssPreview}
          style={{ background: 'var(--color-primary)', color: 'white', borderRadius: 8, padding: '6px 16px', fontSize: 14, fontWeight: 600, border: 'none', cursor: saving || !form.testDate || !cssPreview ? 'not-allowed' : 'pointer', opacity: saving || !form.testDate || !cssPreview ? 0.4 : 1, alignSelf: 'flex-start' }}
        >
          {saving ? 'Saving…' : 'Log Test'}
        </button>
      </form>

      {/* History table */}
      {cssTests.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>History</p>
          {[...cssTests].reverse().map(t => {
            const css     = parseFloat(t.css_per_100m)
            const onTrack = css <= SUB11_CSS_TARGET
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--color-bg)', borderRadius: 10, padding: '8px 12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)' }}>{fmtSecs(css)}/100m</span>
                    <span style={{ fontSize: 12, padding: '1px 8px', borderRadius: 6, background: onTrack ? '#DCFCE7' : '#F3F4F6', color: onTrack ? '#166534' : 'var(--color-text-muted)' }}>
                      {onTrack ? '✓ sub-11h' : 'below target'}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {fmtDate(t.test_date)}
                    {' · '}400m {fmtSecs(t.t400_seconds)}
                    {' · '}200m {fmtSecs(t.t200_seconds)}
                  </p>
                </div>
                <button onClick={() => deleteCSSTest(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--color-text-muted)', padding: 4 }}>✕</button>
              </div>
            )
          })}
        </div>
      )}

      {cssTests.length === 0 && !loading && (
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', textAlign: 'center', padding: '8px 0' }}>
          No tests yet. Do a maximal 400m TT, rest 10–15 min, then a maximal 200m TT in the same session.
        </p>
      )}
    </div>
  )
}
