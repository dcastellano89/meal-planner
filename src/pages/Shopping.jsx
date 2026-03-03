import Header from '../components/layout/Header'
import EmptyState from '../components/ui/EmptyState'
import useShopping from '../hooks/useShopping'
import { CATEGORY_LABELS } from '../utils/shopping'

export default function ShoppingPage({ household }) {
  const { shoppingList, loading, hasPlan, totalItems, checkedCount, toggleItem, clearChecked } =
    useShopping(household.id)

  const hasItems = totalItems > 0

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
              const checkedItems = allEntries.flatMap(([cat, items]) =>
                items.filter((i) => i.checked).map((i) => ({ item: i, cat }))
              )

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

                  {/* Comprado — todos los chequeados al final */}
                  {checkedItems.length > 0 && (
                    <div style={{ marginBottom: 20, opacity: 0.7 }}>
                      {categoryHeader(`✅ Comprado (${checkedItems.length})`)}
                      {checkedItems.map(({ item, cat }) => itemRow(item, cat))}
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
