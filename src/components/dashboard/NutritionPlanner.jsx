import { useState, useMemo } from 'react'

const BIKE_HOURS = 5.5
const RUN_HOURS  = 4.08
const BIKE_CARBS_HR = 70
const RUN_CARBS_HR  = 50

const GEL  = { label: 'Gel',        carbs: 22, cal: 88,  sodium: 40  }
const BAR  = { label: 'Energy bar', carbs: 40, cal: 200, sodium: 80  }
const CHEW = { label: 'Chew pkg',   carbs: 24, cal: 96,  sodium: 50  }

const SWEAT = {
  low:    { label: 'Low',    ml: 450,  sodium: 450,  hint: 'You rarely see salt rings on kit'  },
  medium: { label: 'Medium', ml: 700,  sodium: 700,  hint: 'Moderate sweating, some salt on skin' },
  high:   { label: 'High',   ml: 1000, sodium: 1050, hint: 'Heavy sweater, salt crust on face'    },
}

const CONDITIONS = {
  cool:     { label: 'Cool',     emoji: '🌤', multiplier: 0.8  },
  moderate: { label: 'Moderate', emoji: '⛅', multiplier: 1.0  },
  hot:      { label: 'Hot',      emoji: '☀️', multiplier: 1.3  },
}

function calcPlan(sweatKey, condKey) {
  const sweat = SWEAT[sweatKey]
  const cond  = CONDITIONS[condKey]

  const bikeTotalCarbs    = Math.round(BIKE_CARBS_HR * BIKE_HOURS)
  const bikeTotalCal      = Math.round(bikeTotalCarbs * 4)
  const bikeFluidHr       = Math.round(sweat.ml * cond.multiplier)
  const bikeTotalFluidL   = +((bikeFluidHr * BIKE_HOURS) / 1000).toFixed(1)
  const bikeSodiumHr      = Math.round(sweat.sodium)
  const bikeTotalSodiumMg = Math.round(bikeSodiumHr * BIKE_HOURS)

  const bikeGelsPerHr  = 3
  const bikeBarsTotal  = Math.floor(BIKE_HOURS / 2)
  const bikeGelsTotal  = Math.round(bikeGelsPerHr * BIKE_HOURS - bikeBarsTotal * (BAR.carbs / GEL.carbs))
  const bikeTotalBottles = Math.ceil((bikeFluidHr * BIKE_HOURS) / 500)
  const bikeCarriedBottles = 2
  const bikeAidStationBottles = Math.max(0, bikeTotalBottles - bikeCarriedBottles)

  const runTotalCarbs    = Math.round(RUN_CARBS_HR * RUN_HOURS)
  const runTotalCal      = Math.round(runTotalCarbs * 4)
  const runFluidHr       = Math.round(sweat.ml * cond.multiplier * 0.85)
  const runSodiumHr      = Math.round(sweat.sodium * 0.9)
  const runTotalSodiumMg = Math.round(runSodiumHr * RUN_HOURS)

  const runGelsPerHr  = 2
  const runGelsTotal  = Math.round(runGelsPerHr * RUN_HOURS)
  const runFluidFromAidL = +((runFluidHr * RUN_HOURS) / 1000).toFixed(1)

  const saltTabsTotal = Math.round((bikeTotalSodiumMg + runTotalSodiumMg) / 600)

  return {
    bike: {
      carbs: bikeTotalCarbs, cal: bikeTotalCal,
      fluidL: bikeTotalFluidL, fluidHr: bikeFluidHr,
      sodiumMg: bikeTotalSodiumMg, sodiumHr: bikeSodiumHr,
      gels: Math.max(bikeGelsTotal, 0), bars: bikeBarsTotal,
      bottlesCarry: bikeCarriedBottles,
      bottlesAid: bikeAidStationBottles,
    },
    run: {
      carbs: runTotalCarbs, cal: runTotalCal,
      fluidFromAidL: runFluidFromAidL, fluidHr: runFluidHr,
      sodiumMg: runTotalSodiumMg, sodiumHr: runSodiumHr,
      gels: runGelsTotal,
    },
    totals: {
      carbs:    bikeTotalCarbs + runTotalCarbs,
      cal:      bikeTotalCal + runTotalCal,
      sodiumMg: bikeTotalSodiumMg + runTotalSodiumMg,
      saltTabs: saltTabsTotal,
      gels:     Math.max(bikeGelsTotal, 0) + runGelsTotal,
      bars:     bikeBarsTotal,
    },
  }
}

function SegmentCard({ title, emoji, rows, note }) {
  return (
    <div style={{ background: 'var(--color-bg)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {emoji} {title}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map(([label, value, highlight]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
            <span style={{ fontWeight: 700, color: highlight ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
              {value}
            </span>
          </div>
        ))}
      </div>
      {note && <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5, borderTop: '1px solid var(--color-border)', paddingTop: 6 }}>{note}</p>}
    </div>
  )
}

function ChecklistRow({ emoji, value, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--color-bg)', borderRadius: 10, padding: '8px 12px' }}>
      <span style={{ fontSize: 18 }}>{emoji}</span>
      <div>
        <p style={{ fontSize: 14, fontWeight: 900, color: 'var(--color-text-primary)', lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{label}</p>
      </div>
    </div>
  )
}

export default function NutritionPlanner() {
  const [sweat,  setSweat]  = useState('medium')
  const [cond,   setCond]   = useState('moderate')
  const [showDetail, setShowDetail] = useState(false)

  const plan = useMemo(() => calcPlan(sweat, cond), [sweat, cond])

  return (
    <div style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Race Day Nutrition
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>Sub-11h IRONMAN · Swim + T1/T2 excluded</p>
        </div>
        <span style={{ fontSize: 24 }}>🍌</span>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sweat Rate</p>
          <div style={{ display: 'flex', gap: 4 }}>
            {Object.entries(SWEAT).map(([key, s]) => (
              <button
                key={key}
                onClick={() => setSweat(key)}
                style={{
                  flex: 1, fontSize: 12, padding: '6px 0', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  background: sweat === key ? 'var(--color-primary)' : 'var(--color-bg)',
                  color: sweat === key ? 'white' : 'var(--color-text-secondary)',
                  fontWeight: sweat === key ? 600 : 400,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>{SWEAT[sweat].hint}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Race Conditions</p>
          <div style={{ display: 'flex', gap: 4 }}>
            {Object.entries(CONDITIONS).map(([key, c]) => (
              <button
                key={key}
                onClick={() => setCond(key)}
                style={{
                  flex: 1, fontSize: 12, padding: '6px 0', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  background: cond === key ? 'var(--color-primary)' : 'var(--color-bg)',
                  color: cond === key ? 'white' : 'var(--color-text-secondary)',
                  fontWeight: cond === key ? 600 : 400,
                }}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            Affects fluid + sodium needs
          </p>
        </div>
      </div>

      {/* Race day checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          What to Carry / Plan For
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <ChecklistRow emoji="🍬" value={`${plan.totals.gels} gels`}       label="Total race" />
          <ChecklistRow emoji="🍫" value={`${plan.totals.bars} bars`}       label="On bike only" />
          <ChecklistRow emoji="🧂" value={`${plan.totals.saltTabs} tabs`}   label="Salt tabs" />
          <ChecklistRow emoji="💧" value={`${plan.bike.fluidL} L`}          label="Bike fluid total" />
          <ChecklistRow emoji="🏃" value={`${plan.run.fluidFromAidL} L`}    label="Run from aid stns" />
          <ChecklistRow emoji="⚡" value={`${plan.totals.cal} kcal`}        label="Total calories" />
        </div>
      </div>

      {/* Expandable detail */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={() => setShowDetail((v) => !v)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Per-Segment Detail</span>
          <span>{showDetail ? '▲ hide' : '▼ show'}</span>
        </button>

        {showDetail && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SegmentCard
              title="Bike (5:30)"
              emoji="🚴"
              rows={[
                [`Carbs`, `${plan.bike.carbs} g (${BIKE_CARBS_HR}g/hr)`],
                [`Calories`, `${plan.bike.cal} kcal`],
                [`Fluid / hr`, `${plan.bike.fluidHr} ml/hr`],
                [`Fluid total`, `${plan.bike.fluidL} L`],
                [`Sodium`, `${plan.bike.sodiumHr} mg/hr`],
                [`Start with`, `${plan.bike.bottlesCarry} bottles`, true],
                [`Collect at aid`, `${plan.bike.bottlesAid} more bottles`, plan.bike.bottlesAid > 0],
              ]}
              note="Gels every 20 min. Bars during flatter sections. Drink to thirst, not to schedule."
            />
            <SegmentCard
              title="Run (4:05)"
              emoji="🏃"
              rows={[
                [`Carbs`, `${plan.run.carbs} g (${RUN_CARBS_HR}g/hr)`],
                [`Calories`, `${plan.run.cal} kcal`],
                [`Fluid / hr`, `${plan.run.fluidHr} ml/hr`],
                [`Total fluid`, `${plan.run.fluidFromAidL} L from aid stns`],
                [`Sodium`, `${plan.run.sodiumHr} mg/hr`],
                [`Gels to carry`, `${plan.run.gels} gels`, true],
              ]}
              note="Take a gel at every other aid station. Alternate water and sports drink. Walk to eat if needed."
            />
          </div>
        )}
      </div>

      {/* Golden Rules */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Golden Rules</p>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 4, listStyle: 'none', margin: 0, padding: 0 }}>
          {[
            'Nothing new on race day — practise your exact nutrition plan in long training sessions first.',
            'Start fuelling on the bike within 20 min, before hunger or thirst hits.',
            `Target ${BIKE_CARBS_HR}g carbs/hr on bike, ${RUN_CARBS_HR}g on run — gut-absorption limit for most athletes.`,
            'If your stomach rebels, drop intensity briefly and switch to liquids only.',
          ].map((rule, i) => (
            <li key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>
              <span style={{ color: 'var(--color-primary)', fontWeight: 900, flexShrink: 0 }}>{i + 1}.</span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
