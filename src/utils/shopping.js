export const SHOPPING_CATEGORIES = {
  verduras: {
    label: '🥬 Verduras y Frutas',
    keywords: ['tomate', 'papa', 'cebolla', 'lechuga', 'zanahoria', 'ajo', 'morrón', 'zapallo',
      'berenjena', 'choclo', 'espinaca', 'acelga', 'puerro', 'apio', 'pepino', 'limón',
      'naranja', 'manzana', 'banana', 'pimiento', 'brócoli', 'coliflor', 'rúcula', 'albahaca',
      'perejil', 'cilantro', 'romero', 'tomillo', 'champiñon', 'hongo', 'zucchini', 'chaucha'],
  },
  carnes: {
    label: '🥩 Carnes y Pescados',
    keywords: ['carne', 'pollo', 'cerdo', 'cordero', 'ternera', 'milanesa', 'bife', 'pechuga',
      'muslo', 'atún', 'salmón', 'merluza', 'pescado', 'langostino', 'camarón', 'jamón',
      'panceta', 'chorizo', 'morcilla', 'salchicha', 'lomo', 'costilla'],
  },
  lacteos: {
    label: '🥚 Lácteos y Huevos',
    keywords: ['leche', 'queso', 'yogur', 'crema', 'manteca', 'huevo', 'ricota', 'mozzarella',
      'parmesano', 'mascarpone', 'cheddar', 'gruyere', 'nata'],
  },
  almacen: {
    label: '🫙 Almacén',
    keywords: ['arroz', 'fideos', 'harina', 'aceite', 'azúcar', 'sal', 'pimienta', 'lenteja',
      'garbanzo', 'poroto', 'tomate triturado', 'caldo', 'pan', 'pasta', 'vinagre',
      'mostaza', 'mayonesa', 'ketchup', 'salsa', 'conserva', 'lata', 'maicena',
      'levadura', 'polvo de hornear', 'vino', 'cerveza', 'coco', 'miel', 'mermelada',
      'cacao', 'chocolate', 'avena', 'sémola', 'pan rallado', 'grisín', 'arborio'],
  },
}

/**
 * Parsea un string de cantidad en { amount, unit }.
 * Ejemplos:
 *   "3 tomates"  → { amount: 3,   unit: "tomates" }
 *   "200g"       → { amount: 200, unit: "g" }
 *   "1/2 kg"     → { amount: 0.5, unit: "kg" }
 *   "al gusto"   → { amount: null, unit: "al gusto" }
 */
const parseQuantity = (qty) => {
  if (!qty || !qty.trim()) return { amount: null, unit: '' }
  const str = qty.trim()
  const numMatch = str.match(/^(\d+(?:[.,]\d+)?(?:\/\d+)?)\s*(.*)$/)
  if (!numMatch) return { amount: null, unit: str.toLowerCase().trim() }
  const rawNum = numMatch[1]
  const unit = numMatch[2].trim().toLowerCase()
  let amount
  if (rawNum.includes('/')) {
    const [n, d] = rawNum.split('/')
    amount = parseFloat(n) / parseFloat(d)
  } else {
    amount = parseFloat(rawNum.replace(',', '.'))
  }
  return { amount: isNaN(amount) ? null : amount, unit }
}

/**
 * Consolida ingredientes con el mismo nombre e igual unidad sumando las cantidades.
 * Ingredientes con distinta unidad quedan como ítems separados.
 */
const consolidateIngredients = (ingredients) => {
  const map = {}
  const order = []

  ingredients.forEach(({ name, quantity }) => {
    const { amount, unit } = parseQuantity(quantity)
    const key = `${name.toLowerCase().trim()}__${unit}`

    if (map[key] && amount !== null && map[key].amount !== null) {
      map[key].amount += amount
    } else if (!map[key]) {
      map[key] = { name, amount, unit }
      order.push(key)
    }
  })

  return order.map((key) => {
    const { name, amount, unit } = map[key]
    let quantityStr
    if (amount === null) {
      quantityStr = unit || ''
    } else {
      const amountStr = amount % 1 === 0 ? String(Math.round(amount)) : amount.toFixed(1)
      quantityStr = unit ? `${amountStr} ${unit}` : amountStr
    }
    return { name, quantity: quantityStr }
  })
}

/**
 * Construye la lista de compras a partir de los slots del plan.
 * Deduplica recetas y consolida ingredientes con mismo nombre y unidad.
 */
export const buildShoppingList = (planSlots, recipes) => {
  // IDs únicos de recetas usadas en el plan
  const usedRecipeIds = [...new Set(
    planSlots.filter((s) => s.recipe_id).map((s) => s.recipe_id)
  )]

  // Ingredientes de cada receta (una sola vez por receta)
  const allIngredients = usedRecipeIds.flatMap((recipeId) => {
    const recipe = recipes.find((r) => r.id === recipeId)
    return (recipe?.ingredients || []).map((ing) => ({
      name: ing.name,
      quantity: ing.quantity,
    }))
  })

  // Consolidar y agrupar por categoría
  return groupByCategory(consolidateIngredients(allIngredients))
}

const groupByCategory = (ingredients) => {
  const result = { verduras: [], carnes: [], lacteos: [], almacen: [], otros: [] }
  ingredients.forEach((ing) => {
    const name = ing.name.toLowerCase()
    const match = Object.entries(SHOPPING_CATEGORIES).find(([, { keywords }]) =>
      keywords.some((k) => name.includes(k))
    )
    const key = match ? match[0] : 'otros'
    result[key].push(ing)
  })
  // Quitar categorías vacías
  return Object.fromEntries(Object.entries(result).filter(([, items]) => items.length > 0))
}

export const CATEGORY_LABELS = {
  verduras: '🥬 Verduras y Frutas',
  carnes: '🥩 Carnes y Pescados',
  lacteos: '🥚 Lácteos y Huevos',
  almacen: '🫙 Almacén',
  otros: '🧂 Otros',
}
