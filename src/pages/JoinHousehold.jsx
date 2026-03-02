import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function JoinHouseholdPage({ inviteCode, user, onComplete, onCreateNew }) {
  const [household, setHousehold] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const preview = async () => {
      const { data } = await supabase.rpc('get_household_by_invite_code', {
        p_invite_code: inviteCode,
      })
      setHousehold(data)
      setLoading(false)
    }
    preview()
  }, [inviteCode])

  const handleJoin = async () => {
    setJoining(true)
    setError('')
    const { data, error } = await supabase.rpc('join_household_by_code', {
      p_invite_code: inviteCode,
    })
    if (error || !data) {
      setError('No se pudo unir al hogar. El código puede ser inválido.')
      setJoining(false)
      return
    }
    onComplete({ ...data, role: 'member' })
  }

  return (
    <div className="app" style={{ alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🏠</div>

        {loading ? (
          <p style={{ color: '#6B7280', fontSize: 14 }}>Verificando invitación...</p>
        ) : !household ? (
          <>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, marginBottom: 8 }}>
              Código inválido
            </h2>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 32 }}>
              Este enlace de invitación no es válido o ya expiró.
            </p>
            <button className="btn btn-ghost" style={{ width: '100%' }} onClick={onCreateNew}>
              Crear mi propio hogar
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>Te invitaron a unirte a</p>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 28,
              color: '#1A1A1A',
              fontWeight: 700,
              marginBottom: 8,
            }}>
              {household.name}
            </h2>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 32 }}>
              {household.persons} persona{household.persons !== 1 ? 's' : ''} · compartís recetas, planner y lista de compras
            </p>

            {error && (
              <p style={{ fontSize: 13, color: '#DC2626', marginBottom: 16 }}>{error}</p>
            )}

            <button
              className="btn"
              style={{ width: '100%', marginBottom: 12 }}
              onClick={handleJoin}
              disabled={joining}
            >
              {joining ? 'Uniéndome...' : `Unirme a ${household.name}`}
            </button>
            <button className="btn btn-ghost" style={{ width: '100%' }} onClick={onCreateNew}>
              No, crear mi propio hogar
            </button>
          </>
        )}
      </div>
    </div>
  )
}
