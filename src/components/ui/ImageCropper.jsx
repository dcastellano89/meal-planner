import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'

const getCroppedBlob = (imageSrc, croppedAreaPixels) =>
  new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = croppedAreaPixels.width
      canvas.height = croppedAreaPixels.height
      canvas
        .getContext('2d')
        .drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        )
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9)
    }
    image.src = imageSrc
  })

export default function ImageCropper({ imageSrc, onConfirm, onCancel, aspect = 4 / 3 }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const onCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  const handleConfirm = async () => {
    const blob = await getCroppedBlob(imageSrc, croppedAreaPixels)
    const file = new File([blob], 'dish-photo.jpg', { type: 'image/jpeg' })
    onConfirm(file)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.92)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={onCancel}
          style={{ background: 'none', border: 'none', color: 'white', fontSize: 15, cursor: 'pointer', padding: '4px 8px' }}
        >
          Cancelar
        </button>
        <span style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>Recortá la foto</span>
        <button
          onClick={handleConfirm}
          style={{ background: '#6DB33F', border: 'none', color: 'white', fontSize: 14, fontWeight: 700, borderRadius: 20, padding: '6px 16px', cursor: 'pointer' }}
        >
          Usar
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: { background: 'transparent' },
          }}
        />
      </div>

      <div style={{ padding: '16px 24px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Pellizca para hacer zoom · Arrastrá para mover</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          style={{ width: '80%', accentColor: '#6DB33F' }}
        />
      </div>
    </div>
  )
}
