import { useState, useRef } from 'react'
import Header from '../components/layout/Header'
import Tag from '../components/ui/Tag'
import { generateRecipeFromIngredients, detectIngredientsFromPhoto } from '../services/recipeGenerator'
import useRecipes from '../hooks/useRecipes'

const MEAL_TYPES = [
  { id: 'almuerzo-cena', label: '🍽️ Almuerzo/Cena' },
  { id: 'snack', label: '🥪 Snack' },
  { id: 'postre', label: '🍮 Postre' },
]

const TASTE = [
  { id: 'salado', label: '🧂 Salado' },
  { id: 'dulce', label: '🍬 Dulce' },
]

const TEMPERATURE = [
  { id: 'frío', label: '🧊 Frío' },
  { id: 'caliente', label: '🔥 Caliente' },
  { id: 'indistinto', label: '🤷 Indistinto' },
]

const RESTRICTIONS = [
  { id: 'saludable', label: '🥗 Saludable' },
  { id: 'vegano', label: '🌱 Vegano' },
  { id: 'sin gluten', label: '🌾 Sin gluten' },
  { id: 'vegetariano', label: '🌿 Vegetariano' },
]

const FLEXIBILITY = [
  { id: 'strict', label: 'Solo lo que tengo', desc: 'Sin agregar nada extra' },
  { id: 'some', label: 'Con condimentos básicos', desc: 'Sal, aceite, ajo...' },
  { id: 'free', label: 'Libre creatividad', desc: 'Puede agregar lo que quiera' },
]

const DIFFICULTY = [
  { id: 'baja', label: '🟢 Baja' },
  { id: 'media', label: '🟡 Media' },
  { id: 'alta', label: '🔴 Alta' },
]

const DIFFICULTY_ICON = { baja: '🟢', media: '🟡', alta: '🔴' }

export default function GeneratorPage({ household, onTabChange }) {
  const { createRecipe } = useRecipes(household.id)
  const [ingredients, setIngredients] = useState('')
  const [mealType, setMealType] = useState(null)
  const [restrictions, setRestrictions] = useState([])
  const [taste, setTaste] = useState(null)
  const [temperature, setTemperature] = useState(null)
  const [difficulty, setDifficulty] = useState(null)
  const [flexibility, setFlexibility] = useState('some')
  const [step, setStep] = useState('input') // 'input' | 'generating' | 'result' | 'error'
  const [result, setResult] = useState(null)
  const [generatedNames, setGeneratedNames] = useState([])
  const [error, setError] = useState('')
  const [detectingPhoto, setDetectingPhoto] = useState(false)
  const photoInputRef = useRef()

  const toggleRestriction = (id) =>
    setRestrictions((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id])

  const handlePhotoDetect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setDetectingPhoto(true)
    try {
      const detected = await detectIngredientsFromPhoto(file)
      const current = ingredients.trim()
      const joined = current
        ? [...new Set([...current.split(',').map((s) => s.trim()), ...detected])].join(', ')
        : detected.join(', ')
      setIngredients(joined)
    } catch {
      // silently fail, user can still type manually
    }
    setDetectingPhoto(false)
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  const handleGenerate = async () => {
    if (!ingredients.trim()) return
    setStep('generating')
    setError('')
    try {
      const recipe = await generateRecipeFromIngredients(ingredients, { mealType, taste, temperature, difficulty, restrictions, flexibility, excludeNames: generatedNames })
      setResult(recipe)
      setGeneratedNames((prev) => [...prev, recipe.name])
      setStep('result')
    } catch (err) {
      setError(err.message || 'No se pudo generar la receta. Intentá de nuevo.')
      setStep('error')
    }
  }

  const handleSave = async () => {
    await createRecipe({
      name: result.name,
      portions: result.portions,
      emoji: result.emoji,
      category: result.category,
      tags: result.tags || [],
      difficulty: result.difficulty,
      ingredients: result.ingredients,
      procedure: result.procedure,
      dishPhotoFile: null,
    })
    setStep('input')
    setResult(null)
    setIngredients('')
    onTabChange('recipes')
  }

  if (step === 'generating') {
    return (
      <div className="screen">
        <Header title="¿Qué cocino hoy?" subtitle="Generando tu receta..." />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '48px 24px', gap: 20 }}>
          <div style={{ fontSize: 64 }}>🧑‍🍳</div>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', textAlign: 'center' }}>
            Claude está creando tu receta...
          </p>
          <p style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 1.6 }}>
            Analizando ingredientes y pensando en algo delicioso
          </p>
          <div style={{ background: '#E8F5D0', borderRadius: 12, padding: 16, width: '100%', maxWidth: 320 }}>
            {['Revisando ingredientes...', 'Pensando combinaciones...', 'Calculando porciones...', 'Redactando procedimiento...'].map((t, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid #E8EDE0' : 'none' }}>
                <span style={{ color: '#16A34A', fontSize: 16 }}>✓</span>
                <span style={{ fontSize: 13, color: '#6B7280' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (step === 'result' && result) {
    return (
      <div className="screen">
        <Header title="¿Qué cocino hoy?" subtitle="Tu receta generada" />
        <div style={{ padding: '16px 20px 100px', overflowY: 'auto', flex: 1 }}>
          <div style={{ background: '#E8F5D0', borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 48, background: 'white', borderRadius: 12, width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {result.emoji}
              </div>
              <div>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700, color: '#1A1A1A' }}>
                  {result.name}
                </div>
                <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                  🍽️ {result.portions} porciones · {DIFFICULTY_ICON[result.difficulty]} {result.difficulty}
                </div>
              </div>
            </div>
            {result.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {result.tags.map((t) => <Tag key={t}>{t}</Tag>)}
              </div>
            )}
          </div>

          <div style={{ fontWeight: 700, fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
            Ingredientes
          </div>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E8EDE0', marginBottom: 20, overflow: 'hidden' }}>
            {result.ingredients?.map((ing, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < result.ingredients.length - 1 ? '1px solid #E8EDE0' : 'none' }}>
                <span style={{ fontSize: 14, color: '#1A1A1A' }}>{ing.name}</span>
                <span style={{ fontSize: 14, color: '#6B7280', fontWeight: 500 }}>{ing.quantity}</span>
              </div>
            ))}
          </div>

          <div style={{ fontWeight: 700, fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
            Procedimiento
          </div>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E8EDE0', padding: 16, marginBottom: 24 }}>
            <p style={{ fontSize: 14, color: '#1A1A1A', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
              {result.procedure}
            </p>
          </div>

          <button className="btn btn-primary" onClick={handleSave} style={{ marginBottom: 10 }}>
            Guardar en mi biblioteca
          </button>
          <button className="btn btn-ghost" onClick={handleGenerate} style={{ marginBottom: 8 }}>
            ↻ Nueva opción (mismos filtros)
          </button>
          <button className="btn btn-ghost" onClick={() => { setStep('input'); setResult(null) }}>
            ✏️ Ajustar filtros y regenerar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <Header title="¿Qué cocino hoy?" subtitle="Generá una receta con lo que tenés" />
      <div style={{ padding: '16px 20px 100px', overflowY: 'auto', flex: 1 }}>

        {/* Ingredientes */}
        <div className="input-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label className="input-label" style={{ margin: 0 }}>¿Qué ingredientes tenés?</label>
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={detectingPhoto}
              style={{
                background: '#E8F5D0', border: 'none', borderRadius: 20, padding: '5px 12px',
                fontSize: 12, fontWeight: 600, color: '#2D5016', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
                opacity: detectingPhoto ? 0.6 : 1,
              }}
            >
              {detectingPhoto ? '🔍 Detectando...' : '📷 Foto de heladera'}
            </button>
            <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoDetect} />
          </div>
          <textarea
            className="input-field"
            placeholder="Ej: pollo, papas, cebolla, crema, ajo, tomate..."
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            rows={3}
            style={{ resize: 'none', lineHeight: 1.6 }}
          />
          {detectingPhoto && (
            <p style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>
              Claude está identificando ingredientes de la foto...
            </p>
          )}
        </div>

        {/* Tipo de comida */}
        <div className="input-group">
          <label className="input-label">Tipo de comida <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(opcional)</span></label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {MEAL_TYPES.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setMealType(mealType === id ? null : id)}
                style={{
                  padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: `2px solid ${mealType === id ? '#2D5016' : '#E8EDE0'}`,
                  background: mealType === id ? '#E8F5D0' : 'white',
                  color: mealType === id ? '#2D5016' : '#6B7280',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Dulce / Salado */}
        <div className="input-group">
          <label className="input-label">¿Dulce o salado? <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(opcional)</span></label>
          <div style={{ display: 'flex', gap: 8 }}>
            {TASTE.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTaste(taste === id ? null : id)}
                style={{
                  padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: `2px solid ${taste === id ? '#2D5016' : '#E8EDE0'}`,
                  background: taste === id ? '#E8F5D0' : 'white',
                  color: taste === id ? '#2D5016' : '#6B7280',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Frío / Caliente */}
        <div className="input-group">
          <label className="input-label">Temperatura <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(opcional)</span></label>
          <div style={{ display: 'flex', gap: 8 }}>
            {TEMPERATURE.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTemperature(temperature === id ? null : id)}
                style={{
                  padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: `2px solid ${temperature === id ? '#2D5016' : '#E8EDE0'}`,
                  background: temperature === id ? '#E8F5D0' : 'white',
                  color: temperature === id ? '#2D5016' : '#6B7280',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Dificultad */}
        <div className="input-group">
          <label className="input-label">Dificultad <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(opcional)</span></label>
          <div style={{ display: 'flex', gap: 8 }}>
            {DIFFICULTY.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setDifficulty(difficulty === id ? null : id)}
                style={{
                  padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: `2px solid ${difficulty === id ? '#2D5016' : '#E8EDE0'}`,
                  background: difficulty === id ? '#E8F5D0' : 'white',
                  color: difficulty === id ? '#2D5016' : '#6B7280',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Restricciones */}
        <div className="input-group">
          <label className="input-label">Restricciones <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(opcional)</span></label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {RESTRICTIONS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => toggleRestriction(id)}
                style={{
                  padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: `2px solid ${restrictions.includes(id) ? '#2D5016' : '#E8EDE0'}`,
                  background: restrictions.includes(id) ? '#E8F5D0' : 'white',
                  color: restrictions.includes(id) ? '#2D5016' : '#6B7280',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Flexibilidad */}
        <div className="input-group">
          <label className="input-label">Ingredientes extra que puede usar</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FLEXIBILITY.map(({ id, label, desc }) => (
              <button
                key={id}
                onClick={() => setFlexibility(id)}
                style={{
                  padding: '12px 16px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  border: `2px solid ${flexibility === id ? '#2D5016' : '#E8EDE0'}`,
                  background: flexibility === id ? '#E8F5D0' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: flexibility === id ? '#2D5016' : '#1A1A1A' }}>{label}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{desc}</div>
                </div>
                {flexibility === id && <span style={{ color: '#2D5016', fontSize: 18 }}>✓</span>}
              </button>
            ))}
          </div>
        </div>

        {step === 'error' && (
          <div style={{ background: '#FEE2E2', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#DC2626' }}>{error}</p>
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={!ingredients.trim()}
          style={{ opacity: ingredients.trim() ? 1 : 0.5 }}
        >
          Generar receta ✨
        </button>
      </div>
    </div>
  )
}
