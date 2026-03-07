import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Client credential de la app Thermomix (hardcoded en la app móvil)
const COOKIDOO_BASIC = 'a3VwZmVyd2Vyay1jbGllbnQtbndvdDpMczUwT04xd295U3FzMWRDZEpnZQ=='

const COUNTRY_LANG: Record<string, string> = {
  es: 'es-ES',
  de: 'de-DE',
  at: 'de-AT',
  ch: 'de-CH',
  fr: 'fr-FR',
  it: 'it-IT',
  pt: 'pt-PT',
  gb: 'en-GB',
  au: 'en-AU',
  mx: 'es-MX',
  ar: 'es-AR',
}

function apiBase(country: string) {
  return `https://${country}.tmmobile.vorwerk-digital.com`
}

async function cookidooLogin(email: string, password: string, country: string) {
  const res = await fetch(`${apiBase(country)}/ciam/auth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${COOKIDOO_BASIC}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Thermomix/5427 (iPhone; iOS11.2; Scale/3.00)',
      'Accept': 'application/json',
    },
    body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&grant_type=password`,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Login failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  return {
    access_token: data.access_token as string,
    refresh_token: data.refresh_token as string,
    expires_in: data.expires_in as number,
  }
}

async function cookidooRefresh(refreshToken: string, country: string) {
  const res = await fetch(`${apiBase(country)}/ciam/auth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${COOKIDOO_BASIC}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Thermomix/5427 (iPhone; iOS11.2; Scale/3.00)',
      'Accept': 'application/json',
    },
    body: `refresh_token=${encodeURIComponent(refreshToken)}&grant_type=refresh_token`,
  })

  if (!res.ok) throw new Error(`Refresh failed (${res.status})`)

  const data = await res.json()
  return {
    access_token: data.access_token as string,
    refresh_token: data.refresh_token as string,
    expires_in: data.expires_in as number,
  }
}

// Obtiene un token válido para el hogar, haciendo refresh/login si es necesario
async function getValidToken(supabase: ReturnType<typeof createClient>, connection: Record<string, string>) {
  const now = new Date()
  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : null
  const isExpired = !expiresAt || expiresAt <= now

  if (!isExpired && connection.access_token) {
    return connection.access_token
  }

  // Intentar refresh
  if (connection.refresh_token) {
    try {
      const tokens = await cookidooRefresh(connection.refresh_token, connection.country)
      const newExpires = new Date(Date.now() + tokens.expires_in * 1000)
      await supabase
        .from('cookidoo_connections')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: newExpires.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('household_id', connection.household_id)
      return tokens.access_token
    } catch {
      // Refresh falló, hacer login completo
    }
  }

  // Login completo
  const tokens = await cookidooLogin(connection.email, connection.password, connection.country)
  const newExpires = new Date(Date.now() + tokens.expires_in * 1000)
  await supabase
    .from('cookidoo_connections')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: newExpires.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('household_id', connection.household_id)
  return tokens.access_token
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verificar JWT del usuario
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

    // Obtener household del usuario
    const { data: member } = await supabase
      .from('household_members')
      .select('household_id, role')
      .eq('user_id', user.id)
      .single()

    if (!member) return new Response(JSON.stringify({ error: 'No household found' }), { status: 400, headers: corsHeaders })

    const { action, ...payload } = await req.json()

    // --- CONNECT ---
    if (action === 'connect') {
      if (member.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Solo el administrador puede conectar Cookidoo' }), { status: 403, headers: corsHeaders })
      }

      const { email, password, country } = payload
      if (!email || !password || !country) {
        return new Response(JSON.stringify({ error: 'email, password y country son requeridos' }), { status: 400, headers: corsHeaders })
      }

      // Probar credenciales
      const tokens = await cookidooLogin(email, password, country)
      const expires = new Date(Date.now() + tokens.expires_in * 1000)
      const lang = COUNTRY_LANG[country] || 'es-ES'

      // Upsert la conexión
      const { error } = await supabase
        .from('cookidoo_connections')
        .upsert({
          household_id: member.household_id,
          email,
          password,
          country,
          language: lang,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: expires.toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'household_id' })

      if (error) throw error

      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
    }

    // --- DISCONNECT ---
    if (action === 'disconnect') {
      if (member.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Solo el administrador puede desconectar Cookidoo' }), { status: 403, headers: corsHeaders })
      }

      await supabase
        .from('cookidoo_connections')
        .delete()
        .eq('household_id', member.household_id)

      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
    }

    // --- STATUS ---
    if (action === 'status') {
      const { data: connection } = await supabase
        .from('cookidoo_connections')
        .select('email, country, created_at')
        .eq('household_id', member.household_id)
        .single()

      return new Response(JSON.stringify({ connected: !!connection, connection }), { headers: corsHeaders })
    }

    // --- SYNC SHOPPING ---
    if (action === 'sync-shopping') {
      const { items } = payload as { items: string[] }
      if (!items?.length) {
        return new Response(JSON.stringify({ error: 'No hay items para sincronizar' }), { status: 400, headers: corsHeaders })
      }

      const { data: connection } = await supabase
        .from('cookidoo_connections')
        .select('*')
        .eq('household_id', member.household_id)
        .single()

      if (!connection) {
        return new Response(JSON.stringify({ error: 'Cookidoo no está conectado' }), { status: 400, headers: corsHeaders })
      }

      const token = await getValidToken(supabase, connection)
      const lang = connection.language

      const res = await fetch(`${apiBase(connection.country)}/shopping/${lang}/additional-items/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Thermomix/5427 (iPhone; iOS11.2; Scale/3.00)',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ itemsValue: items }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Cookidoo sync failed (${res.status}): ${text}`)
      }

      const data = await res.json()
      return new Response(JSON.stringify({ ok: true, synced: data.data?.length ?? 0 }), { headers: corsHeaders })
    }

    // --- GET COLLECTIONS ---
    if (action === 'get-collections') {
      const { data: connection } = await supabase
        .from('cookidoo_connections')
        .select('*')
        .eq('household_id', member.household_id)
        .single()

      if (!connection) {
        return new Response(JSON.stringify({ error: 'Cookidoo no está conectado' }), { status: 400, headers: corsHeaders })
      }

      const token = await getValidToken(supabase, connection)
      const lang = connection.language

      const [managedRes, customRes] = await Promise.all([
        fetch(`${apiBase(connection.country)}/organize/${lang}/api/managed-list`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.vorwerk.organize.managed-list.mobile+json',
            'User-Agent': 'Thermomix/5427 (iPhone; iOS11.2; Scale/3.00)',
          },
        }),
        fetch(`${apiBase(connection.country)}/organize/${lang}/api/custom-list`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.vorwerk.organize.custom-list.mobile+json',
            'User-Agent': 'Thermomix/5427 (iPhone; iOS11.2; Scale/3.00)',
          },
        }),
      ])

      const countRecipes = (chapters: { recipes: unknown[] }[]) =>
        chapters.reduce((sum, ch) => sum + (ch.recipes?.length ?? 0), 0)

      const collections: { id: string; name: string; type: string; recipeCount: number }[] = []

      if (managedRes.ok) {
        const data = await managedRes.json()
        for (const col of data.managedlists ?? []) {
          collections.push({ id: col.id, name: col.title, type: 'managed', recipeCount: countRecipes(col.chapters ?? []) })
        }
      }
      if (customRes.ok) {
        const data = await customRes.json()
        for (const col of data.customlists ?? []) {
          collections.push({ id: col.id, name: col.title, type: 'custom', recipeCount: countRecipes(col.chapters ?? []) })
        }
      }

      // Incluir cuáles están seleccionadas actualmente
      const selectedIds: string[] = (connection.selected_collections ?? []).map((c: { id: string }) => c.id)

      return new Response(JSON.stringify({ collections, selectedIds }), { headers: corsHeaders })
    }

    // --- SAVE COLLECTIONS ---
    if (action === 'save-collections') {
      if (member.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Solo el administrador puede cambiar las colecciones' }), { status: 403, headers: corsHeaders })
      }

      const { selected } = payload as { selected: { id: string; name: string; type: string }[] }

      await supabase
        .from('cookidoo_connections')
        .update({ selected_collections: selected, updated_at: new Date().toISOString() })
        .eq('household_id', member.household_id)

      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
    }

    // --- SYNC COOKIDOO RECIPES ---
    if (action === 'sync-cookidoo-recipes') {
      const { data: connection } = await supabase
        .from('cookidoo_connections')
        .select('*')
        .eq('household_id', member.household_id)
        .single()

      if (!connection) {
        return new Response(JSON.stringify({ error: 'Cookidoo no está conectado' }), { status: 400, headers: corsHeaders })
      }

      const selectedCollections: { id: string; name: string; type: string }[] = connection.selected_collections ?? []
      if (!selectedCollections.length) {
        return new Response(JSON.stringify({ error: 'No hay colecciones seleccionadas' }), { status: 400, headers: corsHeaders })
      }

      const token = await getValidToken(supabase, connection)
      const lang = connection.language
      const country = connection.country

      const selectedIds = new Set(selectedCollections.map((c) => c.id))

      // Usar los mismos endpoints de lista completa que ya sabemos que funcionan
      const [managedRes, customRes] = await Promise.all([
        fetch(`${apiBase(country)}/organize/${lang}/api/managed-list`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.vorwerk.organize.managed-list.mobile+json',
            'User-Agent': 'Thermomix/5427 (iPhone; iOS11.2; Scale/3.00)',
          },
        }),
        fetch(`${apiBase(country)}/organize/${lang}/api/custom-list`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.vorwerk.organize.custom-list.mobile+json',
            'User-Agent': 'Thermomix/5427 (iPhone; iOS11.2; Scale/3.00)',
          },
        }),
      ])

      // Recopilar todos los IDs de recetas de las colecciones seleccionadas
      const recipeIds = new Set<string>()

      const extractFromLists = (lists: { id: string; chapters?: { recipes?: { id?: string; recipeId?: string }[] }[] }[]) => {
        for (const list of lists) {
          if (!selectedIds.has(list.id)) continue
          for (const chapter of list.chapters ?? []) {
            for (const r of chapter.recipes ?? []) {
              const id = r.id ?? r.recipeId
              if (id) recipeIds.add(String(id))
            }
          }
        }
      }

      if (managedRes.ok) {
        const data = await managedRes.json()
        extractFromLists(data.managedlists ?? [])
      }
      if (customRes.ok) {
        const data = await customRes.json()
        extractFromLists(data.customlists ?? [])
      }

      if (!recipeIds.size) {
        return new Response(JSON.stringify({ synced: 0 }), { headers: corsHeaders })
      }

      // Obtener IDs de recetas Cookidoo ya existentes para este hogar
      const { data: existing } = await supabase
        .from('recipes')
        .select('id, cookidoo_recipe_id')
        .eq('household_id', member.household_id)
        .eq('source', 'cookidoo')

      const existingMap = new Map<string, string>((existing ?? []).map((r: { id: string; cookidoo_recipe_id: string }) => [r.cookidoo_recipe_id, r.id]))
      const existingIds = new Set(existingMap.keys())

      // IDs a eliminar (ya no están en ninguna colección seleccionada)
      const toDelete = [...existingIds].filter((id) => !recipeIds.has(id))
      if (toDelete.length) {
        const dbIdsToDelete = toDelete.map((cid) => existingMap.get(cid)!).filter(Boolean)
        if (dbIdsToDelete.length) {
          await supabase.from('recipes').delete().in('id', dbIdsToDelete)
        }
      }

      let synced = 0
      const errors: string[] = []
      let debugFirstRecipe: unknown = null

      // Sincronizar cada receta
      for (const recipeId of recipeIds) {
        try {
          const res = await fetch(`${apiBase(country)}/recipes/recipe/${lang}/${recipeId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'User-Agent': 'Thermomix/5427 (iPhone; iOS11.2; Scale/3.00)',
            },
          })
          if (!res.ok) continue

          const data = await res.json()
          const recipe = data.recipe ?? data

          // Debug: guardar estructura de primera receta
          if (!debugFirstRecipe) {
            debugFirstRecipe = {
              keys: Object.keys(recipe),
              hasIngredientGroups: !!recipe.recipeIngredientGroups,
              ingredientGroupsLength: recipe.recipeIngredientGroups?.length ?? 0,
              firstGroupKeys: recipe.recipeIngredientGroups?.[0] ? Object.keys(recipe.recipeIngredientGroups[0]) : [],
              firstGroupIngCount: recipe.recipeIngredientGroups?.[0]?.recipeIngredients?.length ?? recipe.recipeIngredientGroups?.[0]?.ingredients?.length ?? 0,
              firstIngredientKeys: (recipe.recipeIngredientGroups?.[0]?.recipeIngredients?.[0] ?? recipe.recipeIngredientGroups?.[0]?.ingredients?.[0]) ? Object.keys(recipe.recipeIngredientGroups?.[0]?.recipeIngredients?.[0] ?? recipe.recipeIngredientGroups?.[0]?.ingredients?.[0]) : [],
              rawDataKeys: Object.keys(data),
            }
          }

          const name: string = recipe.title ?? recipe.name ?? 'Receta Cookidoo'
          const portions: number = recipe.numberOfPortions ?? recipe.portions ?? recipe.yield ?? 4
          const emoji = '🍲'
          const category = 'otros'
          const tags: string[] = recipe.tags?.map((t: { text?: string; name?: string }) => t.text ?? t.name).filter(Boolean) ?? []

          // Upsert receta
          let dbRecipeId: string

          if (existingMap.has(recipeId)) {
            dbRecipeId = existingMap.get(recipeId)!
            await supabase
              .from('recipes')
              .update({ name, portions, emoji, category, tags })
              .eq('id', dbRecipeId)
          } else {
            const { data: inserted, error: insertErr } = await supabase
              .from('recipes')
              .insert({
                household_id: member.household_id,
                name,
                portions,
                emoji,
                category,
                tags,
                source: 'cookidoo',
                cookidoo_recipe_id: recipeId,
              })
              .select('id')
              .single()
            if (insertErr || !inserted) continue
            dbRecipeId = inserted.id
          }

          // Actualizar ingredientes
          await supabase.from('ingredients').delete().eq('recipe_id', dbRecipeId)

          const ingredientGroups: { recipeIngredients?: unknown[]; ingredients?: unknown[] }[] =
            recipe.recipeIngredientGroups ?? recipe.ingredientGroups ?? []

          type RawIng = { ingredientNotation?: string; ingredient?: { name?: string }; name?: string; quantity?: number | string; amount?: string; unitNotation?: string; quantityUnit?: { name?: string }; unit?: string }
          const allIngredients: { recipe_id: string; name: string; quantity: string; sort_order: number }[] = []
          let sortOrder = 0
          for (const group of ingredientGroups) {
            const ings = (group.recipeIngredients ?? group.ingredients ?? []) as RawIng[]
            for (const ing of ings) {
              const ingName: string = ing.ingredientNotation ?? ing.ingredient?.name ?? ing.name ?? ''
              if (!ingName) continue
              const qty = ing.quantity ?? ing.amount ?? ''
              const unit = ing.unitNotation ?? ing.quantityUnit?.name ?? ing.unit ?? ''
              const quantity = [qty, unit].filter(Boolean).join(' ')
              allIngredients.push({ recipe_id: dbRecipeId, name: ingName, quantity, sort_order: sortOrder++ })
            }
          }

          if (allIngredients.length) {
            await supabase.from('ingredients').insert(allIngredients)
          }

          synced++
        } catch (e) {
          errors.push(recipeId)
        }
      }

      return new Response(JSON.stringify({ synced, deleted: toDelete.length, errors, debugFirstRecipe }), { headers: corsHeaders })
    }

    return new Response(JSON.stringify({ error: `Acción desconocida: ${action}` }), { status: 400, headers: corsHeaders })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: corsHeaders })
  }
})
