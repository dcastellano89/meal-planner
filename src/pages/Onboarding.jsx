import { useState } from 'react'
import { supabase } from '../supabase'
import { seedSampleRecipes } from '../utils/sampleRecipes'

export default function OnboardingPage({ user, onComplete }) {
  const [step, setStep] = useState(0)
  const [householdName, setHouseholdName] = useState('')
  const [persons, setPersons] = useState(2)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [household, setHousehold] = useState(null)

  const createHousehold = async () => {
    if (!householdName.trim()) return
    setLoading(true)
    setError('')

    const { data, error } = await supabase.rpc('create_household_with_member', {
      p_name: householdName.trim(),
      p_persons: persons,
    })

    if (error) {
      setError('Error al crear el hogar. Intentá de nuevo.')
      setLoading(false)
      return
    }

    setHousehold(data)
    await seedSampleRecipes(data.id)
    setLoading(false)
    setStep(2)
  }

  const steps = [
    {
      content: (
        <>
          <div className="onboard-illustration">🍽️</div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: '#1A1A1A', marginBottom: 12, lineHeight: 1.3 }}>
            Planificá tus comidas semanales en minutos
          </div>
          <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.6, marginBottom: 32 }}>
            Tus recetas, tu calendario semanal y la lista de compras, todo en un lugar.
          </p>
          <button className="btn btn-primary" onClick={() => setStep(1)}>Empezar →</button>
        </>
      ),
    },
    {
      content: (
        <>
          <div className="onboard-illustration">🏠</div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>
            ¿Cómo se llama tu hogar?
          </div>
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 1.5 }}>
            Vas a poder compartirlo con tu pareja o familia para planificar juntos.
          </p>
          <div className="input-group">
            <label className="input-label">Nombre del hogar</label>
            <input
              className="input-field"
              placeholder="Ej: Casa de Ana y Carlos"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
            />
          </div>
          <div className="input-group" style={{ marginBottom: 32 }}>
            <label className="input-label">¿Cuántas personas?</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setPersons(n)}
                  style={{
                    flex: 1, padding: '12px', border: `2px solid ${persons === n ? '#2D5016' : '#E8EDE0'}`,
                    borderRadius: 12, background: persons === n ? '#E8F5D0' : 'white',
                    color: persons === n ? '#2D5016' : '#6B7280', fontSize: 18, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          {error && <p style={{ fontSize: 13, color: '#DC2626', marginBottom: 12 }}>{error}</p>}
          <button
            className="btn btn-primary"
            onClick={createHousehold}
            disabled={loading || !householdName.trim()}
          >
            {loading ? 'Creando...' : 'Crear hogar →'}
          </button>
        </>
      ),
    },
    {
      content: (
        <>
          <div className="onboard-illustration">💌</div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>
            ¡Hogar creado!
          </div>
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 1.5 }}>
            Compartí este link con tu pareja para que se una al hogar y puedan planificar juntos.
          </p>
          <div style={{ background: '#E8F5D0', borderRadius: 12, padding: '14px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, color: '#2D5016', fontWeight: 500, flex: 1, wordBreak: 'break-all' }}>
              {window.location.origin}/join/{household?.invite_code}
            </span>
            <button
              onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/join/${household?.invite_code}`)}
              style={{ background: '#2D5016', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              Copiar
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => onComplete({ ...household, role: 'admin' })} style={{ marginBottom: 12 }}>
            Ir a la app →
          </button>
          <button className="btn btn-ghost" onClick={() => onComplete({ ...household, role: 'admin' })} style={{ width: '100%' }}>
            Invitar después
          </button>
        </>
      ),
    },
  ]

  return (
    <div className="onboarding">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${((step + 1) / 3) * 100}%` }} />
      </div>
      {steps[step].content}
    </div>
  )
}
