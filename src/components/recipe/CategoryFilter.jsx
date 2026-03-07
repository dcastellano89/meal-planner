import ThermomixIcon from '../ui/ThermomixIcon'

export const CATEGORIES = [
  { id: 'todas', label: 'Todas' },
  { id: 'pollo', label: '🍗 Pollo' },
  { id: 'carnes', label: '🥩 Carnes' },
  { id: 'pescados', label: '🐟 Pescados' },
  { id: 'pastas', label: '🍝 Pastas' },
  { id: 'sopas', label: '🥣 Sopas' },
  { id: 'tartas', label: '🥧 Tartas' },
  { id: 'ensaladas', label: '🥗 Ensaladas' },
  { id: 'vegetariano', label: '🌱 Vegetariano' },
  { id: 'otros', label: '📦 Otros' },
  { id: 'postre', label: '🍰 Postres' },
  { id: 'snack', label: '🍿 Snacks' },
]

export default function CategoryFilter({ active, onChange, recipes, showCookidoo = false }) {
  const hasCookidoo = showCookidoo || recipes.some((r) => r.source === 'cookidoo')

  const visibleCategories = CATEGORIES.filter((cat) => {
    if (cat.id === 'todas') return true
    return recipes.some((r) => r.category === cat.id && r.source !== 'cookidoo')
  })

  return (
    <div className="pill-tabs">
      {visibleCategories.map((cat) => {
        const count = cat.id === 'todas'
          ? recipes.filter((r) => r.source !== 'cookidoo').length
          : recipes.filter((r) => r.category === cat.id && r.source !== 'cookidoo').length
        return (
          <button
            key={cat.id}
            className={`pill-tab ${active === cat.id ? 'active' : ''}`}
            onClick={() => onChange(cat.id)}
          >
            {cat.label} {count > 0 && <span style={{ marginLeft: 4, opacity: 0.7 }}>({count})</span>}
          </button>
        )
      })}
      {hasCookidoo && (
        <button
          className={`pill-tab ${active === 'cookidoo' ? 'active' : ''}`}
          onClick={() => onChange('cookidoo')}
          style={{ display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <ThermomixIcon size={14} />
          Cookidoo
          <span style={{ marginLeft: 2, opacity: 0.7 }}>({recipes.filter((r) => r.source === 'cookidoo').length})</span>
        </button>
      )}
    </div>
  )
}
