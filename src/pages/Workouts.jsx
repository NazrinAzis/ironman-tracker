import { useState } from 'react'
import { useWorkouts } from '../hooks/useWorkouts'
import { useProfile } from '../hooks/useProfile'
import WorkoutCard from '../components/workouts/WorkoutCard'
import WorkoutForm from '../components/workouts/WorkoutForm'
import WorkoutDetailModal from '../components/workouts/WorkoutDetailModal'
import Layout from '../components/layout/Layout'

export default function Workouts() {
  const { workouts, loading, deleteWorkout, updateWorkout, refetch } = useWorkouts()
  const { profile } = useProfile()
  const [showForm, setShowForm] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState(null)
  const [viewingWorkout, setViewingWorkout] = useState(null)

  function handleView(workout) {
    setViewingWorkout(workout)
  }

  function handleEdit(workout) {
    setShowForm(false)
    setViewingWorkout(null)
    setEditingWorkout(workout)
  }

  function handleCancelEdit() {
    setEditingWorkout(null)
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this workout?')) return
    await deleteWorkout(id)
  }

  return (
    <>
      <Layout>
        <div className="topbar" style={{ marginBottom: 0 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 32, color: 'var(--color-text-primary)' }}>
            Workouts 🏋️
          </h1>
          <button
            onClick={() => { setShowForm((v) => !v); setEditingWorkout(null) }}
            className="btn btn-primary"
          >
            {showForm ? 'Cancel' : '+ Log Workout'}
          </button>
        </div>

        {showForm && (
          <WorkoutForm
            profile={profile}
            onSuccess={() => { setShowForm(false); refetch() }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {editingWorkout && (
          <WorkoutForm
            profile={profile}
            initialWorkout={editingWorkout}
            onSuccess={() => { setEditingWorkout(null); refetch() }}
            onUpdate={(updated) => updateWorkout(updated.id, updated)}
            onCancel={handleCancelEdit}
          />
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
          </div>
        ) : workouts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--color-text-secondary)' }}>
            <p style={{ fontSize: 48, marginBottom: 12 }}>🏋️</p>
            <p>No workouts logged yet. Click "+ Log Workout" to get started!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {workouts.map((w) => (
              <WorkoutCard
                key={w.id}
                workout={w}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </Layout>

      {viewingWorkout && (
        <WorkoutDetailModal
          workout={viewingWorkout}
          onClose={() => setViewingWorkout(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </>
  )
}
