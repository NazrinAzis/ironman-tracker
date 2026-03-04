import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStrava } from '../hooks/useStrava'
import Navbar from '../components/layout/Navbar'

export default function StravaCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { handleStravaCallback, connecting, error } = useStrava()
  const hasRun = useRef(false) // guard against React StrictMode double-invoke

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const code = searchParams.get('code')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      navigate('/settings?strava=denied')
      return
    }

    if (!code) {
      navigate('/settings')
      return
    }

    handleStravaCallback(code)
      .then(() => navigate('/settings?strava=connected'))
      .catch(() => {}) // error is already set in hook state
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center gap-4">
        <div className="bg-ironman-navy rounded-xl p-8 text-center flex flex-col items-center gap-4 w-full">
          {error ? (
            <>
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={() => navigate('/settings')}
                className="bg-ironman-accent hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Back to Settings
              </button>
            </>
          ) : (
            <>
              <div className="w-8 h-8 border-4 border-ironman-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-white text-sm">
                {connecting ? 'Connecting to Strava…' : 'Finishing up…'}
              </p>
            </>
          )}
        </div>
      </main>
    </>
  )
}
