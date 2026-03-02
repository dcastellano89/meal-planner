import { useState } from 'react'
import Header from '../components/layout/Header'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import useRecipes from '../hooks/useRecipes'
import usePlanner from '../hooks/usePlanner'
import { generateWeeklyMenu } from '../services/menuPlanner'
import { formatWeekRange } from '../utils/portions'

const DAYS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom']
const DAYS_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export default function PlannerPage({ household }) {
  const { recipes } = useRecipes(household.id)
  const { slots, loading, hasAnySlot, stats, weekStart, updateSlot, applyGeneratedPlan, clearPlan } = usePlanner(household.id)

  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [slotPicker, setSlotPicker] = useState(null)

  const handleGenerate = async () => {
    if (recipes.length < 1) return
    setGenerating(true)
    setGenerateError('')
    try {
      const generated = await generateWeeklyMenu({ recipes, persons: household.persons || 2 })
      await applyGeneratedPlan(generated, recipes)
    } catch (e) {
      setGenerateError('No se pudo generar el menú. Intentá de nuevo.')
    }
    setGenerating(false)
  }

  const handlePickRecipe = async (recipe) => {
    if (!slotPicker) return
    await updateSlot(slotPicker.day, slotPicker.mealType, recipe)
    setSlotPicker(null)
  }

  const handleClearSlot = async () => {
    if (!slotPicker) return
    await updateSlot(slotPicker.day, slotPicker.mealType, null)
    setSlotPicker(null)
  }

  if (loading) {
    return (
      <div className="screen">
        <Header title="Esta semana" subtitle="Cargando..." />
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#6B7280', fontSize: 14 }}>Cargando planificador...</div>
      </div>
    )
  }

  return (
    <div className="screen">
      <Header title="Esta semana" subtitle={formatWeekRange(weekStart)} />

      {/* Stats */}
      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-num">{stats.planned}</div>
          <div className="stat-label">planificadas</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.empty}</div>
          <div className="stat-label">sin asignar</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.recipes}</div>
          <div className="stat-label">recetas usadas</div>
        </div>
      </div>

      {/* Sin recetas cargadas */}
      {recipes.length === 0 && (
        <div style={{ padding: '0 20px' }}>
          <EmptyState
            icon="📖"
            title="Primero cargá recetas"
            text="Necesitás al menos una receta en tu biblioteca para planificar la semana."
          />
        </div>
      )}

      {/* Banner IA — sin plan todavía */}
      {recipes.length > 0 && !hasAnySlot && (
        <div style={{ padding: '0 20px' }}>
          {recipes.length < 3 && (
            <div style={{ background: '#FEF3C7', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#92400E' }}>
              ⚠️ Con pocas recetas el menú puede repetirse. Cargá al menos 3 para mejores resultados.
            </div>
          )}
          <div className="card" style={{ background: 'linear-gradient(135deg, #2D5016, #4A7C28)', border: 'none' }}>
            <div className="card-pad" style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🤖</div>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, color: 'white', fontWeight: 700, marginBottom: 8 }}>
                ¿Querés que la IA planifique tu semana?
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, marginBottom: 24 }}>
                Usará tus {recipes.length} recetas y distribuirá las porciones automáticamente para {household.persons || 2} persona(s).
              </p>
              {generateError && (
                <p style={{ fontSize: 13, color: '#FCA5A5', marginBottom: 16 }}>{generateError}</p>
              )}
              <button
                className="btn"
                onClick={handleGenerate}
                disabled={generating}
                style={{ background: 'white', color: '#2D5016', padding: '14px 24px', fontSize: 15, width: '100%', fontWeight: 700, borderRadius: 12 }}
              >
                {generating ? '✨ Generando menú...' : '✨ Sugerirme menú'}
              </button>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setSlotPicker({ day: 'lun', mealType: 'lunch' })}
            >
              Armar manualmente
            </button>
          </div>
        </div>
      )}

      {/* Grilla semanal */}
      {hasAnySlot && (
        <>
          <div style={{ padding: '0 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#6B7280' }}>Tocá un slot para cambiar</span>
            <button className="btn btn-secondary btn-sm" onClick={clearPlan}>Limpiar</button>
          </div>

          <div className="section-pad">
            <div className="week-grid">
              {DAYS.map((day, i) => (
                <div key={day} className="day-row">
                  <div className="day-header">{DAYS_FULL[i]}</div>
                  <div className="meal-slots">
                    {['lunch', 'dinner'].map((mealType) => {
                      const recipe = slots[day]?.[mealType]
                      return (
                        <div key={mealType} className="meal-slot" onClick={() => setSlotPicker({ day, mealType })}>
                          <div className="slot-label">{mealType === 'lunch' ? '🌤 Almuerzo' : '🌙 Cena'}</div>
                          {recipe ? (
                            <>
                              <div className="slot-recipe">{recipe.emoji} {recipe.name}</div>
                              <div className="slot-portions">{recipe.portions} porciones</div>
                            </>
                          ) : (
                            <div className="slot-empty">Sin asignar</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {generateError && (
            <p style={{ textAlign: 'center', fontSize: 13, color: '#DC2626', padding: '0 20px 8px' }}>{generateError}</p>
          )}
          <div style={{ padding: '8px 20px 16px' }}>
            <button className="btn btn-ghost" style={{ width: '100%' }} onClick={handleGenerate} disabled={generating}>
              {generating ? '✨ Generando...' : '✨ Regenerar con IA'}
            </button>
          </div>
        </>
      )}

      {/* Slot Picker Modal */}
      {slotPicker && (
        <Modal
          onClose={() => setSlotPicker(null)}
          title={`${DAYS_FULL[DAYS.indexOf(slotPicker.day)]} — ${slotPicker.mealType === 'lunch' ? 'Almuerzo' : 'Cena'}`}
        >
          {recipes.length === 0 ? (
            <p style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', padding: '24px 0' }}>
              No tenés recetas cargadas todavía.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recipes.map((r) => (
                <div key={r.id} className="recipe-card" onClick={() => handlePickRecipe(r)}>
                  <div className="recipe-emoji" style={{ width: 44, height: 44, fontSize: 24 }}>{r.emoji}</div>
                  <div className="recipe-info">
                    <div className="recipe-name">{r.name}</div>
                    <div className="recipe-meta">🍽️ {r.portions} porciones</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {slots[slotPicker.day]?.[slotPicker.mealType] && (
            <button className="btn btn-danger" style={{ width: '100%', marginTop: 16 }} onClick={handleClearSlot}>
              Quitar receta
            </button>
          )}
        </Modal>
      )}
    </div>
  )
}
