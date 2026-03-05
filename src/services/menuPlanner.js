import callClaude from './claudeApi'
import { calcSlots } from '../utils/portions'

const DEFAULT_ACTIVE_DAYS = ['lun', 'mar', 'mie', 'jue', 'vie']

export const generateWeeklyMenu = async ({ recipes, persons, activeDays = DEFAULT_ACTIVE_DAYS, preferences = null }) => {
  const totalSlots = activeDays.length * 2

  const mainRecipes = recipes.filter((r) => r.category !== 'postre' && r.category !== 'snack')
  const snackRecipes = recipes.filter((r) => r.category === 'postre' || r.category === 'snack')

  const slotsPerRecipe = mainRecipes.map((r) => ({
    id: r.id,
    name: r.name,
    portions: r.portions,
    category: r.category,
    emoji: r.emoji,
    slots: calcSlots(r.portions, persons),
  }))

  const dayStructure = activeDays
    .map((d) => `    "${d}": { "lunch": "recipe_id_o_null", "dinner": "recipe_id_o_null" }`)
    .join(',\n')

  const includeSnacks = preferences?.includeSnacks === true
  const snackSection = includeSnacks && snackRecipes.length > 0
    ? `\n\nTambién sugerí entre 1 y 3 recetas de postre/snack para tener en la semana (sin asignarles día), eligiendo de esta lista:\n${JSON.stringify(snackRecipes.map((r) => ({ id: r.id, name: r.name, emoji: r.emoji, category: r.category })), null, 2)}\nAgregá el campo "extras" al JSON con un array de IDs. Si no hay disponibles, dejá "extras": [].`
    : ''

  const extrasStructure = includeSnacks ? ',\n  "extras": ["recipe_id_1", "recipe_id_2"]' : ''

  const response = await callClaude({
    system: `Sos un asistente de planificación de comidas.
Respondé ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código.
El JSON debe tener exactamente esta estructura:
{
  "plan": {
${dayStructure}
  }${extrasStructure}
}`,
    messages: [
      {
        role: 'user',
        content: `Planificá almuerzos y cenas para ${persons} persona(s) durante ${activeDays.length} días (${activeDays.join(', ')}).

Recetas disponibles con su frecuencia de uso requerida (campo "slots"):
${JSON.stringify(slotsPerRecipe, null, 2)}

El campo "slots" indica cuántas comidas rinde UNA SOLA cocción de esa receta para ${persons} persona(s).
Ejemplo: slots=2 significa que cocinás esa receta UNA vez y alcanza para 2 comidas distintas de la semana.

Reglas ESTRICTAS:
- Planificá SOLO los días: ${activeDays.join(', ')}
- Cada receta debe aparecer en el plan EXACTAMENTE tantas veces como su campo "slots" indica. Ni más ni menos.
- Si el total de slots de todas las recetas supera los ${totalSlots} disponibles, priorizá las recetas con más slots y dejá las de menor slots fuera o reducí su aparición
- Si el total es menor que ${totalSlots}, algunos slots quedan como null
- No repitas la misma receta en días consecutivos
- Variá entre categorías a lo largo de la semana
- Usá los IDs exactos (campo "id") en el JSON de respuesta${preferences ? `

Preferencias de esta semana:
${preferences.fridge ? `- Ingredientes disponibles en heladera: ${preferences.fridge}` : ''}
${preferences.specific ? `- Receta o comida que quiere incluir: ${preferences.specific}` : ''}
- Dificultad deseada: ${preferences.difficulty === 'baja' ? 'fácil (solo recetas fáciles o simples)' : preferences.difficulty === 'alta' ? 'elaborado (recetas más complejas)' : 'mix (variedad de dificultades)'}

Reglas adicionales por las preferencias:
- Si indicó ingredientes en heladera, priorizá recetas que los usen
- Si mencionó una receta o tipo de comida específico, incluíla
- Respetá la dificultad deseada en la medida de lo posible` : ''}${snackSection}`,
      },
    ],
    maxTokens: 1200,
  })

  const raw = response.content[0].text.trim()
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  const parsed = JSON.parse(text)

  // Normalizar: solo los días activos
  const plan = {}
  activeDays.forEach((day) => {
    plan[day] = {
      lunch: parsed.plan?.[day]?.lunch || null,
      dinner: parsed.plan?.[day]?.dinner || null,
    }
  })

  if (includeSnacks) {
    plan.extras = (parsed.extras || []).filter(Boolean)
  }

  return plan
}
