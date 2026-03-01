import Tag from '../ui/Tag'

export default function RecipeCard({ recipe, onClick }) {
  return (
    <div className="recipe-card" onClick={onClick}>
      <div className="recipe-emoji">{recipe.emoji}</div>
      <div className="recipe-info">
        <div className="recipe-name">{recipe.name}</div>
        <div className="recipe-meta">
          🍽️ {recipe.portions} porciones · {recipe.ingredients?.length ?? 0} ingredientes
        </div>
        {recipe.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
            {recipe.tags.map((t) => <Tag key={t}>{t}</Tag>)}
          </div>
        )}
      </div>
      <div style={{ color: '#6B7280', fontSize: 18 }}>›</div>
    </div>
  )
}
