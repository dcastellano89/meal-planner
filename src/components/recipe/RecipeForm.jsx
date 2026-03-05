import { useState, useRef } from 'react'
import Modal from '../ui/Modal'
import ImageUploader from './ImageUploader'
import ImageCropper from '../ui/ImageCropper'
import { CATEGORIES } from './CategoryFilter'

const EMOJIS = ['🍗', '🍝', '🥩', '🥚', '🫘', '🥗', '🍲', '🥘', '🌮', '🍛', '🥙', '🍜', '🥧', '🐟', '🍚']

const DIFFICULTY_OPTIONS = [
  { value: 'baja', label: '🟢 Fácil' },
  { value: 'media', label: '🟡 Media' },
  { value: 'alta', label: '🔴 Difícil' },
]

const EMPTY_FORM = {
  name: '',
  portions: 2,
  emoji: '🍴',
  category: 'otros',
  difficulty: 'media',
  tags: [],
  ingredients: [{ name: '', quantity: '' }],
  procedure: '',
}

export default function RecipeForm({ onSave, onClose, initialData = null, suggestions = [] }) {
  const [addTab, setAddTab] = useState('manual')
  const [form, setForm] = useState(
    initialData
      ? {
          ...initialData,
          difficulty: initialData.difficulty || 'media',
          tags: initialData.tags || [],
          ingredients: initialData.ingredients?.length
            ? initialData.ingredients.map((i) => ({ name: i.name, quantity: i.quantity }))
            : [{ name: '', quantity: '' }],
          procedure: initialData.procedure || '',
        }
      : EMPTY_FORM
  )
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageError, setImageError] = useState('')
  const [dishPhotoFile, setDishPhotoFile] = useState(null)
  const [dishPhotoPreview, setDishPhotoPreview] = useState(initialData?.dish_photo_url || null)
  const [removeDishPhoto, setRemoveDishPhoto] = useState(false)
  const [cropperSrc, setCropperSrc] = useState(null)
  const photoInputRef = useRef()

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
        difficulty: form.difficulty,
        tags: form.tags,
        ingredients: form.ingredients.filter((i) => i.name.trim()),
        procedure: form.procedure.trim() || null,
        dishPhotoFile: dishPhotoFile || null,
        removeDishPhoto,
        currentDishPhotoUrl: initialData?.dish_photo_url || null,
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
      difficulty: data.difficulty || 'media',
      tags: data.tags || [],
      ingredients: data.ingredients?.length
        ? data.ingredients.map((i) => ({ name: i.name, quantity: i.quantity }))
        : [{ name: '', quantity: '' }],
      procedure: data.procedure || '',
    })
    setAddTab('review')
  }

  const handleManualPhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCropperSrc(URL.createObjectURL(file))
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  const handleCropConfirm = (croppedFile) => {
    setDishPhotoFile(croppedFile)
    setDishPhotoPreview(URL.createObjectURL(croppedFile))
    setRemoveDishPhoto(false)
    setCropperSrc(null)
  }

  const handleRemovePhoto = () => {
    setDishPhotoFile(null)
    setDishPhotoPreview(null)
    setRemoveDishPhoto(true)
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  return (
    <>
    {cropperSrc && (
      <ImageCropper
        imageSrc={cropperSrc}
        onConfirm={handleCropConfirm}
        onCancel={() => setCropperSrc(null)}
      />
    )}
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
            <label className="input-label">Dificultad</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {DIFFICULTY_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setForm((f) => ({ ...f, difficulty: value }))}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    border: `2px solid ${form.difficulty === value ? '#2D5016' : '#E8EDE0'}`,
                    background: form.difficulty === value ? '#E8F5D0' : 'white',
                    color: form.difficulty === value ? '#2D5016' : '#6B7280',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Tags</label>
            {form.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {form.tags.map((t) => (
                  <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#E8F5D0', color: '#2D5016', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20 }}>
                    {t}
                    <button
                      onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }))}
                      style={{ background: 'none', border: 'none', color: '#2D5016', fontSize: 14, cursor: 'pointer', padding: 0, lineHeight: 1, opacity: 0.7 }}
                    >×</button>
                  </span>
                ))}
              </div>
            )}
            <input
              className="input-field"
              placeholder="Escribí un tag y presioná Enter..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                  e.preventDefault()
                  const newTag = tagInput.trim().replace(/,$/, '')
                  if (newTag && !form.tags.includes(newTag))
                    setForm((f) => ({ ...f, tags: [...f.tags, newTag] }))
                  setTagInput('')
                }
              }}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Ingredientes *</label>
            {suggestions.length > 0 && (
              <datalist id="ingredient-suggestions">
                {suggestions.map((s) => <option key={s} value={s} />)}
              </datalist>
            )}
            {form.ingredients.map((ing, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  className="input-field"
                  placeholder="Ingrediente"
                  value={ing.name}
                  onChange={(e) => updateIng(i, 'name', e.target.value)}
                  list={suggestions.length > 0 ? 'ingredient-suggestions' : undefined}
                  style={{ flex: 2 }}
                />
                <input
                  className="input-field"
                  placeholder="Cantidad (opcional)"
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

          <div className="input-group">
            <label className="input-label">Foto del plato <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(opcional)</span></label>
            {dishPhotoPreview ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={dishPhotoPreview}
                  alt="Foto del plato"
                  style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 12, display: 'block' }}
                />
                <button
                  onClick={handleRemovePhoto}
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'rgba(0,0,0,0.55)', color: 'white', border: 'none',
                    borderRadius: '50%', width: 28, height: 28, fontSize: 16,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >×</button>
              </div>
            ) : (
              <div
                style={{ border: '2px dashed #C5E89A', borderRadius: 12, padding: '24px 16px', textAlign: 'center', background: '#F9FBF5', cursor: 'pointer' }}
                onClick={() => photoInputRef.current?.click()}
              >
                <div style={{ fontSize: 32, marginBottom: 6 }}>📷</div>
                <p style={{ fontSize: 13, color: '#6B7280' }}>Tocá para subir foto del plato terminado</p>
                <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleManualPhotoChange} />
              </div>
            )}
          </div>

          {error && <p style={{ fontSize: 13, color: '#DC2626', marginBottom: 12 }}>{error}</p>}

          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar receta'}
          </button>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading} style={{ marginTop: 8 }}>
            Cancelar
          </button>
        </>
      )}
    </Modal>
    </>
  )
}
