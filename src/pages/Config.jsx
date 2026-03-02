import { useState, useEffect } from 'react'
import { supabase, signOut } from '../supabase'
import Header from '../components/layout/Header'
import Modal from '../components/ui/Modal'

export default function ConfigPage({ household, setHousehold, user }) {
  const [persons, setPersons] = useState(household.persons || 2)
  const [saving, setSaving] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [members, setMembers] = useState([])
  const [copied, setCopied] = useState(false)

  const inviteUrl = `${window.location.origin}/join/${household.invite_code}`

  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase.rpc('get_household_members', {
        p_household_id: household.id,
      })
      setMembers(data || [])
    }
    fetchMembers()
  }, [household.id])

  const updatePersons = async (n) => {
    setPersons(n)
    setSaving(true)
    await supabase.from('households').update({ persons: n }).eq('id', household.id)
    setHousehold((h) => ({ ...h, persons: n }))
    setSaving(false)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="screen">
      <Header title="Configuración" subtitle={household.name} />

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Miembros del hogar */}
        <div className="card">
          <div className="card-pad">
            <div style={{ fontWeight: 700, fontSize: 13, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>
              Mi hogar
            </div>

            {members.map((m) => (
              <div key={m.user_id} className="member-row">
                <div className="avatar">👤</div>
                <div className="member-info">
                  <div className="member-name">{m.email}</div>
                  <div className="member-role">{m.role === 'admin' ? 'Administrador/a' : 'Miembro'}</div>
                </div>
                {m.role === 'admin' && <span className="tag">Admin</span>}
                {m.user_id === user.id && m.role !== 'admin' && (
                  <span className="tag" style={{ background: '#E8EDE0', color: '#6B7280' }}>Yo</span>
                )}
              </div>
            ))}

            <div style={{ marginTop: 16 }}>
              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setShowInvite(true)}>
                + Invitar persona
              </button>
            </div>
          </div>
        </div>

        {/* Personas para porciones */}
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

        {/* Sobre la app */}
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

        <button className="btn btn-danger" onClick={signOut} style={{ width: '100%' }}>
          Cerrar sesión
        </button>
      </div>

      {/* Modal invitación */}
      {showInvite && (
        <Modal onClose={() => setShowInvite(false)} title="Invitar al hogar">
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16, lineHeight: 1.5 }}>
            Compartí este enlace con quien quieras que se una a <strong>{household.name}</strong>.
          </p>
          <div style={{ background: '#E8F5D0', borderRadius: 12, padding: '14px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: '#2D5016', fontWeight: 500, flex: 1, wordBreak: 'break-all' }}>
              {inviteUrl}
            </span>
            <button
              onClick={handleCopy}
              style={{ background: '#2D5016', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
            >
              {copied ? '✓' : 'Copiar'}
            </button>
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowInvite(false)}>
            Listo
          </button>
        </Modal>
      )}
    </div>
  )
}
