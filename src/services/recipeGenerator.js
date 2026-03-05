import callClaude from './claudeApi'

const resizeForClaude = (file, maxPx = 1200) =>
  new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.9))
    }
    img.src = url
  })

export const detectIngredientsFromPhoto = async (imageFile) => {
  const base64url = await resizeForClaude(imageFile)
  const response = await callClaude({
    system: 'Sos un asistente de cocina. Analizá la imagen y listá todos los alimentos/ingredientes que puedas identificar. Respondé ÚNICAMENTE con un array JSON de strings, sin texto adicional. Ejemplo: ["pollo", "zanahoria", "cebolla"]',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64url.split(',')[1] } },
          { type: 'text', text: '¿Qué ingredientes ves en esta imagen?' },
        ],
      },
    ],
    maxTokens: 400,
  })
  const raw = response.content[0].text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  return JSON.parse(raw)
}

const FLEXIBILITY_PROMPT = {
  strict: 'Usá ÚNICAMENTE los ingredientes que te listo. No agregues ningún otro ingrediente.',
  some: 'Usá principalmente los ingredientes que te listo. Podés agregar pequeñas cantidades de condimentos básicos de despensa como sal, pimienta, aceite, ajo o cebolla si son necesarios.',
  free: 'Usá los ingredientes que te listo como base, pero podés agregar todos los ingredientes adicionales que quieras para crear un plato delicioso.',
}

const MEAL_TYPE_PROMPT = {
  'almuerzo-cena': 'plato principal para almuerzo o cena',
  snack: 'snack o merienda liviana',
  postre: 'postre o dulce',
}

export const generateRecipeFromIngredients = async (ingredients, { mealType, taste, temperature, difficulty, restrictions, flexibility, excludeNames = [] }) => {
  const flexPrompt = FLEXIBILITY_PROMPT[flexibility] || FLEXIBILITY_PROMPT.some
  const mealPrompt = mealType ? `El plato debe ser un ${MEAL_TYPE_PROMPT[mealType]}.` : ''
  const tastePrompt = taste ? `El plato debe ser ${taste}.` : ''
  const temperaturePrompt = temperature && temperature !== 'indistinto' ? `El plato debe servirse ${temperature}.` : ''
  const difficultyPrompt = difficulty ? `La dificultad de la receta debe ser ${difficulty}.` : ''
  const restrictionsPrompt = restrictions.length > 0
    ? `Restricciones obligatorias: ${restrictions.join(', ')}.`
    : ''

  const response = await callClaude({
    system: `Sos un chef creativo que genera recetas. ${flexPrompt}
${mealPrompt}
${tastePrompt}
${temperaturePrompt}
${difficultyPrompt}
${restrictionsPrompt}
Respondé ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código.
El JSON debe tener exactamente esta estructura:
{
  "name": "nombre del plato",
  "portions": 2,
  "emoji": "emoji apropiado",
  "category": "pollo|carnes|pescados|pastas|sopas|tartas|ensaladas|vegetariano|otros",
  "tags": ["tag1", "tag2"],
  "difficulty": "baja|media|alta",
  "ingredients": [
    { "name": "ingrediente", "quantity": "cantidad y unidad" }
  ],
  "procedure": "pasos detallados para preparar la receta"
}
Para difficulty: baja = menos de 5 ingredientes y preparación simple (menos de 30 min); media = 5-8 ingredientes o técnica moderada (30-60 min); alta = más de 8 ingredientes o técnica compleja (más de 60 min).`,
    messages: [
      {
        role: 'user',
        content: `Tengo estos ingredientes disponibles: ${ingredients}. Generá una receta.${excludeNames.length > 0 ? ` NO repitas estas recetas que ya generaste: ${excludeNames.join(', ')}.` : ''}`,
      },
    ],
    maxTokens: 1500,
    temperature: 1,
  })

  const raw = response.content[0].text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  return JSON.parse(raw)
}
