import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useCSSTests() {
  const { user }                   = useAuth()
  const [cssTests, setCssTests]    = useState([])
  const [loading, setLoading]      = useState(true)

  useEffect(() => {
    if (!user) return
    fetchTests()
  }, [user])  // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchTests() {
    setLoading(true)
    const { data } = await supabase
      .from('css_tests')
      .select('*')
      .eq('user_id', user.id)
      .order('test_date', { ascending: true })
    setCssTests(data || [])
    setLoading(false)
  }

  /**
   * Log a new CSS test.
   * CSS (sec/100m) = (T400 - T200) / 2
   * because T400-T200 = time for the last 200 m at CSS pace, ÷2 → per 100 m
   */
  async function addCSSTest({ testDate, t400Seconds, t200Seconds, notes = '' }) {
    const cssPerHundred = (t400Seconds - t200Seconds) / 2
    const { error } = await supabase.from('css_tests').insert({
      user_id:      user.id,
      test_date:    testDate,
      t400_seconds: t400Seconds,
      t200_seconds: t200Seconds,
      css_per_100m: cssPerHundred,
      notes:        notes || null,
    })
    if (!error) await fetchTests()
    return { error }
  }

  async function deleteCSSTest(id) {
    await supabase.from('css_tests').delete().eq('id', id)
    setCssTests(prev => prev.filter(t => t.id !== id))
  }

  return { cssTests, loading, addCSSTest, deleteCSSTest }
}
