import { useState } from 'react'
import Modal from '../ui/Modal'
import ImageUploader from './ImageUploader'
import { CATEGORIES } from './CategoryFilter'

const EMOJIS = ['🍗', '🍝', '🥩', '🥚', '🫘', '🥗', '🍲', '🥘', '🌮', '🍛', '🥙', '🍜', '🥧', '🐟', '🍚']

const EMPTY_FORM = {
  name: '',
  portions: 2,
  emoji: '🍴',
  category: 'otros',
  tags: '',
  ingredients: [{ name: '', quantity: '' }],
  procedure: '',
}

export default function RecipeForm({ onSave, onClose, initialData = null }) {
  const [addTab, setAddTab] = useState('manual')
  const [form, setForm] = useState(
    initialData
      ? {
          ...initialData,
          tags: (initialData.tags || []).join(', '),
          ingredients: initialData.ingredients?.length
            ? initialData.ingredients.map((i) => ({ name: i.name, quantity: i.quantity }))
            : [{ name: '', quantity: '' }],
          procedure: initialData.procedure || '',
        }
      : EMPTY_FORM
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageError, setImageError] = useState('')

  const updateIng = (i, field, val) =>
    setForm((f) => {
      const ings = [...f.ingredients]
      ings[i] = { ...ings[i], [field]: val }
      return { ...f, ingredients: ings }
    })

  const addIngredient = () =>
    setForm((f) => ({ ...f, ingredients: [...f.ingredients, { name: '', quantity: '' }] }))

  const removeIng = (i) =>
    setForm((f) => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }))

  const handleSave = async () => {
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return }
    if (!form.ingredients.some((i) => i.name.trim())) { setError('Agregá al menos un ingrediente'); return }
    setLoading(true)
    setError('')
    try {
      await onSave({
        name: form.name.trim(),
        portions: form.portions,
        emoji: form.emoji,
        category: form.category,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        ingredients: form.ingredients.filter((i) => i.name.trim()),
        procedure: form.procedure.trim() || null,
      })
      onClose()
    } catch (e) {
      setError(e.message || 'Error al guardar la receta')
    }
    setLoading(false)
  }

  const handleImageExtracted = (data) => {
    setForm({
      name: data.name || '',
      portions: data.portions || 2,
      emoji: data.emoji || '🍴',
      category: data.category || 'otros',
      tags: (data.tags || []).join(', '),
      ingredients: data.ingredients?.length
        ? data.ingredients.map((i) => ({ name: i.name, quantity: i.quantity }))
        : [{ name: '', quantity: '' }],
      procedure: data.procedure || '',
    })
    setAddTab('review')
  }

  return (
    <Modal onClose={onClose} title={initialData ? 'Editar receta' : 'Nueva receta'}>
      {!initialData && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            className={`btn btn-sm ${addTab === 'manual' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setAddTab('manual')}
            style={{ flex: 1 }}
          >
            ✏️ Manual
          </button>
          <button
            className={`btn btn-sm ${addTab === 'image' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setAddTab('image')}
            style={{ flex: 1 }}
          >
            📸 Desde imagen
          </button>
        </div>
      )}

      {addTab === 'image' && (
        <>
          {imageError && (
            <div style={{ background: '#FEE2E2', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span>⚠️</span>
              <div>
                <p style={{ fontSize: 13, color: '#DC2626', marginBottom: 8 }}>{imageError}</p>
                <button className="btn btn-sm btn-ghost" onClick={() => { setImageError(''); setAddTab('manual') }}>Cargar manualmente</button>
              </div>
            </div>
          )}
          <ImageUploader onExtracted={handleImageExtracted} onError={setImageError} />
        </>
      )}

      {(addTab === 'manual' || addTab === 'review') && (
        <>
          {addTab === 'review' && (
            <div style={{ background: '#E8F5D0', borderRadius: 12, padding: '10px 14px', marginBottom: 20, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 18 }}>✨</span>
              <span style={{ fontSize: 13, color: '#2D5016', fontWeight: 500 }}>Receta extraída. Revisá y corregí si es necesario.</span>
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Nombre de la receta *</label>
            <input
              className="input-field"
              placeholder="Ej: Pollo al horno"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Categoría *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CATEGORIES.filter((c) => c.id !== 'todas').map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setForm((f) => ({ ...f, category: cat.id }))}
                  style={{
                    padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: `1.5px solid ${form.category === cat.id ? '#2D5016' : '#E8EDE0'}`,
                    background: form.category === cat.id ? '#E8F5D0' : 'white',
                    color: form.category === cat.id ? '#2D5016' : '#6B7280',
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Emoji</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                  style={{
                    width: 40, height: 40, fontSize: 22,
                    background: form.emoji === e ? '#E8F5D0' : 'white',
                    border: `2px solid ${form.emoji === e ? '#2D5016' : '#E8EDE0'}`,
                    borderRadius: 10, cursor: 'pointer',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Porciones que rinde *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  onClick={() => setForm((f) => ({ ...f, portions: n }))}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                    border: `2px solid ${form.portions === n ? '#2D5016' : '#E8EDE0'}`,
                    background: form.portions === n ? '#E8F5D0' : 'white',
                    color: form.portions === n ? '#2D5016' : '#6B7280',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Tags (separados por coma)</label>
            <input
              className="input-field"
              placeholder="rápido, vegetariano, con pollo..."
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Ingredientes *</label>
            {form.ingredients.map((ing, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  className="input-field"
                  placeholder="Ingrediente"
                  value={ing.name}
                  onChange={(e) => updateIng(i, 'name', e.target.value)}
                  style={{ flex: 2 }}
                />
                <input
                  className="input-field"
                  placeholder="Cantidad"
                  value={ing.quantity}
                  onChange={(e) => updateIng(i, 'quantity', e.target.value)}
                  style={{ flex: 1 }}
                />
                {form.ingredients.length > 1 && (
                  <button onClick={() => removeIng(i)} style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: 18, cursor: 'pointer', padding: '0 4px' }}>×</button>
                )}
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={addIngredient} style={{ marginTop: 4 }}>
              + Agregar ingrediente
            </button>
          </div>

          <div className="input-group">
            <label className="input-label">Procedimiento <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(opcional)</span></label>
            <textarea
              className="input-field"
              placeholder="Describí los pasos para preparar esta receta..."
              value={form.procedure}
              onChange={(e) => setForm((f) => ({ ...f, procedure: e.target.value }))}
              rows={5}
              style={{ resize: 'vertical', lineHeight: 1.6 }}
            />
          </div>

          {error && <p style={{ fontSize: 13, color: '#DC2626', marginBottom: 12 }}>{error}</p>}

          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar receta'}
          </button>
        </>
      )}
    </Modal>
  )
}
