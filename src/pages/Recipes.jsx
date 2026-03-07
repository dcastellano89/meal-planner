import { useState, useEffect } from 'react'
import Header from '../components/layout/Header'
import RecipeCard from '../components/recipe/RecipeCard'
import CategoryFilter from '../components/recipe/CategoryFilter'
import RecipeForm from '../components/recipe/RecipeForm'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import Tag from '../components/ui/Tag'
import ThermomixIcon from '../components/ui/ThermomixIcon'
import useRecipes from '../hooks/useRecipes'
import { supabase } from '../supabase'

export default function RecipesPage({ household }) {
  const { recipes, loading, createRecipe, updateRecipe, deleteRecipe, toggleFavorite, ingredientSuggestions, refetch } = useRecipes(household.id)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(null)
  const [showDetail, setShowDetail] = useState(null)
  const [activeCategory, setActiveCategory] = useState('todas')
  const [activeDifficulty, setActiveDifficulty] = useState('todas')
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [visibleCount, setVisibleCount] = useState(20)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [syncState, setSyncState] = useState(null) // null | 'loading' | 'ok' | 'error' | 'no-collections'
  const [cookidooConnected, setCookidooConnected] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cookidoo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: 'status' }),
      })
        .then((r) => r.json())
        .then((d) => setCookidooConnected(!!d.connected))
        .catch(() => {})
    })
  }, [])

  const isCookidooView = activeCategory === 'cookidoo'
  const showCookidooTab = cookidooConnected || recipes.some((r) => r.source === 'cookidoo')

  const filtered = isCookidooView
    ? recipes.filter((r) => r.source === 'cookidoo')
    : recipes
        .filter((r) => r.source !== 'cookidoo')
        .filter((r) => activeCategory === 'todas' || r.category === activeCategory)
        .filter((r) => activeDifficulty === 'todas' || r.difficulty === activeDifficulty)
        .filter((r) => !onlyFavorites || r.is_favorite)

  const visibleRecipes = filtered.slice(0, visibleCount)
  const hasMore = filtered.length > visibleCount

  const handleFilterChange = (setter) => (value) => {
    setter(value)
    setVisibleCount(20)
  }

  const handleSyncCookidoo = async () => {
    setSyncState('loading')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cookidoo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: 'sync-cookidoo-recipes' }),
      })
      const data = await res.json()
      if (data.error) {
        setSyncState(data.error.includes('colecciones') ? 'no-collections' : 'error')
      } else {
        await refetch()
        setSyncState('ok')
        setTimeout(() => setSyncState(null), 3000)
      }
    } catch {
      setSyncState('error')
    }
  }

  const handleDelete = async () => {
    await deleteRecipe(showDetail.id)
    setShowDetail(null)
    setDeleteConfirm(false)
  }

  return (
    <div className="screen">
      <Header
        title="Mis Recetas"
        subtitle={loading ? 'Cargando...' : `${recipes.filter((r) => r.source !== 'cookidoo').length} receta${recipes.filter((r) => r.source !== 'cookidoo').length !== 1 ? 's' : ''} en tu biblioteca`}
      />

      {(recipes.length > 0 || showCookidooTab) && (
        <>
          <CategoryFilter
            active={activeCategory}
            onChange={handleFilterChange(setActiveCategory)}
            recipes={recipes}
            showCookidoo={showCookidooTab}
          />
          {!isCookidooView && (
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
                  onClick={() => handleFilterChange(setActiveDifficulty)(value)}
                >
                  {label}
                </button>
              ))}
              <button
                className={`pill-tab ${onlyFavorites ? 'active' : ''}`}
                onClick={() => { setOnlyFavorites((v) => !v); setVisibleCount(20) }}
              >
                ★ Favoritas {recipes.filter((r) => r.is_favorite && r.source !== 'cookidoo').length > 0 && `(${recipes.filter((r) => r.is_favorite && r.source !== 'cookidoo').length})`}
              </button>
            </div>
          )}
          {isCookidooView && (
            <div style={{ padding: '8px 20px' }}>
              <button
                className="btn btn-secondary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onClick={handleSyncCookidoo}
                disabled={syncState === 'loading'}
              >
                <ThermomixIcon size={16} />
                {syncState === 'loading' && 'Sincronizando...'}
                {syncState === 'ok' && '✓ Sincronizado'}
                {syncState === 'error' && 'Error al sincronizar'}
                {syncState === 'no-collections' && 'Sin colecciones seleccionadas'}
                {syncState === null && 'Sincronizar recetas de Cookidoo'}
              </button>
            </div>
          )}
        </>
      )}

      <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#6B7280', fontSize: 14 }}>
            Cargando recetas...
          </div>
        ) : filtered.length === 0 && recipes.filter((r) => r.source !== 'cookidoo').length === 0 && !isCookidooView ? (
          <EmptyState
            icon="📖"
            title="Tu biblioteca está vacía"
            text="Cargá tus primeras recetas para poder planificar la semana."
          />
        ) : filtered.length === 0 && isCookidooView ? (
          <EmptyState
            icon="🍲"
            title="Sin recetas sincronizadas"
            text="Tocá el botón de arriba para importar las recetas de tus colecciones Cookidoo."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🔍"
            title={`Sin recetas en esta categoría`}
            text="Agregá una receta con el botón +"
          />
        ) : (
          <>
            {visibleRecipes.map((r) => (
              <RecipeCard key={r.id} recipe={r} onClick={() => setShowDetail(r)} onToggleFavorite={toggleFavorite} />
            ))}
            {hasMore && (
              <button
                className="btn btn-ghost"
                style={{ width: '100%', marginTop: 4 }}
                onClick={() => setVisibleCount((n) => n + 20)}
              >
                Cargar más ({filtered.length - visibleCount} restantes)
              </button>
            )}
          </>
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
              {showDetail.source === 'cookidoo'
                ? <ThermomixIcon size={40} />
                : showDetail.emoji
              }
            </div>
            <div>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, color: '#1A1A1A' }}>
                {showDetail.name}
              </div>
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                🍽️ {showDetail.portions} porciones
              </div>
              {showDetail.source === 'cookidoo' && (
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ThermomixIcon size={11} /> Cookidoo
                </div>
              )}
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

          {showDetail.source === 'cookidoo' ? (
            <div style={{ marginTop: 20 }}>
              <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => { setShowDetail(null); setDeleteConfirm(false) }}>
                Cerrar
              </button>
            </div>
          ) : deleteConfirm ? (
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
