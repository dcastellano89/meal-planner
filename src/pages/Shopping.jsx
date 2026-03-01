import Header from '../components/layout/Header'
import EmptyState from '../components/ui/EmptyState'

export default function ShoppingPage({ household }) {
  return (
    <div className="screen">
      <Header title="Lista de compras" subtitle="Generada del planificador" />
      <EmptyState
        icon="🛒"
        title="Tu lista está vacía"
        text="Planificá tu semana primero para que se genere la lista de compras automáticamente."
      />
    </div>
  )
}
