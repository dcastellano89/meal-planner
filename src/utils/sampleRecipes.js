import { supabase } from '../supabase'

const SAMPLE_RECIPES = [
  {
    name: 'Churrasco con verduras',
    emoji: '🥩',
    category: 'carnes',
    portions: 4,
    difficulty: 'baja',
    tags: ['Rápida'],
    procedure: null,
    ingredients: [
      { name: 'Churrasco', quantity: '4', sort_order: 0 },
      { name: 'Papa', quantity: '2', sort_order: 1 },
      { name: 'Batata', quantity: '2', sort_order: 2 },
      { name: 'Cebolla', quantity: '2', sort_order: 3 },
      { name: 'Zanahoria', quantity: '2', sort_order: 4 },
    ],
  },
  {
    name: 'Risotto de Calabaza',
    emoji: '🎃',
    category: 'pastas',
    portions: 2,
    difficulty: 'alta',
    tags: ['vegetariano'],
    procedure:
      'Cocinar el zapallo al horno a 200°C hasta que esté tierno. Saltear la cebolla y el ajo hasta que la cebolla esté transparente. Agregar el arroz y saltear por unos minutos. Agregar el caldo, el puré de zapallo y cocinar hasta que se evapore todo el líquido y el arroz esté completamente cocido. Agregar queso y servir.',
    ingredients: [
      { name: 'Cebolla', quantity: '1 unidad', sort_order: 0 },
      { name: 'Diente de ajo', quantity: '1 unidad', sort_order: 1 },
      { name: 'Arroz carnaroli', quantity: '2 pocillos (140 g aprox)', sort_order: 2 },
      { name: 'Caldo casero o agua con condimentos', quantity: '600 ml', sort_order: 3 },
      { name: 'Pimienta', quantity: 'a gusto', sort_order: 4 },
      { name: 'Sal', quantity: 'a gusto', sort_order: 5 },
      { name: 'Orégano', quantity: 'a gusto', sort_order: 6 },
      { name: 'Albahaca', quantity: 'a gusto', sort_order: 7 },
      { name: 'Cubitos de queso', quantity: 'opcional', sort_order: 8 },
      { name: 'Calabaza/zapallo', quantity: '1/2 unidad', sort_order: 9 },
      { name: 'Pimentón dulce', quantity: 'a gusto', sort_order: 10 },
    ],
  },
  {
    name: 'Tortilla de Brócoli',
    emoji: '🥦',
    category: 'vegetariano',
    portions: 2,
    difficulty: 'media',
    tags: ['saludable', 'rápido'],
    procedure:
      'Rallar el brócoli crudo. Picar la cebolla en cubos pequeños y saltearla con aceite de oliva y sal. En un bowl batir los huevos con condimentos (nuez moscada, sal y pimienta). Agregar el brócoli rallado y la cebolla salteada, mezclar bien. Llevar la mitad de la mezcla a una sartén antiadherente. Agregar queso al gusto y tapar con la mitad restante. Tapar y cocinar 6 minutos por lado.',
    ingredients: [
      { name: 'Brócoli', quantity: 'un racimo', sort_order: 0 },
      { name: 'Huevo', quantity: '3 unidades', sort_order: 1 },
      { name: 'Cebolla', quantity: '1 unidad', sort_order: 2 },
      { name: 'Nuez moscada', quantity: 'al gusto', sort_order: 3 },
      { name: 'Sal', quantity: 'al gusto', sort_order: 4 },
      { name: 'Pimienta', quantity: 'al gusto', sort_order: 5 },
      { name: 'Queso', quantity: 'al gusto', sort_order: 6 },
      { name: 'Aceite de oliva', quantity: 'un poco', sort_order: 7 },
    ],
  },
  {
    name: 'Tarta de Choclo y Calabaza',
    emoji: '🥧',
    category: 'tartas',
    portions: 6,
    difficulty: 'alta',
    tags: ['vegetariano', 'horno'],
    procedure:
      'Para la masa: Integrar harina integral, polvo para hornear, agua, aceite de oliva, sal y pimentón dulce hasta formar un bollo. Estirar en una fuente engrasada y cocinar 10 min a 180°C. Para el relleno: Cortar la calabaza en cubos y cocinar al horno hasta que esté tierna. Saltear la cebolla y agregar leche. Cuando esté caliente, agregar el resto de leche fría con el almidón disuelto. Revolver hasta que espese, enfriar y agregar huevos. Rellenar la tarta con el relleno de choclo, queso y calabaza. Hornear hasta listo.',
    ingredients: [
      { name: 'Harina integral', quantity: '250g', sort_order: 0 },
      { name: 'Polvo para hornear', quantity: '1 cucharadita', sort_order: 1 },
      { name: 'Agua', quantity: '80ml', sort_order: 2 },
      { name: 'Aceite de oliva', quantity: '40ml', sort_order: 3 },
      { name: 'Sal', quantity: '1 pizca', sort_order: 4 },
      { name: 'Pimentón dulce', quantity: 'al gusto', sort_order: 5 },
      { name: 'Choclo en lata', quantity: '1 lata', sort_order: 6 },
      { name: 'Cebolla', quantity: '1 unidad', sort_order: 7 },
      { name: 'Huevos', quantity: '2 unidades', sort_order: 8 },
      { name: 'Leche', quantity: '1 taza', sort_order: 9 },
      { name: 'Almidón de maíz', quantity: '2 cucharadas', sort_order: 10 },
      { name: 'Calabaza', quantity: '1/2 unidad', sort_order: 11 },
      { name: 'Queso fresco', quantity: 'trocitos al gusto', sort_order: 12 },
    ],
  },
  {
    name: 'Wok Thai',
    emoji: '🥙',
    category: 'otros',
    portions: 3,
    difficulty: 'media',
    tags: ['Saludable', 'rápido'],
    procedure: null,
    ingredients: [
      { name: 'Pollo', quantity: '1', sort_order: 0 },
      { name: 'Verduras congeladas thai', quantity: '1 bolsa', sort_order: 1 },
      { name: 'Salsa soja', quantity: 'a ojo', sort_order: 2 },
      { name: 'Condimento thai', quantity: 'a ojo', sort_order: 3 },
      { name: 'Arroz', quantity: '200g', sort_order: 4 },
    ],
  },
]

export async function seedSampleRecipes(householdId) {
  for (const recipe of SAMPLE_RECIPES) {
    const { ingredients, ...recipeData } = recipe

    const { data: created, error: recipeError } = await supabase
      .from('recipes')
      .insert({ ...recipeData, household_id: householdId })
      .select()
      .single()

    if (recipeError || !created) continue

    if (ingredients.length) {
      await supabase
        .from('ingredients')
        .insert(ingredients.map((i) => ({ ...i, recipe_id: created.id })))
    }
  }
}
