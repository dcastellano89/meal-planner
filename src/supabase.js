import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signUp = (email, password) =>
  supabase.auth.signUp({ email, password })

export const signOut = () => supabase.auth.signOut()

export const getSession = () => supabase.auth.getSession()

export const resetPassword = (email) =>
  supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  })
