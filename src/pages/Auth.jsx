import { useState } from 'react'
import { signIn, signUp, resetPassword } from '../supabase'

export default function AuthPage() {
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [registered, setRegistered] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')

    if (mode === 'reset') {
      const { error } = await resetPassword(email)
      if (error) setError('No se pudo enviar el mail. Verificá el email ingresado.')
      else setResetSent(true)
      setLoading(false)
      return
    }

    if (!password) { setLoading(false); return }

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError('Email o contraseña incorrectos.')
    } else {
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.')
        setLoading(false)
        return
      }
      const { error } = await signUp(email, password)
      if (error) setError(error.message || 'Error al registrarse.')
      else setRegistered(true)
    }

    setLoading(false)
  }

  if (registered) {
    return (
      <div className="auth-screen">
        <div className="card">
          <div className="card-pad" style={{ textAlign: 'center', padding: '32px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>
              ¡Confirmá tu cuenta!
            </div>
            <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>
              Te enviamos un mail de confirmación a <strong>{email}</strong>.<br />
              Confirmá tu cuenta y volvé a iniciar sesión.
            </p>
            <button
              className="btn btn-secondary"
              style={{ marginTop: 24 }}
              onClick={() => { setRegistered(false); setMode('login') }}
            >
              Ir al login
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (resetSent) {
    return (
      <div className="auth-screen">
        <div className="card">
          <div className="card-pad" style={{ textAlign: 'center', padding: '32px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📩</div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>
              ¡Mail enviado!
            </div>
            <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>
              Te enviamos un link a <strong>{email}</strong> para restablecer tu contraseña.
            </p>
            <button
              className="btn btn-secondary"
              style={{ marginTop: 24 }}
              onClick={() => { setResetSent(false); setMode('login') }}
            >
              Volver al login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-screen">
      <div style={{ marginBottom: 40 }}>
        <div className="onboard-logo">🍽️ Hoy toca</div>
        <div className="onboard-tagline">Hoy toca... comer sin pensar</div>
      </div>

      {mode !== 'reset' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button
            className={`btn btn-sm ${mode === 'login' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1 }}
            onClick={() => { setMode('login'); setError('') }}
          >
            Iniciar sesión
          </button>
          <button
            className={`btn btn-sm ${mode === 'register' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1 }}
            onClick={() => { setMode('register'); setError('') }}
          >
            Registrarse
          </button>
        </div>
      )}

      {mode === 'reset' && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>
            Restablecer contraseña
          </div>
          <p style={{ fontSize: 14, color: '#6B7280' }}>
            Ingresá tu email y te enviamos un link para crear una nueva contraseña.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label">Email</label>
          <input
            className="input-field"
            type="email"
            placeholder="ana@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        {mode !== 'reset' && (
          <div className="input-group">
            <label className="input-label">Contraseña</label>
            <input
              className="input-field"
              type="password"
              placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>
        )}

        {error && (
          <p style={{ fontSize: 13, color: '#DC2626', marginBottom: 12 }}>{error}</p>
        )}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading
            ? 'Cargando...'
            : mode === 'login'
            ? 'Entrar'
            : mode === 'register'
            ? 'Crear cuenta'
            : 'Enviar link'}
        </button>
      </form>

      {mode === 'login' && (
        <button
          className="btn btn-ghost"
          style={{ width: '100%', marginTop: 12, fontSize: 13 }}
          onClick={() => { setMode('reset'); setError('') }}
        >
          ¿Olvidaste tu contraseña?
        </button>
      )}

      {mode === 'reset' && (
        <button
          className="btn btn-ghost"
          style={{ width: '100%', marginTop: 12, fontSize: 13 }}
          onClick={() => { setMode('login'); setError('') }}
        >
          ← Volver al login
        </button>
      )}
    </div>
  )
}
