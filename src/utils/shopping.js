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
 * Construye la lista de compras a partir de los slots del plan.
 * Deduplica recetas: si una receta aparece N veces en la semana,
 * sus ingredientes se cuentan UNA sola vez.
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

  // Agrupar por categoría
  return groupByCategory(allIngredients)
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
