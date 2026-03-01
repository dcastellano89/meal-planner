import { useState, useRef } from 'react'
import { extractRecipeFromImages } from '../../services/recipeExtractor'

export default function ImageUploader({ onExtracted, onError }) {
  const [files, setFiles] = useState([])
  const [step, setStep] = useState('upload') // 'upload' | 'analyzing' | 'done'
  const inputRef = useRef()

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files).slice(0, 5)
    setFiles(selected)
  }

  const handleAnalyze = async () => {
    if (!files.length) return
    setStep('analyzing')
    try {
      const recipe = await extractRecipeFromImages(files)
      setStep('done')
      onExtracted(recipe)
    } catch (err) {
      setStep('upload')
      onError(err.message || 'No pudimos leer la receta. Intentá con otra imagen o cargala manualmente.')
    }
  }

  if (step === 'analyzing') {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
        <p style={{ fontSize: 16, fontWeight: 600, color: '#1A1A1A', marginBottom: 8 }}>Analizando imágenes...</p>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 32 }}>La IA está extrayendo los datos de tu receta</p>
        <div style={{ background: '#E8F5D0', borderRadius: 12, padding: 16, textAlign: 'left' }}>
          {['Detectando nombre de la receta...', 'Extrayendo ingredientes...', 'Identificando cantidades...', 'Calculando porciones...'].map((t, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid #E8EDE0' : 'none' }}>
              <span style={{ color: '#16A34A', fontSize: 16 }}>✓</span>
              <span style={{ fontSize: 13, color: '#6B7280' }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        style={{ border: '2px dashed #C5E89A', borderRadius: 16, padding: '40px 20px', textAlign: 'center', marginBottom: 20, background: '#E8F5D0', cursor: 'pointer' }}
        onClick={() => inputRef.current?.click()}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#2D5016', marginBottom: 8 }}>Subí tus screenshots</p>
        <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
          Podés subir hasta 5 imágenes de la misma receta (Instagram, libros, webs...)
        </p>
        <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFiles} />
      </div>

      {files.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {files.map((f, i) => (
            <div key={i} style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', border: '2px solid #C5E89A', flexShrink: 0 }}>
              <img src={URL.createObjectURL(f)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={handleAnalyze}
        disabled={!files.length}
        style={{ opacity: files.length ? 1 : 0.5 }}
      >
        {files.length ? `Analizar ${files.length} imagen${files.length > 1 ? 'es' : ''} con IA ✨` : 'Seleccioná imágenes primero'}
      </button>
    </>
  )
}
