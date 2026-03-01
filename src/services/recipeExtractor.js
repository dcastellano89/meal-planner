import callClaude from './claudeApi'

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

export const extractRecipeFromImages = async (imageFiles) => {
  const imageContents = await Promise.all(
    imageFiles.map(async (file) => {
      const base64 = await fileToBase64(file)
      return {
        type: 'image',
        source: {
          type: 'base64',
          media_type: file.type,
          data: base64.split(',')[1],
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
  ]
}
Si no podés identificar algún campo, usá valores razonables por defecto.
Para portions, estimá según la cantidad de ingredientes.
Para category, elegí la más apropiada según los ingredientes principales.
Para emoji, elegí uno que represente bien el plato.`,
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

  const text = response.content[0].text.trim()
  return JSON.parse(text)
}
