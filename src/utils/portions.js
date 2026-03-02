/**
 * Calcula cuántas veces una receta puede aparecer en la semana
 * según las porciones que rinde y el número de personas del hogar.
 *
 * Ejemplo: receta rinde 4 porciones, 2 personas → aparece 2 veces
 * Ejemplo: receta rinde 3 porciones, 1 persona  → aparece 3 veces
 * Ejemplo: receta rinde 2 porciones, 3 personas → aparece 1 vez (mínimo 1)
 */
export const calcSlots = (portions, persons) =>
  Math.max(1, Math.floor(portions / Math.max(1, persons)))

/**
 * Devuelve el lunes de la semana actual en formato YYYY-MM-DD
 */
export const getWeekStart = () => {
  const d = new Date()
  const day = d.getDay() // 0=Dom, 1=Lun, ..., 6=Sab
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  return monday.toISOString().split('T')[0]
}

/**
 * Formatea el rango de la semana para mostrar en el header
 */
export const formatWeekRange = (weekStart) => {
  const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(weekStart + 'T00:00:00')
  end.setDate(end.getDate() + 6)
  return `${start.getDate()} — ${end.getDate()} de ${MONTHS[end.getMonth()]}`
}
