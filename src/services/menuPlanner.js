import callClaude from './claudeApi'
import { calcSlots } from '../utils/portions'

const DAYS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom']

export const generateWeeklyMenu = async ({ recipes, persons }) => {
  const slotsPerRecipe = recipes.map((r) => ({
    id: r.id,
    name: r.name,
    portions: r.portions,
    category: r.category,
    emoji: r.emoji,
    slots: calcSlots(r.portions, persons),
  }))

  const response = await callClaude({
    system: `Sos un asistente de planificación de comidas.
Respondé ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código.
El JSON debe tener exactamente esta estructura:
{
  "plan": {
    "lun": { "lunch": "recipe_id_o_null", "dinner": "recipe_id_o_null" },
    "mar": { "lunch": "recipe_id_o_null", "dinner": "recipe_id_o_null" },
    "mie": { "lunch": "recipe_id_o_null", "dinner": "recipe_id_o_null" },
    "jue": { "lunch": "recipe_id_o_null", "dinner": "recipe_id_o_null" },
    "vie": { "lunch": "recipe_id_o_null", "dinner": "recipe_id_o_null" },
    "sab": { "lunch": "recipe_id_o_null", "dinner": "recipe_id_o_null" },
    "dom": { "lunch": "recipe_id_o_null", "dinner": "recipe_id_o_null" }
  }
}`,
    messages: [
      {
        role: 'user',
        content: `Planificá una semana de almuerzos y cenas para ${persons} persona(s).

Recetas disponibles (con cuántas veces puede aparecer cada una en la semana según porciones/personas):
${JSON.stringify(slotsPerRecipe, null, 2)}

Reglas:
- Cada receta puede aparecer como máximo N veces (campo "slots")
- No repitas la misma receta dos días consecutivos
- Variá entre categorías a lo largo de la semana
- Si no hay suficientes recetas para los 14 slots, dejá algunos como null
- Usá los IDs exactos (campo "id") en el JSON de respuesta`,
      },
    ],
    maxTokens: 1000,
  })

  const raw = response.content[0].text.trim()
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  const parsed = JSON.parse(text)

  // Normalizar: asegurar que todos los días existan
  const plan = {}
  DAYS.forEach((day) => {
    plan[day] = {
      lunch: parsed.plan?.[day]?.lunch || null,
      dinner: parsed.plan?.[day]?.dinner || null,
    }
  })
  return plan
}
