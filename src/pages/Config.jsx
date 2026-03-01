import { useState } from 'react'
import { supabase, signOut } from '../supabase'
import Header from '../components/layout/Header'
import Modal from '../components/ui/Modal'

export default function ConfigPage({ household, setHousehold, user }) {
  const [persons, setPersons] = useState(household.persons || 2)
  const [saving, setSaving] = useState(false)
  const [showInvite, setShowInvite] = useState(false)

  const updatePersons = async (n) => {
    setPersons(n)
    setSaving(true)
    await supabase.from('households').update({ persons: n }).eq('id', household.id)
    setHousehold((h) => ({ ...h, persons: n }))
    setSaving(false)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="screen">
      <Header title="Configuración" subtitle={household.name} />

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card">
          <div className="card-pad">
            <div style={{ fontWeight: 700, fontSize: 13, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>
              Mi hogar
            </div>
            <div className="member-row">
              <div className="avatar">👤</div>
              <div className="member-info">
                <div className="member-name">{user.email}</div>
                <div className="member-role">{household.role === 'admin' ? 'Administrador/a' : 'Miembro'}</div>
              </div>
              {household.role === 'admin' && <span className="tag">Admin</span>}
            </div>
            <div style={{ marginTop: 16 }}>
              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setShowInvite(true)}>
                + Invitar persona
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-pad">
            <div style={{ fontWeight: 700, fontSize: 13, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
              Personas en el hogar
            </div>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 14, lineHeight: 1.5 }}>
              Afecta el cálculo de porciones y la lista de compras.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  onClick={() => updatePersons(n)}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer',
                    border: `2px solid ${persons === n ? '#2D5016' : '#E8EDE0'}`,
                    background: persons === n ? '#E8F5D0' : 'white',
                    color: persons === n ? '#2D5016' : '#6B7280',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 12, color: '#6B7280', marginTop: 10 }}>
              {saving ? 'Guardando...' : persons === 1 ? '1 persona — las porciones son para vos sola.' : `${persons} personas — las porciones se dividen entre ${persons}.`}
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-pad">
            <div style={{ fontWeight: 700, fontSize: 13, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>
              Sobre la app
            </div>
            {[['🍽️ Versión', '1.0 MVP'], ['📱 Plataforma', 'PWA — instalable en iPhone'], ['☁️ Datos', 'Supabase'], ['🤖 IA', 'Claude Sonnet']].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #E8EDE0' }}>
                <span style={{ fontSize: 14, color: '#1A1A1A' }}>{label}</span>
                <span style={{ fontSize: 14, color: '#6B7280' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="btn btn-danger" onClick={handleSignOut} style={{ width: '100%' }}>
          Cerrar sesión
        </button>
      </div>

      {showInvite && (
        <Modal onClose={() => setShowInvite(false)} title="Invitar al hogar">
          <div style={{ background: '#E8F5D0', borderRadius: 12, padding: '14px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, color: '#2D5016', fontWeight: 500, flex: 1, wordBreak: 'break-all' }}>
              {window.location.origin}/join/{household.invite_code}
            </span>
            <button
              onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/join/${household.invite_code}`)}
              style={{ background: '#2D5016', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              Copiar
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => setShowInvite(false)}>
            Listo
          </button>
        </Modal>
      )}
    </div>
  )
}
