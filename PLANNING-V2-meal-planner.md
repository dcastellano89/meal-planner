# 🍽️ Meal Planner Familiar — Planificación V2

**Versión:** 1.0  
**Fecha:** Marzo 2026  
**Base:** App V1 en producción con todos los features del MVP  
**Referencia:** PRD-meal-planner v1.2 + TECH-SPEC v1.0

> Este documento planifica las nuevas funcionalidades a agregar sobre la app ya existente. Cada feature fue refinado en sesión de discovery con la usuaria.

---

## 📋 Resumen de Features V2

| # | Feature | Complejidad | Prioridad sugerida |
|---|---------|-------------|-------------------|
| F1 | Consolidación inteligente de ingredientes | Baja | 🔴 Alta |
| F2 | Días de la semana configurables | Baja | 🔴 Alta |
| F3 | Encuesta al generar menú | Media | 🟡 Media |
| F4 | Dificultad en recetas | Baja | 🟡 Media |
| F5 | Recetas favoritas | Baja | 🟡 Media |
| F6 | Autocomplete de ingredientes | Media | 🟢 Baja |

---

## 🔴 FASE 1 — Mejoras de alta prioridad

### F1 — Consolidación inteligente de ingredientes en lista de compras

**Problema actual:** Si dos recetas tienen "tomate" como ingrediente, aparecen como dos ítems separados en la lista de compras en vez de sumarse.

**Solución:** Consolidar ingredientes que tengan el mismo nombre Y la misma unidad.

---

#### UC-F1: Como miembro del hogar, quiero que la lista de compras consolide ingredientes repetidos, para no tener ítems duplicados y saber exactamente cuánto comprar

**Status:** DESIGN

##### SC1: Consolidación por nombre y unidad igual

**Given** el plan semanal tiene dos recetas que usan "tomate" en la misma unidad  
**When** se genera la lista de compras  
**Then** aparece un solo ítem "Tomate: 5 unidades" en vez de dos ítems separados

> **Regla de negocio — Consolidación:**
> - Se consolidan ingredientes que tengan **exactamente el mismo nombre** (case-insensitive) Y **la misma unidad**
> - Ejemplos que SÍ se consolidan: "2 tomates" + "3 tomates" → "5 tomates"
> - Ejemplos que NO se consolidan: "200g de tomate" + "2 tomates" → aparecen como ítems separados (unidades distintas)
> - La comparación de nombres ignora mayúsculas/minúsculas y espacios extra

##### SC2: Ítem con unidades incompatibles

**Given** dos recetas usan el mismo ingrediente con unidades distintas  
**When** se genera la lista de compras  
**Then** aparecen como dos ítems separados sin intentar convertir unidades

##### Implementación técnica sugerida

```javascript
// src/utils/shopping.js
const consolidateIngredients = (ingredients) => {
  const map = {}
  ingredients.forEach(({ name, quantity }) => {
    // Parsear cantidad y unidad
    const parsed = parseQuantity(quantity) 
    // { amount: 2, unit: 'tomates' } o { amount: 200, unit: 'g', ingredient: 'tomate' }
    const key = `${name.toLowerCase().trim()}__${parsed.unit}`
    
    if (map[key]) {
      map[key].amount += parsed.amount
    } else {
      map[key] = { name, amount: parsed.amount, unit: parsed.unit }
    }
  })
  return Object.values(map).map(i => ({
    name: i.name,
    quantity: `${i.amount} ${i.unit}`
  }))
}
```

##### Cambios en base de datos
Ninguno — es solo lógica de presentación en el frontend.

---

### F2 — Días de la semana configurables

**Problema actual:** El planificador siempre muestra los 7 días. Muchos hogares no cocinan el fin de semana o tienen días fijos de salida.

**Solución:** Permitir seleccionar qué días de la semana se incluyen en el planificador, configurable desde el hogar.

---

#### UC-F2: Como miembro del hogar, puedo configurar qué días de la semana incluir en el planificador, para que el menú se adapte a nuestra rutina real

**Status:** DESIGN

##### SC1: Configurar días activos

**Given** la usuaria está en Configuración del hogar  
**When** accede a la sección "Días de planificación"  
**Then** ve los 7 días de la semana con checkboxes, con Lunes a Viernes seleccionados por defecto

> **Regla de negocio:**
> - Default: Lunes, Martes, Miércoles, Jueves, Viernes (5 días)
> - Mínimo 1 día seleccionado (no se puede deseleccionar todos)
> - El cambio afecta el planificador de la semana siguiente, no la semana actual si ya tiene plan

##### SC2: Planificador refleja días activos

**Given** el hogar tiene configurados solo Lunes a Viernes  
**When** la usuaria abre el Planificador  
**Then** ve solo las filas de los 5 días activos, sin Sábado ni Domingo

##### SC3: Sugerencia de menú respeta días activos

**Given** el hogar tiene 5 días activos  
**When** la IA genera el menú  
**Then** genera slots solo para esos 5 días (10 comidas en total en vez de 14)

##### Cambios en base de datos

```sql
-- Agregar columna a households
alter table households 
add column active_days text[] 
default array['lun','mar','mie','jue','vie'];
```

---

## 🟡 FASE 2 — Features de experiencia de usuario

### F3 — Encuesta al generar el menú

**Problema actual:** La IA genera el menú sin contexto de la situación actual del hogar (qué hay en la heladera, qué se antoja, cuánta energía hay para cocinar).

**Solución:** Mostrar una encuesta rápida antes de generar el menú para personalizar la sugerencia.

---

#### UC-F3: Como usuaria, puedo completar una encuesta rápida antes de generar el menú, para que la IA tenga en cuenta mi situación real de esta semana

**Status:** DESIGN

##### SC1: Mostrar encuesta antes de generar

**Given** la usuaria toca "Sugerirme menú" en el Planificador  
**When** se dispara la acción  
**Then** aparece un bottom sheet con la encuesta de 3 preguntas antes de llamar a la IA

##### SC2: Ingredientes en la heladera

**Given** la usuaria está en la encuesta  
**When** completa el campo "¿Qué tenés en la heladera?"  
**Then** puede escribir texto libre con ingredientes que quiere usar (ej: "pollo, zapallo, huevos")

> **Regla de negocio:** La IA priorizará recetas que contengan esos ingredientes. Si no hay ninguna receta con esos ingredientes en la biblioteca, lo ignora y lo indica en un mensaje.

##### SC3: Receta o comida específica a incluir

**Given** la usuaria está en la encuesta  
**When** completa el campo "¿Querés incluir alguna receta o tipo de comida?"  
**Then** puede escribir texto libre (ej: "quiero incluir las lentejas" o "algo con pasta")

> **Regla de negocio:** Si menciona una receta exacta que existe en la biblioteca, la IA la asigna fija. Si menciona un tipo de comida, busca recetas de esa categoría.

##### SC4: Dificultad deseada para la semana

**Given** la usuaria está en la encuesta  
**When** selecciona la dificultad  
**Then** elige entre: 🟢 Fácil (solo recetas fáciles), 🟡 Mix (variado), 🔴 Elaborado (recetas más complejas)

> **Regla de negocio:** La dificultad se cruza con la propiedad `difficulty` de cada receta (ver F4). Si elige "Fácil", la IA solo usa recetas con `difficulty = 'baja'`. Si no hay suficientes, completa con las más fáciles disponibles.

##### SC5: Generar menú con preferencias

**Given** la usuaria completó la encuesta y toca "Generar"  
**When** se llama a la IA  
**Then** las preferencias se incluyen en el prompt y el menú generado las respeta en la medida de lo posible

##### SC6: Saltar la encuesta

**Given** la usuaria no quiere personalizar  
**When** toca "Saltar" en la encuesta  
**Then** se genera el menú sin preferencias adicionales (comportamiento actual)

##### Prompt actualizado para la IA

```
Preferencias de esta semana:
- Ingredientes disponibles en heladera: {ingredientes_heladera}
- Receta o comida que quiere incluir: {receta_especifica}  
- Dificultad deseada: {dificultad} (baja | mix | alta)

Reglas adicionales:
- Priorizá recetas que usen los ingredientes de la heladera
- Si mencionó una receta específica, incluila obligatoriamente
- Filtrá por dificultad según la preferencia indicada
```

##### Cambios en base de datos
Ninguno — las preferencias de la encuesta son efímeras (solo se usan para ese llamado a la IA, no se persisten).

---

### F4 — Dificultad en recetas

**Problema actual:** Las recetas no tienen propiedad de dificultad, lo que impide filtrar por ella y usarla en la encuesta del menú.

**Solución:** Agregar campo `difficulty` a las recetas con tres valores posibles.

---

#### UC-F4: Como usuaria, puedo asignar una dificultad a cada receta, para filtrar y planificar según mi energía disponible cada semana

**Status:** DESIGN

##### SC1: Asignar dificultad al crear/editar receta

**Given** la usuaria está en el formulario de receta (manual o revisión de imagen)  
**When** ve el campo "Dificultad"  
**Then** puede elegir entre: 🟢 Fácil, 🟡 Media, 🔴 Difícil (default: Media)

##### SC2: Dificultad visible en tarjeta de receta

**Given** la usuaria está en la Biblioteca  
**When** ve la lista de recetas  
**Then** cada tarjeta muestra un indicador visual de dificultad (emoji o badge de color)

##### SC3: Filtrar por dificultad en la biblioteca

**Given** la usuaria está en la Biblioteca  
**When** usa los filtros de categoría  
**Then** puede también filtrar por dificultad (Fácil / Media / Difícil) en la misma barra de filtros

> **Decisión de diseño:** La dificultad se agrega como filtro adicional en la barra de categorías existente, no como una barra separada.

##### SC4: IA de extracción sugiere dificultad

**Given** la usuaria carga una receta desde imagen  
**When** la IA extrae los datos  
**Then** también sugiere una dificultad basada en la cantidad de ingredientes y complejidad de la preparación (la usuaria puede corregirla)

##### Cambios en base de datos

```sql
alter table recipes 
add column difficulty text 
default 'media' 
check (difficulty in ('baja', 'media', 'alta'));
```

##### Actualización del prompt de extracción de imagen

```
Agregá al JSON de respuesta:
"difficulty": "baja|media|alta"

Criterios para estimar dificultad:
- baja: menos de 5 ingredientes, preparación simple, menos de 30 min
- media: 5-8 ingredientes, técnica moderada, 30-60 min  
- alta: más de 8 ingredientes, técnica compleja, más de 60 min
```

---

### F5 — Recetas favoritas

**Problema actual:** No hay forma de destacar recetas preferidas. Con una biblioteca grande, es difícil encontrar las que más gustan.

**Solución:** Marcar recetas con estrella ★ y filtrar por favoritas en la biblioteca.

---

#### UC-F5: Como usuaria, puedo marcar recetas como favoritas, para encontrarlas rápidamente y distinguirlas de las demás

**Status:** DESIGN

##### SC1: Marcar/desmarcar como favorita

**Given** la usuaria está en la Biblioteca o en el detalle de una receta  
**When** toca el ícono ★ en la tarjeta  
**Then** la receta se marca como favorita (estrella rellena ★) o se desmarca (estrella vacía ☆) con feedback visual inmediato

##### SC2: Filtrar por favoritas en la biblioteca

**Given** la usuaria está en la Biblioteca  
**When** toca el filtro "★ Favoritas"  
**Then** ve solo las recetas marcadas como favoritas

> **Decisión de diseño:** "Favoritas" se agrega como primera opción en la barra de filtros de categoría existente, después de "Todas".

##### SC3: Estado vacío — sin favoritas

**Given** la usuaria filtra por favoritas y no tiene ninguna marcada  
**When** se aplica el filtro  
**Then** ve un estado vacío con mensaje "Todavía no marcaste ninguna receta como favorita. Tocá ★ en cualquier receta para agregarla aquí."

> **Regla de negocio:** Las favoritas son por hogar, no por usuario individual. Si Ana marca una receta como favorita, Carlos también la ve destacada.

##### Cambios en base de datos

```sql
alter table recipes 
add column is_favorite boolean default false;
```

---

## 🟢 FASE 3 — Mejoras de carga de recetas

### F6 — Autocomplete de ingredientes

**Problema actual:** Al cargar una receta, el usuario tipea el nombre del ingrediente desde cero cada vez, lo que es lento y genera inconsistencias de nomenclatura (ej: "Tomate", "tomates", "tomate perita").

**Solución:** Mostrar sugerencias mientras el usuario tipea, con un catálogo que combina ingredientes predefinidos + ingredientes ya usados en recetas existentes del hogar.

---

#### UC-F6: Como usuaria, puedo seleccionar ingredientes desde un autocomplete mientras cargo una receta, para cargar más rápido y mantener nombres consistentes

**Status:** DESIGN

##### SC1: Sugerencias mientras tipeo

**Given** la usuaria está agregando un ingrediente en el formulario de receta  
**When** tipea al menos 2 caracteres  
**Then** aparece una lista desplegable con hasta 8 sugerencias que coincidan con lo escrito (búsqueda por contiene, no solo por inicio)

##### SC2: Seleccionar sugerencia

**Given** la usuaria ve la lista de sugerencias  
**When** toca una sugerencia  
**Then** el campo se completa con el nombre seleccionado y el foco pasa al campo de cantidad

##### SC3: Ingresar ingrediente no listado

**Given** la usuaria tipea un ingrediente que no está en las sugerencias  
**When** termina de escribir y no selecciona ninguna sugerencia  
**Then** puede continuar con el texto que escribió — el sistema lo acepta igual y lo incorpora al catálogo del hogar para futuras búsquedas

##### SC4: Catálogo combinado

**Given** la usuaria abre el autocomplete  
**When** busca un ingrediente  
**Then** las sugerencias vienen de dos fuentes combinadas y deduplicadas:
1. **Catálogo base** (~150 ingredientes predefinidos más comunes)
2. **Ingredientes del hogar** (todos los ingredientes ya usados en recetas del hogar)

> **Regla de negocio — Prioridad de sugerencias:**
> - Primero aparecen los ingredientes ya usados en el hogar (más relevantes)
> - Luego los del catálogo base que no estén en el hogar
> - La búsqueda es case-insensitive y por subcadena

##### SC5: Catálogo base inicial

Ingredientes predefinidos agrupados por categoría:

```
Verduras: tomate, cebolla, ajo, papa, zanahoria, zapallo, 
  calabaza, pimiento, morrón, berenjena, zucchini, choclo,
  brócoli, coliflor, espinaca, acelga, lechuga, rúcula,
  apio, puerro, cebolla de verdeo, remolacha, pepino,
  radicheta, albahaca, perejil, cilantro, romero, tomillo

Frutas: limón, naranja, manzana, banana, pera, uva,
  frutilla, durazno, ciruela, mandarina, pomelo

Carnes: pollo entero, pechuga de pollo, muslo de pollo,
  carne picada, bife de chorizo, asado, vacío, milanesa,
  cerdo, lomo de cerdo, cordero, chorizo, morcilla

Pescados: atún en lata, salmón, merluza, lenguado,
  langostinos, mejillones, calamares

Lácteos: leche, queso cremoso, queso rallado, mozzarella,
  ricota, crema de leche, manteca, yogur, huevo

Almacén: arroz, fideos, harina, pan rallado, azúcar, sal,
  pimienta, aceite de oliva, aceite de girasol, vinagre,
  tomate triturado, caldo de pollo, caldo de verdura,
  lentejas, garbanzos, porotos, arvejas, maíz en lata,
  atún en lata, aceitunas, alcaparras, mostaza, mayonesa,
  salsa de soja, salsa worcestershire, paprika, comino,
  orégano, laurel, nuez moscada
```

##### Cambios en base de datos

```sql
-- Tabla de catálogo de ingredientes
create table ingredient_catalog (
  id          uuid default gen_random_uuid() primary key,
  name        text not null unique,
  category    text,  -- verduras, frutas, carnes, pescados, lacteos, almacen
  is_default  boolean default false,  -- true = del catálogo base
  household_id uuid references households(id) -- null = global, uuid = del hogar
);

-- Índice para búsqueda por texto
create index ingredient_catalog_name_idx 
on ingredient_catalog using gin(to_tsvector('spanish', name));
```

---

## 📊 Impacto en Analytics

| Evento nuevo | Descripción |
|---|---|
| `meal_planner_menu_survey_shown` | Se mostró la encuesta antes de generar |
| `meal_planner_menu_survey_skipped` | Usuaria saltó la encuesta |
| `meal_planner_menu_survey_completed` | Usuaria completó la encuesta |
| `meal_planner_recipe_favorited` | Usuaria marcó receta como favorita |
| `meal_planner_recipe_unfavorited` | Usuaria desmarcó favorita |
| `meal_planner_recipe_filtered_favorites` | Filtró por favoritas en biblioteca |
| `meal_planner_recipe_filtered_difficulty` | Filtró por dificultad |
| `meal_planner_ingredient_autocomplete_selected` | Seleccionó sugerencia del autocomplete |
| `meal_planner_ingredient_autocomplete_custom` | Ingresó ingrediente no listado |
| `meal_planner_active_days_updated` | Cambió los días activos del hogar |

---

## 🗄️ Resumen de cambios en base de datos

```sql
-- F2: Días activos
alter table households 
add column active_days text[] 
default array['lun','mar','mie','jue','vie'];

-- F4: Dificultad
alter table recipes 
add column difficulty text 
default 'media' 
check (difficulty in ('baja', 'media', 'alta'));

-- F5: Favoritas
alter table recipes 
add column is_favorite boolean default false;

-- F6: Catálogo de ingredientes
create table ingredient_catalog (
  id           uuid    default gen_random_uuid() primary key,
  name         text    not null,
  category     text,
  is_default   boolean default false,
  household_id uuid    references households(id) on delete cascade,
  unique(name, household_id)
);

-- RLS para catálogo
alter table ingredient_catalog enable row level security;

create policy "ingredient_catalog_policy" on ingredient_catalog
  for all using (
    is_default = true 
    or household_id = get_user_household_id()
  );
```

---

## 📅 Timeline estimado

Con menos de 5 horas por semana:

```
Semana 1  →  F1: Consolidación de ingredientes (2-3 hs)
Semana 2  →  F2: Días configurables (2-3 hs)
──────────────────────────────────────
🎉 Mejoras inmediatas listas

Semana 3  →  F4: Dificultad en recetas (2 hs)
Semana 4  →  F5: Favoritas (2 hs)
Semana 5  →  F3: Encuesta al generar menú (3-4 hs)
──────────────────────────────────────
🎉 Experiencia de planificación mejorada

Semana 6-7 →  F6: Autocomplete de ingredientes (4-5 hs)
──────────────────────────────────────
🎉 V2 completa
```

---

## ✅ Criterios de Aceptación V2

- [ ] F1: Dos recetas con "3 tomates" y "2 tomates" aparecen como "5 tomates" en la lista de compras
- [ ] F1: "200g de tomate" y "2 tomates" aparecen como ítems separados (unidades distintas)
- [ ] F2: El planificador muestra solo los días configurados en el hogar
- [ ] F2: La IA genera menú solo para los días activos
- [ ] F3: La encuesta aparece siempre antes de generar el menú
- [ ] F3: El menú generado incluye recetas con los ingredientes indicados en la encuesta
- [ ] F4: Todas las recetas existentes tienen dificultad (migración con default "media")
- [ ] F4: La IA de extracción sugiere dificultad automáticamente
- [ ] F5: Marcar/desmarcar favorita se refleja en menos de 1 segundo
- [ ] F5: El filtro "Favoritas" muestra solo recetas marcadas
- [ ] F6: Las sugerencias aparecen al tipear 2+ caracteres en menos de 300ms
- [ ] F6: Ingredientes no listados se aceptan y se agregan al catálogo del hogar

---

## 🔮 Ideas para V3 (fuera de alcance de esta planificación)

- Historial de menús de semanas anteriores
- Exportar lista de compras (WhatsApp, PDF)
- Notificaciones push ("¿Ya planificaste esta semana?")
- Rotación inteligente (avisar si se repite mucho una receta)
- Importar recetas desde URL
- Carga por dictado de voz

---

*Planificación V2 — Marzo 2026*  
*Basada en PRD-meal-planner v1.2 y TECH-SPEC v1.0*
