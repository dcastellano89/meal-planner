export default function EmptyState({ icon, title, text, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      <div className="empty-text">{text}</div>
      {action}
    </div>
  )
}
