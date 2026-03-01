import Header from '../components/layout/Header'
import EmptyState from '../components/ui/EmptyState'

export default function PlannerPage({ household }) {
  return (
    <div className="screen">
      <Header title="Esta semana" subtitle="Lunes — Domingo" />
      <EmptyState
        icon="📅"
        title="Planificador próximamente"
        text="El planificador semanal con IA estará disponible en la próxima actualización."
      />
    </div>
  )
}
