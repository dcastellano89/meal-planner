export default function Header({ title, subtitle }) {
  return (
    <div className="header">
      <div className="header-title">{title}</div>
      {subtitle && <div className="header-subtitle">{subtitle}</div>}
    </div>
  )
}
