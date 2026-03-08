import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const COOKIDOO_BASIC = 'a3VwZmVyd2Vyay1jbGllbnQtbndvdDpMczUwT04xd295U3FzMWRDZEpnZQ=='

const COUNTRY_LANG: Record<string, string> = {
  es: 'es-ES', de: 'de-DE', at: 'de-AT', ch: 'de-CH', fr: 'fr-FR',
  it: 'it-IT', pt: 'pt-PT', gb: 'en-GB', au: 'en-AU', mx: 'es-MX', ar: 'es-AR',
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
  const data = await res.json()
  if (!res.ok || data.error || data.code || typeof data.access_token !== 'string') {
    throw new Error(`Login failed (${res.status}): ${JSON.stringify(data)}`)
  }
  return { access_token: data.access_token as string, refresh_token: data.refresh_token as string, expires_in: data.expires_in as number }
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
  const data = await res.json()
  if (!res.ok || data.error || data.code || typeof data.access_token !== 'string') {
    throw new Error(`Refresh failed (${res.status}): ${JSON.stringify(data)}`)
  }
  return { access_token: data.access_token as string, refresh_token: data.refresh_token as string, expires_in: data.expires_in as number }
}

async function getValidToken(supabase: ReturnType<typeof createClient>, connection: Record<string, string>) {
  const now = new Date()
  let lastError = ''
  // Siempre intentar refresh primero
  if (connection.refresh_token) {
    try {
      const tokens = await cookidooRefresh(connection.refresh_token, connection.country)
      const newExpires = new Date(Date.now() + tokens.expires_in * 1000)
      await supabase.from('cookidoo_connections').update({ access_token: tokens.access_token, refresh_token: tokens.refresh_token, token_expires_at: newExpires.toISOString(), updated_at: now.toISOString() }).eq('household_id', connection.household_id)
      return tokens.access_token
    } catch (e) { lastError = e instanceof Error ? e.message : String(e) }
  }
  // Si el refresh falló pero el token guardado sigue vigente, usarlo
  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : null
  if (expiresAt && expiresAt > now && connection.access_token) return connection.access_token
  // Último recurso: re-login con credenciales guardadas
  if (!connection.email || !connection.password) {
    throw new Error(`No se puede renovar el token. Reconectá Cookidoo. (Último error: ${lastError})`)
  }
  const tokens = await cookidooLogin(connection.email, connection.password, connection.country)
  const newExpires = new Date(Date.now() + tokens.expires_in * 1000)
  await supabase.from('cookidoo_connections').update({ access_token: tokens.access_token, refresh_token: tokens.refresh_token, token_expires_at: newExpires.toISOString(), updated_at: now.toISOString() }).eq('household_id', connection.household_id)
  return tokens.access_token
}

async function translateToSpanish(texts: Record<string, string>): Promise<Record<string, string>> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) return texts

  const keys = Object.keys(texts)
  if (!keys.length) return texts

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Translate the following JSON values to Spanish (Argentina). Return ONLY the JSON object with the same keys and translated values, no explanation.\n\n${JSON.stringify(texts)}`,
      }],
    }),
  })

  if (!res.ok) return texts

  const data = await res.json()
  const text = data.content?.[0]?.text ?? ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return texts

  try {
    const translated = JSON.parse(match[0]) as Record<string, string>
    // Devolver solo las keys que existían originalmente
    const result: Record<string, string> = {}
    for (const key of keys) result[key] = translated[key] ?? texts[key]
    return result
  } catch {
    return texts
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

    const { data: member } = await supabase.from('household_members').select('household_id, role').eq('user_id', user.id).single()
    if (!member) return new Response(JSON.stringify({ error: 'No household found' }), { status: 400, headers: corsHeaders })

    const { action, ...payload } = await req.json()

    // --- CONNECT ---
    if (action === 'connect') {
      if (member.role !== 'admin') return new Response(JSON.stringify({ error: 'Solo el administrador puede conectar Cookidoo' }), { status: 403, headers: corsHeaders })
      const { email, password, country } = payload
      if (!email || !password || !country) return new Response(JSON.stringify({ error: 'email, password y country son requeridos' }), { status: 400, headers: corsHeaders })
      const tokens = await cookidooLogin(email, password, country)
      const expires = new Date(Date.now() + tokens.expires_in * 1000)
      const lang = COUNTRY_LANG[country] || 'es-ES'
      const { error } = await supabase.from('cookidoo_connections').upsert({ household_id: member.household_id, email, password, country, language: lang, access_token: tokens.access_token, refresh_token: tokens.refresh_token, token_expires_at: expires.toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'household_id' })
      if (error) throw error
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
    }

    // --- DISCONNECT ---
    if (action === 'disconnect') {
      if (member.role !== 'admin') return new Response(JSON.stringify({ error: 'Solo el administrador puede desconectar Cookidoo' }), { status: 403, headers: corsHeaders })
      await supabase.from('cookidoo_connections').delete().eq('household_id', member.household_id)
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
    }

    // --- STATUS ---
    if (action === 'status') {
      const { data: connection } = await supabase.from('cookidoo_connections').select('email, country, created_at').eq('household_id', member.household_id).single()
      return new Response(JSON.stringify({ connected: !!connection, connection }), { headers: corsHeaders })
    }

    // --- SYNC SHOPPING ---
    if (action === 'sync-shopping') {
      const { items } = payload as { items: string[] }
      if (!items?.length) return new Response(JSON.stringify({ error: 'No hay items para sincronizar' }), { status: 400, headers: corsHeaders })
      const { data: connection } = await supabase.from('cookidoo_connections').select('*').eq('household_id', member.household_id).single()
      if (!connection) return new Response(JSON.stringify({ error: 'Cookidoo no está conectado' }), { status: 400, headers: corsHeaders })
      const token = await getValidToken(supabase, connection)
      const lang = connection.language
      const res = await fetch(`${apiBase(connection.country)}/shopping/${lang}/additional-items/add`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'Thermomix/5427 (iPhone; iOS11.2; Scale/3.00)', 'Accept': 'application/json' },
        body: JSON.stringify({ itemsValue: items }),
      })
      if (!res.ok) { const text = await res.text(); throw new Error(`Cookidoo sync failed (${res.status}): ${text}`) }
      const data = await res.json()
      return new Response(JSON.stringify({ ok: true, synced: data.data?.length ?? 0 }), { headers: corsHeaders })
    }

    // --- GET COLLECTIONS ---
    if (action === 'get-collections') {
      const { data: connection } = await supabase.from('cookidoo_connections').select('*').eq('household_id', member.household_id).single()
      if (!connection) return new Response(JSON.stringify({ error: 'Cookidoo no está conectado' }), { status: 400, headers: corsHeaders })
      const token = await getValidToken(supabase, connection)
      const lang = connection.language
      const [managedRes, customRes] = await Promise.all([
        fetch(`${apiBase(connection.country)}/organize/${lang}/api/managed-list`, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.vorwerk.organize.managed-list.mobile+json', 'User-Agent': 'Thermomix/5427 (iPhone; iOS11.2; Scale/3.00)' } }),
        fetch(`${apiBase(connection.country)}/organize/${lang}/api/custom-list`, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.vorwerk.organize.custom-list.mobile+json', 'User-Agent': 'Thermomix/5427 (iPhone; iOS11.2; Scale/3.00)' } }),
      ])
      const countRecipes = (chapters: { recipes: unknown[] }[]) => chapters.reduce((sum, ch) => sum + (ch.recipes?.length ?? 0), 0)
      const collections: { id: string; name: string; type: string; recipeCount: number }[] = []
      if (managedRes.ok) { const data = await managedRes.json(); for (const col of data.managedlists ?? []) collections.push({ id: col.id, name: col.title, type: 'managed', recipeCount: countRecipes(col.chapters ?? []) }) }
      if (customRes.ok) { const data = await customRes.json(); for (const col of data.customlists ?? []) collections.push({ id: col.id, name: col.title, type: 'custom', recipeCount: countRecipes(col.chapters ?? []) }) }
      const selectedIds: string[] = (connection.selected_collections ?? []).map((c: { id: string }) => c.id)
      return new Response(JSON.stringify({ collections, selectedIds }), { headers: corsHeaders })
    }

    // --- SAVE COLLECTIONS ---
    if (action === 'save-collections') {
      if (member.role !== 'admin') return new Response(JSON.stringify({ error: 'Solo el administrador puede cambiar las colecciones' }), { status: 403, headers: corsHeaders })
      const { selected } = payload as { selected: { id: string; name: string; type: string }[] }
      await supabase.from('cookidoo_connections').update({ selected_collections: selected, updated_at: new Date().toISOString() }).eq('household_id', member.household_id)
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
    }

    // --- COOK TODAY ---
    if (action === 'cook-today') {
      const { cookidooRecipeId } = payload as { cookidooRecipeId: string }
      if (!cookidooRecipeId) return new Response(JSON.stringify({ error: 'cookidooRecipeId requerido' }), { status: 400, headers: corsHeaders })
      const { data: connection } = await supabase.from('cookidoo_connections').select('*').eq('household_id', member.household_id).single()
      if (!connection) return new Response(JSON.stringify({ error: 'Cookidoo no está conectado' }), { status: 400, headers: corsHeaders })
      const token = await getValidToken(supabase, connection)
      const lang = connection.language
      const country = connection.country
      const res = await fetch(`${apiBase(country)}/cooking/${lang}/api/v2/cooking-list/recipes`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'Thermomix/5427 (iPhone; iOS11.2; Scale/3.00)', 'Accept': 'application/json' },
        body: JSON.stringify({ id: cookidooRecipeId }),
      })
      if (!res.ok) {
        const text = await res.text()
        return new Response(JSON.stringify({ error: `Cookidoo cook-today failed (${res.status}): ${text}` }), { status: 400, headers: corsHeaders })
      }
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
    }

    // --- SYNC COOKIDOO RECIPES ---
    if (action === 'sync-cookidoo-recipes') {
      const { data: connection } = await supabase.from('cookidoo_connections').select('*').eq('household_id', member.household_id).single()
      if (!connection) return new Response(JSON.stringify({ error: 'Cookidoo no está conectado' }), { status: 400, headers: corsHeaders })
      const selectedCollections: { id: string; name: string; type: string }[] = connection.selected_collections ?? []
      if (!selectedCollections.length) return new Response(JSON.stringify({ error: 'No hay colecciones seleccionadas' }), { status: 400, headers: corsHeaders })

      const token = await getValidToken(supabase, connection)
      const lang = connection.language
      const country = connection.country
      const selectedIds = new Set(selectedCollections.map((c) => c.id))

      const [managedRes, customRes] = await Promise.all([
        fetch(`${apiBase(country)}/organize/${lang}/api/managed-list`, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.vorwerk.organize.managed-list.mobile+json', 'User-Agent': 'Thermomix/5427 (iPhone; iOS11.2; Scale/3.00)' } }),
        fetch(`${apiBase(country)}/organize/${lang}/api/custom-list`, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.vorwerk.organize.custom-list.mobile+json', 'User-Agent': 'Thermomix/5427 (iPhone; iOS11.2; Scale/3.00)' } }),
      ])

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
      if (managedRes.ok) { const data = await managedRes.json(); extractFromLists(data.managedlists ?? []) }
      if (customRes.ok) { const data = await customRes.json(); extractFromLists(data.customlists ?? []) }
      if (!recipeIds.size) return new Response(JSON.stringify({ synced: 0 }), { headers: corsHeaders })

      const { data: existing } = await supabase.from('recipes').select('id, cookidoo_recipe_id, dish_photo_url').eq('household_id', member.household_id).eq('source', 'cookidoo')
      const existingMap = new Map<string, { id: string; dish_photo_url: string | null }>((existing ?? []).map((r: { id: string; cookidoo_recipe_id: string; dish_photo_url: string | null }) => [r.cookidoo_recipe_id, { id: r.id, dish_photo_url: r.dish_photo_url }]))
      const existingIds = new Set(existingMap.keys())

      const toDelete = [...existingIds].filter((id) => !recipeIds.has(id))
      if (toDelete.length) {
        const dbIdsToDelete = toDelete.map((cid) => existingMap.get(cid)?.id).filter(Boolean) as string[]
        if (dbIdsToDelete.length) await supabase.from('recipes').delete().in('id', dbIdsToDelete)
      }

      let synced = 0
      let translated = 0
      const errors: string[] = []
      let debugFirstRecipe: unknown = null

      for (const recipeId of recipeIds) {
        try {
          const res = await fetch(`${apiBase(country)}/recipes/recipe/${lang}/${recipeId}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json', 'User-Agent': 'Thermomix/5427 (iPhone; iOS11.2; Scale/3.00)' },
          })
          if (!res.ok) continue

          const data = await res.json()
          const recipe = data.recipe ?? data

          // Debug: capturar estructura de la primera receta
          if (!debugFirstRecipe) {
            const firstIng = recipe.recipeIngredientGroups?.[0]?.recipeIngredients?.[0]
            debugFirstRecipe = { firstIngredient: firstIng, descriptiveAssets: recipe.descriptiveAssets, locale: recipe.locale, title: recipe.title }
          }

          const rawName: string = recipe.title ?? recipe.name ?? 'Receta Cookidoo'
          const portions: number = recipe.numberOfPortions ?? recipe.portions ?? recipe.yield ?? 4
          const rawTags: string[] = recipe.tags?.map((t: { text?: string; name?: string }) => t.text ?? t.name).filter(Boolean) ?? []

          // Traducir si el locale de la receta es inglés
          const recipeLocale: string = recipe.locale ?? ''
          const needsTranslation = recipeLocale.startsWith('en')

          // Imagen: las URLs de Cookidoo son Cloudinary públicas con placeholder {transformation}
          type Asset = { type?: string; square?: string; portrait?: string; landscape?: string }
          const assets: Asset[] = recipe.descriptiveAssets ?? []
          const firstAsset = assets.find((a) => a.type === 'image' && (a.square || a.portrait || a.landscape))
          const rawImageUrl = firstAsset?.square ?? firstAsset?.portrait ?? firstAsset?.landscape ?? null
          const dish_photo_url: string | null = rawImageUrl
            ? rawImageUrl.replace('{transformation}/', '')
            : (existingMap.get(recipeId)?.dish_photo_url ?? null)

          // Extraer ingredientes con sus datos crudos
          const ingredientGroups: { recipeIngredients?: unknown[]; ingredients?: unknown[] }[] = recipe.recipeIngredientGroups ?? recipe.ingredientGroups ?? []
          type RawIng = { ingredientNotation?: string; ingredient?: { name?: string }; name?: string; quantity?: { value?: number } | number | string; amount?: string; unitNotation?: string; quantityUnit?: { name?: string }; unit?: string }
          const parsedIngs: { rawName: string; qtyStr: string; unit: string }[] = []
          for (const group of ingredientGroups) {
            const ings = (group.recipeIngredients ?? group.ingredients ?? []) as RawIng[]
            for (const ing of ings) {
              const ingName: string = ing.ingredientNotation ?? ing.ingredient?.name ?? ing.name ?? ''
              if (!ingName) continue
              const rawQty = ing.quantity ?? ing.amount
              const qtyVal = rawQty !== null && rawQty !== undefined
                ? (typeof rawQty === 'object' ? (rawQty as { value?: number }).value ?? null : Number(rawQty))
                : null
              const qtyStr = qtyVal !== null && !isNaN(qtyVal) && qtyVal !== 0
                ? (qtyVal % 1 === 0 ? String(qtyVal) : qtyVal.toFixed(2).replace(/\.?0+$/, ''))
                : ''
              const unit = ing.unitNotation ?? ing.quantityUnit?.name ?? ing.unit ?? ''
              parsedIngs.push({ rawName: ingName, qtyStr, unit })
            }
          }

          // Traducir título e ingredientes en una sola llamada si el locale es inglés
          let name = rawName
          const ingNames = parsedIngs.map((i) => i.rawName)
          if (needsTranslation && parsedIngs.length > 0) {
            const toTranslate: Record<string, string> = { _title: rawName }
            parsedIngs.forEach((ing, idx) => { toTranslate[`i${idx}`] = ing.rawName })
            const translatedTexts = await translateToSpanish(toTranslate)
            name = translatedTexts._title ?? rawName
            parsedIngs.forEach((_, idx) => { ingNames[idx] = translatedTexts[`i${idx}`] ?? parsedIngs[idx].rawName })
            if (translatedTexts._title !== rawName) translated++
          }

          let dbRecipeId: string
          if (existingMap.has(recipeId)) {
            dbRecipeId = existingMap.get(recipeId)!.id
            await supabase.from('recipes').update({ name, portions, emoji: '🍲', category: 'otros', tags: rawTags, dish_photo_url }).eq('id', dbRecipeId)
          } else {
            const { data: inserted, error: insertErr } = await supabase.from('recipes').insert({ household_id: member.household_id, name, portions, emoji: '🍲', category: 'otros', tags: rawTags, source: 'cookidoo', cookidoo_recipe_id: recipeId, dish_photo_url }).select('id').single()
            if (insertErr || !inserted) continue
            dbRecipeId = inserted.id
          }

          await supabase.from('ingredients').delete().eq('recipe_id', dbRecipeId)
          const allIngredients = parsedIngs.map((ing, idx) => ({
            recipe_id: dbRecipeId,
            name: ingNames[idx],
            quantity: [ing.qtyStr, ing.unit].filter(Boolean).join(' '),
            sort_order: idx,
          }))
          if (allIngredients.length) await supabase.from('ingredients').insert(allIngredients)

          synced++
        } catch (e) {
          errors.push(recipeId)
        }
      }

      return new Response(JSON.stringify({ synced, deleted: toDelete.length, translated, errors, debugFirstRecipe }), { headers: corsHeaders })
    }

    // --- TEST TOKEN (diagnóstico) ---
    if (action === 'test-token') {
      const { data: connection } = await supabase.from('cookidoo_connections').select('*').eq('household_id', member.household_id).single()
      if (!connection) return new Response(JSON.stringify({ error: 'No conectado' }), { status: 400, headers: corsHeaders })
      const diagInfo: Record<string, unknown> = {
        has_refresh_token: !!connection.refresh_token,
        has_access_token: !!connection.access_token,
        has_email: !!connection.email,
        has_password: !!connection.password,
        token_expires_at: connection.token_expires_at,
        country: connection.country,
        language: connection.language,
      }
      // Intentar refresh directamente y capturar la respuesta raw
      try {
        const res = await fetch(`${apiBase(connection.country)}/ciam/auth/token`, {
          method: 'POST',
          headers: { 'Authorization': `Basic ${COOKIDOO_BASIC}`, 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Thermomix/5427 (iPhone; iOS11.2; Scale/3.00)', 'Accept': 'application/json' },
          body: `refresh_token=${encodeURIComponent(connection.refresh_token)}&grant_type=refresh_token`,
        })
        const text = await res.text()
        diagInfo.refresh_status = res.status
        diagInfo.refresh_response = text.substring(0, 300)
        diagInfo.refresh_ok = res.ok
        let parsed: unknown
        try { parsed = JSON.parse(text) } catch { parsed = null }
        diagInfo.refresh_has_access_token = !!(parsed && typeof parsed === 'object' && 'access_token' in parsed)
      } catch (e) {
        diagInfo.refresh_error = e instanceof Error ? e.message : String(e)
      }
      return new Response(JSON.stringify(diagInfo), { headers: corsHeaders })
    }

    return new Response(JSON.stringify({ error: `Acción desconocida: ${action}` }), { status: 400, headers: corsHeaders })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: corsHeaders })
  }
})
