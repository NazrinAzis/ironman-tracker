import { useState } from 'react'
import { useWorkouts } from '../hooks/useWorkouts'
import { useProfile } from '../hooks/useProfile'
import { calcProgress, IRONMAN_GOALS } from '../utils/ironman'
import { loadPhases } from '../utils/trainingPhases'
import Last30Days from '../components/dashboard/Last30Days'
import RaceCountdown from '../components/dashboard/RaceCountdown'
import StatsCard from '../components/dashboard/StatsCard'
import WeeklySummary from '../components/dashboard/WeeklySummary'
import PMCChart from '../components/dashboard/PMCChart'
import GoalReadiness from '../components/dashboard/GoalReadiness'
import FinishTimeEstimate from '../components/dashboard/FinishTimeEstimate'
import TrainingLoadMonitor from '../components/dashboard/TrainingLoadMonitor'
import DisciplineBalance from '../components/dashboard/DisciplineBalance'
import KeySessions from '../components/dashboard/KeySessions'
import HRZoneChart from '../components/dashboard/HRZoneChart'
import PersonalRecords from '../components/dashboard/PersonalRecords'
import NutritionPlanner from '../components/dashboard/NutritionPlanner'
import PhaseCard from '../components/dashboard/PhaseCard'
import TrainingCalendar from '../components/dashboard/TrainingCalendar'
import ComparativeWeek from '../components/dashboard/ComparativeWeek'
import WorkoutCard from '../components/workouts/WorkoutCard'
import WorkoutDetailModal from '../components/workouts/WorkoutDetailModal'
import Layout from '../components/layout/Layout'

export default function Dashboard() {
  const { workouts, loading: wLoading } = useWorkouts()
  const { profile, loading: pLoading }  = useProfile()
  // Phases stored in localStorage; lifted here so PhaseCard + Calendar stay in sync
  const [phases, setPhases] = useState(loadPhases)
  const [viewingWorkout, setViewingWorkout] = useState(null)

  const swim = calcProgress(workouts, 'swim')
  const bike = calcProgress(workouts, 'bike')
  const run = calcProgress(workouts, 'run')

  const totalKm = +(swim.total + bike.total + run.total).toFixed(2)
  const totalWorkouts = workouts.length
  const recentFive = workouts.slice(0, 5)

  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening'
  const displayName = profile?.display_name ?? 'Naz'

  if (wLoading || pLoading) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
        </div>
      </Layout>
    )
  }

  return (
    <>
    <Layout>
      <div className="topbar">
        <div className="greeting">
          <span className="greeting-light">Good {timeOfDay},</span>
          <span className="greeting-bold">{displayName} 👋</span>
        </div>
        <div className="topbar-meta">
          <span className="meta-chip">📅 {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          <button className="btn-add" onClick={() => window.location.href = '/workouts'} title="Log workout">+</button>
        </div>
      </div>

        {/* Training phase banner */}
        <PhaseCard phases={phases} onUpdate={setPhases} />

        {/* Top row: countdown + stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <RaceCountdown raceDate={profile?.race_date} />
          </div>
          <div className="sm:col-span-2 grid grid-cols-2 gap-4">
            <StatsCard icon="📊" label="Total Workouts" value={totalWorkouts} />
            <StatsCard icon="🛣️" label="Total Distance" value={`${totalKm} km`} />
            <StatsCard
              icon="🏊"
              label="Swim Progress"
              value={`${swim.percent}%`}
              sub={`${swim.total} / ${IRONMAN_GOALS.swim} km`}
            />
            <StatsCard
              icon="🏃"
              label="Run Progress"
              value={`${run.percent}%`}
              sub={`${run.total} / ${IRONMAN_GOALS.run} km`}
            />
          </div>
        </div>

        {/* Last 30 days volume */}
        <section>
          <h2 className="section-title">Last 30 Days</h2>
          <Last30Days workouts={workouts} />
        </section>

        {/* Sub-11h Goal Readiness */}
        <section>
          <h2 className="section-title">Sub-11h Goal Readiness</h2>
          <GoalReadiness workouts={workouts} profile={profile} />
        </section>

        {/* Estimated finish time + Training load monitor */}
        <section>
          <h2 className="section-title">Performance Insights</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FinishTimeEstimate workouts={workouts} profile={profile} />
            <TrainingLoadMonitor workouts={workouts} />
          </div>
        </section>

        {/* Discipline balance + Key sessions */}
        <section>
          <h2 className="section-title">Training Quality</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DisciplineBalance workouts={workouts} />
            <KeySessions workouts={workouts} />
          </div>
        </section>

        {/* Comparative week + training calendar */}
        <section>
          <h2 className="section-title">Training Structure</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ComparativeWeek workouts={workouts} />
            <TrainingCalendar workouts={workouts} phases={phases} />
          </div>
        </section>

        {/* Personal records + HR zone distribution */}
        <section>
          <h2 className="section-title">Training Records</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PersonalRecords workouts={workouts} />
            <HRZoneChart workouts={workouts} profile={profile} />
          </div>
        </section>

        {/* Race-day nutrition planner */}
        <section>
          <h2 className="section-title">Race Preparation</h2>
          <NutritionPlanner />
        </section>

        {/* Weekly summary */}
        <WeeklySummary workouts={workouts} />

        {/* Performance Management Chart */}
        <section>
          <h2 className="section-title">Performance Management</h2>
          <PMCChart workouts={workouts} />
        </section>

        {/* Recent workouts */}
        <section>
          <h2 className="section-title">Recent Workouts</h2>
          {recentFive.length === 0 ? (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
              No workouts yet.{' '}
              <a href="/workouts" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                Log your first one →
              </a>
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentFive.map((w) => (
                <WorkoutCard key={w.id} workout={w} onView={setViewingWorkout} />
              ))}
            </div>
          )}
        </section>
      </Layout>

      {viewingWorkout && (
        <WorkoutDetailModal
          workout={viewingWorkout}
          onClose={() => setViewingWorkout(null)}
        />
      )}
    </>
  )
}
