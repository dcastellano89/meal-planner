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

// Devuelve una sesión con token fresco, forzando refresh si está por expirar o ya expiró
export const getFreshSession = async () => {
  let { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const expiresAt = (session.expires_at ?? 0) * 1000
  if (Date.now() > expiresAt - 60000) {
    const { data } = await supabase.auth.refreshSession()
    return data.session
  }
  return session
}

export const resetPassword = (email) =>
  supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  })

const compressImage = (file, maxPx = 800, quality = 0.82) =>
  new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality)
    }
    img.src = url
  })

export const uploadDishPhoto = async (file) => {
  const compressed = await compressImage(file)
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
  const { error } = await supabase.storage.from('recipe-photos').upload(path, compressed, { contentType: 'image/jpeg', upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('recipe-photos').getPublicUrl(path)
  return data.publicUrl
}

export const deleteDishPhoto = async (url) => {
  const path = url.split('/recipe-photos/').pop()
  if (path) await supabase.storage.from('recipe-photos').remove([path])
}
