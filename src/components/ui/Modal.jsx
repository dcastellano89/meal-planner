export default function Modal({ onClose, title, headerImage, children }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={headerImage ? { paddingTop: 0 } : {}}>
        {headerImage ? (
          <div style={{ position: 'relative', margin: '0 -20px 20px', height: 200, borderRadius: '24px 24px 0 0', overflow: 'hidden' }}>
            <img src={headerImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div className="modal-handle" style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.55)', margin: 0 }} />
          </div>
        ) : (
          <div className="modal-handle" />
        )}
        {title && <div className="modal-title">{title}</div>}
        {children}
      </div>
    </div>
  )
}
