import { useState } from 'react'
import Header from '../components/layout/Header'
import RecipeCard from '../components/recipe/RecipeCard'
import CategoryFilter from '../components/recipe/CategoryFilter'
import RecipeForm from '../components/recipe/RecipeForm'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import Tag from '../components/ui/Tag'
import useRecipes from '../hooks/useRecipes'

export default function RecipesPage({ household }) {
  const { recipes, loading, createRecipe, updateRecipe, deleteRecipe, toggleFavorite, ingredientSuggestions } = useRecipes(household.id)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(null)
  const [showDetail, setShowDetail] = useState(null)
  const [activeCategory, setActiveCategory] = useState('todas')
  const [activeDifficulty, setActiveDifficulty] = useState('todas')
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const filtered = recipes
    .filter((r) => activeCategory === 'todas' || r.category === activeCategory)
    .filter((r) => activeDifficulty === 'todas' || r.difficulty === activeDifficulty)
    .filter((r) => !onlyFavorites || r.is_favorite)

  const handleDelete = async () => {
    await deleteRecipe(showDetail.id)
    setShowDetail(null)
    setDeleteConfirm(false)
  }

  return (
    <div className="screen">
      <Header
        title="Mis Recetas"
        subtitle={loading ? 'Cargando...' : `${recipes.length} receta${recipes.length !== 1 ? 's' : ''} en tu biblioteca`}
      />

      {recipes.length > 0 && (
        <>
          <CategoryFilter
            active={activeCategory}
            onChange={setActiveCategory}
            recipes={recipes}
          />
          <div className="pill-tabs" style={{ paddingTop: 8, paddingBottom: 8 }}>
            {[
              { value: 'todas', label: 'Todas' },
              { value: 'baja',  label: '🟢 Fácil' },
              { value: 'media', label: '🟡 Media' },
              { value: 'alta',  label: '🔴 Difícil' },
            ].map(({ value, label }) => (
              <button
                key={value}
                className={`pill-tab ${activeDifficulty === value ? 'active' : ''}`}
                onClick={() => setActiveDifficulty(value)}
              >
                {label}
              </button>
            ))}
            <button
              className={`pill-tab ${onlyFavorites ? 'active' : ''}`}
              onClick={() => setOnlyFavorites((v) => !v)}
            >
              ★ Favoritas {recipes.filter((r) => r.is_favorite).length > 0 && `(${recipes.filter((r) => r.is_favorite).length})`}
            </button>
          </div>
        </>
      )}

      <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#6B7280', fontSize: 14 }}>
            Cargando recetas...
          </div>
        ) : filtered.length === 0 && recipes.length === 0 ? (
          <EmptyState
            icon="📖"
            title="Tu biblioteca está vacía"
            text="Cargá tus primeras recetas para poder planificar la semana."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🔍"
            title={`Sin recetas en esta categoría`}
            text="Agregá una receta con el botón +"
          />
        ) : (
          filtered.map((r) => (
            <RecipeCard key={r.id} recipe={r} onClick={() => setShowDetail(r)} onToggleFavorite={toggleFavorite} />
          ))
        )}
      </div>

      <button className="fab" onClick={() => setShowAdd(true)}>+</button>

      {showAdd && (
        <RecipeForm
          onSave={createRecipe}
          onClose={() => setShowAdd(false)}
          suggestions={ingredientSuggestions}
        />
      )}

      {showEdit && (
        <RecipeForm
          initialData={showEdit}
          onSave={(data) => updateRecipe(showEdit.id, data)}
          onClose={() => { setShowEdit(null); setShowDetail(null) }}
          suggestions={ingredientSuggestions}
        />
      )}

      {showDetail && !showEdit && (
        <Modal onClose={() => { setShowDetail(null); setDeleteConfirm(false) }}>
          {showDetail.dish_photo_url && (
            <div style={{ margin: '-20px -20px 20px', borderRadius: '16px 16px 0 0', overflow: 'hidden', height: 180 }}>
              <img src={showDetail.dish_photo_url} alt={showDetail.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 52, width: 72, height: 72, background: '#E8F5D0', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {showDetail.emoji}
            </div>
            <div>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, color: '#1A1A1A' }}>
                {showDetail.name}
              </div>
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                🍽️ {showDetail.portions} porciones
              </div>
              {showDetail.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                  {showDetail.tags.map((t) => <Tag key={t}>{t}</Tag>)}
                </div>
              )}
            </div>
          </div>

          <div style={{ fontWeight: 700, fontSize: 13, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
            Ingredientes
          </div>
          {showDetail.ingredients?.map((ing, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #E8EDE0' }}>
              <span style={{ fontSize: 14, color: '#1A1A1A' }}>{ing.name}</span>
              <span style={{ fontSize: 14, color: '#6B7280', fontWeight: 500 }}>{ing.quantity}</span>
            </div>
          ))}

          {showDetail.procedure && (
            <>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 20, marginBottom: 10 }}>
                Procedimiento
              </div>
              <p style={{ fontSize: 14, color: '#1A1A1A', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {showDetail.procedure}
              </p>
            </>
          )}

          {deleteConfirm ? (
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 14, color: '#DC2626', marginBottom: 12, textAlign: 'center' }}>
                ¿Segura que querés eliminar esta receta?
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setDeleteConfirm(false)}>
                  Cancelar
                </button>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete}>
                  Eliminar
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowEdit(showDetail)}>
                  Editar
                </button>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => setDeleteConfirm(true)}>
                  Eliminar
                </button>
              </div>
              <button className="btn btn-ghost" onClick={() => setShowDetail(null)}>
                Cerrar
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
