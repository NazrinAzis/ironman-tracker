import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProfile = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setLoading(false)
    if (error && error.code !== 'PGRST116') {
      setError(error.message)
    } else {
      setProfile(data)
    }
  }, [user])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  async function updateProfile(fields) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...fields })
      .select()
      .single()
    if (!error) setProfile(data)
    return { data, error }
  }

  async function updateRaceDate(raceDate) {
    return updateProfile({ race_date: raceDate })
  }

  return { profile, loading, error, updateRaceDate, updateProfile, refetch: fetchProfile }
}
