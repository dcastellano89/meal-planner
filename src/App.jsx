import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import AuthPage from './pages/Auth'
import UpdatePasswordPage from './pages/UpdatePassword'
import OnboardingPage from './pages/Onboarding'
import RecipesPage from './pages/Recipes'
import PlannerPage from './pages/Planner'
import ShoppingPage from './pages/Shopping'
import ConfigPage from './pages/Config'
import BottomNav from './components/layout/BottomNav'

export default function App() {
  const [session, setSession] = useState(null)
  const [household, setHousehold] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('planner')
  const [recoveryMode, setRecoveryMode] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchHousehold(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSession(session)
        setRecoveryMode(true)
        setLoading(false)
        return
      }
      setSession(session)
      if (session) fetchHousehold(session.user.id)
      else { setHousehold(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchHousehold = async (userId) => {
    const { data } = await supabase
      .from('household_members')
      .select('household_id, role, households(*)')
      .eq('user_id', userId)
      .maybeSingle()
    setHousehold(data ? { ...data.households, role: data.role } : null)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="app" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 48 }}>🍽️</div>
        <p style={{ color: '#6B7280', marginTop: 16, fontSize: 14 }}>Cargando...</p>
      </div>
    )
  }

  if (!session) return <div className="app"><AuthPage /></div>

  if (recoveryMode) return <div className="app"><UpdatePasswordPage onDone={() => setRecoveryMode(false)} /></div>

  if (!household) {
    return (
      <div className="app">
        <OnboardingPage
          user={session.user}
          onComplete={(h) => setHousehold(h)}
        />
      </div>
    )
  }

  const screens = {
    recipes: <RecipesPage household={household} />,
    planner: <PlannerPage household={household} />,
    shopping: <ShoppingPage household={household} />,
    config: <ConfigPage household={household} setHousehold={setHousehold} user={session.user} />,
  }

  return (
    <div className="app">
      {screens[tab]}
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  )
}
