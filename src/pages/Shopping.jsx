import { useState } from 'react'
import Header from '../components/layout/Header'
import EmptyState from '../components/ui/EmptyState'
import useShopping from '../hooks/useShopping'
import { CATEGORY_LABELS } from '../utils/shopping'

export default function ShoppingPage({ household }) {
  const { shoppingList, extras, loading, hasPlan, totalItems, checkedCount, toggleItem, addExtra, removeExtra, toggleExtra, clearChecked } =
    useShopping(household.id)
  const [extraInput, setExtraInput] = useState('')

  const hasItems = totalItems > 0

  const handleAddExtra = () => {
    if (!extraInput.trim()) return
    addExtra(extraInput.trim())
    setExtraInput('')
  }

  if (loading) {
    return (
      <div className="screen">
        <Header title="Lista de compras" subtitle="Cargando..." />
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#6B7280', fontSize: 14 }}>
          Cargando lista...
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <Header
        title="Lista de compras"
        subtitle={
          hasItems
            ? `${checkedCount} de ${totalItems} items`
            : 'Generada del planificador'
        }
      />

      {/* Sin plan */}
      {!hasPlan && (
        <div style={{ padding: '0 20px' }}>
          <EmptyState
            icon="📅"
            title="Sin plan esta semana"
            text="Planificá tu semana primero para que se genere la lista de compras automáticamente."
          />
        </div>
      )}

      {/* Plan existe pero sin recetas */}
      {hasPlan && !hasItems && (
        <div style={{ padding: '0 20px' }}>
          <EmptyState
            icon="🛒"
            title="Lista vacía"
            text="El plan de esta semana no tiene recetas asignadas todavía."
          />
        </div>
      )}

      {/* Lista de compras */}
      {hasItems && (
        <>
          {/* Barra de progreso */}
          <div style={{ padding: '0 20px 16px' }}>
            <div style={{
              background: '#F3F4F6',
              borderRadius: 8,
              height: 8,
              overflow: 'hidden',
            }}>
              <div style={{
                background: checkedCount === totalItems ? '#16A34A' : '#4A7C28',
                height: '100%',
                width: `${(checkedCount / totalItems) * 100}%`,
                borderRadius: 8,
                transition: 'width 0.3s ease',
              }} />
            </div>
            {checkedCount === totalItems && totalItems > 0 && (
              <div style={{ textAlign: 'center', fontSize: 13, color: '#16A34A', marginTop: 8, fontWeight: 600 }}>
                ✅ ¡Lista completada!
              </div>
            )}
          </div>

          {/* Categorías */}
          <div className="section-pad">
            {(() => {
              const categoryHeader = (label) => (
                <div style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#374151',
                  padding: '6px 0',
                  marginBottom: 4,
                  borderBottom: '1px solid #E5E7EB',
                }}>
                  {label}
                </div>
              )

              const itemRow = (item, cat) => (
                <div
                  key={item.name}
                  onClick={() => toggleItem(item, cat, item.checked)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 0',
                    borderBottom: '1px solid #F3F4F6',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    border: item.checked ? 'none' : '2px solid #D1D5DB',
                    background: item.checked ? '#4A7C28' : 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s',
                  }}>
                    {item.checked && (
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                        <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{
                      fontSize: 15,
                      color: item.checked ? '#9CA3AF' : '#111827',
                      textDecoration: item.checked ? 'line-through' : 'none',
                      transition: 'color 0.15s',
                      fontWeight: 500,
                    }}>
                      {item.name}
                    </span>
                    {item.quantity && (
                      <span style={{ fontSize: 12, color: '#9CA3AF', flexShrink: 0 }}>
                        {item.quantity}
                      </span>
                    )}
                  </div>
                </div>
              )

              const allEntries = Object.entries(shoppingList)
              const checkedRecipeItems = allEntries.flatMap(([cat, items]) =>
                items.filter((i) => i.checked).map((i) => ({ item: i, cat, isExtra: false }))
              )
              const checkedExtraItems = extras.filter((e) => e.checked).map((e) => ({ item: e, cat: 'extras', isExtra: true }))
              const allChecked = [...checkedRecipeItems, ...checkedExtraItems]

              return (
                <>
                  {/* Ítems pendientes agrupados por categoría */}
                  {allEntries.map(([cat, items]) => {
                    const pending = items.filter((i) => !i.checked)
                    if (!pending.length) return null
                    return (
                      <div key={cat} style={{ marginBottom: 20 }}>
                        {categoryHeader(CATEGORY_LABELS[cat])}
                        {pending.map((item) => itemRow(item, cat))}
                      </div>
                    )
                  })}

                  {/* Extras manuales pendientes */}
                  <div style={{ marginBottom: 20 }}>
                    {categoryHeader('🛒 Extras')}
                    {extras.filter((e) => !e.checked).map((e) => (
                      <div
                        key={e.name}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}
                      >
                        <div
                          onClick={() => toggleExtra(e.name, e.checked)}
                          style={{ width: 22, height: 22, borderRadius: 6, border: '2px solid #D1D5DB', background: 'white', flexShrink: 0, cursor: 'pointer' }}
                        />
                        <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 6, cursor: 'pointer' }} onClick={() => toggleExtra(e.name, e.checked)}>
                          <span style={{ fontSize: 15, color: '#111827', fontWeight: 500 }}>{e.name}</span>
                          {e.quantity && <span style={{ fontSize: 12, color: '#9CA3AF' }}>{e.quantity}</span>}
                        </div>
                        <button
                          onClick={() => removeExtra(e.name)}
                          style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: 18, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}
                        >×</button>
                      </div>
                    ))}
                    {/* Input agregar extra */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <input
                        className="input-field"
                        placeholder="Agregar ítem extra..."
                        value={extraInput}
                        onChange={(e) => setExtraInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddExtra()}
                        style={{ flex: 1, fontSize: 14 }}
                      />
                      <button className="btn btn-secondary btn-sm" onClick={handleAddExtra} style={{ flexShrink: 0 }}>
                        + Agregar
                      </button>
                    </div>
                  </div>

                  {/* Comprado — todos los chequeados al final */}
                  {allChecked.length > 0 && (
                    <div style={{ marginBottom: 20, opacity: 0.7 }}>
                      {categoryHeader(`✅ Comprado (${allChecked.length})`)}
                      {allChecked.map(({ item, cat, isExtra }) => isExtra
                        ? (
                          <div
                            key={item.name}
                            onClick={() => toggleExtra(item.name, item.checked)}
                            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #F3F4F6', cursor: 'pointer', userSelect: 'none' }}
                          >
                            <div style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: '#4A7C28', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                            <span style={{ fontSize: 15, color: '#9CA3AF', textDecoration: 'line-through', fontWeight: 500 }}>{item.name}</span>
                          </div>
                        )
                        : itemRow(item, cat)
                      )}
                    </div>
                  )}
                </>
              )
            })()}
          </div>

          {/* Botón limpiar checks */}
          {checkedCount > 0 && (
            <div style={{ padding: '0 20px 24px' }}>
              <button
                className="btn btn-ghost"
                style={{ width: '100%' }}
                onClick={clearChecked}
              >
                Desmarcar todo
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
