import { useState, useEffect } from 'react'
import { supabase, signOut } from '../supabase'
import Header from '../components/layout/Header'
import Modal from '../components/ui/Modal'

const COOKIDOO_COUNTRIES = [
  { code: 'es', label: 'España' },
  { code: 'ar', label: 'Argentina' },
  { code: 'mx', label: 'México' },
  { code: 'de', label: 'Alemania' },
  { code: 'at', label: 'Austria' },
  { code: 'ch', label: 'Suiza' },
  { code: 'fr', label: 'Francia' },
  { code: 'it', label: 'Italia' },
  { code: 'pt', label: 'Portugal' },
  { code: 'gb', label: 'Reino Unido' },
]

async function callCookidoo(action, payload = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cookidoo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, ...payload }),
  })
  return res.json()
}

const ALL_DAYS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom']
const ALL_DAYS_LABEL = { lun: 'Lun', mar: 'Mar', mie: 'Mié', jue: 'Jue', vie: 'Vie', sab: 'Sáb', dom: 'Dom' }
const DEFAULT_ACTIVE_DAYS = ['lun', 'mar', 'mie', 'jue', 'vie']

export default function ConfigPage({ household, setHousehold, user }) {
  const [persons, setPersons] = useState(household.persons || 2)
  const [activeDays, setActiveDays] = useState(household.active_days || DEFAULT_ACTIVE_DAYS)
  const [saving, setSaving] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [members, setMembers] = useState([])
  const [copied, setCopied] = useState(false)

  // Cookidoo state
  const [cookidooConnection, setCookidooConnection] = useState(null)
  const [cookidooLoading, setCookidooLoading] = useState(true)
  const [showCookidooForm, setShowCookidooForm] = useState(false)
  const [cookidooEmail, setCookidooEmail] = useState('')
  const [cookidooPassword, setCookidooPassword] = useState('')
  const [cookidooCountry, setCookidooCountry] = useState('es')
  const [cookidooSaving, setCookidooSaving] = useState(false)
  const [cookidooError, setCookidooError] = useState('')

  // Cookidoo collections state
  const [collections, setCollections] = useState(null) // null = no cargado
  const [collectionsOpen, setCollectionsOpen] = useState(false)
  const [collectionsLoading, setCollectionsLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [collectionsDirty, setCollectionsDirty] = useState(false)
  const [collectionsSaving, setCollectionsSaving] = useState(false)

  const isAdmin = members.find((m) => m.user_id === user.id)?.role === 'admin'
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

  useEffect(() => {
    callCookidoo('status').then((res) => {
      setCookidooConnection(res.connected ? res.connection : null)
      setCookidooLoading(false)
    }).catch(() => setCookidooLoading(false))
  }, [])

  const handleCookidooConnect = async () => {
    if (!cookidooEmail || !cookidooPassword) return
    setCookidooSaving(true)
    setCookidooError('')
    const res = await callCookidoo('connect', { email: cookidooEmail, password: cookidooPassword, country: cookidooCountry })
    setCookidooSaving(false)
    if (res.error) {
      setCookidooError(res.error.includes('Login failed') ? 'Credenciales incorrectas. Revisá tu email y contraseña de Cookidoo.' : res.error)
    } else {
      setCookidooConnection({ email: cookidooEmail, country: cookidooCountry })
      setShowCookidooForm(false)
      setCookidooEmail('')
      setCookidooPassword('')
    }
  }

  const handleCookidooDisconnect = async () => {
    await callCookidoo('disconnect')
    setCookidooConnection(null)
    setCollections(null)
    setSelectedIds(new Set())
  }

  const loadCollections = async () => {
    if (collectionsLoading) return
    setCollectionsLoading(true)
    setCollectionsOpen(true)
    const res = await callCookidoo('get-collections')
    setCollectionsLoading(false)
    if (res.error) { setCollectionsOpen(false); return }
    setCollections(res.collections)
    setSelectedIds(new Set(res.selectedIds))
    setCollectionsDirty(false)
  }

  const toggleCollection = (col) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(col.id)) next.delete(col.id)
      else next.add(col.id)
      return next
    })
    setCollectionsDirty(true)
  }

  const saveCollections = async () => {
    setCollectionsSaving(true)
    const selected = (collections || []).filter((c) => selectedIds.has(c.id)).map(({ id, name, type }) => ({ id, name, type }))
    await callCookidoo('save-collections', { selected })
    setCollectionsSaving(false)
    setCollectionsDirty(false)
  }

  const toggleDay = async (day) => {
    const isActive = activeDays.includes(day)
    if (isActive && activeDays.length === 1) return // mínimo 1 día
    const newDays = isActive ? activeDays.filter((d) => d !== day) : [...activeDays, day]
    // Mantener el orden de la semana
    const ordered = ALL_DAYS.filter((d) => newDays.includes(d))
    setActiveDays(ordered)
    await supabase.from('households').update({ active_days: ordered }).eq('id', household.id)
    setHousehold((h) => ({ ...h, active_days: ordered }))
  }

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

        {/* Días activos */}
        <div className="card">
          <div className="card-pad">
            <div style={{ fontWeight: 700, fontSize: 13, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
              Días de planificación
            </div>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 14, lineHeight: 1.5 }}>
              El planificador y la IA solo usarán los días seleccionados.
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              {ALL_DAYS.map((day) => {
                const active = activeDays.includes(day)
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      border: `2px solid ${active ? '#2D5016' : '#E8EDE0'}`,
                      background: active ? '#E8F5D0' : 'white',
                      color: active ? '#2D5016' : '#9CA3AF',
                    }}
                  >
                    {ALL_DAYS_LABEL[day]}
                  </button>
                )
              })}
            </div>
            <p style={{ fontSize: 12, color: '#6B7280', marginTop: 10 }}>
              {activeDays.length} {activeDays.length === 1 ? 'día seleccionado' : 'días seleccionados'}
            </p>
          </div>
        </div>

        {/* Thermomix / Cookidoo */}
        <div className="card">
          <div className="card-pad">
            <div style={{ fontWeight: 700, fontSize: 13, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>
              Thermomix / Cookidoo
            </div>

            {cookidooLoading ? (
              <p style={{ fontSize: 13, color: '#9CA3AF' }}>Comprobando conexión...</p>
            ) : cookidooConnection ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#16A34A', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Conectado</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{cookidooConnection.email} · {COOKIDOO_COUNTRIES.find(c => c.code === cookidooConnection.country)?.label ?? cookidooConnection.country}</div>
                  </div>
                </div>
                {/* Colecciones */}
                <div style={{ borderTop: '1px solid #E8EDE0', paddingTop: 14, marginBottom: isAdmin ? 14 : 0 }}>
                  <div
                    onClick={() => collections !== null ? setCollectionsOpen((o) => !o) : !collectionsLoading && loadCollections()}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: collectionsOpen ? 10 : 0, cursor: 'pointer', userSelect: 'none' }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                      Colecciones para el menú
                      {!collectionsOpen && selectedIds.size > 0 && (
                        <span style={{ fontSize: 11, color: '#4A7C28', fontWeight: 400, marginLeft: 6 }}>({selectedIds.size} seleccionada{selectedIds.size !== 1 ? 's' : ''})</span>
                      )}
                    </span>
                    <span style={{ fontSize: 12, color: '#4A7C28', fontWeight: 600 }}>
                      {collectionsLoading ? 'Cargando...' : collectionsOpen ? 'Cerrar ▲' : (collections === null ? 'Cargar ▼' : 'Ver ▼')}
                    </span>
                  </div>

                  {collectionsOpen && collectionsLoading && (
                    <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>Cargando tus colecciones de Cookidoo...</p>
                  )}

                  {collectionsOpen && collections !== null && collections.length === 0 && (
                    <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>No tenés colecciones en Cookidoo todavía.</p>
                  )}

                  {collectionsOpen && collections !== null && collections.length > 0 && (
                    <>
                      {collections.map((col) => (
                        <div
                          key={col.id}
                          onClick={isAdmin ? () => toggleCollection(col) : undefined}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 0', borderBottom: '1px solid #F3F4F6',
                            cursor: isAdmin ? 'pointer' : 'default',
                            userSelect: 'none',
                          }}
                        >
                          <div style={{
                            width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                            border: selectedIds.has(col.id) ? 'none' : '2px solid #D1D5DB',
                            background: selectedIds.has(col.id) ? '#4A7C28' : 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {selectedIds.has(col.id) && (
                              <svg width="11" height="9" viewBox="0 0 12 10" fill="none">
                                <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>{col.name}</div>
                            <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                              {col.recipeCount} receta{col.recipeCount !== 1 ? 's' : ''} · {col.type === 'managed' ? 'Cookidoo' : 'Propia'}
                            </div>
                          </div>
                        </div>
                      ))}

                      {isAdmin && collectionsDirty && (
                        <button
                          className="btn btn-primary"
                          style={{ width: '100%', marginTop: 12, fontSize: 13 }}
                          onClick={saveCollections}
                          disabled={collectionsSaving}
                        >
                          {collectionsSaving ? 'Guardando...' : `Guardar selección (${selectedIds.size})`}
                        </button>
                      )}

                      <button
                        style={{ width: '100%', marginTop: 10, fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0' }}
                        onClick={() => setCollectionsOpen(false)}
                      >
                        Cerrar ▲
                      </button>
                    </>
                  )}
                </div>

                {isAdmin && (
                  <button className="btn btn-danger" style={{ width: '100%', fontSize: 13 }} onClick={handleCookidooDisconnect}>
                    Desconectar Cookidoo
                  </button>
                )}
              </>
            ) : (
              <>
                <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 14, lineHeight: 1.5 }}>
                  Conectá tu cuenta de Cookidoo para sincronizar la lista de compras con tu Thermomix.
                </p>
                {isAdmin ? (
                  <>
                    {!showCookidooForm ? (
                      <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setShowCookidooForm(true)}>
                        Conectar Cookidoo
                      </button>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <input
                          className="input-field"
                          type="email"
                          placeholder="Email de Cookidoo"
                          value={cookidooEmail}
                          onChange={(e) => setCookidooEmail(e.target.value)}
                        />
                        <input
                          className="input-field"
                          type="password"
                          placeholder="Contraseña de Cookidoo"
                          value={cookidooPassword}
                          onChange={(e) => setCookidooPassword(e.target.value)}
                        />
                        <select
                          className="input-field"
                          value={cookidooCountry}
                          onChange={(e) => setCookidooCountry(e.target.value)}
                        >
                          {COOKIDOO_COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>{c.label}</option>
                          ))}
                        </select>
                        {cookidooError && (
                          <p style={{ fontSize: 12, color: '#DC2626', margin: 0 }}>{cookidooError}</p>
                        )}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setShowCookidooForm(false); setCookidooError('') }}>
                            Cancelar
                          </button>
                          <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleCookidooConnect} disabled={cookidooSaving}>
                            {cookidooSaving ? 'Conectando...' : 'Conectar'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' }}>
                    Solo el administrador del hogar puede conectar Cookidoo.
                  </p>
                )}
              </>
            )}
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
