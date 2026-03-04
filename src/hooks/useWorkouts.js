import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useWorkouts() {
  const { user } = useAuth()
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchWorkouts = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setWorkouts(data)
    }
  }, [user])

  useEffect(() => {
    fetchWorkouts()
  }, [fetchWorkouts])

  async function addWorkout(fields) {
    const { data, error } = await supabase
      .from('workouts')
      .insert({ user_id: user.id, ...fields })
      .select()
      .single()
    if (!error) setWorkouts((prev) => [data, ...prev])
    return { data, error }
  }

  async function updateWorkout(id, fields) {
    const { data, error } = await supabase
      .from('workouts')
      .update(fields)
      .eq('id', id)
      .select()
      .single()
    if (!error) setWorkouts((prev) => prev.map((w) => (w.id === id ? data : w)))
    return { data, error }
  }

  async function deleteWorkout(id) {
    const { error } = await supabase.from('workouts').delete().eq('id', id)
    if (!error) setWorkouts((prev) => prev.filter((w) => w.id !== id))
    return { error }
  }

  return { workouts, loading, error, refetch: fetchWorkouts, addWorkout, updateWorkout, deleteWorkout }
}
