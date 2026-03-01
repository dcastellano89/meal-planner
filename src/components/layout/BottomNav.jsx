const NAV_ITEMS = [
  { id: 'recipes', icon: '📖', label: 'Recetas' },
  { id: 'planner', icon: '📅', label: 'Semana' },
  { id: 'shopping', icon: '🛒', label: 'Compras' },
  { id: 'config', icon: '⚙️', label: 'Config' },
]

export default function BottomNav({ tab, setTab }) {
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => (
        <div
          key={item.id}
          className={`nav-item ${tab === item.id ? 'active' : ''}`}
          onClick={() => setTab(item.id)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </div>
      ))}
    </nav>
  )
}
