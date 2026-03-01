# 🍽️ Meal Planner Familiar — PRD

**Status:** DESIGN  
**Versión:** 1.2  
**Autora:** Usuario  
**Fecha:** Marzo 2026  
**Analytics Prefix:** `meal_planner`

---

## 📌 Resumen

### ¿Qué es?
Una aplicación mobile-first para planificar comidas semanales (almuerzo y cena) y generar automáticamente la lista de compras del supermercado, basada en una biblioteca compartida de recetas del hogar.

### ¿Por qué la construimos?
Ir al supermercado sin un plan genera compras impulsivas, ingredientes que se desperdician y la pregunta diaria de "¿qué comemos hoy?". Esta app resuelve los tres problemas en una sola sesión semanal de planificación, coordinando a todos los miembros del hogar.

### ¿Para quién es?
Hogares de 1 o más personas que comparten recetas, calendario de comidas y lista de compras. Cualquier miembro puede contribuir y ver el estado actualizado en tiempo real.

### Estado actual
Producto nuevo, sin versión previa.

---

## 🎯 Objetivos del MVP

1. Permitir cargar recetas (manual o desde imágenes)
2. Planificar la semana de comidas con sugerencia de la IA
3. Generar la lista de compras consolidada automáticamente
4. Ser usable desde el celular sin fricción

---

## 👤 Personas

**Persona 1 — Administradora del hogar**
Crea el hogar, carga las recetas y planifica la semana. Es la usuaria principal de la app.
Pain points: olvida ingredientes, repite siempre las mismas comidas, desperdicia comida por no planificar porciones.

**Persona 2 — Miembro del hogar (pareja/familiar)**
Se une al hogar via link de invitación. Puede ver el calendario, agregar recetas y tachar ítems en el supermercado.
Pain points: no sabe qué hay planificado para la semana, duplica compras por falta de coordinación.

---

## 🗺️ Módulos y Casos de Uso

---

### MÓDULO 0: Hogar

---

#### UC0: Como usuaria, puedo crear un hogar y invitar a mi pareja, para que ambos compartamos recetas, calendario y lista de compras

**Status:** DESIGN  
**TDD:** TBD  
**Designs:** TBD

El hogar es la unidad central de la app. Todas las recetas, el calendario semanal y la lista de compras pertenecen al hogar, no al usuario individual. Cualquier miembro del hogar puede ver y editar el contenido compartido.

##### SC1: Crear hogar (primera vez)

**Given** la usuaria se registró y no pertenece a ningún hogar  
**When** completa el onboarding  
**Then** se le pide que cree su hogar ingresando un nombre (ej: "Casa de Ana y Carlos") y el número de personas

##### SC2: Generar link de invitación

**Given** la usuaria creó su hogar y está en Configuración  
**When** toca "Invitar miembro"  
**Then** se genera un link único de invitación que puede compartir por WhatsApp, mensaje, etc.

##### SC3: Unirse a un hogar existente

**Given** la pareja recibió el link de invitación  
**When** abre el link en su iPhone y se registra o inicia sesión  
**Then** queda asociada al hogar y ve inmediatamente las mismas recetas y calendario

##### SC4: Acceso compartido en tiempo real

**Given** ambos miembros están en el hogar  
**When** cualquiera hace un cambio (agrega receta, modifica calendario, tacha ítem)  
**Then** el otro miembro ve el cambio reflejado en su app sin necesidad de recargar

> **Regla de negocio:** Último en guardar gana en caso de edición simultánea. Para uso familiar esto es suficiente.

##### SC5: Ver miembros del hogar

**Given** la usuaria está en Configuración  
**When** accede a "Mi hogar"  
**Then** ve la lista de miembros activos con nombre y fecha de incorporación

---

### MÓDULO 1: Biblioteca de Recetas

---

#### UC1: Como miembro del hogar, puedo cargar una receta manualmente, para que todos en el hogar tengamos acceso a ella

**Status:** DESIGN  
**TDD:** TBD  
**Designs:** TBD

La usuaria tiene recetas propias o de memoria que quiere registrar en la app. El formulario manual es el método base y siempre disponible.

##### SC1: Acceder al formulario de nueva receta

**Given** la usuaria está en la Biblioteca de Recetas  
**When** toca el botón "Nueva receta"  
**Then** se abre el formulario de carga manual con los campos: Nombre, Categoría, Porciones que rinde, Tags (opcional), e Ingredientes

##### SC2: Seleccionar categoría de la receta

**Given** la usuaria está completando el formulario  
**When** toca el selector de categoría  
**Then** puede elegir una entre: 🍗 Pollo, 🥩 Carnes, 🐟 Pescados y Mariscos, 🍝 Pastas y Arroz, 🥣 Sopas y Caldos, 🥧 Tartas y Empanadas, 🥗 Ensaladas, 🌱 Vegetariano, 📦 Otros

> **Regla de negocio:** La categoría es obligatoria. Por defecto se preselecciona "Otros".

##### SC3: Agregar ingredientes con cantidades

**Given** la usuaria está en el formulario de nueva receta  
**When** toca "Agregar ingrediente"  
**Then** aparece un campo de texto libre para ingresar el ingrediente con su cantidad y unidad (ej: "2 tomates", "500g de carne picada", "1 taza de arroz")

> **Regla de negocio:** Las unidades son libres — peso (g, kg), volumen (ml, taza), unidad (2 tomates, 3 huevos) o aproximado (c/n de sal). La app no fuerza un formato.

##### SC4: Guardar la receta

**Given** la usuaria completó nombre, categoría, al menos 1 ingrediente y porciones  
**When** toca "Guardar"  
**Then** la receta aparece en su Biblioteca y está disponible para el planificador

##### SC5: Validación de campos requeridos

**Given** la usuaria intenta guardar sin completar nombre, categoría o porciones  
**When** toca "Guardar"  
**Then** se muestran mensajes de error inline indicando los campos faltantes y no se guarda la receta

---

#### UC2: Como usuaria, puedo cargar una receta desde imágenes, para evitar tipear recetas que ya tengo en screenshots de Instagram u otras fuentes

**Status:** DESIGN  
**TDD:** TBD  
**Designs:** TBD

Muchas recetas están guardadas como screenshots de Instagram, fotos de libros, o capturas de webs. La IA extrae los datos automáticamente para minimizar la carga manual.

##### SC1: Iniciar carga por imagen

**Given** la usuaria está en la Biblioteca de Recetas  
**When** toca "Nueva receta" → "Cargar desde imagen"  
**Then** se abre el selector de imágenes del dispositivo

##### SC2: Subir múltiples imágenes de la misma receta

**Given** la usuaria abrió el selector de imágenes  
**When** selecciona 1 o más imágenes (ej: 3 screenshots de un carrusel de Instagram)  
**Then** las imágenes se muestran en una vista previa con opción de agregar más o eliminar alguna antes de procesar

> **Regla de negocio:** Se permiten hasta 5 imágenes por receta. La IA las procesa todas juntas como una sola receta, consolidando la información de todas las imágenes.

##### SC3: Procesamiento por IA

**Given** la usuaria confirmó las imágenes y toca "Extraer receta"  
**When** la IA procesa las imágenes  
**Then** se muestra un indicador de carga ("Analizando imágenes...") mientras se procesa

##### SC4: Revisión y confirmación de datos extraídos

**Given** la IA terminó de procesar las imágenes  
**When** se completa el procesamiento  
**Then** se muestra el formulario pre-completado con los datos extraídos (nombre, categoría sugerida, ingredientes, porciones) para que la usuaria revise, corrija y confirme antes de guardar

> **Regla de negocio:** La revisión es obligatoria — la usuaria siempre puede editar cualquier campo antes de guardar, incluyendo la categoría sugerida por la IA.

##### SC5: Error en procesamiento de imágenes

**Given** la IA no puede extraer datos (imagen ilegible, baja calidad, sin texto)  
**When** ocurre el error  
**Then** se muestra un mensaje "No pudimos leer la receta. Podés intentar con otra imagen o cargarla manualmente" con opciones para reintentar o ir al formulario manual

---

#### UC3: Como miembro del hogar, puedo filtrar recetas por categoría, para encontrar rápidamente lo que busco cuando la biblioteca crece

**Status:** DESIGN  
**TDD:** TBD  
**Designs:** TBD

##### SC1: Ver filtros de categoría

**Given** la usuaria está en la Biblioteca de Recetas  
**When** abre la sección  
**Then** ve una fila de filtros scrolleable en la parte superior con las categorías disponibles. Solo se muestran las categorías que tienen al menos una receta, más "Todas" siempre visible.

##### SC2: Filtrar por categoría

**Given** la usuaria toca una categoría en el filtro  
**When** se aplica el filtro  
**Then** la lista muestra solo las recetas de esa categoría y el filtro seleccionado se resalta visualmente con el contador de recetas

##### SC3: Estado vacío por categoría

**Given** la usuaria filtra por una categoría que no tiene recetas  
**When** no hay resultados  
**Then** se muestra un mensaje "No tenés recetas de [categoría]. Agregá una con el botón +" con acceso directo al formulario

---

#### UC6: Como miembro del hogar, puedo ver, editar y eliminar recetas de mi biblioteca, para mantener mi repertorio actualizado

**Status:** DESIGN  
**TDD:** TBD  
**Designs:** TBD

**Given** la usuaria está en la Biblioteca  
**When** abre la sección  
**Then** ve un listado de todas sus recetas con nombre, porciones y tags visibles

##### SC2: Estado vacío — sin recetas cargadas

**Given** la usuaria no tiene ninguna receta cargada aún  
**When** abre la Biblioteca  
**Then** ve un estado vacío con mensaje "Todavía no tenés recetas. ¡Empezá cargando tu primera receta!" y botón de acción directo

##### SC3: Editar una receta

**Given** la usuaria está en el listado de recetas  
**When** toca una receta y selecciona "Editar"  
**Then** se abre el formulario con los datos actuales pre-cargados para modificar

##### SC4: Eliminar una receta

**Given** la usuaria está en el detalle de una receta  
**When** toca "Eliminar" y confirma en el diálogo de confirmación  
**Then** la receta se elimina de la biblioteca y de cualquier planificación futura (no afecta semanas pasadas)

---

### MÓDULO 2: Planificador Semanal

---

#### UC7: Como miembro del hogar, puedo obtener un menú semanal sugerido por la IA, para no tener que pensar qué comer cada día

**Status:** DESIGN  
**TDD:** TBD  
**Designs:** TBD

La IA selecciona recetas de la biblioteca y las distribuye en los 14 slots de la semana (7 almuerzos + 7 cenas), respetando la lógica de porciones.

##### SC1: Solicitar sugerencia de menú

**Given** la usuaria tiene al menos 1 receta en su biblioteca y está en el Planificador  
**When** toca "Sugerirme menú"  
**Then** la IA genera un menú completo para la semana y lo muestra en la vista de calendario

> **Regla de negocio — Lógica de porciones:**
> - Si una receta rinde N porciones para la cantidad de personas configurada, la IA asigna esa receta a N slots distintos de la semana
> - La lista de compras contará los ingredientes de UNA sola cocción, no de N porciones por separado
> - La IA evita repetir la misma receta más de lo necesario según sus porciones
> - Si la biblioteca no tiene suficientes recetas para cubrir los 14 slots, algunos slots pueden quedar vacíos o repetirse recetas

##### SC2: Vista del calendario semanal

**Given** la IA generó el menú  
**When** se muestra el planificador  
**Then** la usuaria ve una grilla Lunes → Domingo con 2 filas (Almuerzo / Cena) y cada slot muestra el nombre de la receta asignada

##### SC3: Sin recetas suficientes para generar menú

**Given** la usuaria tiene menos de 3 recetas en su biblioteca  
**When** toca "Sugerirme menú"  
**Then** se muestra un mensaje "Necesitás más recetas para generar un menú variado. Cargá al menos 3 recetas." con acceso directo a la Biblioteca

---

#### UC8: Como usuaria, puedo ajustar manualmente el menú sugerido, para tener control total sobre lo que como cada día

**Status:** DESIGN  
**TDD:** TBD  
**Designs:** TBD

##### SC1: Cambiar una receta de un slot

**Given** la usuaria está viendo el planificador semanal  
**When** toca un slot con receta asignada  
**Then** se abre un selector con todas las recetas de su biblioteca para elegir una diferente

##### SC2: Vaciar un slot

**Given** la usuaria está viendo el planificador  
**When** toca un slot y elige "Quitar"  
**Then** el slot queda vacío (sin receta asignada)

##### SC3: Asignar receta a slot vacío

**Given** hay slots vacíos en el planificador  
**When** la usuaria toca un slot vacío  
**Then** se abre el selector de recetas para elegir qué asignar

---

### MÓDULO 3: Lista de Compras

---

#### UC9: Como miembro del hogar, puedo ver y usar la lista de compras generada automáticamente, para que cualquiera pueda ir al supermercado con todo lo que necesitamos para la semana

**Status:** DESIGN  
**TDD:** TBD  
**Designs:** TBD

##### SC1: Generar lista de compras

**Given** la usuaria tiene al menos un slot asignado en el planificador  
**When** navega a la sección "Lista de compras"  
**Then** ve la lista completa de ingredientes necesarios para la semana, consolidados y agrupados por categoría

> **Regla de negocio — Consolidación:**
> - Los ingredientes con la misma unidad se suman (2 tomates + 3 tomates = 5 tomates)
> - Los ingredientes de una receta de múltiples porciones se cuentan UNA sola vez (no multiplicados por porciones)
> - Las categorías por defecto son: Verduras y Frutas, Carnes y Pescados, Lácteos y Huevos, Almacén, Otros

##### SC2: Tachar ingredientes mientras se compra (tiempo real)

**Given** un miembro del hogar está en el supermercado con la lista  
**When** toca un ingrediente  
**Then** aparece tachado visualmente en su app Y en la app del otro miembro en tiempo real, evitando compras duplicadas

##### SC3: Estado vacío — sin planificación activa

**Given** la usuaria no tiene ninguna receta asignada en el planificador  
**When** accede a la Lista de compras  
**Then** ve un mensaje "Tu lista está vacía. Planificá tu semana primero." con acceso directo al Planificador

---

### MÓDULO 4: Configuración del Hogar

---

#### UC10: Como miembro del hogar, puedo configurar el número de personas, para que los cálculos de porciones y compras sean correctos para todos

**Status:** DESIGN  
**TDD:** TBD  
**Designs:** TBD

##### SC1: Configurar número de personas

**Given** la usuaria está en Configuración  
**When** modifica el campo "Número de personas" (default: 1, rango: 1-10)  
**Then** todos los cálculos de porciones y lista de compras se recalculan con el nuevo valor

> **Regla de negocio:** Si una receta rinde 4 porciones y hay 2 personas, la receta alcanza para 2 comidas (no 4). La IA toma esto en cuenta al distribuir en el calendario.

---

## 📊 Analytics

| Evento | Descripción |
|--------|-------------|
| `meal_planner_recipe_category_filtered` | Miembro filtró recetas por categoría |
| `meal_planner_household_created` | Usuario creó un hogar nuevo |
| `meal_planner_household_invite_sent` | Usuario generó link de invitación |
| `meal_planner_household_joined` | Nuevo miembro se unió al hogar |
| `meal_planner_recipe_created_manual` | Miembro guardó receta vía formulario manual |
| `meal_planner_recipe_created_image` | Usuaria guardó receta vía extracción por imagen |
| `meal_planner_recipe_image_upload` | Usuaria subió imágenes para procesar |
| `meal_planner_recipe_image_error` | Error en extracción de imagen |
| `meal_planner_recipe_edited` | Usuaria editó una receta existente |
| `meal_planner_recipe_deleted` | Usuaria eliminó una receta |
| `meal_planner_menu_generated` | IA generó menú semanal |
| `meal_planner_slot_changed` | Usuaria cambió manualmente un slot |
| `meal_planner_shopping_list_viewed` | Usuaria abrió la lista de compras |
| `meal_planner_item_checked` | Usuaria tachó un ítem en la lista |
| `meal_planner_persons_updated` | Usuaria cambió el número de personas |

---

## ⚠️ Estados de Error y Edge Cases

| Situación | Comportamiento |
|-----------|---------------|
| Sin conexión al intentar extraer receta por imagen | Mensaje: "Necesitás conexión para analizar imágenes. Guardá el screenshot e intentalo cuando tengas internet." |
| Imagen ilegible o sin texto de receta | Mensaje con opción de reintentar o cargar manualmente |
| Biblioteca vacía al intentar planificar | Mensaje guía hacia carga de recetas |
| Menos de 3 recetas para generar menú | Advertencia con sugerencia de agregar más |
| Slot vacío en lista de compras | Se ignora ese slot, solo se calculan los asignados |

---

## 🔮 Fuera del Alcance (V2+)

- Exportar lista de compras (PDF, WhatsApp, email)
- Más de un hogar por usuario
- Roles dentro del hogar (admin vs. solo lectura)
- Importar recetas desde URL
- Historial de menús de semanas anteriores
- Sugerencias de recetas nuevas por IA (fuera de la biblioteca del hogar)
- Integración con apps de delivery o supermercados online
- Rotación inteligente (avisar si se repite mucho una receta en el mes)
- Carga por dictado de voz
- Notificaciones push (ej: "tu pareja actualizó la lista de compras")

---

## ✅ Criterios de Aceptación del MVP

- [ ] La usuaria puede crear un hogar e invitar a su pareja en menos de 2 minutos
- [ ] Ambos miembros ven las mismas recetas y calendario en tiempo real
- [ ] Tachar un ítem en la lista de compras se refleja en el celular del otro miembro en menos de 3 segundos
- [ ] Cualquier miembro puede cargar una receta en menos de 2 minutos (manual)
- [ ] La extracción por imagen pre-completa al menos el 80% de los campos correctamente
- [ ] El menú semanal se genera en menos de 10 segundos
- [ ] La lista de compras no duplica ingredientes de recetas de múltiples porciones
- [ ] La app es usable en mobile sin necesidad de zoom o scroll horizontal
- [ ] Los cambios manuales al menú se reflejan inmediatamente en la lista de compras

---

*PRD v1.0 generado en sesión de discovery — Marzo 2026*  
*PRD v1.1 — Actualización: modelo de hogar compartido, tiempo real, invitación por link*  
*PRD v1.2 — Actualización: categorías de recetas (UC3), filtro por categoría en biblioteca*
