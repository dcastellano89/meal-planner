import Tag from '../ui/Tag'

const DIFFICULTY_ICON = { baja: '🟢', media: '🟡', alta: '🔴' }

export default function RecipeCard({ recipe, onClick, onToggleFavorite }) {
  return (
    <div className="recipe-card" onClick={onClick}>
      {recipe.dish_photo_url ? (
        <div style={{ width: 52, height: 52, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
          <img src={recipe.dish_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div className="recipe-emoji">{recipe.emoji}</div>
      )}
      <div className="recipe-info">
        <div className="recipe-name">{recipe.name}</div>
        <div className="recipe-meta">
          🍽️ {recipe.portions} porciones · {recipe.ingredients?.length ?? 0} ingredientes
          {recipe.difficulty && ` · ${DIFFICULTY_ICON[recipe.difficulty]}`}
        </div>
        {recipe.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
            {recipe.tags.map((t) => <Tag key={t}>{t}</Tag>)}
          </div>
        )}
      </div>
      {onToggleFavorite && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(recipe.id, recipe.is_favorite) }}
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: '4px 6px', color: recipe.is_favorite ? '#F59E0B' : '#D1D5DB' }}
          title={recipe.is_favorite ? 'Quitar de favoritas' : 'Marcar como favorita'}
        >
          {recipe.is_favorite ? '★' : '☆'}
        </button>
      )}
      <div style={{ color: '#6B7280', fontSize: 18 }}>›</div>
    </div>
  )
}
