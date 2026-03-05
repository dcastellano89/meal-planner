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

export const extractRecipeFromImages = async (imageFiles) => {
  const imageContents = await Promise.all(
    imageFiles.map(async (file) => {
      const base64url = await resizeForClaude(file)
      return {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: base64url.split(',')[1],
        },
      }
    })
  )

  const response = await callClaude({
    system: `Sos un asistente que extrae recetas de imágenes.
Respondé ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código.
El JSON debe tener exactamente esta estructura:
{
  "name": "nombre de la receta",
  "portions": 2,
  "emoji": "emoji apropiado para la receta",
  "category": "pollo|carnes|pescados|pastas|sopas|tartas|ensaladas|vegetariano|otros",
  "tags": ["tag1", "tag2"],
  "ingredients": [
    { "name": "nombre del ingrediente", "quantity": "cantidad y unidad" }
  ],
  "difficulty": "baja|media|alta",
  "procedure": "pasos para preparar la receta"
}
Si no podés identificar algún campo, usá valores razonables por defecto.
Para portions, estimá según la cantidad de ingredientes.
Para category, elegí la más apropiada según los ingredientes principales.
Para emoji, elegí uno que represente bien el plato.
Para difficulty: baja = menos de 5 ingredientes y preparación simple (menos de 30 min); media = 5-8 ingredientes o técnica moderada (30-60 min); alta = más de 8 ingredientes o técnica compleja (más de 60 min).
Para procedure: si la imagen contiene los pasos de preparación, extraelos. Si no están en la imagen, generá un procedimiento detallado y razonable basado en el nombre y los ingredientes identificados. Siempre incluí el procedimiento.`,
    messages: [
      {
        role: 'user',
        content: [
          ...imageContents,
          { type: 'text', text: 'Extraé la receta de estas imágenes y respondé solo con el JSON.' },
        ],
      },
    ],
    maxTokens: 1500,
  })

  const raw = response.content[0].text.trim()
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  return JSON.parse(text)
}
