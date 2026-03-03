import { useState } from 'react'
import { supabase } from '../supabase'

export default function UpdatePasswordPage({ onDone }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError('No se pudo actualizar la contraseña. Intentá de nuevo.')
    } else {
      setDone(true)
    }
    setLoading(false)
  }

  if (done) {
    return (
      <div className="auth-screen">
        <div className="card">
          <div className="card-pad" style={{ textAlign: 'center', padding: '32px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>
              ¡Contraseña actualizada!
            </div>
            <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>
              Tu contraseña fue cambiada exitosamente.
            </p>
            <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={onDone}>
              Ir a la app →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-screen">
      <div style={{ marginBottom: 32 }}>
        <div className="onboard-logo">🍽️ Hoy toca</div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>
          Nueva contraseña
        </div>
        <p style={{ fontSize: 14, color: '#6B7280' }}>
          Elegí una nueva contraseña para tu cuenta.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label">Nueva contraseña</label>
          <input
            className="input-field"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Confirmar contraseña</label>
          <input
            className="input-field"
            type="password"
            placeholder="Repetí la contraseña"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        {error && (
          <p style={{ fontSize: 13, color: '#DC2626', marginBottom: 12 }}>{error}</p>
        )}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar contraseña'}
        </button>
      </form>
    </div>
  )
}
