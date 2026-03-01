# 🍽️ Meal Planner Familiar — Especificación Técnica

**Versión:** 1.0  
**Fecha:** Marzo 2026  
**Stack:** React + Vite + Tailwind + Supabase + Claude API + Vercel  
**PRD de referencia:** PRD-meal-planner v1.2

> Este documento es la guía de implementación para construir la app desde cero usando Claude Code como copiloto de desarrollo. Leer junto al PRD y el prototipo antes de arrancar.

---

## 1. 🏗️ Arquitectura General

```
┌─────────────────────────────────────────┐
│         PWA — iPhone / Android          │
│                                         │
│   React + Vite + Tailwind CSS           │
│   React Router (navegación)             │
│   Supabase JS SDK (data + auth)         │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌─────────────┐  ┌──────────────────┐
│  Supabase   │  │  Anthropic API   │
│             │  │  Claude Sonnet   │
│ PostgreSQL  │  │                  │
│ Auth        │  │ - Extraer receta │
│ Realtime    │  │   desde imágenes │
│ Storage     │  │ - Sugerir menú   │
│ RLS         │  │   semanal        │
└─────────────┘  └──────────────────┘
       │
       ▼
┌─────────────┐
│   Vercel    │
│  (hosting)  │
│  CI/CD      │
└─────────────┘
```

---

## 2. 📦 Stack Tecnológico

| Capa | Tecnología | Versión | Justificación |
|------|-----------|---------|---------------|
| Framework UI | React | 18+ | Ecosistema maduro, compatible con Supabase |
| Build tool | Vite | 5+ | Rápido, soporte nativo para PWA |
| Estilos | Tailwind CSS | 3+ | Mobile-first, utility classes |
| Routing | React Router | 6+ | Navegación declarativa |
| Base de datos | Supabase (PostgreSQL) | - | Auth + DB + Realtime en uno |
| IA | Anthropic Claude Sonnet | claude-sonnet-4-5 | Visión + texto |
| Hosting | Vercel | - | Deploy automático desde GitHub |
| PWA | vite-plugin-pwa | - | Instalable en iPhone |

---

## 3. 📁 Estructura de Carpetas

```
meal-planner/
├── public/
│   ├── icons/                  # Íconos PWA (192x192, 512x512)
│   └── manifest.json           # Generado por vite-plugin-pwa
│
├── src/
│   ├── main.jsx                # Entry point
│   ├── App.jsx                 # Router principal
│   ├── supabase.js             # Cliente Supabase
│   │
│   ├── components/             # Componentes reutilizables
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Tag.jsx
│   │   │   └── EmptyState.jsx
│   │   ├── layout/
│   │   │   ├── BottomNav.jsx
│   │   │   └── Header.jsx
│   │   └── recipe/
│   │       ├── RecipeCard.jsx
│   │       ├── RecipeForm.jsx
│   │       ├── ImageUploader.jsx
│   │       └── CategoryFilter.jsx
│   │
│   ├── pages/                  # Pantallas principales
│   │   ├── Onboarding.jsx      # Crear hogar + invitación
│   │   ├── Recipes.jsx         # Biblioteca de recetas
│   │   ├── Planner.jsx         # Planificador semanal
│   │   ├── Shopping.jsx        # Lista de compras
│   │   └── Config.jsx          # Configuración del hogar
│   │
│   ├── hooks/                  # Custom hooks
│   │   ├── useHousehold.js     # Datos del hogar
│   │   ├── useRecipes.js       # CRUD de recetas
│   │   ├── usePlanner.js       # Plan semanal
│   │   └── useShopping.js      # Lista de compras
│   │
│   ├── services/               # Lógica de negocio
│   │   ├── claudeApi.js        # Llamadas a Anthropic API
│   │   ├── recipeExtractor.js  # Extraer receta de imágenes
│   │   └── menuPlanner.js      # Lógica de sugerencia de menú
│   │
│   └── utils/
│       ├── portions.js         # Cálculo de porciones
│       └── shopping.js         # Consolidación de ingredientes
│
├── .env.local                  # Variables de entorno (no subir a Git)
├── .env.example                # Plantilla de variables (sí subir)
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## 4. 🗄️ Base de Datos (Supabase)

### Diagrama de relaciones

```
auth.users (Supabase Auth)
    │
    └──< household_members >──┐
                              │
                         households
                              │
              ┌───────────────┼───────────────┐
              │               │               │
           recipes       weekly_plans         │
              │               │               │
         ingredients      plan_slots ─────────┘
                          (recipe_id)
```

### Tablas

#### `households`
```sql
create table households (
  id           uuid    default gen_random_uuid() primary key,
  name         text    not null,
  persons      int     default 1 check (persons between 1 and 10),
  invite_code  text    unique default substring(md5(random()::text), 1, 8),
  created_at   timestamp default now()
);
```

#### `household_members`
```sql
create table household_members (
  id            uuid default gen_random_uuid() primary key,
  household_id  uuid references households(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete cascade,
  role          text default 'member' check (role in ('admin', 'member')),
  created_at    timestamp default now(),
  unique(household_id, user_id)
);
```

#### `recipes`
```sql
create table recipes (
  id            uuid    default gen_random_uuid() primary key,
  household_id  uuid    references households(id) on delete cascade,
  name          text    not null,
  portions      int     not null check (portions > 0),
  emoji         text    default '🍴',
  category      text    not null default 'otros'
                check (category in (
                  'pollo','carnes','pescados','pastas',
                  'sopas','tartas','ensaladas','vegetariano','otros'
                )),
  tags          text[]  default '{}',
  created_at    timestamp default now()
);
```

#### `ingredients`
```sql
create table ingredients (
  id         uuid default gen_random_uuid() primary key,
  recipe_id  uuid references recipes(id) on delete cascade,
  name       text not null,
  quantity   text not null,
  sort_order int  default 0
);
```

#### `weekly_plans`
```sql
create table weekly_plans (
  id            uuid  default gen_random_uuid() primary key,
  household_id  uuid  references households(id) on delete cascade,
  week_start    date  not null,
  created_at    timestamp default now(),
  unique(household_id, week_start)
);
```

#### `plan_slots`
```sql
create table plan_slots (
  id         uuid default gen_random_uuid() primary key,
  plan_id    uuid references weekly_plans(id) on delete cascade,
  day        text not null check (day in ('lun','mar','mie','jue','vie','sab','dom')),
  meal_type  text not null check (meal_type in ('lunch','dinner')),
  recipe_id  uuid references recipes(id) on delete set null,
  unique(plan_id, day, meal_type)
);
```

#### `shopping_items`
```sql
-- Persiste el estado de tachado de la lista de compras
create table shopping_items (
  id            uuid    default gen_random_uuid() primary key,
  plan_id       uuid    references weekly_plans(id) on delete cascade,
  ingredient_name text  not null,
  quantity      text    not null,
  category      text    not null,
  checked       boolean default false,
  checked_by    uuid    references auth.users(id),
  checked_at    timestamp
);
```

### Row Level Security (RLS)

```sql
-- Habilitar RLS en todas las tablas
alter table households         enable row level security;
alter table household_members  enable row level security;
alter table recipes            enable row level security;
alter table ingredients        enable row level security;
alter table weekly_plans       enable row level security;
alter table plan_slots         enable row level security;
alter table shopping_items     enable row level security;

-- Helper: obtener household_id del usuario actual
create or replace function get_user_household_id()
returns uuid as $$
  select household_id from household_members
  where user_id = auth.uid()
  limit 1;
$$ language sql security definer;

-- Política: usuarios solo ven datos de su hogar
create policy "household_members_policy" on household_members
  for all using (user_id = auth.uid());

create policy "recipes_policy" on recipes
  for all using (household_id = get_user_household_id());

create policy "ingredients_policy" on ingredients
  for all using (
    recipe_id in (
      select id from recipes where household_id = get_user_household_id()
    )
  );

create policy "weekly_plans_policy" on weekly_plans
  for all using (household_id = get_user_household_id());

create policy "plan_slots_policy" on plan_slots
  for all using (
    plan_id in (
      select id from weekly_plans where household_id = get_user_household_id()
    )
  );

create policy "shopping_items_policy" on shopping_items
  for all using (
    plan_id in (
      select id from weekly_plans where household_id = get_user_household_id()
    )
  );
```

---

## 5. 🔐 Autenticación y Modelo de Hogar

### Flujo de autenticación

```
Usuario nuevo
    │
    ▼
Registro (email + magic link)
    │
    ▼
¿Tiene household_member? ──No──► Onboarding: Crear hogar
    │                                │
   Sí                           Crear household
    │                           Crear household_member (role: admin)
    ▼                                │
App principal ◄──────────────────────┘

Invitación
    │
    ▼
Usuario abre link /join/:invite_code
    │
    ▼
¿Está autenticado? ──No──► Login/Registro
    │
    ▼
Buscar household por invite_code
    │
    ▼
Crear household_member (role: member)
    │
    ▼
Redirigir a app principal
```

### Implementación en `src/supabase.js`

```javascript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Auth helpers
export const signInWithMagicLink = (email) =>
  supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })

export const signOut = () => supabase.auth.signOut()

export const getSession = () => supabase.auth.getSession()
```

---

## 6. 🤖 Integración con Claude API

### Configuración base (`src/services/claudeApi.js`)

```javascript
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-5'

const callClaude = async ({ system, messages, maxTokens = 1000 }) => {
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages })
  })
  if (!response.ok) throw new Error(`Claude API error: ${response.status}`)
  return response.json()
}

export default callClaude
```

> ⚠️ **Importante:** En producción, las llamadas a Claude API deben ir por un backend (Supabase Edge Function) para no exponer la API key en el frontend. Para el MVP puede ir directo desde el cliente con la variable de entorno.

### Caso 1 — Extraer receta de imágenes (`src/services/recipeExtractor.js`)

```javascript
import callClaude from './claudeApi'

export const extractRecipeFromImages = async (imageFiles) => {
  // Convertir imágenes a base64
  const imageContents = await Promise.all(
    imageFiles.map(async (file) => {
      const base64 = await fileToBase64(file)
      return {
        type: 'image',
        source: {
          type: 'base64',
          media_type: file.type,
          data: base64.split(',')[1]
        }
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
  "category": "pollo|carnes|pescados|pastas|sopas|tartas|ensaladas|vegetariano|otros",
  "ingredients": [
    { "name": "nombre del ingrediente", "quantity": "cantidad y unidad" }
  ]
}
Si no podés identificar algún campo, usá valores razonables por defecto.
Para portions, estimá según la cantidad de ingredientes.
Para category, elegí la más apropiada según los ingredientes principales.`,
    messages: [
      {
        role: 'user',
        content: [
          ...imageContents,
          { type: 'text', text: 'Extraé la receta de estas imágenes y respondé solo con el JSON.' }
        ]
      }
    ],
    maxTokens: 1500
  })

  const text = response.content[0].text.trim()
  return JSON.parse(text)
}

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
```

### Caso 2 — Sugerir menú semanal (`src/services/menuPlanner.js`)

```javascript
import callClaude from './claudeApi'

export const generateWeeklyMenu = async ({ recipes, persons }) => {
  const recipeList = recipes.map(r => ({
    id: r.id,
    name: r.name,
    portions: r.portions,
    category: r.category
  }))

  // Calcular slots disponibles por receta según porciones y personas
  // Una receta de N porciones para P personas alcanza para Math.floor(N/P) comidas
  const slotsPerRecipe = recipeList.map(r => ({
    ...r,
    slots: Math.max(1, Math.floor(r.portions / persons))
  }))

  const response = await callClaude({
    system: `Sos un asistente de planificación de comidas.
Respondé ÚNICAMENTE con un objeto JSON válido, sin texto adicional.
El JSON debe tener esta estructura:
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

Recetas disponibles con sus slots disponibles (cuántas veces puede aparecer en la semana):
${JSON.stringify(slotsPerRecipe, null, 2)}

Reglas importantes:
- Cada receta puede aparecer como máximo N veces según su campo "slots"
- Distribuí bien las recetas a lo largo de la semana (no pongas lo mismo dos días seguidos)
- Variá entre categorías (no pongas solo pollo toda la semana)
- Si no hay suficientes recetas para cubrir los 14 slots, dejá algunos como null
- Usá los IDs exactos de las recetas en el JSON de respuesta`
      }
    ],
    maxTokens: 1000
  })

  const text = response.content[0].text.trim()
  return JSON.parse(text)
}
```

---

## 7. 🔄 Tiempo Real con Supabase Realtime

### Suscripción a cambios del plan semanal

```javascript
// En el hook usePlanner.js
useEffect(() => {
  const channel = supabase
    .channel('plan-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'plan_slots',
        filter: `plan_id=eq.${planId}`
      },
      (payload) => {
        // Actualizar estado local cuando otro miembro cambia algo
        fetchPlanSlots()
      }
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [planId])
```

### Suscripción a la lista de compras (tachado en tiempo real)

```javascript
// En el hook useShopping.js
useEffect(() => {
  const channel = supabase
    .channel('shopping-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'shopping_items',
        filter: `plan_id=eq.${planId}`
      },
      (payload) => {
        // Actualizar el ítem tachado en tiempo real
        setItems(prev =>
          prev.map(item =>
            item.id === payload.new.id ? { ...item, checked: payload.new.checked } : item
          )
        )
      }
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [planId])
```

---

## 8. 🧮 Lógica de Negocio Clave

### Cálculo de porciones (`src/utils/portions.js`)

```javascript
/**
 * Calcula cuántas veces una receta aparece en el calendario
 * según las porciones que rinde y el número de personas del hogar.
 *
 * Ejemplo: receta rinde 4 porciones, 2 personas → aparece 2 veces en el calendario
 * Ejemplo: receta rinde 3 porciones, 1 persona → aparece 3 veces en el calendario
 * Ejemplo: receta rinde 2 porciones, 3 personas → aparece 1 vez (no alcanza para 2 comidas)
 */
export const calcSlots = (portions, persons) =>
  Math.max(1, Math.floor(portions / persons))
```

### Consolidación de ingredientes (`src/utils/shopping.js`)

```javascript
/**
 * Toma los slots del plan semanal y genera la lista de compras consolidada.
 * - Deduplica recetas (una receta usada N veces = UN solo set de ingredientes)
 * - Agrupa ingredientes por categoría de supermercado
 */
export const buildShoppingList = (planSlots, recipes) => {
  // 1. Obtener IDs únicos de recetas usadas en el plan
  const usedRecipeIds = [...new Set(
    planSlots
      .filter(slot => slot.recipe_id)
      .map(slot => slot.recipe_id)
  )]

  // 2. Obtener ingredientes de cada receta (una sola vez por receta)
  const allIngredients = usedRecipeIds.flatMap(recipeId => {
    const recipe = recipes.find(r => r.id === recipeId)
    return recipe?.ingredients || []
  })

  // 3. Consolidar ingredientes con mismo nombre y unidad compatible
  const consolidated = consolidateIngredients(allIngredients)

  // 4. Agrupar por categoría de supermercado
  return groupByCategory(consolidated)
}

const SHOPPING_CATEGORIES = {
  verduras: { label: '🥬 Verduras y Frutas', keywords: ['tomate','papa','cebolla','lechuga','zanahoria','ajo','morrón','zapallo','berenjena','choclo','espinaca','acelga','puerro','apio','pepino','limón','naranja','manzana','banana'] },
  carnes:   { label: '🥩 Carnes y Pescados', keywords: ['carne','pollo','cerdo','cordero','ternera','milanesa','bife','pechuga','muslo','atún','salmón','merluza','pescado','langostino'] },
  lacteos:  { label: '🥚 Lácteos y Huevos',  keywords: ['leche','queso','yogur','crema','manteca','huevo','ricota','mozzarella'] },
  almacen:  { label: '🫙 Almacén',            keywords: ['arroz','fideos','harina','aceite','azúcar','sal','pimienta','lenteja','garbanzo','poroto','tomate triturado','caldo','pan','galleta','pasta'] },
}

const groupByCategory = (ingredients) => {
  const result = {
    verduras: [], carnes: [], lacteos: [], almacen: [], otros: []
  }
  ingredients.forEach(ing => {
    const name = ing.name.toLowerCase()
    const cat = Object.entries(SHOPPING_CATEGORIES).find(([, { keywords }]) =>
      keywords.some(k => name.includes(k))
    )
    const key = cat ? cat[0] : 'otros'
    result[key].push(ing)
  })
  return result
}
```

---

## 9. ⚙️ Variables de Entorno

### `.env.example` (subir a Git)

```bash
# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui

# Anthropic
VITE_ANTHROPIC_API_KEY=sk-ant-tu_api_key_aqui
```

### `.env.local` (NO subir a Git — agregarlo al .gitignore)

```bash
VITE_SUPABASE_URL=https://cxrckwyodmqpoznoubmx.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_real
VITE_ANTHROPIC_API_KEY=sk-ant-tu_key_real
```

### En Vercel (panel de configuración)

Agregar las mismas variables en:
`Settings → Environment Variables → Production`

---

## 10. 📱 Configuración PWA

### `vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Meal Planner',
        short_name: 'Comidas',
        description: 'Planificá tus comidas semanales',
        theme_color: '#2D5016',
        background_color: '#FAFAF7',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
})
```

### Cómo instalar en iPhone

1. Abrís la URL de Vercel en **Safari**
2. Tocás el botón de compartir (cuadrado con flecha)
3. Seleccionás **"Agregar a pantalla de inicio"**
4. Confirmás con **"Agregar"**
5. Aparece el ícono en la pantalla principal como una app

---

## 11. 🚀 Guía de Deploy

### Primera vez

```bash
# 1. Clonar / inicializar el repositorio
git init
git add .
git commit -m "feat: initial setup"

# 2. Crear repositorio en GitHub y subir
git remote add origin https://github.com/tu-usuario/meal-planner.git
git push -u origin main

# 3. Conectar Vercel
# - vercel.com → New Project → importar repo de GitHub
# - Agregar variables de entorno
# - Deploy
```

### Deploy automático (después del setup inicial)

```bash
# Cada push a main hace deploy automático en Vercel
git add .
git commit -m "feat: descripción del cambio"
git push
```

### Comandos útiles durante desarrollo

```bash
npm run dev          # Servidor local en localhost:5173
npm run build        # Build de producción
npm run preview      # Preview del build local
```

---

## 12. 📋 Checklist de Implementación por Fase

### FASE 1 — Setup (2-3 hs)
- [ ] Crear proyecto: `npm create vite@latest meal-planner -- --template react`
- [ ] Instalar dependencias: Tailwind, Supabase JS, React Router, vite-plugin-pwa
- [ ] Configurar `tailwind.config.js` y `vite.config.js`
- [ ] Crear proyecto en Supabase
- [ ] Ejecutar SQL de creación de tablas y RLS
- [ ] Crear `src/supabase.js` con las credenciales
- [ ] Crear `.env.local` con las variables
- [ ] Subir a GitHub + deploy en Vercel
- [ ] Verificar que la URL de Vercel abre la app

### FASE 2 — Biblioteca de Recetas (4-6 hs)
- [ ] Componente `RecipeCard.jsx`
- [ ] Componente `CategoryFilter.jsx` (filtro scrolleable)
- [ ] Página `Recipes.jsx` con listado y filtros
- [ ] Componente `RecipeForm.jsx` (formulario manual)
- [ ] Hook `useRecipes.js` (CRUD con Supabase)
- [ ] Servicio `recipeExtractor.js` (Claude API con imágenes)
- [ ] Componente `ImageUploader.jsx` (múltiples imágenes)
- [ ] Flujo completo de carga por imagen con pantalla de revisión

### FASE 3 — Planificador Semanal (4-5 hs)
- [ ] Página `Planner.jsx` con vista de grilla semanal
- [ ] Hook `usePlanner.js` (leer/escribir slots en Supabase)
- [ ] Servicio `menuPlanner.js` (Claude API para sugerencia)
- [ ] Modal selector de recetas por slot
- [ ] Suscripción Realtime para cambios del plan
- [ ] Lógica de cálculo de porciones (`utils/portions.js`)

### FASE 4 — Lista de Compras (2-3 hs)
- [ ] Página `Shopping.jsx`
- [ ] Hook `useShopping.js`
- [ ] Utilidad `utils/shopping.js` (consolidación de ingredientes)
- [ ] Suscripción Realtime para tachado en tiempo real
- [ ] UI de tachado con feedback visual

### FASE 5 — Hogar Compartido y Auth (3-4 hs)
- [ ] Página `Onboarding.jsx` (crear hogar + invitar)
- [ ] Ruta `/join/:invite_code` para unirse al hogar
- [ ] Hook `useHousehold.js`
- [ ] Guard de autenticación en `App.jsx`
- [ ] Página `Config.jsx` (miembros + personas + invitación)
- [ ] Magic link login

### FASE 6 — PWA (1 hs)
- [ ] Configurar `vite-plugin-pwa` con manifest
- [ ] Generar íconos (192x192 y 512x512)
- [ ] Probar instalación en iPhone desde Safari
- [ ] Verificar que funciona offline (lista de compras)

---

## 13. 🧠 Prompts de Claude Code recomendados

Guardá estos prompts para usarlos con Claude Code durante el desarrollo:

```
# Para empezar una feature
"Implementá el hook useRecipes.js que gestiona el CRUD de recetas 
con Supabase. Las recetas pertenecen al hogar (household_id). 
Incluí: fetchRecipes, createRecipe, updateRecipe, deleteRecipe. 
Usá el cliente de src/supabase.js"

# Para debuggear un error
"Tengo este error en la consola: [pegar error]. 
El componente afectado es [nombre]. 
Revisá el código y proponé una solución."

# Para conectar un componente a Supabase
"Conectá el componente RecipeForm.jsx a Supabase para que al 
hacer submit guarde la receta en la tabla recipes junto con sus 
ingredientes en la tabla ingredients. Manejá el loading y los errores."

# Para implementar Realtime
"Agregá suscripción a Supabase Realtime en el hook useShopping.js 
para que cuando otro miembro del hogar tache un ítem, se refleje 
automáticamente en la lista sin recargar."
```

---

*Especificación técnica v1.0 — Marzo 2026*  
*Referencia: PRD-meal-planner v1.2*
