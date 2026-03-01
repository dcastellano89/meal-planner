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
]

export default function CategoryFilter({ active, onChange, recipes }) {
  const visibleCategories = CATEGORIES.filter((cat) => {
    if (cat.id === 'todas') return true
    return recipes.some((r) => r.category === cat.id)
  })

  return (
    <div className="pill-tabs">
      {visibleCategories.map((cat) => {
        const count = cat.id === 'todas' ? recipes.length : recipes.filter((r) => r.category === cat.id).length
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
    </div>
  )
}
